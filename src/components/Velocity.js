export class Velocity {
  constructor(dx = 0, dy = 0, speed = 1) {
    this.dx = dx; // direção x (-1 para esquerda, 1 para direita)
    this.dy = dy; // direção y (-1 para cima, 1 para baixo)
    this.speed = speed; // velocidade em pixels por frame
  }
}
