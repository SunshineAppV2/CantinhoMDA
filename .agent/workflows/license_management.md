---
description: Planejamento para Gestão de Licenças e Pagamentos (Master)
---

# 📘 Documentação Adaptada: Sistema de Cadastro, Validação e Cobrança

**Ranking DBV - Cantinho DBV**  
**Versão:** 1.0 (Adaptada do BaseTeen)  
**Última Atualização:** 2026-01-11

---

## 📋 Índice

1. [Análise Comparativa](#1-análise-comparativa)
2. [Situação Atual do Sistema](#2-situação-atual-do-sistema)
3. [Estrutura de Dados Proposta](#3-estrutura-de-dados-proposta)
4. [Fluxo de Aprovação de Cadastros](#4-fluxo-de-aprovação-de-cadastros)
5. [Sistema de Assinaturas/Cobrança](#5-sistema-de-assinaturascobrança)
6. [Plano de Implementação](#6-plano-de-implementação)
7. [Arquivos a Modificar](#7-arquivos-a-modificar)
8. [Próximos Passos](#8-próximos-passos)

---

## 1. Análise Comparativa

### BaseTeen vs Ranking DBV

| Aspecto | BaseTeen | Ranking DBV (Atual) |
|---------|----------|---------------------|
| **Backend** | Firebase (Firestore) | NestJS + PostgreSQL (Prisma) |
| **Autenticação** | Firebase Auth | Firebase Auth + JWT |
| **Assinaturas** | Collection `subscriptions` | Campo `subscriptionStatus` no modelo `Club` |
| **Pagamentos** | Collection `payments` | Integração Mercado Pago + PagBank (PIX) |
| **Hierarquia** | União → Associação → Região → Distrito → Base | União → Associação/Missão → Região → Distrito → Clube |
| **Termos** | "Base" | "Clube" |
| **Roles** | Separated (coord_uniao, etc) | Enum (OWNER, ADMIN, MASTER, etc) |
| **Status** | pending/approved/rejected | PENDING/ACTIVE/BLOCKED |

### O que JÁ EXISTE no Ranking DBV:

✅ **Estrutura de Assinaturas no Schema**:
- `Club.planTier` (FREE, TRIAL, PLAN_P, PLAN_M, PLAN_G)
- `Club.subscriptionStatus` (ACTIVE, OVERDUE, CANCELED, TRIAL)
- `Club.memberLimit` (limite de membros)
- `Club.nextBillingDate` (data do próximo vencimento)
- `Club.gracePeriodDays` (dias de carência)
- `Club.referralCode` (código de indicação)

✅ **Sistema de Status de Usuário**:
- `User.status` (PENDING, ACTIVE, BLOCKED)
- Validação no login (bloqueia PENDING e BLOCKED)

✅ **Fluxo de Registro**:
- Modo JOIN (entrar em clube existente)
- Modo CREATE (criar novo clube)
- Campos: plano de pagamento, quantidade de membros

✅ **Página de Assinatura**:
- `SubscriptionPage.tsx` exibe status
- Widget de assinatura
- Contato via WhatsApp

✅ **Serviço de Pagamentos**:
- Integração Mercado Pago
- Geração de PIX (PagBank)
- Planos configurados dinamicamente

### O que PRECISA SER IMPLEMENTADO:

❌ **Tela de Aprovação de Cadastros (Master)**:
- Listar usuários com status PENDING
- Aprovar/Rejeitar cadastros
- Criar estruturas hierárquicas se necessário

❌ **Tabela `payments` no PostgreSQL**:
- Rastrear histórico de pagamentos
- Tipos: `subscription`, `member_addition`
- Status: `pending`, `confirmed`, `expired`, `refunded`

❌ **Endpoints de Gestão de Assinaturas**:
- `POST /subscriptions/confirm-payment`
- `DELETE /payments/:id` (estorno)
- `GET /clubs/:id/subscription`

❌ **Modal de Limite de Membros**:
- Alertar quando limite atingido
- Oferecer link de upgrade via WhatsApp

---

## 2. Situação Atual do Sistema

### 2.1 Fluxo de Registro (Atual)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       FLUXO ATUAL DE REGISTRO                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CRIAR CLUBE              2. CRIAR USUÁRIO           3. LOGIN             │
│  ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  ┌─────────────────┐        ┌─────────────────┐        ┌────────────────┐   │
│  │ clubsService    │ ──────▶│ usersService    │ ─────▶ │  authService   │   │
│  │ .create()       │        │ .create()       │        │  .login()      │   │
│  │                 │        │ status: PENDING │        │  (FALHA p/     │   │
│  │ subscriptionStatus:      │                 │        │   PENDING)     │   │
│  │   TRIAL         │        └─────────────────┘        └────────────────┘   │
│  └─────────────────┘                                                        │
│                                                                              │
│  ⚠️ PROBLEMA: Usuário PENDING não consegue logar, mas não existe tela       │
│     para Master aprovar os cadastros!                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Schema Atual Relevante

```prisma
model Club {
  id                    String              @id @default(uuid())
  name                  String
  planTier              PlanTier            @default(TRIAL)
  memberLimit           Int                 @default(30)
  subscriptionStatus    SubscriptionStatus  @default(TRIAL)
  nextBillingDate       DateTime?
  gracePeriodDays       Int                 @default(5)
  subscriptionId        String?
  referralCode          String?             @unique
  referrerClubId        String?
  settings              Json?  // Contém billingCycle e memberLimit
  // ...
}

model User {
  id        String     @id @default(uuid())
  status    UserStatus @default(ACTIVE)  // PENDING, ACTIVE, BLOCKED
  role      Role       // OWNER, ADMIN, PATHFINDER, MASTER, etc
  clubId    String?
  // ...
}

enum SubscriptionStatus {
  ACTIVE
  OVERDUE
  CANCELED
  TRIAL
}
```

---

## 3. Estrutura de Dados Proposta

### 3.1 Nova Tabela: `Payment`

```prisma
model Payment {
  id              String        @id @default(uuid())
  clubId          String
  type            PaymentType   // subscription, member_addition
  amount          Float
  status          PaymentStatus // pending, confirmed, expired, refunded
  paymentMethod   String        @default("pix")
  description     String
  metadata        Json?         // { memberCount, months, startDate, newMemberLimit }
  confirmedAt     DateTime?
  confirmedBy     String?       // userId do Master
  expiresAt       DateTime?
  createdAt       DateTime      @default(now())
  
  club            Club          @relation(fields: [clubId], references: [id])
  confirmedByUser User?         @relation("PaymentConfirmer", fields: [confirmedBy], references: [id])

  @@map("payments")
}

enum PaymentType {
  SUBSCRIPTION
  MEMBER_ADDITION
  RENEWAL
}

enum PaymentStatus {
  PENDING
  CONFIRMED
  EXPIRED
  REFUNDED
}
```

### 3.2 Atualização: `Club` (Campos Adicionais)

```prisma
model Club {
  // Campos existentes...
  
  // Novos campos (se necessário)
  currentMemberCount  Int   @default(0)  // Pode ser calculado dinamicamente
  subscriptionAmount  Float @default(0)  // Valor pago na última assinatura
  
  // Relações
  payments            Payment[]
}
```

### 3.3 Atualização: `User` (Pendente Info)

O schema atual já possui os campos necessários:
- `status: UserStatus` (PENDING, ACTIVE, BLOCKED)
- Campos de hierarquia: `union`, `association`, `region`, `district`

---

## 4. Fluxo de Aprovação de Cadastros

### 4.1 Fluxo Proposto

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      FLUXO COMPLETO PROPOSTO                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CADASTRO          2. VALIDAÇÃO           3. PAGAMENTO         4. ATIVO  │
│  ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  ┌─────────────┐     ┌──────────────┐      ┌────────────────┐   ┌─────────┐ │
│  │   Usuário   │────▶│    Master    │─────▶│    Payment     │──▶│  Acesso │ │
│  │  Preenche   │     │   Aprova     │      │    Pendente    │   │  Total  │ │
│  │  Formulário │     │   Cadastro   │      │    ▼           │   │         │ │
│  └─────────────┘     └──────────────┘      │  Confirma PIX  │   └─────────┘ │
│        │                    │              └────────────────┘        │      │
│        ▼                    ▼                       │                ▼      │
│  User.status: PENDING  User.status: ACTIVE  Payment.status:    Com acesso   │
│  Club.subscriptionStatus: TRIAL     PENDING → CONFIRMED       completo      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Endpoints de API Necessários

```typescript
// Backend: src/users/users.controller.ts
@Get('pending')
@UseGuards(JwtAuthGuard)
findPending(@Req() req) {
  // Apenas MASTER pode ver todos os pendentes
  return this.usersService.findPendingUsers();
}

@Patch(':id/approve')
@UseGuards(JwtAuthGuard)
approveUser(@Param('id') id: string, @Req() req) {
  return this.usersService.approveUser(id, req.user.id);
}

@Patch(':id/reject')
@UseGuards(JwtAuthGuard)
rejectUser(@Param('id') id: string, @Req() req) {
  return this.usersService.rejectUser(id, req.user.id);
}
```

### 4.3 Tela de Aprovação (Frontend)

Nova página: `src/pages/admin/UserApprovals.tsx`

Funcionalidades:
1. Listar usuários com `status: PENDING`
2. Mostrar detalhes: nome, email, celular, clube, plano escolhido
3. Botão "Aprovar" → atualiza status para ACTIVE + cria Payment pendente
4. Botão "Rejeitar" → atualiza status para BLOCKED
5. Contato rápido via WhatsApp

---

## 5. Sistema de Assinaturas/Cobrança

### 5.1 Configuração de Preços (Atual)

Arquivo: `src/pages/Register.tsx`

```typescript
// Preço atual: R$ 2,00 por membro/mês
const PRICE_PER_MEMBER = 2.00;

// Cálculo:
const totalAmount = Number(clubSize) * PRICE_PER_MEMBER * monthMultiplier;
// Onde monthMultiplier: MENSAL=1, TRIMESTRAL=3, ANUAL=12
```

### 5.2 Planos do Mercado Pago (Atual)

Arquivo: `src/payments/payments.service.ts`

```typescript
const plans = [
  { reason: 'Plano Básico (Até 20)', amount: 19.90 },
  { reason: 'Plano Bronze (21-30)', amount: 29.90 },
  { reason: 'Plano Prata (31-100)', amount: 39.90 },
  { reason: 'Plano Ouro (101+)', amount: 59.90 }
];
```

### 5.3 Serviços a Implementar

```typescript
// src/subscriptions/subscriptions.service.ts

@Injectable()
export class SubscriptionsService {
  
  // Verificar se pode adicionar membro
  async canAddMember(clubId: string): Promise<{
    canAdd: boolean;
    currentCount: number;
    memberLimit: number;
    reason?: string;
  }> {...}
  
  // Criar pagamento pendente após aprovação
  async createPendingPayment(clubId: string, metadata: PaymentMetadata): Promise<Payment> {...}
  
  // Confirmar pagamento (Master recebe PIX e confirma)
  async confirmPayment(paymentId: string, confirmedBy: string): Promise<void> {...}
  
  // Estornar pagamento
  async refundPayment(paymentId: string): Promise<void> {...}
  
  // Verificar e atualizar status de assinaturas expiradas
  async checkExpiredSubscriptions(): Promise<void> {...}
  
  // Gerar recibo PDF
  async generateReceipt(paymentId: string): Promise<Buffer> {...}
}
```

---

## 6. Plano de Implementação

### Fase 1: Backend - Preparação do Schema [PRIORIDADE ALTA]

// turbo
1. Adicionar modelo `Payment` ao `schema.prisma`
2. Criar migration: `npx prisma migrate dev --name add_payments_table`
3. Criar módulo `subscriptions` (controller, service, module)

### Fase 2: Backend - Endpoints de Aprovação [PRIORIDADE ALTA]

1. Adicionar endpoint `GET /users/pending`
2. Adicionar endpoint `PATCH /users/:id/approve`
3. Adicionar endpoint `PATCH /users/:id/reject`
4. Atualizar `AuthService.register` para garantir `status: PENDING`

### Fase 3: Backend - Gestão de Pagamentos [PRIORIDADE ALTA]

1. Criar `SubscriptionsService` com métodos principais
2. Endpoints:
   - `POST /subscriptions/create-payment`
   - `POST /subscriptions/confirm-payment/:id`
   - `DELETE /subscriptions/payments/:id`
   - `GET /clubs/:id/payments`

### Fase 4: Frontend - Tela de Aprovação (Master) [PRIORIDADE ALTA]

1. Criar `src/pages/admin/UserApprovals.tsx`
2. Adicionar rota no `App.tsx`
3. Integrar no menu Sidebar (apenas para MASTER)

### Fase 5: Frontend - Gestão de Pagamentos [PRIORIDADE MÉDIA]

1. Atualizar `SubscriptionPage.tsx` para mostrar histórico de pagamentos
2. Criar modal de confirmação de pagamento (Master)
3. Implementar geração de recibo PDF

### Fase 6: Melhoria do Fluxo de Registro [PRIORIDADE MÉDIA]

1. Atualizar `Register.tsx` com validação de limite de membros
2. Mostrar mensagem clara sobre pendência de aprovação
3. Página `RegistrationSuccess` com instruções claras

### Fase 7: Alertas e Automações [PRIORIDADE BAIXA]

1. Job para verificar assinaturas expiradas (cron)
2. Notificações de vencimento (7, 3, 1 dia antes)
3. Email automático para renovação

---

## 7. Arquivos a Modificar

### Backend

| Arquivo | Ação |
|---------|------|
| `prisma/schema.prisma` | Adicionar modelo Payment |
| `src/subscriptions/` | **NOVO** - Módulo completo |
| `src/users/users.service.ts` | Adicionar métodos de aprovação |
| `src/users/users.controller.ts` | Adicionar endpoints de aprovação |
| `src/clubs/clubs.service.ts` | Adicionar método `getCurrentMemberCount` |
| `src/auth/auth.service.ts` | Revisar fluxo de registro |
| `src/app.module.ts` | Importar SubscriptionsModule |

### Frontend

| Arquivo | Ação |
|---------|------|
| `src/pages/admin/UserApprovals.tsx` | **NOVO** - Tela de aprovação |
| `src/pages/SubscriptionPage.tsx` | Adicionar histórico de pagamentos |
| `src/components/Sidebar.tsx` | Adicionar menu "Aprovações" |
| `src/components/MemberLimitModal.tsx` | **NOVO** - Modal de limite |
| `src/lib/subscription.ts` | **NOVO** - Funções de assinatura |
| `src/config/subscription.ts` | **NOVO** - Configurações |
| `src/App.tsx` | Adicionar rota de aprovações |

---

## 8. Status da Implementação

### ✅ CONCLUÍDO (2026-01-11)

#### Fase 1: Backend - Schema
- ✅ Modelo `Payment` adicionado ao `schema.prisma`
- ✅ Enums `PaymentType` e `PaymentStatus` criados
- ✅ Relações `Club.payments` e `User.confirmedPayments` configuradas
- ✅ `npx prisma generate` executado

#### Fase 2: Backend - Endpoints de Aprovação
- ✅ `GET /users/pending` - Listar usuários pendentes
- ✅ `PATCH /users/:id/approve` - Aprovar usuário
- ✅ `PATCH /users/:id/reject` - Rejeitar usuário
- ✅ Métodos `findPendingUsers`, `approveUser`, `rejectUser` em `UsersService`

#### Fase 3: Backend - Gestão de Pagamentos
- ✅ Módulo `SubscriptionsModule` criado
- ✅ `SubscriptionsService` com métodos:
  - `canAddMember` - Verificar limite de membros
  - `createPendingPayment` - Criar pagamento pendente
  - `confirmPayment` - Confirmar PIX recebido
  - `refundPayment` - Estornar pagamento
  - `getClubPayments` - Histórico de pagamentos
  - `getPendingPayments` - Pagamentos pendentes (Master)
  - `checkExpiredSubscriptions` - Verificar vencidos
- ✅ `SubscriptionsController` com endpoints:
  - `GET /subscriptions/can-add-member/:clubId`
  - `GET /subscriptions/club/:clubId`
  - `GET /subscriptions/payments/club/:clubId`
  - `GET /subscriptions/payments/pending`
  - `POST /subscriptions/payments`
  - `PATCH /subscriptions/payments/:id/confirm`
  - `PATCH /subscriptions/payments/:id/refund`
  - `DELETE /subscriptions/payments/:id`

#### Fase 4: Frontend - Tela de Aprovação
- ✅ `src/pages/admin/UserApprovals.tsx` criado
- ✅ Rota `/dashboard/user-approvals` configurada em `App.tsx`
- ✅ Menu "Aprovação Cadastros" adicionado no Sidebar (MASTER)

#### Fase 5: Frontend - Gestão de Pagamentos
- ✅ `src/pages/admin/PaymentManagement.tsx` criado
- ✅ Rota `/dashboard/payment-management` configurada em `App.tsx`
- ✅ Menu "Gestão Pagamentos" adicionado no Sidebar (MASTER)

#### Fase 6: Melhoria do Fluxo de Registro
- ✅ `RegistrationSuccess.tsx` aprimorado com:
  - Timeline visual do processo (Cadastro → Aprovação → PIX → Ativação)
  - Valor estimado do plano exibido
  - Mensagem WhatsApp diferenciada para novos clubes vs. membros
- ✅ `Register.tsx` atualizado para passar `isNewClub`, `paymentPeriod`, `clubSize`

#### Fase 7: Utilidades de Assinatura
- ✅ `src/lib/subscription.ts` - Biblioteca de utilidades:
  - `canAddMember()` - Verificar limite de membros
  - `getClubSubscription()` - Obter status da assinatura
  - `calculateSubscriptionAmount()` - Calcular valor do plano
  - `formatCurrency()` - Formatar valores em BRL
  - `generateRenewalWhatsAppLink()` - Link para renovação
  - `generateUpgradeWhatsAppLink()` - Link para upgrade
  - `isSubscriptionNearExpiry()` - Verificar vencimento próximo
  - `getSubscriptionStatusColor()` - Cores por status
  - `translateSubscriptionStatus()` - Traduzir status
- ✅ `src/components/MemberLimitModal.tsx` - Modal de limite atingido:
  - Opções de upgrade com valores calculados
  - Links diretos para WhatsApp
  - Design premium com animações

---

### ⚠️ PENDENTE: Rodar Migration

O banco de dados local não estava disponível. Execute:

```bash
cd rankingdbv-backend
npx prisma migrate dev --name add_payments_table
```

---

## Comandos Úteis

```bash
# Rodar migration após alterar schema
cd rankingdbv-backend
npx prisma migrate dev --name add_payments_table

# Gerar cliente Prisma
npx prisma generate

# Verificar schema
npx prisma validate

# Visualizar banco
npx prisma studio

# Iniciar backend (dev)
npm run start:dev

# Iniciar frontend (dev)
cd rankingdbv-web && npm run dev
```

---

## Fluxo Completo de Aprovação

```
1. USUÁRIO SE CADASTRA
   └─▶ User.status = PENDING
   └─▶ Club criado com subscriptionStatus = TRIAL (se novo clube)

2. MASTER ACESSA /dashboard/user-approvals
   └─▶ Lista todos os usuários com status PENDING
   └─▶ Mostra detalhes: nome, email, celular, clube, plano solicitado

3. MASTER CLICA "APROVAR"
   └─▶ User.status = ACTIVE
   └─▶ Se for OWNER de novo clube:
       └─▶ Payment criado com status = PENDING
       └─▶ Valor calculado: memberLimit × R$ 2,00 × meses

4. MASTER RECEBE PIX NA CONTA

5. MASTER ACESSA /dashboard/payment-management
   └─▶ Lista pagamentos pendentes
   └─▶ Clica "Confirmar PIX"

6. SISTEMA ATIVA O CLUBE
   └─▶ Payment.status = CONFIRMED
   └─▶ Club.subscriptionStatus = ACTIVE
   └─▶ Club.nextBillingDate = data de vencimento
   └─▶ Club.memberLimit = limite contratado
```

---

**Implementação Concluída por IA Antigravity em 2026-01-11**

