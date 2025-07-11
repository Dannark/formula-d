import { Track } from "../../components/Track.js";
import { BaseTrackRenderer } from "./BaseTrackRenderer.js";
import { InnerBoundaryRenderer } from "./InnerBoundaryRenderer.js";
import { MiddleBoundaryRenderer } from "./MiddleBoundaryRenderer.js";
import { OuterBoundaryRenderer } from "./OuterBoundaryRenderer.js";
import { TrackHelper } from "./TrackHelper.js";
import { trackColorConfig } from "../../config/TrackColorConfig.js";

export class TrackRenderSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.baseTrackRenderer = new BaseTrackRenderer(this.ctx);
    this.innerBoundaryRenderer = new InnerBoundaryRenderer(this.ctx, 60);
    this.middleBoundaryRenderer = new MiddleBoundaryRenderer(this.ctx, 60);
    this.outerBoundaryRenderer = new OuterBoundaryRenderer(this.ctx, 60);
    
    // Exposição da configuração global de cores
    this.colorConfig = trackColorConfig;
  }

  update(deltaTime, entities) {
    for (const entity of entities) {
      if (entity.hasComponent(Track)) {
        const track = entity.getComponent(Track);
        this.renderTrack(track);
      }
    }
  }

  renderTrack(track) {
    const points = track.points;
    const selectedCellId = track.selectedCellId; // Obtém informações da célula selecionada

    // Inicializa os dados das células se ainda não existirem ou se o número de pontos mudou
    if (!track.trackCells.inner.length || track.trackCells.inner.length !== points.length) {
      track.trackCells = TrackHelper.initializeTrackCells(points);
      console.log('Dados das células inicializados:', track.trackCells);
    }

    // Primeira passagem: calcula todos os pontos das fronteiras
    const innerPoints = this.innerBoundaryRenderer.calculatePerpendicularLinesEndPoints(points);
    const middlePoints = this.middleBoundaryRenderer.calculatePerpendicularLinesEndPoints(innerPoints);
    const outerPoints = this.outerBoundaryRenderer.calculatePerpendicularLinesEndPoints(middlePoints, innerPoints);

    // Desenha a linha base e extrai os dados das linhas centrais
    const baseRenderResult = this.baseTrackRenderer.render(points);
    const baseBoundaryLinesData = baseRenderResult.boundaryLinesData || [];

    // Desenha a primeira faixa (entre linha central e inner boundary)
    const innerRenderResult = this.innerBoundaryRenderer.render(points, innerPoints, baseBoundaryLinesData, selectedCellId);
    const innerBoundaryLinesData = innerRenderResult.boundaryLinesData || [];

    // Atualiza os dados das células da faixa inner usando os pontos reais das boundaries
    this.updateInnerCellsData(track.trackCells.inner, points, innerPoints);

    // Desenha a segunda faixa (entre inner boundary e middle boundary)
    const middleRenderResult = this.middleBoundaryRenderer.render(innerPoints, middlePoints, innerBoundaryLinesData, selectedCellId);

    // Atualiza os dados das células da faixa middle usando os pontos reais das boundaries
    this.updateMiddleCellsData(track.trackCells.middle, innerPoints, middlePoints);

    // Desenha a terceira faixa (entre middle boundary e outer boundary)
    const outerResult = this.outerBoundaryRenderer.render(middlePoints, innerPoints, outerPoints, middleRenderResult.boundaryLinesData, selectedCellId);

    // Atualiza os dados das células da faixa outer usando os pontos reais das boundaries
    this.updateOuterCellsData(track.trackCells.outer, middlePoints, outerPoints);
  }

  // Atualiza os dados das células da faixa inner (azul) usando boundaries reais
  updateInnerCellsData(innerCells, basePoints, innerPoints) {
    const numPoints = basePoints.length;
    
    for (let i = 0; i < numPoints; i++) {
      const currentPoint = basePoints[i];
      const nextPoint = basePoints[(i + 1) % numPoints];
      const prevPoint = basePoints[(i - 1 + numPoints) % numPoints];
      const nextNextPoint = basePoints[(i + 2) % numPoints];
      
      // Calcula os pontos de controle para a curva
      const controlPoints = TrackHelper.calculateControlPoints(currentPoint, nextPoint, prevPoint, nextNextPoint);
      
      // Calcula o ponto médio da curva (centro da célula)
      const midPoint = TrackHelper.calculateBezierPoint(currentPoint, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      // Calcula a tangente no ponto médio
      const tangent = TrackHelper.calculateBezierTangent(currentPoint, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      // Calcula o vetor perpendicular à tangente (direção para fora da pista)
      const perpendicular = {
        x: -tangent.y,
        y: tangent.x
      };
      
      // Posiciona o centro da célula azul
      const offset = 30; // Metade da largura da célula (60/2)
      const centerX = midPoint.x + perpendicular.x * offset;
      const centerY = midPoint.y + perpendicular.y * offset;
      
      // Calcula o ângulo da curva
      const curveAngle = TrackHelper.calculateCurveAngle(currentPoint, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      // Constrói o polígono real da célula usando as boundaries calculadas
      const cellPolygon = this.buildInnerCellPolygon(basePoints, innerPoints, i);
      
      // Atualiza os dados da célula com o shape real
      TrackHelper.updateCellDataWithBounds(innerCells[i], centerX, centerY, curveAngle, cellPolygon);
    }
  }

  // Atualiza os dados das células da faixa middle (verde) usando boundaries reais
  updateMiddleCellsData(middleCells, innerPoints, middlePoints) {
    const numPoints = innerPoints.length;
    
    for (let i = 0; i < numPoints; i++) {
      const currentPoint = innerPoints[i];
      const nextPoint = innerPoints[(i + 1) % numPoints];
      const prevPoint = innerPoints[(i - 1 + numPoints) % numPoints];
      const nextNextPoint = innerPoints[(i + 2) % numPoints];
      
      // Calcula os pontos de controle para a curva
      const controlPoints = TrackHelper.calculateControlPoints(currentPoint, nextPoint, prevPoint, nextNextPoint);
      
      // Calcula o ponto médio da curva (centro da célula)
      const midPoint = TrackHelper.calculateBezierPoint(currentPoint, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      // Calcula a tangente no ponto médio
      const tangent = TrackHelper.calculateBezierTangent(currentPoint, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      // Calcula o vetor perpendicular à tangente (direção para fora da pista)
      const perpendicular = {
        x: -tangent.y,
        y: tangent.x
      };
      
      // Posiciona o centro da célula verde
      const offset = 30; // Metade da largura da célula (60/2)
      const centerX = midPoint.x + perpendicular.x * offset;
      const centerY = midPoint.y + perpendicular.y * offset;
      
      // Calcula o ângulo da curva
      const curveAngle = TrackHelper.calculateCurveAngle(currentPoint, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      // Constrói o polígono real da célula usando as boundaries calculadas
      const cellPolygon = this.buildMiddleCellPolygon(innerPoints, middlePoints, i);
      
      // Atualiza os dados da célula com o shape real
      TrackHelper.updateCellDataWithBounds(middleCells[i], centerX, centerY, curveAngle, cellPolygon);
    }
  }

  // Atualiza os dados das células da faixa outer (rosa/amarela) usando boundaries reais
  updateOuterCellsData(outerCells, middlePoints, outerPoints) {
    const numPoints = middlePoints.length;
    
    for (let i = 0; i < numPoints; i++) {
      const currentPoint = middlePoints[i];
      const nextPoint = middlePoints[(i + 1) % numPoints];
      const prevPoint = middlePoints[(i - 1 + numPoints) % numPoints];
      const nextNextPoint = middlePoints[(i + 2) % numPoints];
      
      // Calcula os pontos de controle para a curva
      const controlPoints = TrackHelper.calculateControlPoints(currentPoint, nextPoint, prevPoint, nextNextPoint);
      
      // Calcula o ponto médio da curva (centro da célula)
      const midPoint = TrackHelper.calculateBezierPoint(currentPoint, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      // Calcula a tangente no ponto médio
      const tangent = TrackHelper.calculateBezierTangent(currentPoint, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      // Calcula o vetor perpendicular à tangente (direção para fora da pista)
      const perpendicular = {
        x: -tangent.y,
        y: tangent.x
      };
      
      // Posiciona o centro da célula outer
      const offset = 30; // Metade da largura da célula (60/2)
      const centerX = midPoint.x + perpendicular.x * offset;
      const centerY = midPoint.y + perpendicular.y * offset;
      
      // Calcula o ângulo da curva
      const curveAngle = TrackHelper.calculateCurveAngle(currentPoint, controlPoints.cp1, controlPoints.cp2, nextPoint, 0.5);
      
      // Constrói o polígono real da célula usando as boundaries calculadas
      const cellPolygon = this.buildOuterCellPolygon(middlePoints, outerPoints, i);
      
      // Atualiza os dados da célula com o shape real
      TrackHelper.updateCellDataWithBounds(outerCells[i], centerX, centerY, curveAngle, cellPolygon);
    }
  }

  // Constrói o polígono real da célula inner usando as boundaries da linha central e azul
  buildInnerCellPolygon(basePoints, innerPoints, cellIndex) {
    const polygon = [];
    const resolution = 10; // Número de pontos por curva
    
    // Pontos da linha central (boundary interna da célula)
    const currentBase = basePoints[cellIndex];
    const nextBase = basePoints[(cellIndex + 1) % basePoints.length];
    const prevBase = basePoints[(cellIndex - 1 + basePoints.length) % basePoints.length];
    const nextNextBase = basePoints[(cellIndex + 2) % basePoints.length];
    
    const baseControlPoints = TrackHelper.calculateControlPoints(currentBase, nextBase, prevBase, nextNextBase);
    
    // Adiciona pontos da linha central
    for (let i = 0; i <= resolution; i++) {
      const t = i / resolution;
      polygon.push(TrackHelper.calculateBezierPoint(currentBase, baseControlPoints.cp1, baseControlPoints.cp2, nextBase, t));
    }
    
    // Pontos da linha azul (boundary externa da célula)
    const currentInner = innerPoints[cellIndex];
    const nextInner = innerPoints[(cellIndex + 1) % innerPoints.length];
    const prevInner = innerPoints[(cellIndex - 1 + innerPoints.length) % innerPoints.length];
    const nextNextInner = innerPoints[(cellIndex + 2) % innerPoints.length];
    
    const innerControlPoints = TrackHelper.calculateControlPoints(currentInner, nextInner, prevInner, nextNextInner);
    
    // Adiciona pontos da linha azul (em ordem reversa para fechar o polígono)
    for (let i = resolution; i >= 0; i--) {
      const t = i / resolution;
      polygon.push(TrackHelper.calculateBezierPoint(currentInner, innerControlPoints.cp1, innerControlPoints.cp2, nextInner, t));
    }
    
    return polygon;
  }

  // Constrói o polígono real da célula middle usando as boundaries azul e roxa
  buildMiddleCellPolygon(innerPoints, middlePoints, cellIndex) {
    const polygon = [];
    const resolution = 15; // Número de pontos por curva (mesmo usado no renderer)
    
    // Para o efeito "brick/tijolo", precisamos das linhas azuis da célula atual e da próxima
    const currentCellIndex = cellIndex;
    const nextCellIndex = (cellIndex + 1) % innerPoints.length;
    
    // Calcula os pontos da linha azul da célula atual
    const currentInner = innerPoints[currentCellIndex];
    const nextInner = innerPoints[(currentCellIndex + 1) % innerPoints.length];
    const prevInner = innerPoints[(currentCellIndex - 1 + innerPoints.length) % innerPoints.length];
    const nextNextInner = innerPoints[(currentCellIndex + 2) % innerPoints.length];
    
    const currentInnerControlPoints = TrackHelper.calculateControlPoints(currentInner, nextInner, prevInner, nextNextInner);
    
    // Calcula pontos da linha azul da célula atual
    const currentCellBoundary = [];
    for (let i = 0; i <= resolution; i++) {
      const t = i / resolution;
      currentCellBoundary.push(TrackHelper.calculateBezierPoint(currentInner, currentInnerControlPoints.cp1, currentInnerControlPoints.cp2, nextInner, t));
    }
    
    // Calcula os pontos da linha azul da próxima célula
    const nextInnerPoint = innerPoints[nextCellIndex];
    const nextNextInnerPoint = innerPoints[(nextCellIndex + 1) % innerPoints.length];
    const nextPrevInnerPoint = innerPoints[(nextCellIndex - 1 + innerPoints.length) % innerPoints.length];
    const nextNextNextInnerPoint = innerPoints[(nextCellIndex + 2) % innerPoints.length];
    
    const nextInnerControlPoints = TrackHelper.calculateControlPoints(nextInnerPoint, nextNextInnerPoint, nextPrevInnerPoint, nextNextNextInnerPoint);
    
    // Calcula pontos da linha azul da próxima célula
    const nextCellBoundary = [];
    for (let i = 0; i <= resolution; i++) {
      const t = i / resolution;
      nextCellBoundary.push(TrackHelper.calculateBezierPoint(nextInnerPoint, nextInnerControlPoints.cp1, nextInnerControlPoints.cp2, nextNextInnerPoint, t));
    }
    
    // Aplica o efeito "brick/tijolo" - 50% de cada linha (lógica do MiddleBoundaryRenderer)
    const midPointCurrent = Math.floor(currentCellBoundary.length / 2);
    const midPointNext = Math.floor(nextCellBoundary.length / 2);
    
    // 1. Adiciona a segunda metade da linha azul da célula atual
    for (let i = midPointCurrent; i < currentCellBoundary.length; i++) {
      polygon.push(currentCellBoundary[i]);
    }
    
    // 2. Adiciona a primeira metade da linha azul da próxima célula
    for (let i = 0; i <= midPointNext; i++) {
      polygon.push(nextCellBoundary[i]);
    }
    
    // 3. Adiciona os pontos da linha roxa (boundary externa da célula)
    const currentMiddle = middlePoints[cellIndex];
    const nextMiddle = middlePoints[(cellIndex + 1) % middlePoints.length];
    const prevMiddle = middlePoints[(cellIndex - 1 + middlePoints.length) % middlePoints.length];
    const nextNextMiddle = middlePoints[(cellIndex + 2) % middlePoints.length];
    
    const middleControlPoints = TrackHelper.calculateControlPoints(currentMiddle, nextMiddle, prevMiddle, nextNextMiddle);
    
    // Calcula pontos da linha roxa
    const roxaCurvePoints = [];
    for (let i = 0; i <= resolution; i++) {
      const t = i / resolution;
      roxaCurvePoints.push(TrackHelper.calculateBezierPoint(currentMiddle, middleControlPoints.cp1, middleControlPoints.cp2, nextMiddle, t));
    }
    
    // 4. Adiciona pontos da linha roxa (em ordem reversa para fechar o polígono)
    for (let i = roxaCurvePoints.length - 1; i >= 0; i--) {
      polygon.push(roxaCurvePoints[i]);
    }
    
    return polygon;
  }

  // Constrói o polígono real da célula outer usando as boundaries roxa e externa
  buildOuterCellPolygon(middlePoints, outerPoints, cellIndex) {
    const polygon = [];
    const resolution = 15; // Número de pontos por curva (mesmo usado no renderer)
    
    // Para o efeito "brick/tijolo", precisamos das linhas roxas da célula atual e da próxima
    const currentCellIndex = cellIndex;
    const nextCellIndex = (cellIndex + 1) % middlePoints.length;
    
    // Calcula os pontos da linha roxa da célula atual
    const currentMiddle = middlePoints[currentCellIndex];
    const nextMiddle = middlePoints[(currentCellIndex + 1) % middlePoints.length];
    const prevMiddle = middlePoints[(currentCellIndex - 1 + middlePoints.length) % middlePoints.length];
    const nextNextMiddle = middlePoints[(currentCellIndex + 2) % middlePoints.length];
    
    const currentMiddleControlPoints = TrackHelper.calculateControlPoints(currentMiddle, nextMiddle, prevMiddle, nextNextMiddle);
    
    // Calcula pontos da linha roxa da célula atual
    const currentCellBoundary = [];
    for (let i = 0; i <= resolution; i++) {
      const t = i / resolution;
      currentCellBoundary.push(TrackHelper.calculateBezierPoint(currentMiddle, currentMiddleControlPoints.cp1, currentMiddleControlPoints.cp2, nextMiddle, t));
    }
    
    // Calcula os pontos da linha roxa da próxima célula
    const nextMiddlePoint = middlePoints[nextCellIndex];
    const nextNextMiddlePoint = middlePoints[(nextCellIndex + 1) % middlePoints.length];
    const nextPrevMiddlePoint = middlePoints[(nextCellIndex - 1 + middlePoints.length) % middlePoints.length];
    const nextNextNextMiddlePoint = middlePoints[(nextCellIndex + 2) % middlePoints.length];
    
    const nextMiddleControlPoints = TrackHelper.calculateControlPoints(nextMiddlePoint, nextNextMiddlePoint, nextPrevMiddlePoint, nextNextNextMiddlePoint);
    
    // Calcula pontos da linha roxa da próxima célula
    const nextCellBoundary = [];
    for (let i = 0; i <= resolution; i++) {
      const t = i / resolution;
      nextCellBoundary.push(TrackHelper.calculateBezierPoint(nextMiddlePoint, nextMiddleControlPoints.cp1, nextMiddleControlPoints.cp2, nextNextMiddlePoint, t));
    }
    
    // Aplica o efeito "brick/tijolo" - 50% de cada linha
    const midPointCurrent = Math.floor(currentCellBoundary.length / 2);
    const midPointNext = Math.floor(nextCellBoundary.length / 2);
    
    // 1. Adiciona a primeira metade da linha roxa da célula atual
    for (let i = midPointCurrent; i < currentCellBoundary.length; i++) {
      polygon.push(currentCellBoundary[i]);
    }
    
    // 2. Adiciona a segunda metade da linha roxa da próxima célula
    for (let i = 0; i <= midPointNext; i++) {
      polygon.push(nextCellBoundary[i]);
    }
    
    // 3. Adiciona os pontos da linha externa (boundary externa da célula)
    const currentOuter = outerPoints[cellIndex];
    const nextOuter = outerPoints[(cellIndex + 1) % outerPoints.length];
    const prevOuter = outerPoints[(cellIndex - 1 + outerPoints.length) % outerPoints.length];
    const nextNextOuter = outerPoints[(cellIndex + 2) % outerPoints.length];
    
    const outerControlPoints = TrackHelper.calculateControlPoints(currentOuter, nextOuter, prevOuter, nextNextOuter);
    
    // Calcula pontos da linha externa
    const outerCurvePoints = [];
    for (let i = 0; i <= resolution; i++) {
      const t = i / resolution;
      outerCurvePoints.push(TrackHelper.calculateBezierPoint(currentOuter, outerControlPoints.cp1, outerControlPoints.cp2, nextOuter, t));
    }
    
    // 4. Adiciona pontos da linha externa (em ordem reversa para fechar o polígono)
    for (let i = outerCurvePoints.length - 1; i >= 0; i--) {
      polygon.push(outerCurvePoints[i]);
    }
    
    return polygon;
  }
}

// Exporta a configuração global para acesso direto
export { trackColorConfig };
