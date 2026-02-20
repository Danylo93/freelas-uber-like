# E2E with Detox - Freelas Uber-like

This repository has Detox suites for both mobile apps:

- `mobile-customer`
- `mobile-provider`

The suite targets Android Emulator with `android.emu.release`.

## Prerequisites

- Android Studio with an AVD (default used by CI: `test`)
- `ANDROID_HOME` set
- Android SDK and Java working
- Dependencies installed in each app (`yarn`)

## Commands

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

## Build and test separately

```bash
yarn e2e:build:android
yarn e2e:test:android
```

## Custom AVD

Windows:

```bash
set DETOX_AVD_NAME=YOUR_AVD
```

Detox config is loaded from `.detoxrc.js` at each app root.

## Suite scope

### Customer

- Splash/login flow smoke
- Invalid login stays unauthenticated
- New customer registration authenticates successfully

### Provider

- Splash/welcome/login flow smoke
- Invalid login stays unauthenticated
- Valid login authenticates successfully
- New provider registration authenticates successfully

## CI

GitHub Actions workflow:

- `.github/workflows/mobile-detox-android.yml`

It runs:

- Docker backend startup and health check
- Detox Android build for both apps
- `authentication` and `navigation` tests for both apps
