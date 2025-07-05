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

// Função para calcular a distância entre dois pontos
function calculateDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Função para criar um ponto intermediário entre dois pontos
function createIntermediatePoint(point1, point2) {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2,
  };
}

// Função para ajustar os pontos da pista baseado na distância máxima permitida
export function adjustTrackPoints(points, maxDistance, selectedIndex) {
  if (selectedIndex === undefined || selectedIndex === -1)
    return { points, newSelectedIndex: selectedIndex };

  let newPoints = points.map((point) => ({ ...point }));
  const totalPoints = newPoints.length;
  let newSelectedIndex = selectedIndex;

  // Não permitir menos de 4 pontos na pista
  const MIN_POINTS = 4;

  // Calcula o índice do ponto anterior e próximo considerando o circuito fechado
  const prevIndex = (selectedIndex - 1 + totalPoints) % totalPoints;
  const nextIndex = (selectedIndex + 1) % totalPoints;

  // Calcula as distâncias
  const distToPrev = calculateDistance(
    newPoints[selectedIndex],
    newPoints[prevIndex]
  );
  const distToNext = calculateDistance(
    newPoints[selectedIndex],
    newPoints[nextIndex]
  );

  // Verifica se precisa mesclar com o ponto anterior
  if (distToPrev < trackConfig.minPointDistance && totalPoints > MIN_POINTS) {
    // Remove o ponto atual e mantém o anterior
    newPoints.splice(selectedIndex, 1);
    newSelectedIndex = prevIndex;
    return { points: newPoints, newSelectedIndex };
  }

  // Verifica se precisa mesclar com o próximo ponto
  if (distToNext < trackConfig.minPointDistance && totalPoints > MIN_POINTS) {
    // Remove o próximo ponto e mantém o atual
    newPoints.splice(nextIndex, 1);
    return { points: newPoints, newSelectedIndex };
  }

  // Verifica se precisa adicionar ponto entre o selecionado e o anterior
  if (distToPrev > maxDistance) {
    const intermediatePoint = createIntermediatePoint(
      newPoints[selectedIndex],
      newPoints[prevIndex]
    );

    // Caso especial: se o ponto selecionado é 0 e estamos adicionando um ponto
    // entre ele e o último ponto, adicionamos no final do array
    if (selectedIndex === 0) {
      newPoints.push(intermediatePoint);
    } else {
      newPoints.splice(prevIndex + 1, 0, intermediatePoint);
      newSelectedIndex++;
    }
  }

  // Verifica se precisa adicionar ponto entre o selecionado e o próximo
  // Usamos o newSelectedIndex que pode ter sido atualizado acima
  if (distToNext > maxDistance) {
    const intermediatePoint = createIntermediatePoint(
      newPoints[newSelectedIndex],
      newPoints[(newSelectedIndex + 1) % newPoints.length]
    );
    newPoints.splice(newSelectedIndex + 1, 0, intermediatePoint);
  }

  return { points: newPoints, newSelectedIndex };
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
  maxPointDistance: 250, // distância máxima permitida entre pontos
  minPointDistance: 50, // distância mínima permitida entre pontos
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
//     x: 1266,
//     y: 627,
//   },
//   {
//     x: 1243,
//     y: 708,
//   },
//   {
//     x: 1105,
//     y: 792,
//   },
//   {
//     x: 973,
//     y: 881,
//   },
//   {
//     x: 870,
//     y: 870,
//   },
//   {
//     x: 814,
//     y: 820,
//   },
//   {
//     x: 742,
//     y: 719,
//   },
//   {
//     x: 655,
//     y: 605,
//   },
//   {
//     x: 505,
//     y: 560,
//   },
//   {
//     x: 370,
//     y: 499,
//   },
//   {
//     x: 355,
//     y: 402,
//   },
//   {
//     x: 412,
//     y: 299,
//   },
//   {
//     x: 535,
//     y: 325,
//   },
//   {
//     x: 665.1249999999999,
//     y: 347.84670738912354,
//   },
//   {
//     x: 818.5,
//     y: 306.75,
//   },
//   {
//     x: 971.875,
//     y: 347.8467073891235,
//   },
//   {
//     x: 1091,
//     y: 454,
//   },
//   {
//     x: 1178.5766463054383,
//     y: 542.5625,
//   },
// ];

export { trackConfig };
