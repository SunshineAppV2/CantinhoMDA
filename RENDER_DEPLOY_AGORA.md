# 🎯 CONFIGURAÇÃO DO RENDER - Passo a Passo

## ✅ Banco de Dados PostgreSQL - CONCLUÍDO

Você já criou o banco de dados! ✅

**Detalhes**:
- **Name**: cantinhodbv
- **User**: cantinhodbv_user
- **Internal URL**: `postgresql://cantinhodbv_user:ofJ4BrE1dtt79Z1d3Ey3mWyoJL79Nhgh@dpg-d58gqrf5r7bs738mmneg-a/cantinhodbv`

---

## 🚀 PRÓXIMO PASSO: Deploy do Backend

### 1. Criar Web Service no Render

1. Acesse: https://dashboard.render.com
2. Clique em **"New +"** > **"Web Service"**
3. Conecte seu repositório GitHub
4. **Selecione o repositório** do CantinhoMDA

### 2. Configurar o Serviço

Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Name** | `cantinhomda-backend` |
| **Region** | `Oregon (US West)` |
| **Branch** | `main` (ou `master`) |
| **Root Directory** | `cantinhomda-backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Instance Type** | `Free` |

### 3. Configurar Environment Variables

Clique em **"Advanced"** e adicione estas variáveis:

```bash
DATABASE_URL=postgresql://cantinhodbv_user:ofJ4BrE1dtt79Z1d3Ey3mWyoJL79Nhgh@dpg-d58gqrf5r7bs738mmneg-a/cantinhodbv

JWT_SECRET=cantinhomda_super_secret_2026

NODE_ENV=production

PORT=3000
```

**⚠️ IMPORTANTE**: 
- Use a **Internal Database URL** (sem `.virginia-postgres.render.com`)
- Não adicione `?schema=public` na URL do Render

### 4. Criar o Serviço

1. Clique em **"Create Web Service"**
2. Aguarde o deploy (~5-10 minutos)
3. **Copie a URL** que será gerada (ex: `https://cantinhomda-backend.onrender.com`)

---

## ✅ Verificar Deploy

Quando o deploy finalizar, teste:

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

## 🔄 DEPOIS: Atualizar Frontend

1. Acesse: https://vercel.com/dashboard
2. Selecione projeto `cantinhomda`
3. **Settings** > **Environment Variables**
4. **Edite** `VITE_API_URL`:
   ```
   VITE_API_URL=https://cantinhomda-backend.onrender.com
   ```
   (Substitua pela URL real do seu backend)
5. **Deployments** > ⋯ > **Redeploy**

---

## 🧪 Testar Sistema Completo

```bash
node check-deploy.js
```

Deve retornar:
```
✅ Todos os serviços estão funcionando!
🎉 Sistema pronto para uso!
```

---

## 🎉 FINALIZAÇÃO

1. Limpar cache do navegador:
   - F12 > Application > Local Storage
   - Deletar: `token`, `api_url`, `user`
   - Ctrl+Shift+R

2. Acessar: https://cantinhomda.vercel.app

3. Fazer login

**✅ SISTEMA 100% FUNCIONAL!**

---

## 📞 Se Tiver Problemas

### Erro no Build
- Verificar logs no Render
- Confirmar que `Root Directory` está correto
- Verificar se `Build Command` está completo

### Erro 500 ao acessar /health
- Verificar `DATABASE_URL` nas variáveis de ambiente
- Confirmar que usou a **Internal URL**
- Verificar logs do Render

### Erro de Conexão com Banco
- Confirmar que o PostgreSQL está ativo
- Verificar se a URL está correta
- Não usar a External URL no Render

---

**🚀 AÇÃO ATUAL**: Criar Web Service no Render seguindo os passos acima

**⏱️ TEMPO**: ~10 minutos

**✅ RESULTADO**: Backend online e sistema funcional
