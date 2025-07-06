# Algoritmos de Geração de Pistas

Este projeto implementa múltiplos algoritmos para geração de pistas de corrida, cada um com suas vantagens e casos de uso específicos.

## 🧠 Algoritmos Disponíveis

### 1. **DirectionalGenerator** (Seu Algoritmo Original - Melhorado)
**Abordagem**: Navegação direcional com exploração e retorno
- **Estratégia**: Fase de exploração + fase de retorno ao ponto inicial
- **Detecção de Colisão**: Agora com sistema avançado considerando largura da pista
- **Vantagens**: 
  - Pistas dinâmicas e imprevisíveis
  - Controle fino sobre direções e ângulos
  - Bom para pistas longas e complexas
- **Desvantagens**: 
  - Pode ainda ter problemas de "caracol" em casos extremos
  - Computacionalmente mais pesado
  - Requer ajuste fino de parâmetros

### 2. **SkeletonTrackGenerator** (NOVA - Recomendado)
**Abordagem**: Gera esqueleto da pista e depois expande
- **Estratégia**: Criar linha central + interpolação + validação
- **Detecção de Colisão**: Evita colisões por design
- **Vantagens**:
  - ✅ **Elimina auto-intersecções por design**
  - ✅ **Melhor controle sobre forma da pista**
  - ✅ **Performance superior**
  - ✅ **Pistas mais consistentes**
  - ✅ **Presets para diferentes tipos de pista**
- **Desvantagens**:
  - Menos aleatoriedade que o algoritmo direcional
  - Pistas podem ser mais "previsíveis"

### 3. **PerlinNoiseGenerator** (Legado)
**Abordagem**: Baseado em ruído Perlin para formas orgânicas
- **Estratégia**: Formas matemáticas + perturbações orgânicas
- **Vantagens**: 
  - Formas muito orgânicas
  - Previsível (sem surpresas)
  - Rápido
- **Desvantagens**:
  - Limitado a formas pré-definidas
  - Menos dinâmico

## 🎯 Recomendações

### **Para Produção: SkeletonTrackGenerator**
```javascript
const generator = new TrackGenerator();
const track = generator.generateBestSkeletonTrack({
  segments: 12,
  complexity: 0.5,
  pointDensity: 100
});
```

**Por quê?**
- Resolve seus problemas de auto-intersecção
- Mais confiável e previsível
- Boa performance
- Fácil de ajustar

### **Para Experimentação: DirectionalGenerator (Melhorado)**
```javascript
const generator = new TrackGenerator();
const track = generator.generateSafeDirectionalTrack({
  explorationSteps: 10,
  stepSize: 100,
  leftTurnAngleRange: { min: 20 * Math.PI / 180, max: 35 * Math.PI / 180 },
  rightTurnAngleRange: { min: 30 * Math.PI / 180, max: 65 * Math.PI / 180 }
});
```

**Por quê?**
- Agora com detecção de colisão melhorada
- Mais dinâmico e imprevisível
- Seu conceito original, mas muito melhorado

## 🚀 Melhorias Implementadas

### **Detecção de Colisão Avançada**
Seu algoritmo original agora usa:
- **Colisão por corredor**: Considera largura da pista
- **Distância ponto-a-segmento**: Mais precisa que distância ponto-a-ponto
- **Intersecção de corredores**: Verifica se os "tubos" da pista se cruzam
- **Otimização espacial**: Só verifica segmentos próximos

### **Novos Métodos**
- `wouldCauseCorridorCollision()`: Considera largura da pista
- `wouldCauseSmartCollision()`: Otimizada com grid espacial
- `pointToSegmentDistance()`: Distância precisa a segmentos
- `corridorsIntersect()`: Verifica intersecção de corredores

## 🔧 Como Usar

### **Automático (Recomendado)**
```javascript
const generator = new TrackGenerator();
const track = generator.generateBestTrack({
  preferSkeleton: true,  // Prioriza skeleton
  maxAttempts: 3
});
```

### **Com Critérios Específicos**
```javascript
const track = generator.generateQualityTrack({
  minLength: 12,
  maxLength: 20,
  minComplexity: 0.3,
  maxComplexity: 0.6,
  preferredAlgorithm: 'skeleton'
});
```

### **Direto por Algoritmo**
```javascript
// Skeleton (Recomendado)
const track = generator.generatePresetSkeletonTrack('balanced');

// Seu algoritmo melhorado
const track = generator.generateSafeDirectionalTrack({
  explorationSteps: 12,
  stepSize: 100
});
```

## 📊 Comparação de Performance

| Algoritmo | Colisões | Performance | Qualidade | Variabilidade |
|-----------|----------|-------------|-----------|---------------|
| **Skeleton** | ✅ Excelente | ✅ Rápido | ✅ Alta | 🟡 Média |
| **Direcional** | 🟡 Melhorado | 🟡 Médio | ✅ Alta | ✅ Excelente |
| **Perlin** | ✅ Boa | ✅ Rápido | 🟡 Média | 🟡 Média |

## 🎮 Testando os Algoritmos

Para testar diferentes algoritmos, use:

```javascript
// No seu código
const generator = new TrackGenerator();

// Teste skeleton
trackConfig.points = generator.generatePresetSkeletonTrack('balanced');

// Teste direcional melhorado
trackConfig.points = generator.generateSafeDirectionalTrack({
  explorationSteps: 10,
  stepSize: 100
});

// Teste automático
trackConfig.points = generator.generateBestTrack();
```

## 🔄 Próximos Passos

1. **Teste o SkeletonTrackGenerator** - Deve resolver seus problemas de auto-intersecção
2. **Compare com seu algoritmo melhorado** - Agora com detecção de colisão avançada
3. **Ajuste parâmetros** conforme necessário
4. **Considere híbridos** - Combinar skeleton com elementos direcionais

## 🤔 Qual Usar?

- **Para resolver o problema atual**: **SkeletonTrackGenerator**
- **Para manter sua abordagem original**: **DirectionalGenerator melhorado**
- **Para máxima confiabilidade**: **PerlinNoiseGenerator**
- **Para deixar o sistema decidir**: **generateBestTrack()** 