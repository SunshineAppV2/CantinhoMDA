import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Interceptor Global de Auditoria
 * 
 * Registra automaticamente todas as ações de modificação (POST, PUT, PATCH, DELETE)
 * no banco de dados para fins de auditoria e compliance.
 * 
 * Informações registradas:
 * - Ação realizada (método + URL)
 * - Recurso afetado
 * - ID do recurso
 * - Usuário que realizou a ação
 * - IP e User-Agent
 * - Detalhes da requisição (sanitizados)
 * - Status (SUCCESS/ERROR)
 * - Duração da operação
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, user, ip, body } = request;

        // Apenas auditar ações de modificação
        const auditableActions = ['POST', 'PUT', 'PATCH', 'DELETE'];

        if (!auditableActions.includes(method)) {
            return next.handle();
        }

        // Ignorar endpoints de saúde e documentação
        if (url.includes('/health') || url.includes('/api/docs')) {
            return next.handle();
        }

        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: async (response) => {
                    try {
                        await this.prisma.auditLog.create({
                            data: {
                                action: `${method} ${url}`,
                                resource: this.extractResource(url),
                                resourceId: this.extractResourceId(url, response),
                                authorId: user?.userId || null,
                                clubId: user?.clubId || null,
                                ipAddress: ip || request.connection?.remoteAddress,
                                userAgent: request.headers['user-agent'],
                                details: {
                                    method,
                                    url,
                                    body: this.sanitizeBody(body),
                                    duration: Date.now() - startTime,
                                    timestamp: new Date().toISOString(),
                                },
                                status: 'SUCCESS',
                            },
                        });
                    } catch (error) {
                        // Não falhar a requisição se auditoria falhar
                        console.error('Erro ao registrar auditoria:', error);
                    }
                },
                error: async (error) => {
                    try {
                        await this.prisma.auditLog.create({
                            data: {
                                action: `${method} ${url}`,
                                resource: this.extractResource(url),
                                authorId: user?.userId || null,
                                clubId: user?.clubId || null,
                                ipAddress: ip || request.connection?.remoteAddress,
                                userAgent: request.headers['user-agent'],
                                details: {
                                    method,
                                    url,
                                    error: error.message,
                                    statusCode: error.status,
                                    timestamp: new Date().toISOString(),
                                },
                                status: 'ERROR',
                            },
                        });
                    } catch (auditError) {
                        console.error('Erro ao registrar auditoria de erro:', auditError);
                    }
                },
            })
        );
    }

    /**
     * Remove campos sensíveis dos logs de auditoria
     */
    private sanitizeBody(body: any): any {
        if (!body || typeof body !== 'object') {
            return body;
        }

        const sensitiveFields = [
            'password',
            'cpf',
            'rg',
            'susNumber',
            'healthPlan',
            'token',
            'secret',
            'apiKey',
        ];

        const sanitized = { ...body };

        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '***REDACTED***';
            }
        });

        return sanitized;
    }

    /**
     * Extrai o nome do recurso da URL
     * Exemplo: /users/123 -> users
     */
    private extractResource(url: string): string {
        const parts = url.split('/').filter(p => p);
        return parts[0] || 'unknown';
    }

    /**
     * Tenta extrair o ID do recurso da URL ou resposta
     */
    private extractResourceId(url: string, response: any): string | null {
        // Tentar extrair UUID da URL
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = url.match(uuidRegex);

        if (match) return match[0];

        // Tentar pegar ID da resposta
        if (response?.id) return response.id;
        if (response?.data?.id) return response.data.id;

        return null;
    }
}
