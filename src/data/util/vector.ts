import { Vector2 } from "../scene/entities/vector2";

export function deserializeLocationVector(locationVector: string): Vector2 {
  const vectorRegex = /[<〈]([\de\-\.]+),([\de\-\.]+)[〉>]/;
  const [_, matchX, matchY]: string[] = locationVector.match(vectorRegex);
  const x: number = parseFloat(matchX);
  const y: number = parseFloat(matchY);

  return new Vector2(x, y);
}
