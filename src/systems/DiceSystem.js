import { Dice } from "../components/Dice.js";
import { Player } from "../components/Player.js";
import { Track } from "../components/Track.js";

export class DiceSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.isRolling = false;
    this.setupEventListeners();
    this.entities = null; // Armazena referência às entidades
    this.currentPlayerTurn = 1; // Controla qual jogador está ativo (1 ou 2)
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
    
    // Inicializa o turno atual no componente Dice na primeira execução
    if (this.entities && this.currentPlayerTurn === 1) {
      this.updateDicePlayerTurn();
    }
    
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
    
    console.log(`🎲 Dado rolado: ${diceResult} - Turno do Jogador ${this.currentPlayerTurn}`);
    
    // Atualiza o dado
    for (const entity of this.entities) {
      if (entity.hasComponent(Dice)) {
        const dice = entity.getComponent(Dice);
        dice.currentValue = diceResult;
        dice.lastRollTime = Date.now();
        break;
      }
    }
    
    // Move o jogador ativo baseado no resultado do dado
    this.movePlayer(diceResult);
    
    // Alterna para o próximo jogador
    this.nextPlayerTurn();
    
    this.isRolling = false;
  }

  nextPlayerTurn() {
    // Conta quantos jogadores existem
    const playerCount = this.getPlayerCount();
    
    if (playerCount > 1) {
      // Alterna entre os jogadores (1 -> 2 -> 1 -> 2...)
      this.currentPlayerTurn = (this.currentPlayerTurn % playerCount) + 1;
      console.log(`🔄 Próximo turno: Jogador ${this.currentPlayerTurn}`);
      
      // Atualiza o componente Dice com o turno atual
      this.updateDicePlayerTurn();
    }
  }

  updateDicePlayerTurn() {
    // Atualiza o componente Dice com o turno atual para sincronização
    for (const entity of this.entities) {
      if (entity.hasComponent(Dice)) {
        const dice = entity.getComponent(Dice);
        dice.currentPlayerTurn = this.currentPlayerTurn;
        break;
      }
    }
  }

  getPlayerCount() {
    let count = 0;
    for (const entity of this.entities) {
      if (entity.hasComponent(Player)) {
        count++;
      }
    }
    return count;
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
    
    // Encontra o jogador ativo baseado no turno atual
    let activePlayer = null;
    let activePlayerEntity = null;
    
    for (const entity of this.entities) {
      if (entity.hasComponent(Player)) {
        const player = entity.getComponent(Player);
        if (player.playerId === this.currentPlayerTurn) {
          activePlayer = player;
          activePlayerEntity = entity;
          break;
        }
      }
    }
    
    if (!activePlayer) {
      console.warn(`Jogador ${this.currentPlayerTurn} não encontrado`);
      return;
    }
    
    console.log(`🏃 Movendo jogador ${activePlayer.playerId} por ${steps} células`);
    console.log(`Posição anterior: célula ${activePlayer.cellIndex} (${activePlayer.cellType})`);
    
    // Obtém o número correto de células da faixa atual
    const cells = track.trackCells[activePlayer.cellType];
    const totalCells = cells.length;
    
    if (totalCells === 0) {
      console.warn(`Nenhuma célula encontrada na faixa ${activePlayer.cellType}`);
      return;
    }
    
    // Move o jogador na pista circular usando o número correto de células
    activePlayer.cellIndex = (activePlayer.cellIndex + steps) % totalCells;
    
    // Atualiza a direção do jogador baseada no ângulo da curva da célula
    const newCell = cells[activePlayer.cellIndex];
    if (newCell && newCell.curveAngle !== undefined) {
      activePlayer.direction = newCell.curveAngle;
      console.log(`🧭 Direção atualizada para: ${(activePlayer.direction * 180 / Math.PI).toFixed(1)}°`);
    } else {
      console.warn(`Célula ${activePlayer.cellIndex} não tem ângulo de curva definido`);
    }
    
    console.log(`Nova posição: célula ${activePlayer.cellIndex} (${activePlayer.cellType}) - Total de células: ${totalCells}`);
  }
} 