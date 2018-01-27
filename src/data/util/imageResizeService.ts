import {Vector2} from 'data/scene/entities/vector2';
import {MIME_TYPE_JPEG} from 'ui/common/constants';

const MAX_SIZE_HOTSPOT = 1024;

function getNearestPowerOfTwo(x: number): number {
  return new Array(14).fill(null)
    .map((_, index) => Math.pow(2, index))
    .map((power, index) => {
      const distance = Math.abs(x - power);
      return {distance: distance, value: power};
    })
    .sort((a, b) => a.distance - b.distance)[0].value;
}

export function fitToMax(width: number, height: number, maxSize: number): Vector2 {
  let x: number;
  let y: number;
  if (width > height && width > maxSize) {
    x = maxSize;
    y = (height / width) * maxSize;
  }
  else if (height > width && height > maxSize){
    x = (width / height) * maxSize;
    y = maxSize;
  }
  else if (width === height && width > maxSize) {
    x = maxSize;
    y = maxSize;
  }
  else {
    x = width;
    y = height;
  }
  return new Vector2(x, y);
}

const SIZE_OPTIONS = {
  projectThumbnail: (width: number, height: number): Vector2 => new Vector2(336, 168),
  hotspotImage: (width: number, height: number): Vector2 => fitToMax(width, height, MAX_SIZE_HOTSPOT),
  backgroundImage: (width: number, height: number): Vector2 => {
    if (width >= height) {
      const x = getNearestPowerOfTwo(width);
      const y = Math.floor((height / width) * x);
      return new Vector2(x, y);
    }
    else {
      const y = getNearestPowerOfTwo(height);
      const x = Math.floor((width / height) * y);
      return new Vector2(x, y);
    }
  }
};

function getResizedImage(imageUrl: any, sizeOption: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.onload = () => {
        const resizeDimensions: Vector2 = SIZE_OPTIONS[sizeOption](img.width, img.height);
        canvas.width = resizeDimensions.getX();
        canvas.height = resizeDimensions.getY();
        canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height, 0, 0, resizeDimensions.getX(), resizeDimensions.getY());
        resolve(canvas.toDataURL(MIME_TYPE_JPEG, 1));
      };
      img.src = imageUrl.changingThisBreaksApplicationSecurity ?
        imageUrl.changingThisBreaksApplicationSecurity : imageUrl;
    }
    catch(error) {
      reject(error);
    }
  });
}

export function resizeImage(imageUrl: any, sizeOption: string): Promise<any> {
  if (!SIZE_OPTIONS[sizeOption]) {
    return Promise.reject('resizeImage must have a valid size option: ' + Object.keys(SIZE_OPTIONS).join(', '));
  }
  if (sizeOption === 'backgroundImage') {
    return Promise.all([
      getResizedImage(imageUrl, 'backgroundImage'),
      getResizedImage(imageUrl, 'projectThumbnail')
    ])
    .then(resizeList => {
      return {
        backgroundImage: resizeList[0],
        thumbnail: resizeList[1]
      };
    });
  }
  else {
    return getResizedImage(imageUrl, sizeOption);
  }


}
