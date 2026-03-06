# Deploy Guide — FeedbackForms

## Arquitetura

```
Usuário
  ├── mediallquality.com  →  Vercel (frontend React) — GRÁTIS
  └── api.mediallquality.com  →  Cloudflare Tunnel → Servidor Windows (backend NestJS)
                                                              ↓
                                                    RDS AWS (banco PostgreSQL)
```

---

## Projetos

| Pasta | O que é | Deploy |
|-------|---------|--------|
| `/feedbackforms-frontend` | React (Vite) | Vercel |
| `/feedbackforms/backend` | NestJS | Docker no servidor Windows |

---

## PARTE 1 — Frontend na Vercel

### 1.1 — Criar conta e conectar repositório

1. Acesse https://vercel.com e crie uma conta (pode usar GitHub)
2. Clique em **Add New Project**
3. Importe o repositório `feedbackforms-frontend` do GitHub
   - Se ainda não está no GitHub, faça push primeiro:
   ```bash
   cd C:\Users\rafae\projects\feedbackforms-frontend
   git init
   git add .
   git commit -m "initial commit"
   # Crie um repositório no GitHub e siga as instruções
   ```

### 1.2 — Configurar na Vercel

- **Framework Preset:** Vite
- **Root Directory:** `/` (raiz)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** adicione:
  ```
  VITE_API_URL = https://api.mediallquality.com/api
  ```

### 1.3 — Configurar domínio

1. No projeto Vercel → **Settings** → **Domains**
2. Adicione `mediallquality.com` e `www.mediallquality.com`
3. A Vercel fornecerá registros DNS para configurar no Cloudflare

> Nota: o DNS será gerenciado pelo Cloudflare (configurado na Parte 2)

---

## PARTE 2 — Backend no servidor Windows

Siga o guia completo em: `scripts/setup-windows-server.md`

### Resumo dos passos:
1. Transferir DNS do GoDaddy para Cloudflare (grátis)
2. Instalar Cloudflare Tunnel no servidor Windows
3. Criar túnel `api.mediallquality.com → localhost:3001`
4. Subir backend com Docker: `docker compose -f docker-compose.prod.yml up -d --build`
5. Configurar início automático do serviço

---

## PARTE 3 — DNS no Cloudflare (após ambos configurados)

No painel do Cloudflare → `mediallquality.com` → **DNS**:

| Tipo | Nome | Valor |
|------|------|-------|
| CNAME | `@` | `cname.vercel-dns.com` (fornecido pela Vercel) |
| CNAME | `www` | `cname.vercel-dns.com` (fornecido pela Vercel) |
| CNAME | `api` | `SEU-TUNNEL-ID.cfargotunnel.com` (criado automaticamente pelo tunnel) |

---

## Custos mensais

| Serviço | Custo |
|---------|-------|
| Vercel (frontend) | **R$ 0** |
| Cloudflare Tunnel | **R$ 0** |
| Servidor Windows da empresa | **R$ 0** (já existe) |
| RDS AWS (banco) | já pago |
| GoDaddy (domínio) | já pago |
| **Total** | **R$ 0/mês extra** |
