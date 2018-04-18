import * as THREE from 'three';

const fontSize = 26;

class TextLine {
  x: number;
  y: number;
  text: string;

  constructor(x, y, text) {
    this.x = x;
    this.y = y;
    this.text = text;
  }
}

function printWrappedText(context, text, x, y, maxWidth, lineHeight): TextLine[] {
  const lines: TextLine[] = [];
  const wordList = text.split(/(\s+)/);
  let lineContent = '';

  wordList.forEach((word) => {
    const proposedLine = lineContent + word + ' ';
    const metrics = context.measureText(proposedLine);

    if (metrics.width > maxWidth) {
      lines.push(new TextLine(x, y, lineContent.trim()));
      lineContent = word + ' ';
      y += lineHeight;
    }
    else {
      lineContent = proposedLine;
    }
  });

  lines.push(new TextLine(x, y, lineContent.trim()));

  return lines;
}

export function getTextureSizeFromText(textContext: string) {
  const width = 600;
  const drawCanvas = document.createElement('canvas');
  const g2d = drawCanvas.getContext('2d');

  drawCanvas.width = width;
  drawCanvas.height = 800;
  g2d.font = `${fontSize}pt Nunito`;
  g2d.fillStyle = 'rgba(0, 0, 0, 0.7)';
  g2d.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
  g2d.fillStyle = 'white';

  const textLines = printWrappedText(g2d, textContext, 10, fontSize + 10, width, fontSize + 8);
  const height = textLines[textLines.length - 1].y + fontSize;

  // Print text onto canvas
  textLines.forEach(textLine => g2d.fillText(textLine.text, textLine.x, textLine.y));

  return {width, height, drawCanvas};
}

export function buildMaterialFromText(textContext: string) {
  const {width, height, drawCanvas} = getTextureSizeFromText(textContext);
  const resizedCanvas = document.createElement('canvas');
  const resizedG2d = resizedCanvas.getContext('2d');

  resizedCanvas.width = width;
  resizedCanvas.height = height;
  // Get new "cropped" canvas to fit text
  resizedG2d.drawImage(drawCanvas, 0, 0, width, height, 0, 0, width, height);

  const texture = new THREE.Texture(resizedCanvas);

  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({map: texture, transparent: true, side:THREE.FrontSide});

  return {
    width: width,
    height: height,
    material: material
  };
}
