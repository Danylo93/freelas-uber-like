# Testes E2E com Maestro

Este projeto contém configurações de teste E2E usando [Maestro](https://maestro.mobile.dev/).

## Pré-requisitos

1. Instale o Maestro:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
2. Tenha os emuladores Android/iOS rodando com os apps instalados.

## Executando os Testes

### Customer App

```bash
maestro test mobile-customer/e2e/flow.yaml
```

### Provider App

```bash
maestro test mobile-provider/e2e/flow.yaml
```

## Cenários Cobertos

1. **Customer**: Login, Seleção de Categoria, Visualização de Prestadores, Tentativa de Solicitação.
2. **Provider**: Login, Toggle Online/Offline, Navegação de Ganhos.

> Nota: Para testes completos de integração (Customer solicitando -> Provider aceitando), é necessário rodar os dois fluxos simultaneamente ou usar um backend de teste com estado controlado.
