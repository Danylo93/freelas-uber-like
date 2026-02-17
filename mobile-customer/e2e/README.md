# Detox E2E (Customer)

## Pre-requisitos

- Android SDK + emulador criado (ex: `Pixel_5_API_34`)
- Variável `ANDROID_HOME` configurada
- Dependências instaladas (`yarn`)

## Comandos

```bash
yarn e2e:build:android
yarn e2e:test:android
```

Ou em sequência:

```bash
yarn e2e:android
```

## Configuração de AVD

Por padrão a suíte usa `Pixel_5_API_34`.

Para usar outro emulador:

```bash
set DETOX_AVD_NAME=SEU_AVD
```

## Escopo inicial

- Validar splash screen
- Validar abertura da tela de login com campos principais
