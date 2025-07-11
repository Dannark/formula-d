export class Player {
  constructor(cellIndex = 0, cellType = "inner", direction = 0, color = "#FF0000", playerId = 1) {
    this.cellIndex = cellIndex;     // Índice da célula na pista (0 a n)
    this.cellType = cellType;       // Tipo da célula ('inner', 'middle', 'outer')
    this.direction = direction;     // Direção em radianos (0 = direita, π/2 = baixo, π = esquerda, 3π/2 = cima)
    this.color = color;             // Cor do jogador
    this.playerId = playerId;       // ID único do jogador
    this.size = 24;                 // Tamanho do triângulo (aumentado de 8 para 12)
    this.directionInitialized = false; // Flag para controlar se a direção foi inicializada
  }
}
