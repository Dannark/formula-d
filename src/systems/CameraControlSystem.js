import { Camera } from "../components/Camera.js";
import { Transform } from "../components/Transform.js";

export class CameraControlSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.cameraEntity = null;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Previne o menu de contexto do botão direito
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    // Mouse down - inicia o drag
    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button === 2) { // Botão direito do mouse
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.canvas.style.cursor = "grabbing";
      }
    });

    // Mouse move - arrasta a câmera
    this.canvas.addEventListener("mousemove", (e) => {
      if (this.isDragging && this.cameraEntity) {
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        
        const transform = this.cameraEntity.getComponent(Transform);
        const camera = this.cameraEntity.getComponent(Camera);
        
        // Inverte o movimento para que arrastar para a direita mova a câmera para a esquerda
        transform.x -= deltaX / camera.zoom;
        transform.y -= deltaY / camera.zoom;
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    // Mouse up - para o drag
    this.canvas.addEventListener("mouseup", (e) => {
      if (e.button === 2) {
        this.isDragging = false;
        this.canvas.style.cursor = "default";
      }
    });

    // Scroll do mouse para zoom
    this.canvas.addEventListener("wheel", (e) => {
      if (this.cameraEntity) {
        e.preventDefault();
        
        const transform = this.cameraEntity.getComponent(Transform);
        const camera = this.cameraEntity.getComponent(Camera);
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        
        // Guarda a posição do mouse antes do zoom
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Converte para coordenadas do mundo
        const worldX = (mouseX / camera.zoom) + transform.x;
        const worldY = (mouseY / camera.zoom) + transform.y;
        
        // Aplica o zoom
        const newZoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, camera.zoom * zoomFactor));
        camera.zoom = newZoom;
        
        // Ajusta a posição da câmera para manter o ponto do mouse fixo
        transform.x = worldX - (mouseX / camera.zoom);
        transform.y = worldY - (mouseY / camera.zoom);
      }
    });
  }

  update(deltaTime, entities) {
    // Encontra a entidade da câmera
    if (!this.cameraEntity) {
      for (const entity of entities) {
        if (entity.hasComponent(Camera) && entity.hasComponent(Transform)) {
          this.cameraEntity = entity;
          break;
        }
      }
    }
  }

  // Método auxiliar para converter coordenadas da tela para o mundo
  screenToWorld(screenX, screenY) {
    if (this.cameraEntity) {
      const transform = this.cameraEntity.getComponent(Transform);
      const camera = this.cameraEntity.getComponent(Camera);
      
      return {
        x: (screenX / camera.zoom) + transform.x,
        y: (screenY / camera.zoom) + transform.y
      };
    }
    return { x: screenX, y: screenY };
  }
} 