# 🔐 PLANO DE SEGURANÇA DA INFORMAÇÃO - CantinhoMDA

## 📋 Sumário Executivo

Este documento apresenta um plano abrangente de melhorias de segurança da informação para o sistema CantinhoMDA, abordando aspectos de **autenticação**, **autorização**, **proteção de dados**, **auditoria**, **compliance** e **infraestrutura**.

**Status Atual**: ⚠️ Segurança Básica Implementada  
**Objetivo**: 🎯 Segurança Robusta e Compliance com LGPD  
**Prioridade**: 🔴 ALTA

---

## 🎯 Análise de Riscos Identificados

### 🔴 Riscos Críticos (Ação Imediata)

1. **Exposição de Credenciais Sensíveis**
   - ❌ JWT_SECRET em texto plano no código
   - ❌ DATABASE_URL exposta no repositório
   - ❌ Sem rotação de secrets
   - **Impacto**: Comprometimento total do sistema

2. **Falta de Criptografia de Dados Sensíveis**
   - ❌ CPF, RG armazenados em texto plano
   - ❌ Dados de saúde sem criptografia
   - ❌ Informações bancárias sem proteção adicional
   - **Impacto**: Violação LGPD, multas de até 2% do faturamento

3. **Ausência de Rate Limiting Granular**
   - ⚠️ Rate limit global de 500 req/15min é muito permissivo
   - ❌ Sem proteção específica para login/registro
   - ❌ Vulnerável a ataques de força bruta
   - **Impacto**: Ataques DDoS, comprometimento de contas

4. **Logs de Auditoria Incompletos**
   - ⚠️ Auditoria implementada mas não abrangente
   - ❌ Sem logs de acesso a dados sensíveis
   - ❌ Sem rastreamento de alterações em dados críticos
   - **Impacto**: Dificuldade em investigar incidentes

### 🟡 Riscos Médios (Curto Prazo)

5. **Validação de Entrada Insuficiente**
   - ⚠️ ValidationPipe configurado mas sem sanitização
   - ❌ Vulnerável a XSS e SQL Injection
   - **Impacto**: Injeção de código malicioso

6. **Gestão de Sessões**
   - ❌ Tokens JWT sem expiração curta
   - ❌ Sem invalidação de tokens
   - ❌ Sem refresh token seguro
   - **Impacto**: Sessões comprometidas permanecem válidas

7. **Backup e Recuperação**
   - ❌ Sem política de backup automatizado
   - ❌ Sem testes de recuperação
   - **Impacto**: Perda de dados irreversível

8. **Monitoramento de Segurança**
   - ❌ Sem alertas de segurança
   - ❌ Sem detecção de anomalias
   - **Impacto**: Ataques não detectados

### 🟢 Riscos Baixos (Médio Prazo)

9. **Compliance LGPD**
   - ❌ Sem termo de consentimento
   - ❌ Sem política de privacidade
   - ❌ Sem processo de exclusão de dados
   - **Impacto**: Não conformidade legal

10. **Segurança de Upload de Arquivos**
    - ❌ Sem validação de tipo de arquivo
    - ❌ Sem scan de malware
    - **Impacto**: Upload de arquivos maliciosos

---

## 🛡️ PLANO DE AÇÃO - PRIORIZADO

## FASE 1: SEGURANÇA CRÍTICA (Semana 1-2)

### 1.1 🔑 Gestão Segura de Secrets

**Problema**: Credenciais expostas em código e repositório

**Solução**:

#### Backend
```typescript
// src/config/secrets.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('secrets', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  encryptionKey: process.env.ENCRYPTION_KEY,
  firebaseCredentials: process.env.FIREBASE_CREDENTIALS,
}));

// Validação de variáveis obrigatórias
export function validateSecrets() {
  const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
    'ENCRYPTION_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

**Ações**:
- [ ] Criar `.env.example` sem valores reais
- [ ] Adicionar `.env` ao `.gitignore` (verificar se já está)
- [ ] Usar variáveis de ambiente no Render/Vercel
- [ ] Implementar rotação de secrets (trimestral)
- [ ] Usar secrets manager (AWS Secrets Manager, HashiCorp Vault)

**Prioridade**: 🔴 CRÍTICA  
**Tempo**: 2 dias  
**Responsável**: DevOps + Backend

---

### 1.2 🔐 Criptografia de Dados Sensíveis (LGPD)

**Problema**: Dados pessoais sensíveis em texto plano

**Solução**:

```typescript
// src/common/encryption/encryption.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    // Chave de 32 bytes para AES-256
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Retorna: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
```

**Campos a Criptografar**:
- ✅ CPF
- ✅ RG
- ✅ Dados de saúde (susNumber, healthPlan, etc.)
- ✅ Informações de contato de emergência
- ✅ Endereço completo

**Implementação no Prisma**:

```typescript
// src/users/users.service.ts
async create(createUserDto: CreateUserDto) {
  const encryptedData = {
    ...createUserDto,
    cpf: createUserDto.cpf ? this.encryptionService.encrypt(createUserDto.cpf) : null,
    rg: createUserDto.rg ? this.encryptionService.encrypt(createUserDto.rg) : null,
    susNumber: createUserDto.susNumber ? this.encryptionService.encrypt(createUserDto.susNumber) : null,
    // ... outros campos sensíveis
  };

  return this.prisma.user.create({ data: encryptedData });
}

async findOne(id: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  
  if (!user) return null;

  // Descriptografar apenas quando necessário
  return {
    ...user,
    cpf: user.cpf ? this.encryptionService.decrypt(user.cpf) : null,
    rg: user.rg ? this.encryptionService.decrypt(user.rg) : null,
    // ... outros campos
  };
}
```

**Ações**:
- [ ] Criar EncryptionService
- [ ] Gerar chave de criptografia segura (32 bytes)
- [ ] Criar migration para criptografar dados existentes
- [ ] Atualizar UsersService para usar criptografia
- [ ] Documentar processo de recuperação de chave

**Prioridade**: 🔴 CRÍTICA  
**Tempo**: 3 dias  
**Responsável**: Backend

---

### 1.3 🚦 Rate Limiting Avançado

**Problema**: Proteção insuficiente contra ataques de força bruta

**Solução**:

```typescript
// src/common/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private loginLimiter = new RateLimiterMemory({
    points: 5, // 5 tentativas
    duration: 15 * 60, // por 15 minutos
    blockDuration: 60 * 60, // bloqueia por 1 hora
  });

  private registerLimiter = new RateLimiterMemory({
    points: 3, // 3 registros
    duration: 60 * 60, // por hora
  });

  private apiLimiter = new RateLimiterMemory({
    points: 100, // 100 requisições
    duration: 60, // por minuto
  });

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const endpoint = this.reflector.get<string>('endpoint', context.getHandler());
    const ip = request.ip;

    try {
      if (endpoint === 'login') {
        await this.loginLimiter.consume(ip);
      } else if (endpoint === 'register') {
        await this.registerLimiter.consume(ip);
      } else {
        await this.apiLimiter.consume(ip);
      }
      return true;
    } catch (error) {
      throw new HttpException(
        'Muitas tentativas. Tente novamente mais tarde.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }
}

// Decorator customizado
export const RateLimit = (endpoint: string) => SetMetadata('endpoint', endpoint);
```

**Uso**:

```typescript
// src/auth/auth.controller.ts
@Post('login')
@RateLimit('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}

@Post('register')
@RateLimit('register')
async register(@Body() registerDto: RegisterDto) {
  return this.authService.register(registerDto);
}
```

**Ações**:
- [ ] Instalar `rate-limiter-flexible`
- [ ] Criar RateLimitGuard
- [ ] Aplicar em endpoints críticos
- [ ] Configurar Redis para produção (persistência)
- [ ] Adicionar logs de tentativas bloqueadas

**Prioridade**: 🔴 CRÍTICA  
**Tempo**: 2 dias  
**Responsável**: Backend

---

### 1.4 📝 Sistema de Auditoria Completo

**Problema**: Logs de auditoria incompletos

**Solução**:

```typescript
// src/common/interceptors/audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, body } = request;

    // Ações que devem ser auditadas
    const auditableActions = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    if (!auditableActions.includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          this.auditService.log({
            action: `${method} ${url}`,
            resource: this.extractResource(url),
            resourceId: this.extractResourceId(url, response),
            authorId: user?.userId,
            clubId: user?.clubId,
            ipAddress: ip,
            details: {
              method,
              url,
              body: this.sanitizeBody(body),
              response: this.sanitizeResponse(response),
              duration: Date.now() - startTime,
              userAgent: request.headers['user-agent'],
            },
            status: 'SUCCESS',
          });
        },
        error: (error) => {
          this.auditService.log({
            action: `${method} ${url}`,
            resource: this.extractResource(url),
            authorId: user?.userId,
            clubId: user?.clubId,
            ipAddress: ip,
            details: {
              method,
              url,
              error: error.message,
              stack: error.stack,
            },
            status: 'ERROR',
          });
        },
      })
    );
  }

  private sanitizeBody(body: any): any {
    // Remove campos sensíveis dos logs
    const sensitiveFields = ['password', 'cpf', 'rg', 'susNumber'];
    const sanitized = { ...body };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  private sanitizeResponse(response: any): any {
    // Limita tamanho da resposta nos logs
    if (typeof response === 'object') {
      return { ...response, _truncated: true };
    }
    return response;
  }

  private extractResource(url: string): string {
    const parts = url.split('/');
    return parts[1] || 'unknown';
  }

  private extractResourceId(url: string, response: any): string | null {
    // Tenta extrair ID da URL ou resposta
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = url.match(uuidRegex);
    
    if (match) return match[0];
    if (response?.id) return response.id;
    
    return null;
  }
}
```

**Atualizar Schema Prisma**:

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  action     String
  resource   String
  resourceId String?
  details    Json?
  ipAddress  String?
  userAgent  String?
  authorId   String?
  clubId     String?
  status     String   @default("SUCCESS") // SUCCESS, ERROR, WARNING
  createdAt  DateTime @default(now())
  
  author     User?    @relation(fields: [authorId], references: [id])
  club       Club?    @relation(fields: [clubId], references: [id])

  @@index([authorId])
  @@index([clubId])
  @@index([resource])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**Ações**:
- [ ] Criar AuditInterceptor
- [ ] Atualizar schema Prisma
- [ ] Aplicar globalmente no main.ts
- [ ] Criar dashboard de auditoria
- [ ] Configurar retenção de logs (6 meses)

**Prioridade**: 🔴 CRÍTICA  
**Tempo**: 3 dias  
**Responsável**: Backend

---

## FASE 2: AUTENTICAÇÃO E AUTORIZAÇÃO (Semana 3-4)

### 2.1 🔄 Refresh Token Seguro

**Problema**: Tokens JWT sem refresh seguro

**Solução**:

```typescript
// src/auth/auth.service.ts
async login(user: any) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    clubId: user.clubId,
  };

  const accessToken = this.jwtService.sign(payload, {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m', // Token de acesso curto
  });

  const refreshToken = this.jwtService.sign(
    { sub: user.id },
    {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d', // Refresh token mais longo
    }
  );

  // Armazenar refresh token no banco (hash)
  await this.storeRefreshToken(user.id, refreshToken);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 900, // 15 minutos em segundos
  };
}

async refreshAccessToken(refreshToken: string) {
  try {
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    // Verificar se refresh token está válido no banco
    const isValid = await this.validateRefreshToken(payload.sub, refreshToken);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findOne(payload.sub);
    
    return this.login(user);
  } catch (error) {
    throw new UnauthorizedException('Invalid refresh token');
  }
}

async logout(userId: string, refreshToken: string) {
  // Invalidar refresh token
  await this.revokeRefreshToken(userId, refreshToken);
}

private async storeRefreshToken(userId: string, token: string) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  await this.prisma.refreshToken.create({
    data: {
      userId,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}
```

**Novo Model Prisma**:

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  revokedAt DateTime?
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

**Ações**:
- [ ] Implementar refresh token
- [ ] Criar endpoint `/auth/refresh`
- [ ] Atualizar frontend para usar refresh
- [ ] Implementar logout adequado
- [ ] Limpar tokens expirados (cron job)

**Prioridade**: 🟡 ALTA  
**Tempo**: 3 dias  
**Responsável**: Backend + Frontend

---

### 2.2 🔐 Autenticação Multi-Fator (2FA)

**Problema**: Apenas senha como fator de autenticação

**Solução**:

```typescript
// src/auth/two-factor/two-factor.service.ts
import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
  async generateSecret(email: string) {
    const secret = speakeasy.generateSecret({
      name: `CantinhoMDA (${email})`,
      length: 32,
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Aceita tokens de até 2 períodos antes/depois
    });
  }

  async enable2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const { secret, qrCode } = await this.generateSecret(user.email);

    // Armazenar secret temporário
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
    });

    return { qrCode, secret };
  }

  async verify2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    const isValid = this.verifyToken(user.twoFactorSecret, token);
    
    if (isValid && !user.twoFactorEnabled) {
      // Ativar 2FA após primeira verificação bem-sucedida
      await this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      });
    }

    return isValid;
  }
}
```

**Atualizar Schema**:

```prisma
model User {
  // ... campos existentes
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?
  backupCodes      String[] @default([])
}
```

**Ações**:
- [ ] Implementar 2FA com TOTP
- [ ] Criar endpoints de configuração
- [ ] Atualizar fluxo de login
- [ ] Gerar códigos de backup
- [ ] Criar UI para configuração

**Prioridade**: 🟡 MÉDIA  
**Tempo**: 4 dias  
**Responsável**: Backend + Frontend

---

### 2.3 🛡️ RBAC (Role-Based Access Control) Aprimorado

**Problema**: Controle de acesso básico

**Solução**:

```typescript
// src/common/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export enum Permission {
  // Users
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // Treasury
  TREASURY_READ = 'treasury:read',
  TREASURY_WRITE = 'treasury:write',
  TREASURY_APPROVE = 'treasury:approve',
  
  // Sensitive Data
  SENSITIVE_DATA_READ = 'sensitive:read',
  SENSITIVE_DATA_WRITE = 'sensitive:write',
  
  // Admin
  ADMIN_FULL = 'admin:full',
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// src/common/guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const userPermissions = await this.permissionsService.getUserPermissions(
      user.userId,
      user.role,
    );

    return requiredPermissions.every(permission =>
      userPermissions.includes(permission),
    );
  }
}
```

**Mapeamento de Permissões por Role**:

```typescript
// src/auth/permissions/permissions.config.ts
export const ROLE_PERMISSIONS = {
  MASTER: [Permission.ADMIN_FULL, Permission.SENSITIVE_DATA_READ, Permission.SENSITIVE_DATA_WRITE],
  OWNER: [Permission.USER_READ, Permission.USER_WRITE, Permission.TREASURY_APPROVE],
  ADMIN: [Permission.USER_READ, Permission.TREASURY_READ, Permission.TREASURY_WRITE],
  COORDINATOR_REGIONAL: [Permission.USER_READ, Permission.TREASURY_READ],
  INSTRUCTOR: [Permission.USER_READ],
  PATHFINDER: [Permission.USER_READ],
};
```

**Ações**:
- [ ] Criar sistema de permissões
- [ ] Implementar PermissionsGuard
- [ ] Mapear permissões por role
- [ ] Aplicar em endpoints sensíveis
- [ ] Criar UI de gerenciamento de permissões

**Prioridade**: 🟡 MÉDIA  
**Tempo**: 3 dias  
**Responsável**: Backend

---

## FASE 3: PROTEÇÃO DE DADOS E COMPLIANCE (Semana 5-6)

### 3.1 📜 Compliance LGPD

**Problema**: Não conformidade com LGPD

**Solução**:

#### 3.1.1 Termo de Consentimento

```typescript
// src/lgpd/consent/consent.service.ts
@Injectable()
export class ConsentService {
  async recordConsent(userId: string, consentData: ConsentDto) {
    return this.prisma.userConsent.create({
      data: {
        userId,
        consentType: consentData.type,
        consentText: consentData.text,
        consentVersion: consentData.version,
        ipAddress: consentData.ip,
        userAgent: consentData.userAgent,
        acceptedAt: new Date(),
      },
    });
  }

  async revokeConsent(userId: string, consentType: string) {
    return this.prisma.userConsent.updateMany({
      where: { userId, consentType, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async hasValidConsent(userId: string, consentType: string): Promise<boolean> {
    const consent = await this.prisma.userConsent.findFirst({
      where: {
        userId,
        consentType,
        revokedAt: null,
      },
      orderBy: { acceptedAt: 'desc' },
    });

    return !!consent;
  }
}
```

**Schema**:

```prisma
model UserConsent {
  id             String    @id @default(uuid())
  userId         String
  consentType    String    // DATA_PROCESSING, MARKETING, ANALYTICS
  consentText    String
  consentVersion String
  ipAddress      String
  userAgent      String?
  acceptedAt     DateTime  @default(now())
  revokedAt      DateTime?
  
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("user_consents")
}
```

#### 3.1.2 Direito ao Esquecimento

```typescript
// src/lgpd/data-deletion/data-deletion.service.ts
@Injectable()
export class DataDeletionService {
  async requestDataDeletion(userId: string) {
    // Criar solicitação
    const request = await this.prisma.dataDeletionRequest.create({
      data: {
        userId,
        status: 'PENDING',
        requestedAt: new Date(),
      },
    });

    // Notificar administradores
    await this.notificationService.notifyAdmins({
      title: 'Solicitação de Exclusão de Dados',
      message: `Usuário ${userId} solicitou exclusão de dados pessoais`,
      type: 'LGPD_REQUEST',
    });

    return request;
  }

  async processDataDeletion(requestId: string, approvedBy: string) {
    const request = await this.prisma.dataDeletionRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    // Anonimizar dados ao invés de deletar (manter integridade referencial)
    await this.prisma.user.update({
      where: { id: request.userId },
      data: {
        email: `deleted_${request.userId}@anonymized.local`,
        name: 'Usuário Removido',
        cpf: null,
        rg: null,
        phone: null,
        address: null,
        // ... outros campos sensíveis
        status: 'DELETED',
      },
    });

    // Marcar solicitação como processada
    await this.prisma.dataDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        processedBy: approvedBy,
      },
    });

    // Registrar auditoria
    await this.auditService.log({
      action: 'DATA_DELETION',
      resource: 'user',
      resourceId: request.userId,
      authorId: approvedBy,
      details: { requestId },
    });
  }
}
```

#### 3.1.3 Portabilidade de Dados

```typescript
// src/lgpd/data-export/data-export.service.ts
@Injectable()
export class DataExportService {
  async exportUserData(userId: string): Promise<Buffer> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        attendances: true,
        transactions: true,
        requirements: true,
        specialties: true,
        pointsHistory: true,
        purchases: true,
      },
    });

    // Descriptografar dados sensíveis
    const decryptedUser = await this.decryptUserData(user);

    // Gerar JSON formatado
    const exportData = {
      exportDate: new Date().toISOString(),
      userData: decryptedUser,
      metadata: {
        version: '1.0',
        format: 'JSON',
      },
    };

    return Buffer.from(JSON.stringify(exportData, null, 2));
  }
}
```

**Ações**:
- [ ] Implementar sistema de consentimento
- [ ] Criar fluxo de exclusão de dados
- [ ] Implementar exportação de dados
- [ ] Criar política de privacidade
- [ ] Adicionar termos de uso
- [ ] Criar página de gerenciamento de dados

**Prioridade**: 🟡 ALTA  
**Tempo**: 5 dias  
**Responsável**: Backend + Jurídico

---

### 3.2 🔒 Segurança de Upload de Arquivos

**Problema**: Uploads sem validação adequada

**Solução**:

```typescript
// src/common/validators/file-upload.validator.ts
import { FileValidator } from '@nestjs/common';
import * as fileType from 'file-type';
import * as crypto from 'crypto';

export class SecureFileValidator extends FileValidator {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  async isValid(file: Express.Multer.File): Promise<boolean> {
    // 1. Verificar tamanho
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('Arquivo muito grande');
    }

    // 2. Verificar tipo real do arquivo (não confiar na extensão)
    const type = await fileType.fromBuffer(file.buffer);
    
    if (!type || !this.allowedMimeTypes.includes(type.mime)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

    // 3. Verificar nome do arquivo (sanitizar)
    const sanitizedName = this.sanitizeFilename(file.originalname);
    file.originalname = sanitizedName;

    // 4. Scan de malware (integração com ClamAV ou similar)
    const isSafe = await this.scanForMalware(file.buffer);
    
    if (!isSafe) {
      throw new BadRequestException('Arquivo contém conteúdo malicioso');
    }

    return true;
  }

  private sanitizeFilename(filename: string): string {
    // Remove caracteres perigosos
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 255);
  }

  private async scanForMalware(buffer: Buffer): Promise<boolean> {
    // Integração com ClamAV ou serviço de scan
    // Por enquanto, retorna true (implementar posteriormente)
    return true;
  }

  buildErrorMessage(): string {
    return 'Arquivo inválido';
  }
}

// src/common/storage/secure-storage.service.ts
@Injectable()
export class SecureStorageService {
  async uploadFile(file: Express.Multer.File, userId: string): Promise<string> {
    // Gerar nome único
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${hash}${ext}`;

    // Organizar por data e usuário
    const date = new Date();
    const folder = `${date.getFullYear()}/${date.getMonth() + 1}/${userId}`;
    const filepath = path.join(folder, filename);

    // Upload para storage seguro (S3, Google Cloud Storage, etc.)
    await this.storageClient.upload(filepath, file.buffer, {
      contentType: file.mimetype,
      metadata: {
        uploadedBy: userId,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Retornar URL assinada (temporária)
    return this.storageClient.getSignedUrl(filepath, { expiresIn: 3600 });
  }

  async deleteFile(filepath: string, userId: string): Promise<void> {
    // Verificar se usuário tem permissão
    const metadata = await this.storageClient.getMetadata(filepath);
    
    if (metadata.uploadedBy !== userId) {
      throw new ForbiddenException('Sem permissão para deletar arquivo');
    }

    await this.storageClient.delete(filepath);
  }
}
```

**Ações**:
- [ ] Implementar validação de arquivos
- [ ] Integrar scan de malware
- [ ] Migrar uploads para storage seguro (S3/GCS)
- [ ] Implementar URLs assinadas
- [ ] Adicionar limite de quota por usuário

**Prioridade**: 🟡 MÉDIA  
**Tempo**: 4 dias  
**Responsável**: Backend

---

## FASE 4: INFRAESTRUTURA E MONITORAMENTO (Semana 7-8)

### 4.1 📊 Monitoramento de Segurança

**Problema**: Sem monitoramento de eventos de segurança

**Solução**:

```typescript
// src/monitoring/security-monitor.service.ts
@Injectable()
export class SecurityMonitorService {
  private readonly suspiciousPatterns = {
    multipleFailedLogins: { threshold: 5, window: 300000 }, // 5 em 5 min
    rapidApiCalls: { threshold: 100, window: 60000 }, // 100 em 1 min
    sensitiveDataAccess: { threshold: 50, window: 3600000 }, // 50 em 1h
  };

  async detectAnomalies(userId: string, action: string) {
    const recentActions = await this.getRecentActions(userId, action);

    // Detectar padrões suspeitos
    if (this.isAnomalous(recentActions, action)) {
      await this.triggerSecurityAlert({
        userId,
        action,
        severity: 'HIGH',
        message: `Comportamento anômalo detectado: ${action}`,
        timestamp: new Date(),
      });

      // Bloquear temporariamente se necessário
      if (action === 'failed_login') {
        await this.temporaryBlock(userId, 3600000); // 1 hora
      }
    }
  }

  private async triggerSecurityAlert(alert: SecurityAlert) {
    // Salvar alerta
    await this.prisma.securityAlert.create({ data: alert });

    // Notificar administradores
    await this.notificationService.notifySecurityTeam(alert);

    // Integrar com ferramentas externas (Slack, PagerDuty, etc.)
    await this.externalNotificationService.send(alert);
  }

  async generateSecurityReport(startDate: Date, endDate: Date) {
    const alerts = await this.prisma.securityAlert.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    const failedLogins = await this.prisma.auditLog.count({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const blockedIPs = await this.getBlockedIPs(startDate, endDate);

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
        failedLogins,
        blockedIPs: blockedIPs.length,
      },
      alerts,
      recommendations: this.generateRecommendations(alerts),
    };
  }
}
```

**Schema**:

```prisma
model SecurityAlert {
  id        String   @id @default(uuid())
  userId    String?
  action    String
  severity  String   // LOW, MEDIUM, HIGH, CRITICAL
  message   String
  details   Json?
  resolved  Boolean  @default(false)
  resolvedBy String?
  resolvedAt DateTime?
  timestamp DateTime @default(now())

  @@index([userId])
  @@index([severity])
  @@index([timestamp])
  @@map("security_alerts")
}
```

**Ações**:
- [ ] Implementar detecção de anomalias
- [ ] Criar sistema de alertas
- [ ] Integrar com ferramentas de monitoramento
- [ ] Criar dashboard de segurança
- [ ] Configurar alertas automáticos

**Prioridade**: 🟡 MÉDIA  
**Tempo**: 4 dias  
**Responsável**: Backend + DevOps

---

### 4.2 💾 Backup e Recuperação

**Problema**: Sem política de backup automatizado

**Solução**:

#### Render PostgreSQL Backup

```bash
# Script de backup automático
#!/bin/bash

# backup-database.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="cantinhodbv"

# Backup completo
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Comprimir
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload para S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://cantinhomda-backups/

# Manter apenas últimos 30 dias localmente
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Notificar sucesso
curl -X POST https://api.cantinhomda.com/webhooks/backup-success \
  -H "Content-Type: application/json" \
  -d "{\"date\": \"$DATE\", \"status\": \"success\"}"
```

**Cron Job (Render)**:

```yaml
# render.yaml
services:
  - type: cron
    name: database-backup
    schedule: "0 2 * * *" # Diariamente às 2h
    command: ./scripts/backup-database.sh
```

**Teste de Recuperação**:

```typescript
// src/backup/backup-test.service.ts
@Injectable()
export class BackupTestService {
  async testRestore(backupFile: string): Promise<boolean> {
    try {
      // 1. Criar banco de teste
      await this.createTestDatabase();

      // 2. Restaurar backup
      await this.restoreBackup(backupFile, 'test_db');

      // 3. Validar integridade
      const isValid = await this.validateData('test_db');

      // 4. Limpar
      await this.dropTestDatabase();

      return isValid;
    } catch (error) {
      console.error('Backup restore test failed:', error);
      return false;
    }
  }

  async scheduleMonthlyTest() {
    // Testar restauração mensalmente
    cron.schedule('0 3 1 * *', async () => {
      const latestBackup = await this.getLatestBackup();
      const result = await this.testRestore(latestBackup);

      await this.notificationService.notifyAdmins({
        title: 'Teste de Backup',
        message: result ? 'Sucesso' : 'Falha',
        type: 'BACKUP_TEST',
      });
    });
  }
}
```

**Ações**:
- [ ] Configurar backup automático diário
- [ ] Configurar backup incremental (a cada 6h)
- [ ] Armazenar backups em múltiplas regiões
- [ ] Implementar testes mensais de restauração
- [ ] Documentar processo de recuperação
- [ ] Criar runbook de disaster recovery

**Prioridade**: 🟡 ALTA  
**Tempo**: 3 dias  
**Responsável**: DevOps

---

### 4.3 🔍 Logging Centralizado

**Problema**: Logs dispersos e difíceis de analisar

**Solução**:

```typescript
// src/logging/logger.service.ts
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'cantinhomda-backend',
        environment: process.env.NODE_ENV,
      },
      transports: [
        // Console
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),

        // Arquivo
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10485760,
          maxFiles: 10,
        }),

        // Elasticsearch (produção)
        ...(process.env.NODE_ENV === 'production'
          ? [
              new ElasticsearchTransport({
                level: 'info',
                clientOpts: {
                  node: process.env.ELASTICSEARCH_URL,
                  auth: {
                    username: process.env.ELASTICSEARCH_USER,
                    password: process.env.ELASTICSEARCH_PASSWORD,
                  },
                },
                index: 'cantinhomda-logs',
              }),
            ]
          : []),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

**Ações**:
- [ ] Implementar logging estruturado
- [ ] Configurar Elasticsearch + Kibana (ou alternativa)
- [ ] Criar dashboards de logs
- [ ] Configurar alertas de erro
- [ ] Implementar log rotation

**Prioridade**: 🟢 MÉDIA  
**Tempo**: 3 dias  
**Responsável**: DevOps

---

## FASE 5: SEGURANÇA FRONTEND (Semana 9)

### 5.1 🛡️ Proteção XSS e CSRF

**Problema**: Vulnerabilidades de frontend

**Solução**:

```typescript
// cantinhomda-web/src/utils/sanitize.ts
import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < e >
    .trim();
};

// cantinhomda-web/src/utils/csrf.ts
export const generateCSRFToken = (): string => {
  return crypto.randomUUID();
};

export const validateCSRFToken = (token: string): boolean => {
  const storedToken = sessionStorage.getItem('csrf_token');
  return token === storedToken;
};

// Interceptor Axios
axios.interceptors.request.use((config) => {
  const csrfToken = sessionStorage.getItem('csrf_token');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

**Content Security Policy**:

```typescript
// cantinhomda-backend/src/main.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://trusted-cdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cantinhomda-backend.onrender.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
```

**Ações**:
- [ ] Implementar sanitização de inputs
- [ ] Configurar CSP
- [ ] Implementar CSRF protection
- [ ] Adicionar validação de formulários
- [ ] Configurar SameSite cookies

**Prioridade**: 🟡 ALTA  
**Tempo**: 2 dias  
**Responsável**: Frontend

---

### 5.2 🔐 Armazenamento Seguro no Frontend

**Problema**: Dados sensíveis em localStorage

**Solução**:

```typescript
// cantinhomda-web/src/utils/secure-storage.ts
class SecureStorage {
  private readonly prefix = 'cantinhomda_';

  // Usar sessionStorage para dados sensíveis
  setSecure(key: string, value: any): void {
    const encrypted = this.encrypt(JSON.stringify(value));
    sessionStorage.setItem(this.prefix + key, encrypted);
  }

  getSecure(key: string): any {
    const encrypted = sessionStorage.getItem(this.prefix + key);
    if (!encrypted) return null;

    try {
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  // Limpar ao fechar aba
  clearOnUnload(): void {
    window.addEventListener('beforeunload', () => {
      sessionStorage.clear();
    });
  }

  private encrypt(text: string): string {
    // Criptografia simples no frontend (não é 100% segura)
    // Idealmente, dados sensíveis não devem ser armazenados no frontend
    return btoa(text);
  }

  private decrypt(encrypted: string): string {
    return atob(encrypted);
  }
}

export const secureStorage = new SecureStorage();

// Uso
secureStorage.setSecure('user', userData);
const user = secureStorage.getSecure('user');
```

**Ações**:
- [ ] Migrar dados sensíveis para sessionStorage
- [ ] Implementar auto-logout por inatividade
- [ ] Limpar storage ao fazer logout
- [ ] Não armazenar tokens em localStorage
- [ ] Usar httpOnly cookies quando possível

**Prioridade**: 🟡 ALTA  
**Tempo**: 1 dia  
**Responsável**: Frontend

---

## 📊 RESUMO DE PRIORIDADES

### 🔴 CRÍTICO (Semana 1-2)
1. ✅ Gestão Segura de Secrets
2. ✅ Criptografia de Dados Sensíveis (LGPD)
3. ✅ Rate Limiting Avançado
4. ✅ Sistema de Auditoria Completo

### 🟡 ALTA (Semana 3-6)
5. ✅ Refresh Token Seguro
6. ✅ RBAC Aprimorado
7. ✅ Compliance LGPD
8. ✅ Segurança de Upload
9. ✅ Backup Automatizado
10. ✅ Proteção XSS/CSRF
11. ✅ Armazenamento Seguro Frontend

### 🟢 MÉDIA (Semana 7-9)
12. ✅ Autenticação Multi-Fator (2FA)
13. ✅ Monitoramento de Segurança
14. ✅ Logging Centralizado

---

## 📈 MÉTRICAS DE SUCESSO

### KPIs de Segurança

1. **Tempo de Detecção de Incidentes**: < 5 minutos
2. **Tempo de Resposta a Incidentes**: < 1 hora
3. **Taxa de Falsos Positivos**: < 5%
4. **Cobertura de Auditoria**: 100% de ações críticas
5. **Compliance LGPD**: 100%
6. **Uptime de Backups**: 99.9%
7. **Tempo de Recuperação (RTO)**: < 4 horas
8. **Ponto de Recuperação (RPO)**: < 1 hora

### Indicadores de Maturidade

- [ ] **Nível 1 - Básico**: Autenticação e autorização básicas ✅ (Atual)
- [ ] **Nível 2 - Gerenciado**: Criptografia, auditoria, backups
- [ ] **Nível 3 - Definido**: RBAC, 2FA, monitoramento
- [ ] **Nível 4 - Quantitativamente Gerenciado**: Métricas, SLAs
- [ ] **Nível 5 - Otimizado**: Melhoria contínua, automação completa

---

## 💰 ESTIMATIVA DE CUSTOS

### Ferramentas e Serviços

| Item | Custo Mensal (USD) | Prioridade |
|------|-------------------|------------|
| Backup Storage (S3) | $10-30 | 🔴 CRÍTICA |
| Secrets Manager | $0-5 | 🔴 CRÍTICA |
| Monitoring (Datadog/New Relic) | $15-50 | 🟡 ALTA |
| Logging (Elasticsearch) | $20-100 | 🟢 MÉDIA |
| Security Scanning | $0-30 | 🟡 ALTA |
| **TOTAL** | **$45-215** | |

### Investimento em Tempo

| Fase | Dias | Desenvolvedores | Total Horas |
|------|------|----------------|-------------|
| Fase 1 | 10 | 2 | 160h |
| Fase 2 | 10 | 2 | 160h |
| Fase 3 | 10 | 2 | 160h |
| Fase 4 | 10 | 1 | 80h |
| Fase 5 | 5 | 1 | 40h |
| **TOTAL** | **45 dias** | | **600h** |

---

## 🎓 TREINAMENTO E CONSCIENTIZAÇÃO

### Para Desenvolvedores

1. **OWASP Top 10** (4h)
2. **Secure Coding Practices** (8h)
3. **LGPD para Desenvolvedores** (4h)
4. **Incident Response** (2h)

### Para Usuários

1. **Segurança de Senhas** (30min)
2. **Phishing Awareness** (30min)
3. **Proteção de Dados Pessoais** (30min)

---

## 📚 DOCUMENTAÇÃO NECESSÁRIA

- [ ] Política de Segurança da Informação
- [ ] Política de Privacidade (LGPD)
- [ ] Termos de Uso
- [ ] Plano de Resposta a Incidentes
- [ ] Runbook de Disaster Recovery
- [ ] Manual de Configuração de Segurança
- [ ] Guia de Desenvolvimento Seguro

---

## 🚨 PLANO DE RESPOSTA A INCIDENTES

### Níveis de Severidade

**🔴 CRÍTICO**: Vazamento de dados, sistema comprometido
- Tempo de resposta: Imediato
- Ação: Isolar sistema, notificar ANPD (72h)

**🟡 ALTO**: Tentativa de invasão, vulnerabilidade descoberta
- Tempo de resposta: 1 hora
- Ação: Investigar, aplicar patch

**🟢 MÉDIO**: Comportamento suspeito
- Tempo de resposta: 4 horas
- Ação: Monitorar, analisar

### Fluxo de Resposta

1. **Detecção** → 2. **Contenção** → 3. **Erradicação** → 4. **Recuperação** → 5. **Lições Aprendidas**

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Semana 1-2 (Crítico)
- [ ] Migrar secrets para variáveis de ambiente
- [ ] Implementar EncryptionService
- [ ] Criptografar dados existentes
- [ ] Implementar rate limiting granular
- [ ] Expandir sistema de auditoria
- [ ] Criar dashboard de auditoria

### Semana 3-4 (Alta)
- [ ] Implementar refresh tokens
- [ ] Criar sistema de permissões
- [ ] Atualizar guards de autorização
- [ ] Implementar 2FA (opcional)

### Semana 5-6 (Alta)
- [ ] Implementar consentimento LGPD
- [ ] Criar fluxo de exclusão de dados
- [ ] Implementar exportação de dados
- [ ] Validação de uploads
- [ ] Configurar backup automático

### Semana 7-9 (Média)
- [ ] Implementar monitoramento de segurança
- [ ] Configurar logging centralizado
- [ ] Proteção XSS/CSRF no frontend
- [ ] Migrar storage frontend

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **Revisar e aprovar este plano** com stakeholders
2. **Priorizar itens críticos** para implementação imediata
3. **Alocar recursos** (desenvolvedores, orçamento)
4. **Criar sprint de segurança** (2 semanas)
5. **Iniciar Fase 1** (Gestão de Secrets + Criptografia)

---

## 📞 CONTATOS DE EMERGÊNCIA

- **Responsável de Segurança**: [Nome]
- **DevOps Lead**: [Nome]
- **DPO (LGPD)**: [Nome]
- **Suporte Render**: support@render.com
- **Suporte Vercel**: support@vercel.com

---

**Documento criado em**: {{ data_atual }}  
**Versão**: 1.0  
**Próxima revisão**: Trimestral

---

## 🔗 REFERÊNCIAS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
