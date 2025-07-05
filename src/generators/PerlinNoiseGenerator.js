// Implementação simplificada do Perlin Noise
class PerlinNoise {
  constructor(seed = Math.random()) {
    this.seed = seed;
    this.p = [];
    
    // Gera a tabela de permutação
    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(Math.random() * 256);
    }
    
    // Duplica a tabela para evitar overflow
    for (let i = 0; i < 256; i++) {
      this.p[256 + i] = this.p[i];
    }
  }
  
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  lerp(t, a, b) {
    return a + t * (b - a);
  }
  
  grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  
  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = this.fade(x);
    const v = this.fade(y);
    
    const A = this.p[X] + Y;
    const AA = this.p[A];
    const AB = this.p[A + 1];
    const B = this.p[X + 1] + Y;
    const BA = this.p[B];
    const BB = this.p[B + 1];
    
    return this.lerp(v,
      this.lerp(u,
        this.grad(this.p[AA], x, y),
        this.grad(this.p[BA], x - 1, y)
      ),
      this.lerp(u,
        this.grad(this.p[AB], x, y - 1),
        this.grad(this.p[BB], x - 1, y - 1)
      )
    );
  }
}

export class PerlinNoiseGenerator {
  constructor(seed = Math.random()) {
    this.noise = new PerlinNoise(seed);
    this.seed = seed;
  }
  
  // Gera uma pista circular com perturbações orgânicas
  generateOrganicCircuit(options = {}) {
    const {
      centerX = window.innerWidth / 2,
      centerY = window.innerHeight / 2,
      baseRadius = Math.min(window.innerWidth, window.innerHeight) * 0.25,
      numPoints = 16,
      noiseScale = 0.01,
      noiseAmplitude = 0.3,
      complexity = 1.0
    } = options;
    
    const points = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      
      // Ruído baseado no ângulo para variação orgânica
      const noiseValue = this.noise.noise(
        Math.cos(angle) * noiseScale * complexity,
        Math.sin(angle) * noiseScale * complexity
      );
      
      // Aplica a perturbação ao raio
      const radiusVariation = 1 + (noiseValue * noiseAmplitude);
      const radius = baseRadius * radiusVariation;
      
      // Calcula as coordenadas finais
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      points.push({ x, y });
    }
    
    return points;
  }
  
  // Gera uma pista oval com perturbações
  generateOrganicOval(options = {}) {
    const {
      centerX = window.innerWidth / 2,
      centerY = window.innerHeight / 2,
      radiusX = Math.min(window.innerWidth, window.innerHeight) * 0.3,
      radiusY = Math.min(window.innerWidth, window.innerHeight) * 0.2,
      numPoints = 20,
      noiseScale = 0.02,
      noiseAmplitude = 0.2
    } = options;
    
    const points = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      
      // Ruído para variação orgânica
      const noiseValue = this.noise.noise(
        Math.cos(angle) * noiseScale,
        Math.sin(angle) * noiseScale
      );
      
      // Raio elíptico com perturbação
      const baseRadius = Math.sqrt(
        Math.pow(radiusX * Math.cos(angle), 2) + 
        Math.pow(radiusY * Math.sin(angle), 2)
      );
      
      const radius = baseRadius * (1 + noiseValue * noiseAmplitude);
      
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      points.push({ x, y });
    }
    
    return points;
  }
  
  // Gera uma pista em forma de 8 com perturbações
  generateOrganicFigureEight(options = {}) {
    const {
      centerX = window.innerWidth / 2,
      centerY = window.innerHeight / 2,
      lobeRadius = Math.min(window.innerWidth, window.innerHeight) * 0.15,
      numPoints = 24,
      noiseScale = 0.015,
      noiseAmplitude = 0.25
    } = options;
    
    const points = [];
    
    for (let i = 0; i < numPoints; i++) {
      const t = (i * 2 * Math.PI) / numPoints;
      
      // Equações paramétricas para figura 8
      const scale = 2 / (3 - Math.cos(2 * t));
      const baseX = scale * Math.cos(t);
      const baseY = scale * Math.sin(2 * t) / 2;
      
      // Ruído para variação orgânica
      const noiseValue = this.noise.noise(
        baseX * noiseScale,
        baseY * noiseScale
      );
      
      // Aplica escala e perturbação
      const radius = lobeRadius * (1 + noiseValue * noiseAmplitude);
      const x = centerX + baseX * radius;
      const y = centerY + baseY * radius;
      
      points.push({ x, y });
    }
    
    return points;
  }
  
  // Gera uma pista complexa com múltiplas curvas
  generateComplexCircuit(options = {}) {
    const {
      centerX = window.innerWidth / 2,
      centerY = window.innerHeight / 2,
      baseRadius = Math.min(window.innerWidth, window.innerHeight) * 0.25,
      numPoints = 20,
      sections = 3,
      noiseScale = 0.02,
      noiseAmplitude = 0.4
    } = options;
    
    const points = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      
      // Cria seções com diferentes características
      const sectionAngle = (angle * sections) % (2 * Math.PI);
      const sectionFactor = 0.8 + 0.4 * Math.sin(sectionAngle);
      
      // Múltiplas octavas de ruído para complexidade
      const noise1 = this.noise.noise(
        Math.cos(angle) * noiseScale,
        Math.sin(angle) * noiseScale
      );
      const noise2 = this.noise.noise(
        Math.cos(angle * 2) * noiseScale * 2,
        Math.sin(angle * 2) * noiseScale * 2
      ) * 0.5;
      
      const totalNoise = noise1 + noise2;
      
      // Aplica variações
      const radius = baseRadius * sectionFactor * (1 + totalNoise * noiseAmplitude);
      
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      points.push({ x, y });
    }
    
    return points;
  }
  
  // Verifica se a pista tem auto-interseções (cruzamentos)
  hasIntersections(points) {
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      
      for (let j = i + 2; j < points.length; j++) {
        if (j === points.length - 1 && i === 0) continue; // Evita verificar o último segmento com o primeiro
        
        const p3 = points[j];
        const p4 = points[(j + 1) % points.length];
        
        if (this.linesIntersect(p1, p2, p3, p4)) {
          return true;
        }
      }
    }
    return false;
  }
  
  // Verifica se duas linhas se intersectam
  linesIntersect(p1, p2, p3, p4) {
    const d1 = this.direction(p3, p4, p1);
    const d2 = this.direction(p3, p4, p2);
    const d3 = this.direction(p1, p2, p3);
    const d4 = this.direction(p1, p2, p4);
    
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }
    
    return false;
  }
  
  // Calcula a direção do produto cruzado
  direction(pi, pj, pk) {
    return (pk.x - pi.x) * (pj.y - pi.y) - (pj.x - pi.x) * (pk.y - pi.y);
  }
  
  // Gera uma pista segura (sem cruzamentos)
  generateSafeTrack(type = 'organic', options = {}, maxAttempts = 10) {
    let attempts = 0;
    let track = null;
    
    while (attempts < maxAttempts) {
      switch (type) {
        case 'organic':
          track = this.generateOrganicCircuit(options);
          break;
        case 'oval':
          track = this.generateOrganicOval(options);
          break;
        case 'figure8':
          track = this.generateOrganicFigureEight(options);
          break;
        case 'complex':
          track = this.generateComplexCircuit(options);
          break;
        default:
          track = this.generateOrganicCircuit(options);
      }
      
      if (!this.hasIntersections(track)) {
        console.log(`✅ Pista ${type} gerada com sucesso em ${attempts + 1} tentativa(s)`);
        return track;
      }
      
      attempts++;
      console.log(`⚠️ Tentativa ${attempts} falhou - pista com cruzamentos`);
    }
    
    console.log(`❌ Não foi possível gerar pista ${type} sem cruzamentos. Usando pista circular simples.`);
    // Fallback para pista circular simples
    return this.generateSimpleCircle(options);
  }
  
  // Gera uma pista circular simples como fallback
  generateSimpleCircle(options = {}) {
    const {
      centerX = window.innerWidth / 2,
      centerY = window.innerHeight / 2,
      radius = Math.min(window.innerWidth, window.innerHeight) * 0.25,
      numPoints = 12
    } = options;
    
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push({ x, y });
    }
    
    return points;
  }
} 