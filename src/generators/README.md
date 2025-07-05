# Sistema de Geradores de Pistas Formula-D

## Visão Geral

O sistema de geração de pistas foi refatorado para uma arquitetura modular que separa diferentes algoritmos de geração. Isso permite maior flexibilidade, manutenibilidade e facilita a adição de novos tipos de geradores.

## Arquitetura Modular

### Arquivos Principais

- **`TrackGenerator.js`** - Classe principal que orquestra os geradores
- **`DirectionalGenerator.js`** - Gerador inteligente baseado em navegação direcional (NOVO)
- **`PerlinNoiseGenerator.js`** - Geradores baseados em ruído Perlin (legado)

### Benefícios da Modularização

1. **Separação de Responsabilidades**: Cada gerador é responsável por um tipo específico de algoritmo
2. **Reutilização**: Geradores podem ser usados independentemente
3. **Testes**: Cada gerador pode ser testado isoladamente
4. **Manutenção**: Mudanças em um gerador não afetam outros
5. **Extensibilidade**: Novos geradores podem ser adicionados facilmente

## DirectionalGenerator (NOVO)

### Conceito

O gerador direcional simula como uma pista real seria desenhada, usando decisões direcionais inteligentes:

1. **Início**: Começa em uma direção (geralmente para a direita)
2. **Decisões**: A cada passo, decide entre:
   - Continuar reto (maior probabilidade)
   - Virar 45° à esquerda
   - Virar 45° à direita
3. **Fase de Retorno**: Após 60% dos passos, aumenta probabilidade de retornar ao início
4. **Prevenção de Cruzamentos**: Evita que a pista se cruze
5. **Fechamento Inteligente**: Detecta quando pode fechar o circuito

### Parâmetros

```javascript
{
  stepSize: 40,              // Tamanho de cada passo (pixels)
  maxSteps: 50,              // Número máximo de passos
  turnAngle: Math.PI / 4,    // Ângulo de curva (45°)
  returnPhaseRatio: 0.6,     // Quando começar a retornar (60% dos passos)
  minCircuitDistance: 60,    // Distância mínima para fechar circuito
  clockwise: true,           // Direção horária (true) ou anti-horária (false)
  maxDistanceFromCenter: 0.7 // Máximo 70% da tela do centro (0.9 = 90%)
}
```

### Algoritmo de Pontuação

O gerador avalia pistas baseado em:
- **Número de pontos** (mais pontos = melhor)
- **Variação angular** (recompensa curvas moderadas)
- **Fechamento do circuito** (bônus se fechou bem)

### Vantagens

- **Realismo**: Produz pistas mais parecidas com circuitos reais
- **Controle**: Parâmetros intuitivos para ajustar o comportamento
- **Qualidade**: Sistema de pontuação para avaliar resultados
- **Eficiência**: Menos tentativas necessárias para gerar pistas válidas
- **Direção Natural**: Pistas horária por padrão (como a maioria dos circuitos reais)

## PerlinNoiseGenerator (Legado)

### Conceito

Usa ruído Perlin para criar perturbações orgânicas em formas geométricas básicas:

- **Orgânico**: Círculo com perturbações
- **Oval**: Elipse com variações
- **Figura-8**: Lemniscata com ruído
- **Complexo**: Múltiplas seções com diferentes características

### Limitações

- **Artificialidade**: Pistas podem parecer muito "matemáticas"
- **Cruzamentos**: Maior probabilidade de gerar auto-interseções
- **Previsibilidade**: Padrões tendem a ser regulares

## TrackGenerator (Interface Principal)

### Métodos Principais

#### Novos Geradores
- `generateDirectionalTrack(options)` - Pista direcional inteligente
- `generateBestTrack(options)` - Testa múltiplos geradores, escolhe o melhor
- `generateRandomTrack(options)` - Escolhe tipo aleatório (inclui direcional)

#### Geradores Perlin (Legado)
- `generateOrganicCircuit(options)` - Círculo com Perlin Noise
- `generateOrganicOval(options)` - Oval com perturbações
- `generateOrganicFigureEight(options)` - Figura-8 com ruído
- `generateComplexCircuit(options)` - Pista complexa

#### Utilitários
- `hasIntersections(points)` - Verifica cruzamentos
- `generateSafeTrack(type, options)` - Gera pista sem cruzamentos
- `scoreTrack(track)` - Avalia qualidade da pista

## Uso Recomendado

### Para Pistas Realistas
```javascript
// Pista direcional horária (recomendado)
generateDirectionalTrack({ stepSize: 45, maxSteps: 35 });

// Pista direcional anti-horária
generateDirectionalTrack({ stepSize: 45, maxSteps: 35, clockwise: false });

// Pista direcional com limite estendido (permite ir mais longe do centro)
generateDirectionalTrack({ stepSize: 45, maxSteps: 35, maxDistanceFromCenter: 0.9 });

// Melhor pista possível
generateBestTrack({ preferDirectional: true });
```

### Para Pistas Experimentais
```javascript
// Pista orgânica
generateOrganicTrack({ noiseAmplitude: 0.4 });

// Pista figura-8
generateFigureEightTrack({ numPoints: 28 });
```

### Para Testes
```javascript
// Pista completamente aleatória
generateRandomTrack();

// Pista circular simples
generateSimpleCircle({ numPoints: 12 });
```

## Desenvolvimento Futuro

### Geradores Planejados
1. **CityCircuitGenerator** - Pistas baseadas em ruas urbanas
2. **NaturalTerrainGenerator** - Pistas que seguem topografia natural
3. **SpeedwayGenerator** - Pistas especializadas para alta velocidade
4. **RallyGenerator** - Pistas off-road com obstáculos

### Melhorias Possíveis
1. **Configuração Visual** - Interface gráfica para ajustar parâmetros
2. **Presets** - Configurações predefinidas para diferentes tipos de corrida
3. **Análise de Trafegabilidade** - Avaliar se a pista é boa para corridas
4. **Exportação** - Salvar/carregar configurações de pistas

## Integração com o Sistema

### Console Debug
Todas as funções estão disponíveis no console do navegador:
```javascript
generateDirectionalTrack()
generateBestTrack()
generateRandomTrack()
trackHelp() // Mostra ajuda completa
```

### ECS Integration
O sistema se integra perfeitamente com o ECS:
- Atualiza automaticamente a entidade da pista
- Mantém sincronização com o componente Track
- Suporta arrastar pontos após geração

## Considerações Técnicas

### Performance
- Geradores são otimizados para execução em tempo real
- Sistemas de cache interno para evitar recálculos
- Detecção de intersecção otimizada

### Compatibilidade
- Todas as pistas são compatíveis com o sistema de renderização existente
- Suporta redimensionamento de janela
- Funciona com sistema de cores unificado

### Extensibilidade
- Interface padronizada para novos geradores
- Configurações flexíveis via objetos de opções
- Sistema de pontuação extensível 