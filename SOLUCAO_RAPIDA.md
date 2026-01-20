# Solução Rápida - Expo Start Lento

## ⚡ Problema: `npx expo start --tunnel` está muito lento

O tunnel do Expo usa ngrok e pode ser muito lento. Como você já tem ngrok configurado manualmente, **NÃO precisa usar `--tunnel`**!

## ✅ Solução: Use sem tunnel

### Opção 1: Modo Normal (Mais Rápido)

```bash
cd mobile-provider
npx expo start
```

**Por quê funciona?**
- Os apps já estão configurados com a URL do ngrok (`https://07dea1eaf6ce.ngrok-free.app`)
- O Expo só precisa servir o código JavaScript do app
- As requisições HTTP vão direto para o ngrok que você já configurou

### Opção 2: Modo LAN (Se estiver na mesma rede WiFi)

```bash
cd mobile-provider
npx expo start --lan
```

Isso é mais rápido que tunnel, mas requer que o celular esteja na mesma rede WiFi.

## 🎯 Comandos Rápidos

### Para mobile-provider:
```bash
cd mobile-provider
npx expo start
# Pressione 'a' para Android ou 'i' para iOS
# Ou escaneie o QR code com Expo Go
```

### Para mobile-customer:
```bash
cd mobile-customer
npx expo start
# Pressione 'a' para Android ou 'i' para iOS
# Ou escaneie o QR code com Expo Go
```

## 📝 Por que não precisa de --tunnel?

1. ✅ **Backend já está exposto via ngrok**: `https://07dea1eaf6ce.ngrok-free.app`
2. ✅ **Apps já configurados**: Ambos usam a URL do ngrok
3. ✅ **Expo só serve o código**: O Expo não precisa fazer tunnel do backend, só do código do app

## ⚡ Diferença entre os modos:

- `npx expo start` → Modo normal (mais rápido, funciona com ngrok manual)
- `npx expo start --lan` → LAN (rápido, precisa mesma rede WiFi)
- `npx expo start --tunnel` → Tunnel automático (lento, cria tunnel próprio)

## 🚀 Resumo

**Use simplesmente:**
```bash
npx expo start
```

**Sem `--tunnel`!** O ngrok já está configurado e funcionando.
