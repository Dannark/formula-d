import { Player } from "../components/Player.js";
import { Track } from "../components/Track.js";
import { Dice } from "../components/Dice.js"; // Added Dice import

export class PlayerRenderSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.trackEntity = null;
    this.currentPlayerTurn = 1; // Sincroniza com o DiceSystem
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

    // Atualiza o turno atual procurando pelo DiceSystem
    this.updateCurrentPlayerTurn(entities);

    // Renderiza todos os jogadores
    // Nota: A transformação da câmera já foi aplicada pelo RenderSystem principal
    for (const entity of entities) {
      if (entity.hasComponent(Player)) {
        this.renderPlayer(entity);
      }
    }
    
    // Renderiza o indicador de turno
    this.renderTurnIndicator();
  }

  updateCurrentPlayerTurn(entities) {
    // Procura pelo componente Dice para sincronizar o turno atual
    for (const entity of entities) {
      if (entity.hasComponent(Dice)) {
        const dice = entity.getComponent(Dice);
        this.currentPlayerTurn = dice.currentPlayerTurn;
        break;
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
      console.log(`🧭 Direção inicial do jogador ${player.playerId}: ${(player.direction * 180 / Math.PI).toFixed(1)}°`);
    }
    
    // Verifica se a célula tem coordenadas válidas
    if (!cell.centerX || !cell.centerY || cell.centerX === 0 || cell.centerY === 0) {
      console.warn(`Célula ${player.cellIndex} do tipo ${player.cellType} ainda não tem coordenadas válidas`);
      return;
    }
    
    // Usa as coordenadas reais da célula da pista
    const worldX = cell.centerX;
    const worldY = cell.centerY;
    
    // Determina se este jogador está ativo
    const isActivePlayer = player.playerId === this.currentPlayerTurn;
    
    // Salva o estado atual do contexto
    this.ctx.save();
    
    // Move para a posição do jogador
    this.ctx.translate(worldX, worldY);
    
    // Rotaciona para a direção do jogador
    this.ctx.rotate(player.direction);
    
    // Desenha o triângulo (apontando para a direita por padrão)
    this.ctx.fillStyle = player.color;
    this.ctx.strokeStyle = isActivePlayer ? "#FFD700" : "#000000"; // Dourado para jogador ativo
    this.ctx.lineWidth = isActivePlayer ? 4 : 2; // Borda mais grossa para jogador ativo
    
    this.ctx.beginPath();
    this.ctx.moveTo(player.size, 0);              // Ponta do triângulo
    this.ctx.lineTo(-player.size/2, -player.size/2); // Canto inferior esquerdo
    this.ctx.lineTo(-player.size/2, player.size/2);  // Canto superior esquerdo
    this.ctx.closePath();
    
    this.ctx.fill();
    this.ctx.stroke();
    
    // Desenha um halo dourado ao redor do jogador ativo
    if (isActivePlayer) {
      this.ctx.strokeStyle = "#FFD700";
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]); // Linha pontilhada
      this.ctx.beginPath();
      this.ctx.arc(0, 0, player.size + 8, 0, 2 * Math.PI);
      this.ctx.stroke();
      this.ctx.setLineDash([]); // Restaura linha sólida
    }
    
    // Restaura o estado do contexto
    this.ctx.restore();
  }

  renderTurnIndicator() {
    // Salva o estado atual do contexto
    this.ctx.save();
    
    // Reseta as transformações para desenhar na posição fixa da tela
    this.ctx.resetTransform();
    
    // Posição do indicador (canto superior esquerdo)
    const x = 20;
    const y = 30;
    
    // Cor do jogador ativo
    const playerColor = this.currentPlayerTurn === 1 ? "#FF0000" : "#0000FF";
    
    // Desenha o fundo do indicador
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(x - 10, y - 25, 200, 40);
    
    // Desenha o texto do turno
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "16px Arial";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`Turno: Jogador ${this.currentPlayerTurn}`, x, y);
    
    // Desenha um pequeno triângulo da cor do jogador ativo
    this.ctx.fillStyle = playerColor;
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x + 160, y - 5);              // Ponta do triângulo
    this.ctx.lineTo(x + 150, y - 10);             // Canto inferior esquerdo
    this.ctx.lineTo(x + 150, y);                  // Canto superior esquerdo
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Restaura o estado do contexto
    this.ctx.restore();
  }
}
