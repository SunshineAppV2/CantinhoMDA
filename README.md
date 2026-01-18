# 🏕️ CantinhoMDA - Sistema de Gestão de Clubes

Sistema completo de gestão para clubes de Desbravadores e Aventureiros, com funcionalidades de administração, gamificação, loja virtual, tesouraria e muito mais.

---

## 🚀 Deploy Rápido

### Opção 1: Vercel + Render (Recomendado)

**Frontend (Vercel)** + **Backend (Render)** + **PostgreSQL (Render)**

📖 **Guia Completo**: [`DEPLOY_COMPLETO.md`](./DEPLOY_COMPLETO.md)  
⚡ **Guia Rápido**: [`DEPLOY_RAPIDO.md`](./DEPLOY_RAPIDO.md)

**Tempo estimado**: ~15 minutos

### Verificar Deploy

```bash
node check-deploy.js
```

---

## 📁 Estrutura do Projeto

```
CantinhoMDA/
├── cantinhomda-web/          # Frontend (React + Vite + TypeScript)
├── cantinhomda-backend/      # Backend (NestJS + Prisma + PostgreSQL)
├── DEPLOY_COMPLETO.md        # Guia completo de deploy
├── DEPLOY_RAPIDO.md          # Checklist rápido
├── RENDER_CONFIG.md          # Configuração do Render
├── VERCEL_CONFIG.md          # Configuração do Vercel
└── check-deploy.js           # Script de verificação
```

---

## 🛠️ Tecnologias

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **TailwindCSS** (estilização)
- **Framer Motion** (animações)
- **React Query** (gerenciamento de estado)
- **Firebase Auth** (autenticação)
- **Axios** (requisições HTTP)

### Backend
- **NestJS** (framework)
- **Prisma** (ORM)
- **PostgreSQL** (banco de dados)
- **JWT** (autenticação)
- **Swagger** (documentação da API)
- **Firebase Admin** (integração)

---

## 🌐 URLs de Produção

- **Frontend**: https://cantinhomda.vercel.app
- **Backend**: https://cantinhomda-backend.onrender.com
- **API Docs**: https://cantinhomda-backend.onrender.com/api/docs
- **Health Check**: https://cantinhomda-backend.onrender.com/health

---

## 🔧 Desenvolvimento Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- Git

### 1. Clonar Repositório
```bash
git clone <seu-repositorio>
cd CantinhoMDA
```

### 2. Backend

```bash
cd cantinhomda-backend

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
# Editar .env com suas credenciais

# Gerar Prisma Client
npx prisma generate

# Criar banco de dados
npx prisma db push

# Iniciar servidor
npm run start:dev
```

Backend rodando em: `http://localhost:3000`

### 3. Frontend

```bash
cd cantinhomda-web

# Instalar dependências
npm install

# Configurar .env
# Criar arquivo .env com as variáveis do Firebase e API_URL

# Iniciar servidor
npm run dev
```

Frontend rodando em: `http://localhost:5173`

---

## 📚 Funcionalidades

### ✅ Implementadas

- 🔐 **Autenticação** (Firebase + JWT)
- 👥 **Gestão de Membros** (CRUD completo)
- 🏆 **Sistema de Pontos** (XP e Ranking)
- 🛒 **Loja Virtual** (produtos e resgate)
- 💰 **Tesouraria** (receitas, despesas, validações)
- 📊 **Dashboard** (estatísticas e gráficos)
- 🎯 **Especialidades** (gestão e conquistas)
- 📅 **Eventos e Reuniões**
- 📝 **Atas de Secretaria**
- 🔔 **Notificações em Tempo Real**
- 📱 **Responsivo** (mobile-first)

### 🚧 Em Desenvolvimento

- 📧 **Notificações por Email**
- 📊 **Relatórios Avançados**
- 🎨 **Temas Personalizáveis**
- 🌍 **Multi-idioma**

---

## 🐛 Troubleshooting

### Erro 401 (Unauthorized)

**Solução**:
1. Limpar cache do navegador (F12 > Application > Local Storage)
2. Deletar: `token`, `api_url`, `user`
3. Fazer logout e login novamente
4. Verificar se `VITE_API_URL` está correto

### Backend não responde (504)

**Causa**: Plano Free do Render hiberna após 15 min

**Solução**: Aguardar ~30 segundos (reativa automaticamente)

### Erro de CORS

**Solução**: Verificar `main.ts` do backend e adicionar domínio do frontend na lista `allowedOrigins`

---

## 📖 Documentação Adicional

- [`DEPLOY_COMPLETO.md`](./DEPLOY_COMPLETO.md) - Guia completo de deploy
- [`DEPLOY_RAPIDO.md`](./DEPLOY_RAPIDO.md) - Checklist rápido
- [`RENDER_CONFIG.md`](./RENDER_CONFIG.md) - Configuração do Render
- [`VERCEL_CONFIG.md`](./VERCEL_CONFIG.md) - Configuração do Vercel
- [`ARQUITETURA_MODERNA.md`](./ARQUITETURA_MODERNA.md) - Arquitetura do sistema

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é privado e proprietário.

---

## 📞 Suporte

Para problemas ou dúvidas:
1. Consulte a documentação acima
2. Verifique os logs no Render/Vercel
3. Teste o health check: `/health`

---

**✅ Sistema pronto para uso!**

🔗 **Acesse**: https://cantinhomda.vercel.app
