
const LOCATION_JITTER: number = 10;
const ROUNDING_BASE: number = 1;

function getPosNeg(): number {
  return Math.random() > 0.5 ? -1 : 1;
}

function getRandomPosition() {
  return getPosNeg() * LOCATION_JITTER * Math.random();
}

export class Vector2 {

  private x: number;
  private y: number;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static build() {
    const x: number = 180 + getRandomPosition();
    const y: number = getRandomPosition();
    return new Vector2(x, y);
  }

  getX(): number {
    return this.x;
  }

  setX(x: number) {
    this.x = x;
  }

  getY(): number {
    return this.y;
  }

  setY(y: number) {
    this.y = y;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  toString(): string {
    return `<${this.x},${this.y}>`;
  }

}
