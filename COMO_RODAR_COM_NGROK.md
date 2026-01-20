# Como Rodar os Apps Mobile com Ngrok Tunnel

## Pré-requisitos

1. ✅ Backend rodando na porta 5000
2. ✅ Ngrok configurado e rodando
3. ✅ Apps mobile configurados com a URL do ngrok

## Passo a Passo

### 1. Iniciar o Backend

```bash
cd backend
docker-compose up -d
```

Verifique se está rodando:
```bash
curl http://localhost:5000/healthz
```

### 2. Iniciar o Ngrok

Abra um terminal e execute:

```bash
ngrok http 5000
```

Você verá algo como:
```
Forwarding  https://07dea1eaf6ce.ngrok-free.app -> http://localhost:5000
```

**Copie a URL HTTPS** (não a HTTP) e atualize nos arquivos de config dos apps.

### 3. Atualizar Configuração dos Apps

#### mobile-customer/src/config.ts
```typescript
export const CONFIG = {
  API_URL: 'https://07dea1eaf6ce.ngrok-free.app',
  SOCKET_URL: 'https://07dea1eaf6ce.ngrok-free.app'
};
```

#### mobile-provider/src/config.ts
```typescript
export const CONFIG = {
  API_URL: 'https://07dea1eaf6ce.ngrok-free.app',
  SOCKET_URL: 'https://07dea1eaf6ce.ngrok-free.app'
};
```

### 4. Rodar os Apps Mobile

#### Opção A: Expo Go (Recomendado para testes rápidos)

**mobile-customer:**
```bash
cd mobile-customer
npm install  # ou yarn install
npx expo start
```

**mobile-provider:**
```bash
cd mobile-provider
npm install  # ou yarn install
npx expo start
```

Depois escaneie o QR code com o app Expo Go no seu celular.

#### Opção B: Build de Desenvolvimento

**mobile-customer:**
```bash
cd mobile-customer
npm install
npx expo start --tunnel
```

**mobile-provider:**
```bash
cd mobile-provider
npm install
npx expo start --tunnel
```

### 5. Testar a Conexão

No app mobile, tente fazer login ou registrar um usuário. Se funcionar, o ngrok está configurado corretamente!

## Troubleshooting

### Erro: "Network request failed"
- Verifique se o ngrok está rodando
- Verifique se a URL no config.ts está correta (HTTPS, não HTTP)
- Verifique se o backend está rodando na porta 5000

### Erro: "CORS" ou "Origin not allowed"
- O backend já tem CORS configurado para aceitar qualquer origem
- Se ainda assim der erro, verifique os logs do backend

### Socket.io não conecta
- Verifique se está usando HTTPS no Socket.io URL
- O Socket.io precisa de autenticação via token JWT
- Verifique se o token está sendo enviado corretamente

### Ngrok mostra página de erro
- Verifique se o backend está realmente rodando: `curl http://localhost:5000/healthz`
- Verifique se o ngrok está apontando para a porta correta: `ngrok http 5000`

## Configuração Permanente (Opcional)

Se você quer usar sempre a mesma URL do ngrok, pode configurar um domínio estático:

1. Crie uma conta no ngrok (gratuita)
2. Configure um domínio estático:
   ```bash
   ngrok config add-authtoken SEU_TOKEN
   ngrok http 5000 --domain=seu-dominio.ngrok-free.app
   ```

3. Use esse domínio nos arquivos de config dos apps

## Notas Importantes

⚠️ **URL do ngrok muda**: Se você fechar e reabrir o ngrok, a URL muda. Você precisará atualizar os arquivos de config.

⚠️ **Plano Free do ngrok**: Tem limitações de requisições. Para produção, considere usar um plano pago ou outro serviço.

⚠️ **HTTPS obrigatório**: Apps mobile (especialmente iOS) exigem HTTPS. Use sempre a URL HTTPS do ngrok, nunca HTTP.

## Comandos Úteis

```bash
# Ver status do backend
docker-compose ps

# Ver logs do backend
docker-compose logs -f backend

# Testar endpoint via ngrok
curl https://07dea1eaf6ce.ngrok-free.app/healthz

# Reiniciar backend
docker-compose restart backend
```
