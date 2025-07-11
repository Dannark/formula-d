import { Dice } from "../components/Dice.js";
import { Player } from "../components/Player.js";
import { Track } from "../components/Track.js";

export class DiceSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.isRolling = false;
    this.setupEventListeners();
    this.entities = null; // Armazena referência às entidades
  }

  setupEventListeners() {
    // Escuta por cliques no canvas ou tecla de espaço para rolar o dado
    this.canvas.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !this.isRolling) {
        this.rollDice();
      }
    });

    // Permite que o canvas receba eventos de teclado
    this.canvas.setAttribute("tabindex", "0");
    this.canvas.focus();
  }

  update(deltaTime, entities) {
    // Armazena referência às entidades para uso no rollDice
    this.entities = entities;
    
    // System Update - poderia ser usado para animações futuras
    for (const entity of entities) {
      if (entity.hasComponent(Dice)) {
        const dice = entity.getComponent(Dice);
        
        // Atualiza estado do dado se necessário
        if (dice.isRolling) {
          // Aqui poderia ter lógica de animação
          // Por agora, apenas marca como não está mais rolando
          dice.isRolling = false;
        }
      }
    }
  }

  rollDice() {
    if (this.isRolling || !this.entities) return;
    
    this.isRolling = true;
    
    // Usa a função window.rollDice para rolar o dado
    let diceResult;
    if (typeof window.rollDice === "function") {
      diceResult = window.rollDice();
    } else {
      // Fallback caso a função não esteja disponível
      diceResult = Math.floor(Math.random() * 6) + 1;
      console.warn("window.rollDice não está disponível, usando Math.random como fallback");
    }
    
    console.log(`🎲 Dado rolado: ${diceResult}`);
    
    // Atualiza o dado
    for (const entity of this.entities) {
      if (entity.hasComponent(Dice)) {
        const dice = entity.getComponent(Dice);
        dice.currentValue = diceResult;
        dice.lastRollTime = Date.now();
        break;
      }
    }
    
    // Move o jogador baseado no resultado do dado
    this.movePlayer(diceResult);
    
    this.isRolling = false;
  }

  movePlayer(steps) {
    // Encontra a entidade Track para obter o número correto de células
    let trackEntity = null;
    for (const entity of this.entities) {
      if (entity.hasComponent(Track)) {
        trackEntity = entity;
        break;
      }
    }
    
    if (!trackEntity) {
      console.warn("Entidade Track não encontrada para movimento");
      return;
    }
    
    const track = trackEntity.getComponent(Track);
    
    // Encontra o primeiro jogador (pode ser expandido para múltiplos jogadores)
    for (const entity of this.entities) {
      if (entity.hasComponent(Player)) {
        const player = entity.getComponent(Player);
        
        console.log(`🏃 Movendo jogador ${player.playerId} por ${steps} células`);
        console.log(`Posição anterior: célula ${player.cellIndex} (${player.cellType})`);
        
        // Obtém o número correto de células da faixa atual
        const cells = track.trackCells[player.cellType];
        const totalCells = cells.length;
        
        if (totalCells === 0) {
          console.warn(`Nenhuma célula encontrada na faixa ${player.cellType}`);
          return;
        }
        
        // Move o jogador na pista circular usando o número correto de células
        player.cellIndex = (player.cellIndex + steps) % totalCells;
        
        // Atualiza a direção do jogador baseada no ângulo da curva da célula
        const newCell = cells[player.cellIndex];
        if (newCell && newCell.curveAngle !== undefined) {
          player.direction = newCell.curveAngle;
          console.log(`🧭 Direção atualizada para: ${(player.direction * 180 / Math.PI).toFixed(1)}°`);
        } else {
          console.warn(`Célula ${player.cellIndex} não tem ângulo de curva definido`);
        }
        
        console.log(`Nova posição: célula ${player.cellIndex} (${player.cellType}) - Total de células: ${totalCells}`);
        
        // Para múltiplos jogadores, remover o break
        break;
      }
    }
  }
} 