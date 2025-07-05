export class Camera {
  constructor(zoom = 1, minZoom = 0.1, maxZoom = 3.0) {
    this.zoom = zoom;
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
  }
} 