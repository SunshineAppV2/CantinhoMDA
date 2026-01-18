import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterMemory } from 'rate-limiter-flexible';

/**
 * Guard de Rate Limiting para proteção contra ataques de força bruta
 * 
 * Configurações:
 * - Login: 5 tentativas a cada 15 minutos, bloqueio de 1 hora
 * - Registro: 3 tentativas por hora
 * - API Geral: 100 requisições por minuto
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
    // Rate limiter para login - mais restritivo
    private loginLimiter = new RateLimiterMemory({
        points: 5, // 5 tentativas
        duration: 15 * 60, // por 15 minutos
        blockDuration: 60 * 60, // bloqueia por 1 hora após exceder
    });

    // Rate limiter para registro - previne spam
    private registerLimiter = new RateLimiterMemory({
        points: 3, // 3 registros
        duration: 60 * 60, // por hora
        blockDuration: 2 * 60 * 60, // bloqueia por 2 horas
    });

    // Rate limiter geral para API
    private apiLimiter = new RateLimiterMemory({
        points: 100, // 100 requisições
        duration: 60, // por minuto
    });

    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const endpoint = this.reflector.get<string>('rate_limit_endpoint', context.getHandler());

        // Identificar cliente por IP
        const ip = request.ip || request.connection.remoteAddress;

        try {
            // Aplicar rate limiting específico por endpoint
            if (endpoint === 'login') {
                await this.loginLimiter.consume(ip);
            } else if (endpoint === 'register') {
                await this.registerLimiter.consume(ip);
            } else {
                // Rate limiting geral para outros endpoints
                await this.apiLimiter.consume(ip);
            }

            return true;
        } catch (rateLimiterRes) {
            // Calcular tempo de espera
            const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000) || 1;

            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: 'Muitas tentativas. Tente novamente mais tarde.',
                    retryAfter,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }
    }
}

/**
 * Decorator para marcar endpoints com rate limiting específico
 * 
 * Uso:
 * @RateLimit('login')
 * @RateLimit('register')
 */
export const RATE_LIMIT_KEY = 'rate_limit_endpoint';
export const RateLimit = (endpoint: string) => SetMetadata(RATE_LIMIT_KEY, endpoint);
