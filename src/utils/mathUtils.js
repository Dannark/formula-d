/**
 * Calcula o vetor direção entre dois pontos e o normaliza
 * @param {Object} point1 - Ponto inicial {x, y}
 * @param {Object} point2 - Ponto final {x, y}
 * @returns {Object} Vetor direção normalizado {x, y, angle}
 */
export function calculateDirection(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  return {
    x: dx / length,
    y: dy / length,
    angle: Math.atan2(dy, dx),
    length, // às vezes é útil ter o comprimento original
  };
}

/**
 * Calcula a bissetriz entre duas direções e retorna o vetor perpendicular a ela
 * @param {Object} currentPoint - Ponto atual {x, y}
 * @param {Object} prevPoint - Ponto anterior {x, y}
 * @param {Object} nextPoint - Próximo ponto {x, y}
 * @returns {Object} Vetor perpendicular à bissetriz {x, y}
 */
export function getBisectorPerpendicular(currentPoint, prevPoint, nextPoint) {
  // Calcula os vetores direção
  const prevDirection = calculateDirection(prevPoint, currentPoint);
  const nextDirection = calculateDirection(currentPoint, nextPoint);

  // Calcula a bissetriz somando os vetores e normalizando
  const bisector = normalizeVector({
    x: prevDirection.x + nextDirection.x,
    y: prevDirection.y + nextDirection.y
  });

  // Retorna o vetor perpendicular à bissetriz (90 graus no sentido horário)
  return {
    x: bisector.y,
    y: -bisector.x
  };
}

/**
 * Rotaciona um vetor por um ângulo
 * @param {Object} vector - Vetor a ser rotacionado {x, y}
 * @param {number} angleInRadians - Ângulo em radianos
 * @returns {Object} Vetor rotacionado {x, y}
 */
export function rotateVector(vector, angleInRadians) {
  const cos = Math.cos(angleInRadians);
  const sin = Math.sin(angleInRadians);
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

/**
 * Calcula o vetor perpendicular (90 graus anti-horário)
 * @param {Object} vector - Vetor de entrada {x, y}
 * @returns {Object} Vetor perpendicular {x, y}
 */
export function getPerpendicular(vector) {
  return {
    x: vector.y,
    y: -vector.x,
  };
}

/**
 * Normaliza um vetor
 * @param {Object} vector - Vetor a ser normalizado {x, y}
 * @returns {Object} Vetor normalizado {x, y}
 */
export function normalizeVector(vector) {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

/**
 * Multiplica um vetor por um escalar
 * @param {Object} vector - Vetor {x, y}
 * @param {number} scalar - Valor escalar
 * @returns {Object} Vetor resultante {x, y}
 */
export function multiplyVector(vector, scalar) {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
  };
}
