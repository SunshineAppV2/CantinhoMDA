# ⚡ Deploy Rápido - CantinhoMDA

## 🎯 Checklist Rápido

### ✅ Backend (Render)

1. **Criar PostgreSQL no Render**
   - New + > PostgreSQL
   - Name: `cantinhomda-db`
   - Plan: Free
   - **Copiar "Internal Database URL"**

2. **Criar Web Service no Render**
   - New + > Web Service
   - Conectar GitHub
   - Root: `cantinhomda-backend`
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm run start:prod`
   
3. **Environment Variables**:
   ```
   DATABASE_URL=<Internal Database URL do PostgreSQL>
   JWT_SECRET=seu_segredo_123
   NODE_ENV=production
   PORT=3000
   ```

4. **Deploy** e copiar URL (ex: `https://cantinhomda-backend.onrender.com`)

5. **Testar**: `https://seu-backend.onrender.com/health`

---

### ✅ Frontend (Vercel)

1. **Importar Projeto**
   - Add New > Project
   - Conectar GitHub
   - Root: `cantinhomda-web`
   - Framework: Vite

2. **Environment Variables**:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyB4yshC1hK1EJMs8pKm_dzLCEhojMQPyQM
   VITE_FIREBASE_AUTH_DOMAIN=cantinhodbv-dfdab.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=cantinhodbv-dfdab
   VITE_FIREBASE_STORAGE_BUCKET=cantinhodbv-dfdab.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=402854694692
   VITE_FIREBASE_APP_ID=1:402854694692:web:38dc7415eb2f3fdbffadb1
   VITE_FIREBASE_MEASUREMENT_ID=G-2D3NW9W4QP
   VITE_API_URL=https://SEU-BACKEND.onrender.com
   ```
   
   **⚠️ Substituir `SEU-BACKEND` pela URL real!**

3. **Deploy** e aguardar build

---

### ✅ Pós-Deploy

1. **Limpar Cache**:
   - F12 > Application > Local Storage
   - Deletar: `token`, `api_url`, `user`
   - Ctrl+Shift+R

2. **Testar Login**

3. **Se der erro 401**:
   - Verificar `VITE_API_URL` no Vercel
   - Limpar cache novamente
   - Fazer logout/login

---

## 🔗 URLs Importantes

- **Frontend**: https://cantinhomda.vercel.app
- **Backend**: https://cantinhomda-backend.onrender.com
- **Health**: https://cantinhomda-backend.onrender.com/health
- **API Docs**: https://cantinhomda-backend.onrender.com/api/docs

---

## 🐛 Problemas Comuns

| Erro | Solução |
|------|---------|
| 401 Unauthorized | Limpar cache + verificar `VITE_API_URL` |
| 504 Gateway Timeout | Aguardar 30s (Render reativando) |
| CORS Error | Adicionar domínio Vercel no `main.ts` |

---

**✅ Pronto!** Sistema no ar em ~15 minutos.
