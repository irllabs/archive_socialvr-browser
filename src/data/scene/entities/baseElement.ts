import { Vector2 } from 'data/scene/entities/vector2';

import { RoomProperty } from 'data/scene/interfaces/roomProperty';

import { generateUniqueId } from 'data/util/uuid';

export class BaseElement implements RoomProperty {
  private id: string = generateUniqueId();
  private name: string = '';
  private location: Vector2 = Vector2.build();
  private timestamp: number = Date.now();
  private isPossibleCombinedHotspot: boolean = false;

  constructor() {
  }

  getId(): string {
    return this.id;
  }

  setId(id: string): RoomProperty {
    this.id = id;
    return this;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): RoomProperty {
    this.name = name;
    return this;
  }

  getLocation(): Vector2 {
    return this.location;
  }

  setLocation(location: Vector2): RoomProperty {
    this.location = location;
    return this;
  }

  getTimestamp() {
    return this.timestamp;
  }

  setTimestamp(timestamp): RoomProperty {
    this.timestamp = timestamp;
    return this;
  }

  getPossibleCombinedHotspot(): boolean {
    return this.isPossibleCombinedHotspot;
  }

  setPossibleCombinedHotspot(isPossibleCombinedHotspot: boolean) {
    this.isPossibleCombinedHotspot = isPossibleCombinedHotspot;
  }

  getIcon(): string {
    return null;
  }

  toJson(): any {
    return {
      uuid: this.id,
      name: this.name,
      vect: this.location.toString(),
      time: this.timestamp,
    };
  }

}
