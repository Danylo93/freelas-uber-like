# Solução: Erro "ngrok tunnel took too long to connect"

## ❌ Problema

Quando você roda `npx expo start --tunnel`, o Expo tenta criar um tunnel próprio via ngrok, o que:
- É muito lento
- Pode dar timeout
- Não é necessário se você já tem ngrok rodando manualmente

## ✅ Solução: Não use `--tunnel`

Você **NÃO precisa** usar `--tunnel` porque:

1. ✅ **Ngrok já está rodando**: `https://07dea1eaf6ce.ngrok-free.app`
2. ✅ **Apps já configurados**: Ambos usam a URL do ngrok
3. ✅ **Expo só serve código**: O Expo não precisa fazer tunnel do backend

## 🚀 Comando Correto

### Para mobile-provider:
```bash
cd mobile-provider
npx expo start
```

### Para mobile-customer:
```bash
cd mobile-customer
npx expo start
```

**Sem `--tunnel`!**

## 📝 Como Funciona

1. **Expo serve o código JavaScript** do app (rápido, sem tunnel)
2. **Apps fazem requisições HTTP** direto para `https://07dea1eaf6ce.ngrok-free.app`
3. **Ngrok encaminha** para `localhost:5000` onde o backend está rodando

## ⚡ Diferença

- `npx expo start` → **Rápido** (usa ngrok manual já configurado)
- `npx expo start --tunnel` → **Lento** (tenta criar tunnel próprio, pode dar timeout)

## 🎯 Resumo

**Pare de usar `--tunnel`!** 

Use simplesmente:
```bash
npx expo start
```

Isso será muito mais rápido e funcionará perfeitamente com seu ngrok manual.
