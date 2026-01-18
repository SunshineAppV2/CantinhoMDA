# 🚀 INÍCIO RÁPIDO - Implementação de Segurança

## ⚡ Ações Imediatas (Hoje)

### 1. Gerar Chaves de Criptografia ✅

```bash
cd G:\CantinhoMDA\cantinhomda-backend
node generate-encryption-key.js
```

**Resultado**: Chaves geradas com sucesso! ✅

```env
ENCRYPTION_KEY="ca8e6e4b6cf04908ee81d020203fe53b31d144fba752c24dd5bd9f04cee81b0c"
JWT_SECRET="6abe27fde67b9733de0672a8675e7d9910370f4769a2ea10e4eb225828da5be8"
JWT_REFRESH_SECRET="05648ad1e67710f8ad22ffca6b6a299912fccd73b5b1256b1828ba1481d91da1"
```

⚠️ **IMPORTANTE**: Guarde essas chaves em local seguro! Nunca as commite no Git!

---

### 2. Atualizar .env Local

Edite `G:\CantinhoMDA\cantinhomda-backend\.env`:

```env
DATABASE_URL="postgresql://cantinhodbv_user:ofJ4BrE1dtt79Z1d3Ey3mWyoJL79Nhgh@dpg-d58gqrf5r7bs738mmneg-a/cantinhodbv?schema=public"
JWT_SECRET="6abe27fde67b9733de0672a8675e7d9910370f4769a2ea10e4eb225828da5be8"
JWT_REFRESH_SECRET="05648ad1e67710f8ad22ffca6b6a299912fccd73b5b1256b1828ba1481d91da1"
ENCRYPTION_KEY="ca8e6e4b6cf04908ee81d020203fe53b31d144fba752c24dd5bd9f04cee81b0c"
NODE_ENV=development
```

---

### 3. Configurar Secrets no Render

1. Acesse: https://dashboard.render.com
2. Selecione seu serviço backend
3. Vá em **Settings > Environment Variables**
4. Adicione as variáveis:

```
JWT_SECRET=6abe27fde67b9733de0672a8675e7d9910370f4769a2ea10e4eb225828da5be8
JWT_REFRESH_SECRET=05648ad1e67710f8ad22ffca6b6a299912fccd73b5b1256b1828ba1481d91da1
ENCRYPTION_KEY=ca8e6e4b6cf04908ee81d020203fe53b31d144fba752c24dd5bd9f04cee81b0c
NODE_ENV=production
```

5. Clique em **Save Changes**

---

### 4. Integrar EncryptionModule no AppModule

Edite `G:\CantinhoMDA\cantinhomda-backend\src\app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionModule } from './common/encryption/encryption.module'; // ← ADICIONAR

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EncryptionModule, // ← ADICIONAR
    // ... outros módulos
  ],
  // ...
})
export class AppModule {}
```

---

### 5. Exemplo de Uso no UsersService

Edite `G:\CantinhoMDA\cantinhomda-backend\src\users\users.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service'; // ← ADICIONAR

@Injectable()
export class UsersService {
  // Campos sensíveis que devem ser criptografados
  private readonly sensitiveFields = [
    'cpf',
    'rg',
    'susNumber',
    'healthPlan',
    'address',
    'cep',
    'phone',
    'mobile',
  ];

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService, // ← ADICIONAR
  ) {}

  async create(createUserDto: any) {
    // Criptografar dados sensíveis antes de salvar
    const encryptedData = this.encryptionService.encryptObject(
      createUserDto,
      this.sensitiveFields,
    );

    return this.prisma.user.create({
      data: encryptedData,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    // Descriptografar dados sensíveis ao retornar
    return this.encryptionService.decryptObject(
      user,
      this.sensitiveFields,
    );
  }

  async update(id: string, updateUserDto: any) {
    // Criptografar apenas campos sensíveis que estão sendo atualizados
    const fieldsToEncrypt = this.sensitiveFields.filter(
      field => updateUserDto[field] !== undefined
    );

    const encryptedData = this.encryptionService.encryptObject(
      updateUserDto,
      fieldsToEncrypt,
    );

    const updated = await this.prisma.user.update({
      where: { id },
      data: encryptedData,
    });

    return this.encryptionService.decryptObject(
      updated,
      this.sensitiveFields,
    );
  }
}
```

---

## 📊 Próximos Passos (Esta Semana)

### Dia 1-2: Criptografia ✅
- [x] Gerar chaves
- [x] Criar EncryptionService
- [ ] Integrar no AppModule
- [ ] Atualizar UsersService
- [ ] Testar localmente

### Dia 3-4: Rate Limiting
- [ ] Instalar `rate-limiter-flexible`
- [ ] Criar RateLimitGuard
- [ ] Aplicar em auth endpoints
- [ ] Testar proteção contra força bruta

### Dia 5: Auditoria
- [ ] Atualizar schema Prisma
- [ ] Criar AuditInterceptor
- [ ] Aplicar globalmente
- [ ] Testar logs de auditoria

---

## 🧪 Testes Rápidos

### Testar Criptografia

Crie arquivo `test-encryption.ts`:

```typescript
import { EncryptionService } from './src/common/encryption/encryption.service';

// Configurar variável de ambiente
process.env.ENCRYPTION_KEY = 'ca8e6e4b6cf04908ee81d020203fe53b31d144fba752c24dd5bd9f04cee81b0c';

const encryptionService = new EncryptionService();

// Teste 1: Criptografar e descriptografar
const cpf = '123.456.789-00';
const encrypted = encryptionService.encrypt(cpf);
const decrypted = encryptionService.decrypt(encrypted);

console.log('Original:', cpf);
console.log('Criptografado:', encrypted);
console.log('Descriptografado:', decrypted);
console.log('Sucesso:', cpf === decrypted ? '✅' : '❌');

// Teste 2: Criptografar objeto
const userData = {
  name: 'João Silva',
  cpf: '123.456.789-00',
  email: 'joao@example.com',
  rg: '12.345.678-9',
};

const encryptedUser = encryptionService.encryptObject(userData, ['cpf', 'rg']);
console.log('\nUsuário Criptografado:', encryptedUser);

const decryptedUser = encryptionService.decryptObject(encryptedUser, ['cpf', 'rg']);
console.log('Usuário Descriptografado:', decryptedUser);
```

Execute:
```bash
npx ts-node test-encryption.ts
```

---

## ⚠️ Checklist de Segurança

Antes de fazer deploy:

- [ ] ✅ Chaves geradas e armazenadas com segurança
- [ ] ✅ .env adicionado ao .gitignore
- [ ] ✅ Variáveis configuradas no Render
- [ ] EncryptionModule integrado
- [ ] UsersService atualizado
- [ ] Testes de criptografia passando
- [ ] Backup do banco de dados criado
- [ ] Documentação atualizada

---

## 🆘 Troubleshooting

### Erro: "ENCRYPTION_KEY não configurada"

**Solução**: Adicione a variável ao .env:
```env
ENCRYPTION_KEY="ca8e6e4b6cf04908ee81d020203fe53b31d144fba752c24dd5bd9f04cee81b0c"
```

### Erro: "ENCRYPTION_KEY deve ter 64 caracteres"

**Solução**: Gere uma nova chave:
```bash
node generate-encryption-key.js
```

### Erro ao descriptografar dados antigos

**Problema**: Dados foram salvos antes da criptografia

**Solução**: Criar script de migração para criptografar dados existentes:

```typescript
// migrate-encrypt-data.ts
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './src/common/encryption/encryption.service';

const prisma = new PrismaClient();
const encryptionService = new EncryptionService();

async function migrateData() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    // Verificar se já está criptografado (tem formato iv:tag:data)
    const isEncrypted = user.cpf?.includes(':');
    
    if (!isEncrypted && user.cpf) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          cpf: encryptionService.encrypt(user.cpf),
          rg: user.rg ? encryptionService.encrypt(user.rg) : null,
          // ... outros campos
        },
      });
      console.log(`✅ Usuário ${user.id} criptografado`);
    }
  }

  console.log('✅ Migração concluída!');
}

migrateData();
```

---

## 📚 Documentação Relacionada

- **Plano Completo**: `PLANO_SEGURANCA_INFORMACAO.md`
- **Workflow**: `.agent/workflows/security_implementation.md`
- **Resumo Executivo**: `RESUMO_SEGURANCA.md`

---

## 🎯 Meta da Semana

**Objetivo**: Implementar criptografia de dados sensíveis (LGPD)

**Resultado Esperado**:
- ✅ 100% dos dados sensíveis criptografados
- ✅ Conformidade com LGPD
- ✅ Sistema funcionando normalmente
- ✅ Testes passando

**Tempo Estimado**: 2-3 dias

---

**Status**: 🟡 Em Progresso  
**Última atualização**: {{ data }}  
**Próxima revisão**: Amanhã
