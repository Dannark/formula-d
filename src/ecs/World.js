export class World {
  constructor() {
    this.entities = new Set();
    this.systems = new Set();
  }

  addEntity(entity) {
    this.entities.add(entity);
    return entity;
  }

  removeEntity(entity) {
    this.entities.delete(entity);
  }

  addSystem(system) {
    this.systems.add(system);
    return system;
  }

  update(deltaTime) {
    for (const system of this.systems) {
      system.update(deltaTime, this.entities);
    }
  }
}
