import { Vector2 } from 'data/scene/entities/vector2';
import { Vector3 } from 'three';

// xy screen position to normalized position: [0, 360], [-90, 90]
function normalizeAbsolutePosition(x: number, y: number): Vector2 {
  const bodyRect = document.body.getBoundingClientRect();
  const xRelative: number = 360 * x / bodyRect.width;
  const yRelative: number = -180 * y / bodyRect.height + 90;
  return new Vector2(xRelative, yRelative);
}

// normalized position [0, 360], [-90, 90] to screen position
function denormalizePosition(x: number, y: number): Vector2 {
  const bodyRect = document.body.getBoundingClientRect();
  const xAbsolute: number = x / 360 * bodyRect.width;
  const yAbsolute: number = (y / -180 + 0.5) * bodyRect.height;
  return new Vector2(xAbsolute, yAbsolute);
}

//added by ali to have coordinate system changes
//these use angles in Degrees (NOT Radians)
function car2pol(x, y, z): Vector3 {
  var rho = Math.sqrt((x * x) + (y * y) + (z * z));
  var phi = Math.atan2(z, x) * 180 / Math.PI;
  var theta = Math.acos(y / rho) * 180 / Math.PI;
  return new Vector3(rho, theta, phi);
}

//these use angles in Degrees (NOT Radians)
function pol2car(rho, theta, phi): Vector3 {
  var x = rho * Math.sin(theta * Math.PI / 180) * Math.cos(phi * Math.PI / 180);
  var z = rho * Math.sin(theta * Math.PI / 180) * Math.sin(phi * Math.PI / 180);
  var y = rho * Math.cos(theta * Math.PI / 180);
  return new Vector3(x, y, z);
}

//these angles are in radians (NOT degrees)

// xyz to spherical
function coordinateToSpherical(x: number, y: number, z: number): any {
  const rho: number = Math.sqrt(x * x + y * y + z * z);
  const theta: number = Math.atan2(z, x);
  const phi: number = Math.acos(y / rho);
  return {
    rho: rho,      // distance from origin
    theta: theta,  // polar angle (x)
    phi: phi,       // azimuth angle (y)
  };
}

// spherical to xyz
function sphericalToCoordinate(radialDistance: number, theta: number, phi: number): Vector3 {
  const x: number = radialDistance * Math.cos(theta) * Math.sin(phi);
  const z: number = radialDistance * Math.sin(theta) * Math.sin(phi);
  const y: number = radialDistance * Math.cos(phi);
  return new Vector3(x, y, z);
}

function clamp(value: number, lowerBound: number, upperBound: number): number {
  return Math.max(lowerBound, Math.min(upperBound, value));
}

// given coordinates where 0 <= x <= 360 and -90 <= y <= 90, get 3D position
function getCoordinatePosition(x: number, y: number, r?: number): Vector3 {
  const radialDistance = r || 300;
  const locationX: number = clamp(x, 0, 360);
  const locationY: number = clamp(-y, -90, 90);
  const radianPositionX: number = locationX / 180 * Math.PI;
  const radianPositionY: number = (locationY + 90) / 180 * Math.PI;
  return sphericalToCoordinate(radialDistance, radianPositionX, radianPositionY);
}

export {
  normalizeAbsolutePosition,
  denormalizePosition,
  sphericalToCoordinate,
  coordinateToSpherical,
  getCoordinatePosition,
  clamp,
  car2pol,
  pol2car,
};
