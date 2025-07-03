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
//     x: 869,
//     y: 440,
//   },
//   {
//     x: 730.6081205873071,
//     y: 553.125,
//   },
//   {
//     x: 649.625,
//     y: 634.108120587307,
//   },
//   {
//     x: 539,
//     y: 663.75,
//   },
//   {
//     x: 428.37500000000006,
//     y: 634.1081205873071,
//   },
//   {
//     x: 347.3918794126929,
//     y: 553.125,
//   },
//   {
//     x: 317.75,
//     y: 442.5,
//   },
//   {
//     x: 347.3918794126929,
//     y: 331.87500000000006,
//   },
//   {
//     x: 428.3749999999999,
//     y: 250.89187941269302,
//   },
//   {
//     x: 539,
//     y: 221.25,
//   },
//   {
//     x: 649.625,
//     y: 250.89187941269296,
//   },
//   {
//     x: 730.608120587307,
//     y: 331.8749999999999,
//   },
// ];

export { trackConfig };
