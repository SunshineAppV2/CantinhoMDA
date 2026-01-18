# 🔧 Configuração do Render - CantinhoMDA Backend

## 📋 Variáveis de Ambiente Obrigatórias

Configure estas variáveis em **Settings > Environment** no painel do Render:

```bash
# Database (obrigatório)
DATABASE_URL=<Internal Database URL do PostgreSQL>

# JWT Secret (obrigatório)
JWT_SECRET=cantinhomda_super_secret_key_2026

# Node Environment (obrigatório)
NODE_ENV=production

# Port (opcional, Render define automaticamente)
PORT=3000
```

---

## 🚀 Configurações do Serviço

### Build Settings
```
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm run start:prod
```

### Auto-Deploy
✅ **Ativado** - Deploy automático a cada push no GitHub

### Health Check Path
```
/health
```

### Instance Type
**Free** (512 MB RAM, hiberna após 15 min de inatividade)

---

## 🔗 URLs Importantes

Após o deploy, você terá:

- **API Base**: `https://cantinhomda-backend.onrender.com`
- **Health Check**: `https://cantinhomda-backend.onrender.com/health`
- **API Info**: `https://cantinhomda-backend.onrender.com/api`
- **Swagger Docs**: `https://cantinhomda-backend.onrender.com/api/docs`

---

## ⚠️ Importante

1. **Primeira inicialização**: Pode demorar até 2 minutos
2. **Hibernação**: Plano Free hiberna após 15 min sem uso
3. **Reativação**: Primeira requisição após hibernação demora ~30 segundos
4. **Logs**: Disponíveis em tempo real no painel do Render

---

## ✅ Checklist Pós-Deploy

- [ ] Testar `/health` - deve retornar `{"status":"ok"}`
- [ ] Testar `/api` - deve retornar informações da API
- [ ] Verificar logs - não deve ter erros críticos
- [ ] Atualizar `VITE_API_URL` no Vercel com a URL do Render
- [ ] Testar login no frontend

---

## 🐛 Troubleshooting

### Erro: "Application failed to respond"
**Causa**: Porta incorreta ou aplicação não iniciou
**Solução**: Verificar logs e confirmar que `PORT` está correto

### Erro: "Database connection failed"
**Causa**: `DATABASE_URL` incorreta
**Solução**: Copiar novamente a "Internal Database URL" do PostgreSQL

### Erro: "Prisma schema not found"
**Causa**: Build falhou
**Solução**: Verificar se `npx prisma generate` está no Build Command

---

**✅ Backend configurado com sucesso!**
