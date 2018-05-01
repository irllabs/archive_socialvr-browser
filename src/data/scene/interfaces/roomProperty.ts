import {Vector2} from 'data/scene/entities/vector2';

export interface RoomProperty {

  getId(): string;

  setId(id: string): RoomProperty;

  getName(): string;

  setName(name: string): RoomProperty;

  getLocation(): Vector2;

  setLocation(location: Vector2): RoomProperty;

  getTimestamp(): number;

  getIcon(): string;

  setTimestamp(timestamp: number): RoomProperty;

  getPossibleCombinedHotspot();

  setPossibleCombinedHotspot(isPossibleCombinedHotspot: boolean);

}
