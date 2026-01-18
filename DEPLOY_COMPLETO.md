# 🚀 Guia de Deploy - CantinhoMDA

Este guia contém as instruções completas para fazer deploy do sistema CantinhoMDA no **Vercel (Frontend)** e **Render (Backend)**.

---

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Render](https://render.com)
- Conta no [Firebase](https://console.firebase.google.com)
- Banco de dados PostgreSQL (pode usar o gratuito do Render)

---

## 🔧 1. Deploy do Backend (Render)

### 1.1. Criar Banco de Dados PostgreSQL

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em **"New +"** > **"PostgreSQL"**
3. Configure:
   - **Name**: `cantinhomda-db`
   - **Database**: `cantinhomda`
   - **User**: `cantinhomda_user`
   - **Region**: `Oregon (US West)` (ou mais próximo)
   - **Plan**: **Free**
4. Clique em **"Create Database"**
5. **Copie a "Internal Database URL"** (será usada no backend)

### 1.2. Deploy do Backend

1. No Render, clique em **"New +"** > **"Web Service"**
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `cantinhomda-backend`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Root Directory**: `cantinhomda-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Plan**: **Free**

4. **Environment Variables** (Settings > Environment):
   ```
   DATABASE_URL=<Cole a Internal Database URL do PostgreSQL>
   JWT_SECRET=seu_segredo_super_seguro_aqui_123
   NODE_ENV=production
   PORT=3000
   ```

5. Clique em **"Create Web Service"**
6. **Aguarde o deploy** (~5-10 minutos)
7. **Copie a URL** do serviço (ex: `https://cantinhomda-backend.onrender.com`)

### 1.3. Testar o Backend

Acesse no navegador:
```
https://cantinhomda-backend.onrender.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2026-01-16T...",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0"
}
```

---

## 🌐 2. Deploy do Frontend (Vercel)

### 2.1. Configurar Projeto no Vercel

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **"Add New..."** > **"Project"**
3. Importe seu repositório do GitHub
4. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `cantinhomda-web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.2. Configurar Variáveis de Ambiente

Em **Settings** > **Environment Variables**, adicione:

```
VITE_FIREBASE_API_KEY=AIzaSyB4yshC1hK1EJMs8pKm_dzLCEhojMQPyQM
VITE_FIREBASE_AUTH_DOMAIN=cantinhodbv-dfdab.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cantinhodbv-dfdab
VITE_FIREBASE_STORAGE_BUCKET=cantinhodbv-dfdab.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=402854694692
VITE_FIREBASE_APP_ID=1:402854694692:web:38dc7415eb2f3fdbffadb1
VITE_FIREBASE_MEASUREMENT_ID=G-2D3NW9W4QP
VITE_API_URL=https://cantinhomda-backend.onrender.com
```

**⚠️ IMPORTANTE**: Substitua `https://cantinhomda-backend.onrender.com` pela URL real do seu backend no Render!

### 2.3. Deploy

1. Marque as variáveis para **Production**, **Preview** e **Development**
2. Clique em **"Deploy"**
3. Aguarde o build (~2-5 minutos)
4. Acesse a URL gerada (ex: `https://cantinhomda.vercel.app`)

---

## 🔐 3. Configurar CORS no Backend

Se você tiver erros de CORS, verifique se o arquivo `cantinhomda-backend/src/main.ts` tem:

```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',              // Desenvolvimento local
    'https://cantinhomda.vercel.app',     // Produção
    'https://*.vercel.app'                // Previews do Vercel
  ],
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
});
```

Se precisar alterar, faça commit e o Render fará redeploy automaticamente.

---

## 🧪 4. Testar o Sistema

### 4.1. Limpar Cache do Navegador

1. Acesse `https://cantinhomda.vercel.app`
2. Abra **DevTools** (F12)
3. Vá em **Application** > **Local Storage**
4. Delete as chaves: `token`, `api_url`, `user`
5. Recarregue a página (Ctrl+Shift+R)

### 4.2. Fazer Login

1. Use as credenciais de um usuário MASTER ou OWNER
2. Se der erro 401:
   - Verifique se a `VITE_API_URL` está correta no Vercel
   - Verifique se o backend está online: `https://seu-backend.onrender.com/health`
   - Limpe o cache novamente

---

## 🐛 5. Troubleshooting

### Erro 401 (Unauthorized)

**Causa**: Token inválido ou backend incorreto

**Solução**:
1. Limpe o Local Storage
2. Verifique se `VITE_API_URL` está correta
3. Faça logout e login novamente

### Backend não responde (504 Gateway Timeout)

**Causa**: Plano Free do Render hiberna após 15 min de inatividade

**Solução**:
1. Aguarde ~30 segundos (o Render reativa automaticamente)
2. Recarregue a página

### Erro de CORS

**Causa**: Backend não permite requisições do domínio do Vercel

**Solução**:
1. Adicione o domínio do Vercel no `main.ts` (seção CORS)
2. Faça commit e push
3. Aguarde o redeploy automático

---

## 📊 6. Monitoramento

### Logs do Backend (Render)
```
https://dashboard.render.com/web/[seu-servico]/logs
```

### Logs do Frontend (Vercel)
```
https://vercel.com/[seu-usuario]/[seu-projeto]/deployments
```

### Health Check
```
https://cantinhomda-backend.onrender.com/health
```

---

## 🔄 7. Atualizações

### Backend
1. Faça commit e push no GitHub
2. O Render fará redeploy automaticamente
3. Aguarde ~5 minutos

### Frontend
1. Faça commit e push no GitHub
2. O Vercel fará redeploy automaticamente
3. Aguarde ~2 minutos

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no Render e Vercel
2. Teste o health check: `/health`
3. Limpe o cache do navegador
4. Verifique as variáveis de ambiente

---

**✅ Sistema deployado com sucesso!**

URLs:
- **Frontend**: https://cantinhomda.vercel.app
- **Backend**: https://cantinhomda-backend.onrender.com
- **API Docs**: https://cantinhomda-backend.onrender.com/api/docs
- **Health**: https://cantinhomda-backend.onrender.com/health
