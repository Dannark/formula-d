export class Track {
  constructor(points, width = 100) {
    this.points = points; // Array de pontos que formam a pista
    this.width = width; // Largura da pista
    
    // Dados das células organizados por faixa
    this.trackCells = {
      inner: [],   // Faixa azul (primeira)
      middle: [],  // Faixa verde (segunda) 
      outer: []    // Faixa rosa/amarela (terceira/quarta)
    };
  }
}
