import { Track } from "../components/Track.js";
import { Camera } from "../components/Camera.js";
import { Transform } from "../components/Transform.js";
import { TrackHelper } from "./track/TrackHelper.js";

export class CellInteractionSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.cameraEntity = null;
    this.trackEntity = null;
    this.isEnabled = true;
    
    console.log("🖱️ Sistema de interação com células inicializado");
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.addEventListener("click", (e) => {
      if (!this.isEnabled) return;
      
      this.handleCellClick(e);
    });
  }

  handleCellClick(e) {
    // Não faz nada se não temos entidades necessárias
    if (!this.trackEntity || !this.cameraEntity) {
      console.log("🚫 Entidades não encontradas:", { 
        trackEntity: !!this.trackEntity, 
        cameraEntity: !!this.cameraEntity 
      });
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Converte coordenadas da tela para coordenadas do mundo
    const worldCoords = this.screenToWorld(mouseX, mouseY);
    
    // Busca a célula mais próxima do clique
    const track = this.trackEntity.getComponent(Track);
    
    const cellInfo = TrackHelper.findNearestCell(
      track.trackCells, 
      worldCoords.x, 
      worldCoords.y, 
      50 // Distância máxima de 50 pixels
    );

    if (cellInfo) {
      this.logCellClick(cellInfo, worldCoords);
    } else {
      console.log("🖱️ Clique fora de qualquer célula");
    }
  }

  logCellClick(cellInfo, worldCoords) {
    const { cell, type, distance, exactMatch } = cellInfo;
    
    const matchType = exactMatch ? "🎯 CLIQUE EXATO" : "📍 CLIQUE PRÓXIMO";
    const matchIcon = exactMatch ? "🎯" : "📍";
    
    // Seleciona a célula clicada
    this.selectCell(type, cell.index);
    
    console.log(`${matchType} NA CÉLULA:`, {
      tipo: type.toUpperCase(),
      indice: cell.index,
      tipoMatch: exactMatch ? "Dentro da célula" : `Próximo (${Math.round(distance)}px)`,
      posicao: {
        centerX: Math.round(cell.centerX),
        centerY: Math.round(cell.centerY)
      },
      ocupacao: {
        ocupada: !TrackHelper.isCellFree(cell),
        ocupadaPor: cell.occupiedBy || "Livre"
      },
      curva: {
        anguloRadianos: cell.curveAngle?.toFixed(4),
        anguloGraus: cell.curveAngle ? TrackHelper.radiansToDegrees(cell.curveAngle).toFixed(2) + "°" : "N/A"
      },
      coordenadasDoClique: {
        x: Math.round(worldCoords.x),
        y: Math.round(worldCoords.y)
      }
    });

    // Log resumido mais limpo
    const status = cell.occupiedBy ? `Ocupada por jogador ${cell.occupiedBy}` : "Livre";
    const precision = exactMatch ? "EXATO" : "PRÓXIMO";
    console.log(`${matchIcon} Célula ${type} #${cell.index} (${status}) - ${precision} - ✨ SELECIONADA`);
  }

  // Seleciona uma célula específica
  selectCell(type, index) {
    if (!this.trackEntity) return;
    
    const track = this.trackEntity.getComponent(Track);
    const previousSelection = track.selectedCellId;
    
    // Atualiza a seleção
    track.selectedCellId = { type, index };
    
    // Log da mudança de seleção
    if (previousSelection) {
      console.log(`🔄 Seleção mudou: ${previousSelection.type}[${previousSelection.index}] → ${type}[${index}]`);
    } else {
      console.log(`✨ Primeira seleção: ${type}[${index}]`);
    }
  }

  // Desseleciona a célula atual
  deselectCell() {
    if (!this.trackEntity) return;
    
    const track = this.trackEntity.getComponent(Track);
    if (track.selectedCellId) {
      console.log(`❌ Desselecionando célula: ${track.selectedCellId.type}[${track.selectedCellId.index}]`);
      track.selectedCellId = null;
    }
  }

  // Verifica se uma célula está selecionada
  isCellSelected(type, index) {
    if (!this.trackEntity) return false;
    
    const track = this.trackEntity.getComponent(Track);
    return track.selectedCellId && 
           track.selectedCellId.type === type && 
           track.selectedCellId.index === index;
  }

  // Obtém a célula atualmente selecionada
  getSelectedCell() {
    if (!this.trackEntity) return null;
    
    const track = this.trackEntity.getComponent(Track);
    return track.selectedCellId;
  }

  screenToWorld(screenX, screenY) {
    // Se não há câmera, retorna coordenadas da tela
    if (!this.cameraEntity) {
      console.log("⚠️ Usando coordenadas da tela (sem câmera)");
      return { x: screenX, y: screenY };
    }

    const camera = this.cameraEntity.getComponent(Camera);
    const transform = this.cameraEntity.getComponent(Transform);
    
    // Se não conseguiu obter componentes da câmera, usa coordenadas da tela
    if (!camera || !transform) {
      console.log("⚠️ Usando coordenadas da tela (componentes não encontrados)");
      return { x: screenX, y: screenY };
    }

    // CORREÇÃO: Usa exatamente a mesma lógica do CameraControlSystem
    const worldX = (screenX / camera.zoom) + transform.x;
    const worldY = (screenY / camera.zoom) + transform.y;

    return { x: worldX, y: worldY };
  }

  update(deltaTime, entities) {
    // Encontra as entidades necessárias
    for (const entity of entities) {
      if (entity.hasComponent(Track) && !this.trackEntity) {
        this.trackEntity = entity;
        console.log("🎯 Entidade da pista encontrada pelo sistema de interação");
      }
      
      if (entity.hasComponent(Camera) && !this.cameraEntity) {
        this.cameraEntity = entity;
        console.log("📷 Entidade da câmera encontrada pelo sistema de interação");
      }
    }
  }

  // Habilita/desabilita o sistema
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🖱️ Sistema de interação com células ${enabled ? 'habilitado' : 'desabilitado'}`);
  }

  // Obtém informações da célula em uma posição específica
  getCellAtPosition(x, y, maxDistance = 50) {
    if (!this.trackEntity) return null;
    
    const track = this.trackEntity.getComponent(Track);
    return TrackHelper.findNearestCell(track.trackCells, x, y, maxDistance);
  }
} 