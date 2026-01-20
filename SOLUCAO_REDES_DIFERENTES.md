# Solução: iPhone no WiFi e PC no Cabo

## 🔍 Situação

- **iPhone**: Conectado via WiFi
- **PC**: Conectado via cabo de rede
- **Problema**: Podem estar em redes diferentes, então o Expo precisa de tunnel

## ✅ Soluções

### Opção 1: Conectar PC no WiFi também (Recomendado)

Se possível, conecte o PC na mesma rede WiFi do iPhone:

1. Desconecte o cabo de rede
2. Conecte o PC no WiFi (mesma rede do iPhone)
3. Rode:
   ```bash
   cd mobile-provider
   npx expo start --lan
   ```
   Isso será **muito mais rápido** que tunnel!

### Opção 2: Usar --lan mesmo assim (Teste primeiro)

Mesmo com cabo, se estiverem na mesma rede local, pode funcionar:

```bash
cd mobile-provider
npx expo start --lan
```

O Expo vai mostrar um IP local. Tente acessar pelo iPhone.

### Opção 3: Usar ngrok para o Expo também

Se as opções acima não funcionarem, você pode usar ngrok para o Expo também:

1. **Terminal 1**: Backend (já está rodando)
   ```bash
   ngrok http 5000
   ```

2. **Terminal 2**: Expo (adicione outro ngrok)
   ```bash
   # Em outro terminal, rode outro ngrok para a porta do Expo (8081)
   ngrok http 8081
   ```
   
   Depois atualize o app para usar essa URL também (mas isso é complicado).

### Opção 4: Usar --tunnel com mais paciência

O `--tunnel` pode demorar, mas eventualmente conecta:

```bash
cd mobile-provider
npx expo start --tunnel
```

**Aguarde alguns minutos** - pode demorar mesmo, mas geralmente funciona.

## 🎯 Recomendação

**Tente primeiro a Opção 1** (conectar PC no WiFi):
- Mais rápido
- Mais estável
- Não precisa de tunnel

Se não for possível, use **Opção 4** (`--tunnel`) e aguarde - pode demorar 2-5 minutos na primeira vez.

## 📝 Verificar se estão na mesma rede

No PC, rode:
```bash
ipconfig
```

Veja o IP do PC (ex: 192.168.1.100)

No iPhone, vá em Configurações > WiFi > (sua rede) e veja o IP do iPhone.

Se começarem com o mesmo prefixo (ex: 192.168.1.x), estão na mesma rede e `--lan` deve funcionar!
