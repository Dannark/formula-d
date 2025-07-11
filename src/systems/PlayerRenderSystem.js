import { Player } from "../components/Player.js";
import { Track } from "../components/Track.js";

export class PlayerRenderSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.trackEntity = null;
  }

  update(deltaTime, entities) {
    // Encontra a entidade da pista para acessar as células
    if (!this.trackEntity) {
      for (const entity of entities) {
        if (entity.hasComponent(Track)) {
          this.trackEntity = entity;
          break;
        }
      }
    }

    // Renderiza todos os jogadores
    // Nota: A transformação da câmera já foi aplicada pelo RenderSystem principal
    for (const entity of entities) {
      if (entity.hasComponent(Player)) {
        this.renderPlayer(entity);
      }
    }
  }

  renderPlayer(entity) {
    const player = entity.getComponent(Player);
    
    if (!this.trackEntity) {
      console.warn("Pista não encontrada para renderizar jogador");
      return;
    }
    
    const track = this.trackEntity.getComponent(Track);
    
    // Busca a célula específica onde o jogador está
    const cells = track.trackCells[player.cellType];
    if (!cells || cells.length === 0) {
      console.warn(`Células do tipo ${player.cellType} não encontradas ou ainda não inicializadas`);
      return;
    }
    
    const cell = cells[player.cellIndex];
    if (!cell) {
      console.warn(`Célula ${player.cellIndex} do tipo ${player.cellType} não encontrada`);
      return;
    }
    
    // Inicializa a direção do jogador se ainda não foi inicializada
    if (!player.directionInitialized && cell.curveAngle !== undefined) {
      player.direction = cell.curveAngle;
      player.directionInitialized = true;
      console.log(`🧭 Direção inicial do jogador: ${(player.direction * 180 / Math.PI).toFixed(1)}°`);
    }
    
    // Verifica se a célula tem coordenadas válidas
    if (!cell.centerX || !cell.centerY || cell.centerX === 0 || cell.centerY === 0) {
      console.warn(`Célula ${player.cellIndex} do tipo ${player.cellType} ainda não tem coordenadas válidas`);
      return;
    }
    
    // Usa as coordenadas reais da célula da pista
    const worldX = cell.centerX;
    const worldY = cell.centerY;
    
    // Salva o estado atual do contexto
    this.ctx.save();
    
    // Move para a posição do jogador
    this.ctx.translate(worldX, worldY);
    
    // Rotaciona para a direção do jogador
    this.ctx.rotate(player.direction);
    
    // Desenha o triângulo (apontando para a direita por padrão)
    this.ctx.fillStyle = player.color;
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(player.size, 0);              // Ponta do triângulo
    this.ctx.lineTo(-player.size/2, -player.size/2); // Canto inferior esquerdo
    this.ctx.lineTo(-player.size/2, player.size/2);  // Canto superior esquerdo
    this.ctx.closePath();
    
    this.ctx.fill();
    this.ctx.stroke();
    
    // Restaura o estado do contexto
    this.ctx.restore();
  }
}
