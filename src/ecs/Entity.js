export class Entity {
  constructor() {
    this.id = crypto.randomUUID();
    this.components = new Map();
  }

  addComponent(component) {
    this.components.set(component.constructor.name, component);
    return this;
  }

  getComponent(componentClass) {
    return this.components.get(componentClass.name);
  }

  removeComponent(componentClass) {
    this.components.delete(componentClass.name);
  }

  hasComponent(componentClass) {
    return this.components.has(componentClass.name);
  }
}
