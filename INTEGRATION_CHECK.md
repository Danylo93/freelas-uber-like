# Integration Check - Freelas Uber-like

## 1. Fluxo Customer (Cliente)

| Etapa | Tela | Como chegar | Pré-condição |
|-------|------|-------------|--------------|
| 1 | Splash/Boot | App inicia | - |
| 2 | Login/Cadastro | Após splash se não autenticado | - |
| 3 | Home (mapa/lista) | Após login (user_type=CUSTOMER) | Auth |
| 4 | Solicitar serviço | Home → categoria → provider → "Solicitar" | Auth, localização |
| 5 | Aguardar provider | Após criar request (overlay) | Request criado |
| 6 | Acompanhar status | Socket + overlay no mapa | Request aceito |
| 7 | Ofertas | `offer_received` → /client/offers | Request pendente |
| 8 | Pagamento | job_status=near_client/completed → /client/payment | Serviço concluído |
| 9 | Success/Receipt | payment/success, receipt | Pagamento feito |
| 10 | Review | payment/success → "Avaliar" | Pagamento feito |
| 11 | Histórico | Menu → Histórico → /client/history | Auth |
| 12 | Perfil/Config | Menu ou avatar → /profile | Auth |
| 13 | Provider Profile | Lista → card → /client/provider_profile | - |
| 14 | Debug (dev) | Menu → Debug → /debug | __DEV__ |

## 2. Fluxo Provider (Prestador)

| Etapa | Tela | Como chegar | Pré-condição |
|-------|------|-------------|--------------|
| 1 | Splash/Boot | App inicia | - |
| 2 | Login/Cadastro | Após splash se não autenticado | - |
| 3 | Ficar online/offline | Home → toggle ONLINE/OFFLINE | Auth |
| 4 | Receber solicitações | Online + socket/polling | isOnline |
| 5 | Aceitar/recusar | Incoming card → ACEITAR / Recusar | Request recebido |
| 6 | Propor valor | "Propor valor" → /provider/propose | Request selecionado |
| 7 | Navegação até cliente | Após aceitar (mapa + rota) | Request aceito |
| 8 | Iniciar serviço | Slide → in_progress, near_client, started | Em atendimento |
| 9 | Finalizar serviço | "SLIDE TO FINISH" → modal foto → Finalizar | started |
| 10 | Wallet | Card "Ganhos" → /provider/wallet | Auth |
| 11 | Perfil/Config | Menu/avatar → /profile | Auth |
| 12 | Debug (dev) | Menu → Debug → /debug | __DEV__ |

## 3. Divergências e correções

### Customer
- **Correção**: Menu hamburger abria logout direto → alterado para Alert com Perfil, Histórico, Debug (dev), Sair
- **Correção**: Avatar sem ação → agora navega para /profile
- **Correção**: Histórico não acessível → adicionado no menu

### Provider
- **Correção**: Ícone de notificações virou menu → Alert com Perfil, Debug (dev), Sair
- **Correção**: Avatar/userInfo sem ação → agora navega para /profile

### Ambos
- **Config**: baseURL usa `process.env.EXPO_PUBLIC_API_BASE_URL` em `config.ts`
- **Debug**: Tela /debug (somente `__DEV__`) com BASE_URL e status /healthz

## 4. Como rodar Backend + ngrok

```powershell
# Opção 1: Script unificado (recomendado)
.\scripts\dev-up.ps1

# O script faz:
# 1. docker compose up -d --build
# 2. Verifica se ngrok já está rodando; senão, inicia ngrok http 5000
# 3. Obtém URL do ngrok via http://127.0.0.1:4040/api/tunnels
# 4. Grava EXPO_PUBLIC_API_BASE_URL nos .env (mobile-customer e mobile-provider)
# 5. Exibe a URL no console
```

O backend expõe a porta 5000 (host) mapeada da 3000 (container).

## 5. Como rodar Customer e Provider

```bash
# Terminal 1 - Customer
cd mobile-customer
npx expo start

# Terminal 2 - Provider
cd mobile-provider
npx expo start
```

**Importante**: rode `.\scripts\dev-up.ps1` antes para atualizar o `.env` com a URL do ngrok.

## 6. Testes manuais rápidos

### Backend
1. `curl http://localhost:5000/healthz` → deve retornar `{"status":"ok",...}`
2. Com ngrok: `curl https://<sua-url>.ngrok-free.app/healthz` → idem (pode precisar header `ngrok-skip-browser-warning: true`)

### Customer
1. Abrir app → Splash → Login
2. Registrar ou logar (user_type CUSTOMER)
3. Home → escolher categoria → ver providers
4. Solicitar serviço → ver overlay de acompanhamento
5. Menu → Perfil, Histórico, Debug (em dev)
6. Debug → ver BASE_URL e status /healthz

### Provider
1. Abrir app → Splash → Login
2. Registrar ou logar (user_type PROVIDER)
3. Home → toggle ONLINE
4. (Com customer criando request) ver incoming request
5. Aceitar → ver tela de navegação
6. Slide → iniciar/chegar/finalizar (com foto)
7. Menu → Perfil, Debug

### Integração E2E
1. Customer: login → criar request em categoria com providers
2. Provider: login → ficar online → aceitar request
3. Provider: atualizar status (in_progress → near_client → started → completed)
4. Customer: receber eventos via socket, ir para pagamento
5. Customer: pagar (mock) → success → avaliar

## 7. Endpoints utilizados pelos apps

### Customer
- `POST /auth/login`, `POST /auth/register`
- `GET /providers`, `GET /providers/:id`
- `GET /categories`
- `POST /requests`, `GET /requests`, `GET /requests/client/:clientId`
- `PUT /requests/:id/accept`, `PUT /requests/:id/update-status`
- `GET /requests/:id/receipt`, `PUT /requests/:id/review`
- `POST /requests/:id/payment`
- `GET /offers/:requestId`, `POST /offers/:id/accept`
- `POST /offers/:requestId/propose`
- `GET /providers/:id/wallet`
- `PUT /provider/location`
- `GET /healthz` (debug)

### Provider
- Mesmos + `PUT /providers/:id` (toggleOnline - legacy), `POST /matching/:requestId/accept`, `POST /tracking/:jobId/location` (legacy no api.ts)

### Possíveis endpoints faltantes ou inconsistências
- **Histórico completed**: Backend filtra por `RequestStatus` (PENDING, OFFERED, ACCEPTED, CANCELED, EXPIRED). Serviços concluídos podem estar em Job.status=COMPLETED; o request pode continuar ACCEPTED. Se precisar listar "completed" no histórico, o backend pode precisar de ajuste para considerar Job.status.
- **Provider PUT /providers/:id**: mobile-provider api.ts usa `fetch` direto em `/providers/:id` para toggleOnline – verificar se users-service expõe isso.

## 8. Mapeamento Completo de Rotas

### Customer App (`mobile-customer/app/`)

| Rota | Arquivo | Descrição | Status |
|------|---------|-----------|--------|
| `/` (index) | `app/index.tsx` | Splash → Auth → Home (redireciona por user_type) | ✅ |
| `/auth` | `app/auth/index.tsx` | Login/Registro | ✅ |
| `/client` | `app/client/index.tsx` | Home do cliente (mapa + categorias) | ✅ |
| `/client/history` | `app/client/history.tsx` | Histórico de serviços | ✅ |
| `/client/offers` | `app/client/offers.tsx` | Lista de ofertas recebidas | ✅ |
| `/client/payment` | `app/client/payment/index.tsx` | Seleção de método de pagamento | ✅ |
| `/client/payment/pix` | `app/client/payment/pix.tsx` | Pagamento via PIX | ✅ |
| `/client/payment/card` | `app/client/payment/card.tsx` | Pagamento via cartão | ✅ |
| `/client/payment/success` | `app/client/payment/success.tsx` | Sucesso do pagamento | ✅ |
| `/client/provider_profile` | `app/client/provider_profile.tsx` | Perfil do prestador | ✅ |
| `/client/receipt` | `app/client/receipt.tsx` | Recibo do serviço | ✅ |
| `/client/review` | `app/client/review.tsx` | Avaliação do serviço | ✅ |
| `/profile` | `app/profile/index.tsx` | Perfil do usuário | ✅ |
| `/debug` | `app/debug/index.tsx` | Debug/Health (dev-only) | ✅ |

**Rotas não utilizadas (podem ser removidas):**
- `/provider` - Não deve ser acessível no app customer
- `/admin` - Não implementado

### Provider App (`mobile-provider/app/`)

| Rota | Arquivo | Descrição | Status |
|------|---------|-----------|--------|
| `/` (index) | `app/index.tsx` | Splash → Auth → Home (redireciona por user_type) | ✅ |
| `/auth` | `app/auth/index.tsx` | Login/Registro | ✅ |
| `/provider` | `app/provider/index.tsx` | Home do prestador (mapa + toggle online) | ✅ |
| `/provider/propose` | `app/provider/propose.tsx` | Propor valor para request | ✅ |
| `/provider/wallet` | `app/provider/wallet/index.tsx` | Carteira/Ganhos | ✅ |
| `/profile` | `app/profile/index.tsx` | Perfil do usuário | ✅ |
| `/debug` | `app/debug/index.tsx` | Debug/Health (dev-only) | ✅ |

**Rotas não utilizadas (podem ser removidas):**
- `/client/*` - Não deve ser acessível no app provider
- `/admin` - Não implementado

### Comparação: Fluxo Esperado vs Implementado

#### Customer - ✅ Todas as telas esperadas existem

| Esperado | Implementado | Status |
|----------|--------------|--------|
| Splash | ✅ `app/index.tsx` | ✅ |
| Auth | ✅ `app/auth/index.tsx` | ✅ |
| Home | ✅ `app/client/index.tsx` | ✅ |
| RequestService | ✅ `app/client/index.tsx` (botão Solicitar) | ✅ |
| WaitingProvider | ✅ Overlay em `app/client/index.tsx` | ✅ |
| Tracking | ✅ Overlay em `app/client/index.tsx` | ✅ |
| History | ✅ `app/client/history.tsx` | ✅ |
| Profile | ✅ `app/profile/index.tsx` | ✅ |

**Nota**: Ofertas, Pagamento, Review são acessados via navegação programática (não são rotas diretas no menu).

#### Provider - ✅ Todas as telas esperadas existem

| Esperado | Implementado | Status |
|----------|--------------|--------|
| Splash | ✅ `app/index.tsx` | ✅ |
| Auth | ✅ `app/auth/index.tsx` | ✅ |
| OnlineToggle | ✅ `app/provider/index.tsx` | ✅ |
| IncomingRequests | ✅ Overlay em `app/provider/index.tsx` | ✅ |
| AcceptDecline | ✅ Overlay em `app/provider/index.tsx` | ✅ |
| NavigateToCustomer | ✅ Tela de navegação em `app/provider/index.tsx` | ✅ |
| StartService | ✅ Slide button em `app/provider/index.tsx` | ✅ |
| FinishService | ✅ Modal em `app/provider/index.tsx` | ✅ |
| History | ⚠️ Não implementado como rota separada | ⚠️ |
| Profile | ✅ `app/profile/index.tsx` | ✅ |

**Nota**: Histórico do provider não está implementado como tela separada, mas pode ser adicionado se necessário.

## 9. Testes E2E

### Estrutura Criada

```
mobile-customer/e2e/
  .detoxrc.js          # Config Detox (requer Expo Bare)
  jest.config.js        # Config Jest
  navigation.test.js     # Testes de navegação

mobile-provider/e2e/
  .detoxrc.js          # Config Detox (requer Expo Bare)
  jest.config.js        # Config Jest
  navigation.test.js     # Testes de navegação

README_E2E.md           # Documentação completa de testes
```

### Testes Implementados

#### Customer (`mobile-customer/e2e/navigation.test.js`)
- ✅ Splash screen aparece
- ✅ Navegação para Auth após splash
- ✅ Navegação para Home após login
- ✅ Tela de Solicitar Serviço existe
- ✅ Navegação para Histórico
- ✅ Navegação para Perfil
- ✅ Tela Debug (dev-only)

#### Provider (`mobile-provider/e2e/navigation.test.js`)
- ✅ Splash screen aparece
- ✅ Navegação para Auth após splash
- ✅ Navegação para Home após login
- ✅ Toggle Online existe
- ✅ Tela de Receber Solicitação existe
- ✅ Navegação para Perfil
- ✅ Tela Debug (dev-only)

### Como Executar

**⚠️ Importante**: Os apps são Expo Managed, então Detox requer conversão para Expo Bare.

**Opções:**
1. **Detox** (requer Expo Bare): Ver `README_E2E.md`
2. **Testes Unitários**: Mais prático para Expo Managed
3. **Playwright** (web): Se testar versão web
4. **Checklist Manual**: Use a seção 6 abaixo

**Ver documentação completa em `README_E2E.md`**

## 10. Checklist do fluxo

- [ ] Backend sobe com docker compose
- [ ] ngrok expõe localhost:5000
- [ ] .env tem EXPO_PUBLIC_API_BASE_URL com URL ngrok
- [ ] Customer: splash → auth → home
- [ ] Customer: home → categoria → lista providers
- [ ] Customer: solicitar → overlay tracking
- [ ] Customer: ofertas via socket
- [ ] Customer: pagamento → success → review
- [ ] Customer: menu → perfil, histórico, debug
- [ ] Provider: splash → auth → home
- [ ] Provider: toggle online
- [ ] Provider: receber request → aceitar/recusar
- [ ] Provider: navegação → iniciar → finalizar (foto)
- [ ] Provider: menu → perfil, debug
- [ ] Debug: BASE_URL e /healthz OK
- [ ] Testes E2E executados (se aplicável)
