export class TrackColorConfig {
  constructor() {
    // Configuração global de cores
    this.useUniformColor = true; // true = cor única, false = cores específicas
    this.uniformColor = "gray"; // cor única quando ativada
  }

  // Método para obter a cor baseada na configuração
  getColor(specificColor) {
    return this.useUniformColor ? this.uniformColor : specificColor;
  }

  // Método para ativar/desativar cor uniforme
  setUniformColor(enable, color = "gray") {
    this.useUniformColor = enable;
    if (color) {
      this.uniformColor = color;
    }
  }

  // Método para alterar apenas a cor uniforme
  setUniformColorValue(color) {
    this.uniformColor = color;
  }

  // Método para obter o estado atual da configuração
  getColorConfig() {
    return {
      useUniformColor: this.useUniformColor,
      uniformColor: this.uniformColor
    };
  }
}

// Instância global única (singleton)
export const trackColorConfig = new TrackColorConfig();
