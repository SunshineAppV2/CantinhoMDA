# 🚀 Guia de Migração e Deploy: Vercel + Firebase + GitHub

Este guia descreve como colocar o sistema **Ranking DBV** em produção utilizando a infraestrutura da **Vercel** (Frontend e Backend Serverless) e **Firebase** (Notificações, Storage e Auth).

---

## 🏗️ 1. Nova Arquitetura

*   **Hospedagem (Front & Back):** [Vercel](https://vercel.com). O projeto foi configurado como um Monorepo.
    *   Frontend acessível em `https://seu-projeto.vercel.app`
    *   Backend acessível em `https://seu-projeto.vercel.app/api` (Sem problemas de CORS!)
*   **Banco de Dados (PostgreSQL):** [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech) ou [Supabase](https://supabase.com). **Serverless**.
*   **Tempo Real & Arquivos:** [Firebase](https://firebase.google.com).
    *   Notificações: Firestore (Substituindo Socket.IO).
    *   Uploads: Firebase Storage (Substituindo pasta local).

---

## 🛠️ 2. Passo a Passo para Configuração

### Passo 1: Configurar Banco de Dados (Nuvem)

Você precisa de um banco Postgres acessível publicamente (com senha).
1.  Crie um banco no **Vercel Postgres**, **Supabase** ou **Neon**.
2.  Obtenha a **Connection String** (`DATABASE_URL`).
    *   *Exemplo*: `postgres://usuario:senha@host-na-nuvem.com/db?sslmode=require`

### Passo 2: Configurar Firebase

1.  Acesse o [Console do Firebase](https://console.firebase.google.com/).
2.  Crie um projeto (ex: `rankingdbv-prod`).
3.  **Firestore**: Crie o banco de dados (Modo Produção).
4.  **Storage**: Ative o Storage.
5.  **Auth**: Ative o Authentication (Email/Password).
6.  **Service Account (Backend)**:
    *   Vá em *Configurações do Projeto > Contas de Serviço*.
    *   Gere uma nova Chave Privada (JSON).
    *   *Nota*: Para Vercel, você precisará transformar esse JSON em variáveis de ambiente ou usar as credenciais padrão do Google Application Credentials.
    *   **Dica Prática**: Converta o JSON em string base64 ou adicione os campos (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) nas variáveis da Vercel.

### Passo 3: Configurar Repositório GitHub

1.  Crie um repositório no GitHub.
2.  Faça o push do código atual:
    ```bash
    git init
    git add .
    git commit -m "Migração Vercel e Firebase"
    git branch -M main
    git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
    git push -u origin main
    ```

### Passo 4: Deploy na Vercel

1.  Acesse [Vercel Dashboard](https://vercel.com/dashboard).
2.  Clique em **Add New > Project**.
3.  Importe o repositório do GitHub.
4.  **Configurações de Build**:
    *   A Vercel deve detectar o `vercel.json` na raiz e entender a estrutura.
    *   Se perguntar o `Root Directory`, mantenha a raiz (`.`).
5.  **Variáveis de Ambiente (Environment Variables)**:
    Adicione todas as variáveis do seu `.env` (Backend e Frontend):
    
    **Backend:**
    *   `DATABASE_URL`: (Sua string de conexão do Passo 1)
    *   `JWT_SECRET`: (Gere uma senha forte)
    *   `FIREBASE_PROJECT_ID`: (ID do projeto Firebase)
    *   `FIREBASE_CLIENT_EMAIL`: (Email da conta de serviço)
    *   `FIREBASE_PRIVATE_KEY`: (Chave privada da conta de serviço - *Atenção com as quebras de linha `\n`*)
    
    **Frontend:**
    *   `VITE_FIREBASE_API_KEY`: ...
    *   `VITE_FIREBASE_AUTH_DOMAIN`: ...
    *   `VITE_FIREBASE_PROJECT_ID`: ...
    *   (Etc... todas as vars do `firebaseConfig`)
    *   `VITE_API_URL`: `/api` (Isso mesmo, apenas `/api` pois estamos no mesmo domínio!)

6.  Clique em **Deploy**.

---

## 🔄 3. O que mudou no Código?

1.  **Backend**:
    *   **Socket.IO Removido**: Vercel Functions não suportam conexões persistentes.
    *   **Notificações**: Agora gravam direto no Firestore.
    *   **Static Assets**: O serviço de arquivos locais foi removido. Uploads devem ir para o Firebase Storage (precisa ser implementado no `uploads.service.ts` se ainda não estiver - *Pendente de Verificação*).
2.  **Frontend**:
    *   **Socket Client Removido**: O "Sininho" agora escuta o Firestore diretamente.
    *   **API URL**: Agora usa `/api` relativo.

---

## ✅ Checklist de Verificação

1.  [ ] Deploy na Vercel ficou verde (Success)?
2.  [ ] Login funciona? (Testa conexão com Banco + Auth).
3.  [ ] Notificações aparecem? (Testa integração Firestore).
