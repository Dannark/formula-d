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
const trackConfig = {
  // Array de pontos que formam a pista
  points: createCircularPoints(
    window.innerWidth / 2, // centro x (meio da tela)
    window.innerHeight / 2, // centro y (meio da tela)
    Math.min(window.innerWidth, window.innerHeight) * 0.25, // raio (25% do menor lado da tela)
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
    Math.min(window.innerWidth, window.innerHeight) * 0.25,
    12
  );
}

// trackConfig.points = [
//   {
//     x: 767.95,
//     y: 383.5,
//   },
//   {
//     x: 731.9845196459326,
//     y: 517.7249999999999,
//   },
//   {
//     x: 633.725,
//     y: 615.9845196459326,
//   },
//   {
//     x: 499.5,
//     y: 651.95,
//   },
//   {
//     x: 365.2750000000001,
//     y: 615.9845196459326,
//   },
//   {
//     x: 267.01548035406745,
//     y: 517.7249999999999,
//   },
//   {
//     x: 231.05,
//     y: 383.50000000000006,
//   },
//   {
//     x: 267.01548035406745,
//     y: 249.2750000000001,
//   },
//   {
//     x: 365.27499999999986,
//     y: 151.01548035406753,
//   },
//   {
//     x: 499.49999999999994,
//     y: 115.05000000000001,
//   },
//   {
//     x: 733.725,
//     y: 151.01548035406748,
//   },
//   {
//     x: 831.9845196459324,
//     y: 249.2749999999999,
//   },
// ];

export { trackConfig };