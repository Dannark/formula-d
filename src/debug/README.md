# 🏁 Formula-D Track Debug System

Este sistema permite gerar e manipular pistas via console do navegador.

## 📁 Arquivos

- `TrackDebug.js` - Sistema de debug principal
- `README.md` - Este arquivo de documentação

## 🎮 Como usar

Abra o console do navegador (F12) e use as seguintes funções:

### Gerar nova pista circular
```javascript
generateCircularTrack()                // Pista padrão (12 pontos, 25%)
generateCircularTrack(8)              // 8 pontos, raio padrão
generateCircularTrack(16, 0.3)        // 16 pontos, 30% da tela
generateCircularTrack(6, 0.15)        // 6 pontos, 15% da tela
```

### Obter informações da pista
```javascript
getTrackInfo()                        // Mostra detalhes da pista atual
```

### Resetar para pista padrão
```javascript
resetToDefaultTrack()                 // Volta para configuração original
```

### Ajuda
```javascript
trackHelp()                           // Mostra todas as funções disponíveis
```

## 🔧 Remoção segura

Este sistema é completamente opcional. Para remover:

1. Delete a pasta `src/debug/`
2. Remova o import em `src/index.js`:
   ```javascript
   // Remova esta linha:
   import "./debug/TrackDebug.js";
   ```

O jogo continuará funcionando normalmente sem o sistema de debug.

## 🚀 Próximos passos

Este sistema pode ser expandido para:
- Algoritmos de geração procedural (Perlin Noise)
- Diferentes tipos de pista (ovais, em forma de 8, etc.)
- Salvamento/carregamento de pistas
- Editor visual de pistas 