# Como Rodar os Apps Mobile com Ngrok

## ✅ Configuração Atual

Os apps já estão configurados com a URL do ngrok:
- `mobile-customer/src/config.ts` → `https://07dea1eaf6ce.ngrok-free.app`
- `mobile-provider/src/config.ts` → `https://07dea1eaf6ce.ngrok-free.app`

## 🚀 Como Rodar

### Passo 1: Garantir que o Backend está rodando

```bash
cd backend
docker-compose up -d
```

Verifique se está funcionando:
```bash
curl http://localhost:5000/healthz
```

### Passo 2: Garantir que o Ngrok está rodando

Em um terminal separado:
```bash
ngrok http 5000
```

Você verá algo como:
```
Forwarding  https://07dea1eaf6ce.ngrok-free.app -> http://localhost:5000
```

**⚠️ IMPORTANTE:** Se a URL mudar, atualize os arquivos `config.ts` nos dois apps!

### Passo 3: Rodar o App Mobile

#### Para mobile-customer:

```bash
cd mobile-customer
npm install  # ou yarn install (se ainda não instalou)
npx expo start
```

Depois:
- Pressione `a` para abrir no Android
- Pressione `i` para abrir no iOS
- Escaneie o QR code com o Expo Go no celular

#### Para mobile-provider:

```bash
cd mobile-provider
npm install  # ou yarn install (se ainda não instalou)
npx expo start
```

Depois:
- Pressione `a` para abrir no Android
- Pressione `i` para abrir no iOS
- Escaneie o QR code com o Expo Go no celular

## 📱 Opções de Execução

### Opção A: Expo Go (Mais Rápido para Testes)

```bash
# Terminal 1: Backend
cd backend && docker-compose up -d

# Terminal 2: Ngrok
ngrok http 5000

# Terminal 3: App Customer
cd mobile-customer && npx expo start

# Terminal 4: App Provider (opcional, em outro terminal)
cd mobile-provider && npx expo start
```

### Opção B: Build de Desenvolvimento

```bash
# Com tunnel automático do Expo (usa ngrok integrado)
cd mobile-customer
npx expo start --tunnel

# Ou sem tunnel (precisa estar na mesma rede)
npx expo start
```

## 🔧 Troubleshooting

### Erro: "Network request failed"
1. Verifique se o ngrok está rodando: `curl https://07dea1eaf6ce.ngrok-free.app/healthz`
2. Verifique se a URL no `config.ts` está correta (HTTPS, não HTTP)
3. Verifique se o backend está rodando: `docker-compose ps`

### Erro: "CORS" ou "Origin not allowed"
- O backend já tem CORS configurado para aceitar qualquer origem
- Se ainda assim der erro, verifique os logs: `docker-compose logs backend`

### Socket.io não conecta
- Verifique se está usando HTTPS no Socket.io URL
- O Socket.io precisa de autenticação via token JWT
- Verifique se o token está sendo enviado corretamente

### Ngrok mostra página de erro
- Verifique se o backend está rodando: `curl http://localhost:5000/healthz`
- Verifique se o ngrok está apontando para a porta correta: `ngrok http 5000`

## 📝 Comandos Úteis

```bash
# Ver status do backend
docker-compose ps

# Ver logs do backend
docker-compose logs -f backend

# Testar endpoint via ngrok
curl https://07dea1eaf6ce.ngrok-free.app/healthz

# Reiniciar backend
docker-compose restart backend

# Parar tudo
docker-compose down
```

## ⚠️ Notas Importantes

1. **URL do ngrok muda**: Se você fechar e reabrir o ngrok, a URL muda. Você precisará atualizar os arquivos `config.ts` nos dois apps.

2. **Plano Free do ngrok**: Tem limitações de requisições. Para produção, considere usar um plano pago.

3. **HTTPS obrigatório**: Apps mobile (especialmente iOS) exigem HTTPS. Use sempre a URL HTTPS do ngrok.

4. **Dois apps simultâneos**: Você pode rodar ambos os apps ao mesmo tempo em terminais diferentes.

## 🎯 Fluxo Completo

1. ✅ Backend rodando na porta 5000
2. ✅ Ngrok tunnel ativo apontando para localhost:5000
3. ✅ Apps configurados com URL do ngrok
4. ✅ Rodar apps com `npx expo start`
5. ✅ Testar login/registro nos apps

## 🔄 Atualizar URL do Ngrok

Se a URL do ngrok mudar, atualize ambos os arquivos:

**mobile-customer/src/config.ts:**
```typescript
export const CONFIG = {
  API_URL: 'https://NOVA_URL_AQUI.ngrok-free.app',
  SOCKET_URL: 'https://NOVA_URL_AQUI.ngrok-free.app'
};
```

**mobile-provider/src/config.ts:**
```typescript
export const CONFIG = {
  API_URL: 'https://NOVA_URL_AQUI.ngrok-free.app',
  SOCKET_URL: 'https://NOVA_URL_AQUI.ngrok-free.app'
};
```
