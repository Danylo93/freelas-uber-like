# E2E com Detox - Freelas Uber-like

Este repositório possui suíte Detox para os dois apps mobile:

- `mobile-customer`
- `mobile-provider`

A suíte atual é focada em Android Emulator (configuração `android.emu.debug`).

## Pré-requisitos

- Android Studio + AVD criado (padrão: `Pixel_5_API_34`)
- `ANDROID_HOME` configurado
- Java/SDK Android funcionando
- Dependências instaladas em cada app (`yarn`)

## Comandos

### Customer

```bash
cd mobile-customer
yarn e2e:android
```

### Provider

```bash
cd mobile-provider
yarn e2e:android
```

## Comandos separados

```bash
yarn e2e:build:android
yarn e2e:test:android
```

## AVD customizado

Windows:

```bash
set DETOX_AVD_NAME=SEU_AVD
```

A configuração é lida de `e2e/.detoxrc.js` em cada app.

## Escopo inicial da suíte

### Customer

- Splash screen aparece
- Tela de login abre após splash
- Campos de login principais ficam visíveis

### Provider

- Splash screen aparece
- Tela de boas-vindas abre após splash
- Transição para login funciona
- Campos de login principais ficam visíveis
