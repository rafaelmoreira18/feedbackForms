# Setup Backend — Servidor Windows + Cloudflare Tunnel

## Pré-requisitos

1. **Docker Desktop** instalado → https://www.docker.com/products/docker-desktop/
2. **Git** instalado → https://git-scm.com/download/win
3. **Conta Cloudflare** (grátis) → https://dash.cloudflare.com/sign-up

---

## Passo 1 — Transferir domínio para Cloudflare (DNS)

> Isso não tira o domínio do GoDaddy — só muda onde o DNS é gerenciado (grátis).

1. No Cloudflare → **Add a Site** → digite `mediallquality.com`
2. Escolha o plano **Free**
3. O Cloudflare vai detectar seus DNS atuais e mostrar os registros
4. Clique em **Continue**
5. O Cloudflare fornece 2 nameservers (ex: `aida.ns.cloudflare.com`)
6. No GoDaddy → My Domains → `mediallquality.com` → **DNS** → **Nameservers** → **Change** → **Enter my own nameservers**
7. Cole os 2 nameservers do Cloudflare
8. Aguarde ~10-30 minutos

---

## Passo 2 — Instalar Cloudflare Tunnel no servidor Windows

Abra o **PowerShell como Administrador** e execute:

```powershell
# Baixar cloudflared
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "C:\cloudflared.exe"

# Autenticar (abre o browser)
C:\cloudflared.exe tunnel login
```

---

## Passo 3 — Criar o túnel

```powershell
# Criar túnel (guarde o ID que aparecer)
C:\cloudflared.exe tunnel create mediallquality-backend

# Listar túneis para pegar o ID
C:\cloudflared.exe tunnel list
```

---

## Passo 4 — Configurar DNS do túnel no Cloudflare

```powershell
# Substitua SEU-TUNNEL-ID pelo ID do passo anterior
C:\cloudflared.exe tunnel route dns SEU-TUNNEL-ID api.mediallquality.com
```

---

## Passo 5 — Criar arquivo de configuração do túnel

Crie o arquivo `C:\Users\SEU_USUARIO\.cloudflared\config.yml`:

```yaml
tunnel: SEU-TUNNEL-ID
credentials-file: C:\Users\SEU_USUARIO\.cloudflared\SEU-TUNNEL-ID.json

ingress:
  - hostname: api.mediallquality.com
    service: http://localhost:3001
  - service: http_status:404
```

> Substitua `SEU_USUARIO` pelo seu usuário Windows e `SEU-TUNNEL-ID` pelo ID real.

---

## Passo 6 — Subir o backend com Docker

No **PowerShell**, navegue até a pasta do projeto e execute:

```powershell
cd C:\caminho\para\feedbackforms

docker compose -f docker-compose.prod.yml up -d --build
```

Verifique se está rodando:
```powershell
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

---

## Passo 7 — Iniciar o túnel Cloudflare

```powershell
C:\cloudflared.exe tunnel run mediallquality-backend
```

Teste acessando: `https://api.mediallquality.com/api/auth/login`
Deve retornar `401` (normal — significa que está funcionando).

---

## Passo 8 — Configurar início automático no Windows

Para o túnel e o Docker iniciarem automaticamente quando o servidor ligar:

```powershell
# Instalar cloudflared como serviço Windows
C:\cloudflared.exe service install

# O Docker Desktop já inicia automaticamente com o Windows
# Verifique em: Docker Desktop → Settings → General → "Start Docker Desktop when you log in"
```

---

## Resultado final

| URL | O que é |
|-----|---------|
| `https://mediallquality.com` | Frontend (Vercel) |
| `https://api.mediallquality.com` | Backend (servidor da empresa via Cloudflare Tunnel) |

---

## Comandos úteis no dia a dia

```powershell
# Ver logs do backend
docker compose -f docker-compose.prod.yml logs -f

# Reiniciar backend
docker compose -f docker-compose.prod.yml restart

# Atualizar backend após mudanças no código
docker compose -f docker-compose.prod.yml up -d --build

# Parar tudo
docker compose -f docker-compose.prod.yml down
```
