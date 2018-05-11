import { Vector2 } from 'data/scene/entities/vector2';

export interface Hotspot {

  // getName(): string;

  // propertyIs(propertyType: string): boolean;

  setPixelLocation(x: number, y: number);

  setPixelLocationWithBuffer(x: number, y: number);

  getScreenPosition(): Vector2;

  getLocation(): Vector2;

}
