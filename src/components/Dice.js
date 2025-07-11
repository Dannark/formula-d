export class Dice {
  constructor(currentValue = 1, isRolling = false, diceType = 6) {
    this.currentValue = currentValue;  // Valor atual do dado (1-6)
    this.isRolling = isRolling;        // Se está rolando (para animação futura)
    this.diceType = diceType;          // Tipo do dado (6 faces por padrão)
    this.lastRollTime = 0;             // Timestamp da última rolagem
  }
}
