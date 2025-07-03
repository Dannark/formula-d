import { Grid } from "../components/Grid.js";

export class GridRenderSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  update(deltaTime, entities) {
    for (const entity of entities) {
      const grid = entity.getComponent(Grid);
      if (!grid) continue;

      // Desenha os pontos da grid
      for (let x = 0; x < this.canvas.width; x += grid.spacing) {
        for (let y = 0; y < this.canvas.height; y += grid.spacing) {
          this.ctx.fillStyle = grid.color;
          this.ctx.beginPath();
          this.ctx.arc(x, y, grid.dotSize, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }
}
