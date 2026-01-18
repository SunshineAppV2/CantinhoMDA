# 🔐 GUIA PASSO A PASSO - Configurar Secrets no Render

## 📋 O Que Você Vai Fazer

Configurar 4 variáveis de ambiente no Render para ativar as melhorias de segurança que acabamos de implementar.

**Tempo necessário**: 5 minutos  
**Dificuldade**: Fácil ⭐

---

## 🎯 Variáveis que Você Vai Adicionar

Copie estas 4 linhas (você vai precisar delas):

```
ENCRYPTION_KEY=ca8e6e4b6cf04908ee81d020203fe53b31d144fba752c24dd5bd9f04cee81b0c
JWT_SECRET=6abe27fde67b9733de0672a8675e7d9910370f4769a2ea10e4eb225828da5be8
JWT_REFRESH_SECRET=05648ad1e67710f8ad22ffca6b6a299912fccd73b5b1256b1828ba1481d91da1
NODE_ENV=production
```

---

## 📝 PASSO A PASSO

### Passo 1: Acessar o Render

1. Abra seu navegador
2. Acesse: **https://dashboard.render.com**
3. Faça login com sua conta

---

### Passo 2: Encontrar Seu Serviço Backend

1. Na página inicial do Render, você verá uma lista de serviços
2. Procure pelo serviço do **backend** (provavelmente chamado `cantinhomda-backend` ou similar)
3. **Clique no nome do serviço** para abrir

---

### Passo 3: Ir para Environment Variables

1. No menu lateral esquerdo, clique em **"Settings"** (Configurações)
2. Role a página até encontrar a seção **"Environment Variables"**
3. Você verá as variáveis que já existem (como `DATABASE_URL`)

---

### Passo 4: Adicionar as Novas Variáveis

Para cada uma das 4 variáveis, faça:

#### 4.1 - ENCRYPTION_KEY

1. Clique no botão **"Add Environment Variable"**
2. No campo **"Key"** (Chave), digite: `ENCRYPTION_KEY`
3. No campo **"Value"** (Valor), cole: `ca8e6e4b6cf04908ee81d020203fe53b31d144fba752c24dd5bd9f04cee81b0c`
4. Clique em **"Save"** ou **"Add"**

#### 4.2 - JWT_SECRET

1. Clique novamente em **"Add Environment Variable"**
2. No campo **"Key"**, digite: `JWT_SECRET`
3. No campo **"Value"**, cole: `6abe27fde67b9733de0672a8675e7d9910370f4769a2ea10e4eb225828da5be8`
4. Clique em **"Save"** ou **"Add"**

#### 4.3 - JWT_REFRESH_SECRET

1. Clique novamente em **"Add Environment Variable"**
2. No campo **"Key"**, digite: `JWT_REFRESH_SECRET`
3. No campo **"Value"**, cole: `05648ad1e67710f8ad22ffca6b6a299912fccd73b5b1256b1828ba1481d91da1`
4. Clique em **"Save"** ou **"Add"**

#### 4.4 - NODE_ENV

1. Clique novamente em **"Add Environment Variable"**
2. No campo **"Key"**, digite: `NODE_ENV`
3. No campo **"Value"**, digite: `production`
4. Clique em **"Save"** ou **"Add"**

---

### Passo 5: Salvar Todas as Mudanças

1. Role até o final da página
2. Clique no botão **"Save Changes"** (grande, geralmente azul)
3. O Render vai perguntar se você quer fazer redeploy
4. **Clique em "Yes" ou "Deploy"** para aplicar as mudanças

---

### Passo 6: Aguardar o Deploy

1. O Render vai reiniciar seu serviço automaticamente
2. Você verá uma barra de progresso ou status "Deploying..."
3. Aguarde até o status mudar para **"Live"** (verde)
4. Isso pode levar 2-5 minutos

---

## ✅ Como Saber se Deu Certo

Após o deploy completar:

1. Acesse a URL do seu backend (ex: `https://cantinhomda-backend.onrender.com/health`)
2. Você deve ver uma resposta JSON como:
   ```json
   {
     "status": "ok",
     "timestamp": "..."
   }
   ```

3. Verifique os logs:
   - Clique em **"Logs"** no menu lateral
   - Procure por mensagens como:
     - ✅ `Application is running on: ...`
     - ✅ Sem erros de `ENCRYPTION_KEY not found`

---

## 🎯 Checklist Rápido

Use esta lista para conferir:

- [ ] Acessei https://dashboard.render.com
- [ ] Encontrei meu serviço backend
- [ ] Cliquei em "Settings"
- [ ] Adicionei `ENCRYPTION_KEY`
- [ ] Adicionei `JWT_SECRET`
- [ ] Adicionei `JWT_REFRESH_SECRET`
- [ ] Adicionei `NODE_ENV`
- [ ] Cliquei em "Save Changes"
- [ ] Aguardei o deploy completar
- [ ] Verifiquei que o status está "Live"

---

## 🆘 Problemas Comuns

### "Não encontro o botão Add Environment Variable"

**Solução**: 
- Certifique-se de que está na aba "Settings"
- Role a página para baixo até a seção "Environment Variables"
- O botão geralmente está no canto superior direito da seção

### "O deploy falhou"

**Solução**:
1. Clique em "Logs" para ver o erro
2. Verifique se copiou as chaves corretamente (sem espaços extras)
3. Tente fazer deploy manual: clique em "Manual Deploy" > "Deploy latest commit"

### "Não sei qual é meu serviço backend"

**Solução**:
- Procure por um serviço com "backend" no nome
- Ou procure pelo serviço que tem `DATABASE_URL` nas variáveis
- Geralmente é o serviço do tipo "Web Service"

---

## 📸 Referência Visual

### Como Deve Ficar

Após adicionar todas as variáveis, você deve ver algo assim na seção Environment Variables:

```
DATABASE_URL = postgresql://... (já existia)
ENCRYPTION_KEY = ca8e6e4b6cf04908ee81d020203fe53b31d144fba752c24dd5bd9f04cee81b0c
JWT_SECRET = 6abe27fde67b9733de0672a8675e7d9910370f4769a2ea10e4eb225828da5be8
JWT_REFRESH_SECRET = 05648ad1e67710f8ad22ffca6b6a299912fccd73b5b1256b1828ba1481d91da1
NODE_ENV = production
```

---

## 🚀 Próximo Passo

Após configurar as variáveis no Render:

1. ✅ Faça commit das mudanças de código:
   ```bash
   cd G:\CantinhoMDA\cantinhomda-backend
   git add .
   git commit -m "feat: add security improvements (encryption, rate limiting, audit)"
   git push origin main
   ```

2. ✅ O Render vai fazer deploy automaticamente

3. ✅ Aguarde o deploy completar

4. ✅ Teste a aplicação!

---

## 💡 Dica Importante

⚠️ **NUNCA** compartilhe essas chaves publicamente!
- Não as coloque no código
- Não as commite no Git
- Não as envie por email ou chat
- Mantenha apenas no Render (variáveis de ambiente)

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas em algum passo:
1. Tire um print da tela onde está com dúvida
2. Me mostre o print
3. Eu te ajudo a resolver! 😊

---

**Status**: ⏳ Aguardando você configurar no Render  
**Tempo estimado**: 5 minutos  
**Dificuldade**: ⭐ Fácil

**Boa sorte! Você consegue! 🚀**
