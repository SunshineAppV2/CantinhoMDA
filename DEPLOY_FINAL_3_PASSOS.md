# ⚡ DEPLOY FINAL - 3 Passos Simples

## ✅ Passo 1: Banco de Dados - CONCLUÍDO ✅

Você já criou o PostgreSQL no Render! 

---

## 🚀 Passo 2: Deploy do Backend no Render

### 2.1. Criar Web Service

1. Acesse: https://dashboard.render.com
2. Clique em **"New +"** > **"Web Service"**
3. **Conecte GitHub** e selecione o repositório

### 2.2. Configurações Básicas

```
Name:            cantinhomda-backend
Region:          Oregon (US West)
Branch:          main
Root Directory:  cantinhomda-backend
Runtime:         Node
```

### 2.3. Build & Start Commands

```
Build Command:   npm install && npx prisma generate && npm run build
Start Command:   npm run start:prod
```

### 2.4. Environment Variables (COPIE E COLE)

Clique em **"Advanced"** e adicione:

```
DATABASE_URL=postgresql://cantinhodbv_user:ofJ4BrE1dtt79Z1d3Ey3mWyoJL79Nhgh@dpg-d58gqrf5r7bs738mmneg-a/cantinhodbv

JWT_SECRET=cantinhomda_super_secret_2026

NODE_ENV=production
```

### 2.5. Finalizar

1. **Instance Type**: Free
2. Clique em **"Create Web Service"**
3. ⏱️ Aguarde ~10 minutos
4. 📋 **Copie a URL** (ex: `https://cantinhomda-backend-xyz.onrender.com`)

---

## 🌐 Passo 3: Atualizar Frontend no Vercel

### 3.1. Configurar Variável

1. Acesse: https://vercel.com/dashboard
2. Selecione projeto **cantinhomda**
3. **Settings** > **Environment Variables**
4. **Edite** `VITE_API_URL`:
   ```
   VITE_API_URL=<COLE A URL DO BACKEND AQUI>
   ```
   Exemplo: `https://cantinhomda-backend-xyz.onrender.com`

### 3.2. Redeploy

1. **Deployments** (menu lateral)
2. Clique nos **⋯** do último deploy
3. **Redeploy**
4. Aguarde ~2 minutos

---

## ✅ VERIFICAR

### Teste 1: Backend
```
https://SEU-BACKEND.onrender.com/health
```

Deve retornar:
```json
{"status":"ok", "timestamp":"...", ...}
```

### Teste 2: Frontend
```
https://cantinhomda.vercel.app
```

### Teste 3: Automático
```bash
node check-deploy.js
```

---

## 🧹 LIMPAR CACHE

Antes de fazer login:

1. Acesse: https://cantinhomda.vercel.app
2. **F12** > **Application** > **Local Storage**
3. **Deletar**: `token`, `api_url`, `user`
4. **Ctrl+Shift+R** (hard reload)
5. Fazer login

---

## 🎉 PRONTO!

**✅ Sistema 100% funcional!**

URLs finais:
- **Frontend**: https://cantinhomda.vercel.app
- **Backend**: https://SEU-BACKEND.onrender.com
- **Health**: https://SEU-BACKEND.onrender.com/health
- **API Docs**: https://SEU-BACKEND.onrender.com/api/docs

---

## 🐛 Se Der Erro

### Erro no Build do Render
- Verificar se `Root Directory` = `cantinhomda-backend`
- Verificar se `Build Command` está completo

### Erro 500 no /health
- Verificar variáveis de ambiente
- Confirmar `DATABASE_URL` (sem espaços extras)

### Erro 401 no Frontend
- Limpar cache do navegador
- Verificar se `VITE_API_URL` está correta
- Fazer logout/login

---

**🚀 AÇÃO AGORA**: Passo 2 - Criar Web Service no Render

**⏱️ TEMPO TOTAL**: ~15 minutos

**✅ RESULTADO**: Sistema completo funcionando!
