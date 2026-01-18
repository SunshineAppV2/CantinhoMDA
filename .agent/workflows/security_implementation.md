---
description: Implementação de Melhorias de Segurança da Informação
---

# Workflow: Implementação de Segurança

Este workflow guia a implementação das melhorias de segurança conforme o **PLANO_SEGURANCA_INFORMACAO.md**.

## 📋 Pré-requisitos

- [ ] Plano de segurança revisado e aprovado
- [ ] Recursos alocados (desenvolvedores, orçamento)
- [ ] Backup completo do sistema atual
- [ ] Ambiente de testes configurado

---

## 🔴 FASE 1: SEGURANÇA CRÍTICA (Prioridade Máxima)

### 1. Gestão Segura de Secrets

```bash
# 1.1 Criar arquivo .env.example (sem valores reais)
cd G:\CantinhoMDA\cantinhomda-backend
```

Criar `G:\CantinhoMDA\cantinhomda-backend\.env.example`:
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"
ENCRYPTION_KEY="64-character-hex-encryption-key-for-aes256"
NODE_ENV="development"
FIREBASE_CREDENTIALS="path-to-firebase-credentials.json"
```

```bash
# 1.2 Gerar secrets seguros
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Ação Manual**: Copiar os secrets gerados e adicionar ao Render (Environment Variables)

---

### 2. Implementar Criptografia de Dados Sensíveis

```bash
# 2.1 Criar serviço de criptografia
cd G:\CantinhoMDA\cantinhomda-backend
```

Criar arquivo `src/common/encryption/encryption.service.ts` (ver PLANO_SEGURANCA_INFORMACAO.md seção 1.2)

```bash
# 2.2 Criar módulo de criptografia
```

Criar `src/common/encryption/encryption.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
```

```bash
# 2.3 Importar no AppModule
```

Atualizar `src/app.module.ts` para incluir `EncryptionModule`

```bash
# 2.4 Criar migration para criptografar dados existentes
npx prisma migrate dev --name add_encryption_to_sensitive_data
```

**IMPORTANTE**: Criar script de migração de dados para criptografar CPF, RG, etc.

---

### 3. Implementar Rate Limiting Avançado

```bash
# 3.1 Instalar dependência
cd G:\CantinhoMDA\cantinhomda-backend
npm install rate-limiter-flexible
```

```bash
# 3.2 Criar guard de rate limiting
```

Criar `src/common/guards/rate-limit.guard.ts` (ver PLANO_SEGURANCA_INFORMACAO.md seção 1.3)

```bash
# 3.3 Aplicar em endpoints críticos
```

Atualizar `src/auth/auth.controller.ts` para usar `@RateLimit('login')` e `@RateLimit('register')`

---

### 4. Expandir Sistema de Auditoria

```bash
# 4.1 Atualizar schema Prisma
```

Adicionar campo `status` e índices ao modelo `AuditLog` em `prisma/schema.prisma`

```bash
# 4.2 Criar migration
npx prisma migrate dev --name enhance_audit_logs
```

```bash
# 4.3 Criar interceptor de auditoria
```

Criar `src/common/interceptors/audit.interceptor.ts` (ver PLANO_SEGURANCA_INFORMACAO.md seção 1.4)

```bash
# 4.4 Aplicar globalmente
```

Atualizar `src/main.ts` para usar `app.useGlobalInterceptors(new AuditInterceptor())`

---

## 🟡 FASE 2: AUTENTICAÇÃO E AUTORIZAÇÃO

### 5. Implementar Refresh Token

```bash
# 5.1 Atualizar schema Prisma
```

Adicionar modelo `RefreshToken` ao `prisma/schema.prisma`

```bash
# 5.2 Criar migration
npx prisma migrate dev --name add_refresh_tokens
```

```bash
# 5.3 Atualizar AuthService
```

Implementar métodos `refreshAccessToken`, `storeRefreshToken`, `revokeRefreshToken`

```bash
# 5.4 Criar endpoint de refresh
```

Adicionar `POST /auth/refresh` em `src/auth/auth.controller.ts`

```bash
# 5.5 Atualizar frontend
cd G:\CantinhoMDA\cantinhomda-web
```

Implementar interceptor Axios para refresh automático de tokens

---

### 6. Implementar Sistema de Permissões (RBAC)

```bash
# 6.1 Criar enums de permissões
```

Criar `src/common/decorators/permissions.decorator.ts`

```bash
# 6.2 Criar guard de permissões
```

Criar `src/common/guards/permissions.guard.ts`

```bash
# 6.3 Criar serviço de permissões
```

Criar `src/auth/permissions/permissions.service.ts`

```bash
# 6.4 Aplicar em endpoints sensíveis
```

Adicionar `@RequirePermissions(Permission.SENSITIVE_DATA_READ)` nos controllers

---

## 🟡 FASE 3: COMPLIANCE LGPD

### 7. Implementar Consentimento LGPD

```bash
# 7.1 Criar modelo de consentimento
```

Adicionar modelo `UserConsent` ao `prisma/schema.prisma`

```bash
# 7.2 Criar migration
npx prisma migrate dev --name add_user_consent
```

```bash
# 7.3 Criar serviço de consentimento
```

Criar `src/lgpd/consent/consent.service.ts`

```bash
# 7.4 Criar endpoints
```

Adicionar endpoints em `src/lgpd/consent/consent.controller.ts`

```bash
# 7.5 Atualizar frontend
cd G:\CantinhoMDA\cantinhomda-web
```

Criar modal de consentimento no primeiro login

---

### 8. Implementar Direito ao Esquecimento

```bash
# 8.1 Criar modelo de solicitação
```

Adicionar modelo `DataDeletionRequest` ao `prisma/schema.prisma`

```bash
# 8.2 Criar serviço
```

Criar `src/lgpd/data-deletion/data-deletion.service.ts`

```bash
# 8.3 Criar endpoints
```

Adicionar endpoints de solicitação e processamento

---

### 9. Implementar Portabilidade de Dados

```bash
# 9.1 Criar serviço de exportação
```

Criar `src/lgpd/data-export/data-export.service.ts`

```bash
# 9.2 Criar endpoint
```

Adicionar `GET /users/:id/export-data`

---

## 🟡 FASE 4: INFRAESTRUTURA

### 10. Configurar Backup Automático

```bash
# 10.1 Criar script de backup
```

Criar `scripts/backup-database.sh` no backend

```bash
# 10.2 Configurar cron no Render
```

**Ação Manual**: Adicionar cron job no Render Dashboard

```bash
# 10.3 Configurar S3 para backups
```

**Ação Manual**: Criar bucket S3 e configurar credenciais

---

### 11. Implementar Monitoramento de Segurança

```bash
# 11.1 Criar modelo de alertas
```

Adicionar modelo `SecurityAlert` ao `prisma/schema.prisma`

```bash
# 11.2 Criar serviço de monitoramento
```

Criar `src/monitoring/security-monitor.service.ts`

```bash
# 11.3 Configurar alertas
```

Integrar com Slack/email para notificações

---

## 🟢 FASE 5: FRONTEND

### 12. Implementar Proteção XSS/CSRF

```bash
cd G:\CantinhoMDA\cantinhomda-web

# 12.1 Instalar DOMPurify
npm install dompurify
npm install --save-dev @types/dompurify
```

```bash
# 12.2 Criar utilitários de sanitização
```

Criar `src/utils/sanitize.ts`

```bash
# 12.3 Implementar CSRF tokens
```

Criar `src/utils/csrf.ts` e adicionar interceptor Axios

---

### 13. Migrar para Armazenamento Seguro

```bash
# 13.1 Criar SecureStorage
```

Criar `src/utils/secure-storage.ts`

```bash
# 13.2 Migrar localStorage para sessionStorage
```

Substituir todas as chamadas `localStorage` por `secureStorage`

```bash
# 13.3 Implementar auto-logout
```

Adicionar timer de inatividade (15 minutos)

---

## ✅ VALIDAÇÃO E TESTES

### Testes de Segurança

```bash
# 1. Testar rate limiting
cd G:\CantinhoMDA\cantinhomda-backend
npm run test:e2e -- --grep "rate limiting"
```

```bash
# 2. Testar criptografia
npm run test:e2e -- --grep "encryption"
```

```bash
# 3. Testar auditoria
npm run test:e2e -- --grep "audit"
```

```bash
# 4. Testar LGPD
npm run test:e2e -- --grep "lgpd"
```

### Scan de Vulnerabilidades

```bash
# 5. Scan de dependências
npm audit
npm audit fix
```

```bash
# 6. Scan de código
npx eslint-plugin-security
```

---

## 🚀 DEPLOY

### Backend

```bash
# 1. Commit e push
cd G:\CantinhoMDA\cantinhomda-backend
git add .
git commit -m "feat: implement security improvements (Phase 1-5)"
git push origin main
```

**Ação Manual**: Verificar deploy no Render

### Frontend

```bash
# 2. Commit e push
cd G:\CantinhoMDA\cantinhomda-web
git add .
git commit -m "feat: implement frontend security improvements"
git push origin main
```

**Ação Manual**: Verificar deploy no Vercel

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### Verificações Imediatas

- [ ] Verificar logs de erro no Render
- [ ] Testar login/registro
- [ ] Verificar rate limiting funcionando
- [ ] Testar criptografia de dados
- [ ] Verificar auditoria sendo registrada
- [ ] Testar backup automático

### Monitoramento Contínuo

- [ ] Configurar alertas de segurança
- [ ] Revisar logs de auditoria diariamente
- [ ] Testar restauração de backup mensalmente
- [ ] Revisar permissões trimestralmente

---

## 📚 DOCUMENTAÇÃO

- [ ] Atualizar README.md com novas features de segurança
- [ ] Documentar processo de recuperação de dados
- [ ] Criar runbook de resposta a incidentes
- [ ] Documentar política de privacidade

---

## 🎓 TREINAMENTO

- [ ] Treinar equipe em novas práticas de segurança
- [ ] Documentar fluxo de consentimento LGPD
- [ ] Criar guia de uso do 2FA (se implementado)

---

## ✅ CHECKLIST FINAL

- [ ] Todas as fases implementadas
- [ ] Testes de segurança passando
- [ ] Deploy em produção realizado
- [ ] Monitoramento configurado
- [ ] Documentação atualizada
- [ ] Equipe treinada
- [ ] Backup testado
- [ ] Compliance LGPD verificado

---

**Status**: 🟡 Em Progresso  
**Última atualização**: {{ data }}  
**Responsável**: {{ nome }}
