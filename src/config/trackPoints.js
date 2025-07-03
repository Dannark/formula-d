// Função auxiliar para criar pontos em círculo
function createCircularPoints(centerX, centerY, radius, numPoints) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    // Calcula o ângulo para cada ponto (em radianos)
    const angle = (i * 2 * Math.PI) / numPoints;
    // Calcula as coordenadas x,y usando funções trigonométricas
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push({ x, y });
  }
  return points;
}

// Configuração da pista
export const trackConfig = {
  // Array de pontos que formam a pista
  points: createCircularPoints(
    window.innerWidth / 2, // centro x (meio da tela)
    window.innerHeight / 2, // centro y (meio da tela)
    Math.min(window.innerWidth, window.innerHeight) * 0.35, // raio (35% do menor lado da tela)
    12 // número de pontos
  ),

  // Outras configurações da pista que podemos adicionar depois
  trackWidth: 50, // largura da pista em pixels
  padding: 20, // espaço extra ao redor da pista
};

// Função para atualizar os pontos quando a tela for redimensionada
export function updateTrackPoints() {
  trackConfig.points = createCircularPoints(
    window.innerWidth / 2,
    window.innerHeight / 2,
    Math.min(window.innerWidth, window.innerHeight) * 0.35,
    12
  );
}
