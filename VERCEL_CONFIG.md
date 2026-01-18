# 🌐 Configuração do Vercel - CantinhoMDA Frontend

## 📋 Variáveis de Ambiente Obrigatórias

Configure estas variáveis em **Settings > Environment Variables** no painel do Vercel:

### Firebase Configuration
```bash
VITE_FIREBASE_API_KEY=AIzaSyB4yshC1hK1EJMs8pKm_dzLCEhojMQPyQM
VITE_FIREBASE_AUTH_DOMAIN=cantinhodbv-dfdab.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cantinhodbv-dfdab
VITE_FIREBASE_STORAGE_BUCKET=cantinhodbv-dfdab.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=402854694692
VITE_FIREBASE_APP_ID=1:402854694692:web:38dc7415eb2f3fdbffadb1
VITE_FIREBASE_MEASUREMENT_ID=G-2D3NW9W4QP
```

### Backend API URL
```bash
VITE_API_URL=https://cantinhomda-backend.onrender.com
```

**⚠️ IMPORTANTE**: 
- Substitua pela URL **real** do seu backend no Render
- Não adicione `/` no final da URL
- Marque as variáveis para **Production**, **Preview** e **Development**

---

## 🚀 Configurações do Projeto

### Framework Preset
**Vite** (detectado automaticamente)

### Build Settings
```
Root Directory: cantinhomda-web
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Node Version
**18.x** (ou superior)

---

## 🔗 URLs Importantes

Após o deploy, você terá:

- **Produção**: `https://cantinhomda.vercel.app`
- **Previews**: `https://cantinhomda-[hash].vercel.app` (para cada PR)

---

## ⚙️ Configurações Avançadas (Opcional)

### Custom Domain
Se você tiver um domínio próprio:
1. Settings > Domains
2. Add Domain
3. Seguir instruções de DNS

### Redirects (vercel.json)
Já configurado no projeto para SPA routing.

---

## ✅ Checklist Pós-Deploy

- [ ] Verificar se todas as variáveis de ambiente estão configuradas
- [ ] Confirmar que `VITE_API_URL` aponta para o backend correto
- [ ] Testar login no site
- [ ] Verificar console do navegador (F12) - não deve ter erros
- [ ] Limpar cache do navegador antes de testar

---

## 🐛 Troubleshooting

### Erro: "Failed to fetch"
**Causa**: `VITE_API_URL` incorreta ou backend offline
**Solução**: 
1. Verificar se backend está respondendo: `https://seu-backend.onrender.com/health`
2. Confirmar `VITE_API_URL` no Vercel
3. Fazer **Redeploy** após alterar variáveis

### Erro: 401 Unauthorized
**Causa**: Token inválido ou expirado
**Solução**:
1. Limpar Local Storage (F12 > Application > Local Storage)
2. Deletar: `token`, `api_url`, `user`
3. Fazer logout e login novamente

### Erro: CORS
**Causa**: Backend não permite requisições do Vercel
**Solução**:
1. Verificar `main.ts` do backend (seção CORS)
2. Adicionar domínio do Vercel na lista `allowedOrigins`
3. Fazer commit e aguardar redeploy do backend

### Build Failed
**Causa**: Erro de TypeScript ou dependências
**Solução**:
1. Verificar logs do build no Vercel
2. Testar build localmente: `npm run build`
3. Corrigir erros e fazer commit

---

## 🔄 Redeploy

Após alterar variáveis de ambiente:
1. Vá em **Deployments**
2. Clique nos **⋯** do último deploy
3. Selecione **Redeploy**
4. Aguarde ~2 minutos

---

## 📊 Monitoramento

### Analytics
Vercel oferece analytics gratuito:
- **Settings > Analytics**
- Métricas de performance, visitantes, etc.

### Logs
Disponíveis em tempo real:
- **Deployments > [Seu Deploy] > Function Logs**

---

**✅ Frontend configurado com sucesso!**

**Próximo passo**: Testar o sistema completo em `https://cantinhomda.vercel.app`
