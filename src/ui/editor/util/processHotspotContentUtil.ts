const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1024;
const IMAGE_MAX_HEIGHT = 400;
const IMAGE_ONLY_MAX_HEIGHT = 700;
const IMAGE_MAX_WIDTH = 700;
const PADDING = 30;

export default function (image, text) {
  let imageElement;
  let textElement;
  let maxWidth = IMAGE_MAX_WIDTH;
  let maxHeight = IMAGE_MAX_HEIGHT;

  if(!text){
    maxHeight = IMAGE_ONLY_MAX_HEIGHT;
  }

  if (image) {
    let imageHeight = image.height;
    let imageWidth = image.width;

    const aspectRatio = imageWidth / imageHeight;

    if (imageWidth >= imageHeight) {
      imageWidth = maxWidth;
      imageHeight = maxWidth / aspectRatio;

      if (imageHeight > maxHeight) {
        imageHeight = maxHeight;
        imageWidth = imageHeight * aspectRatio;
      }

    } else {
      imageHeight = maxHeight;
      imageWidth = imageHeight * aspectRatio;
    }

    imageElement = `
      <div 
        style="
          width: 100%;
          display: flex;
          position: relative;
          margin: 0px auto;
          background-color: black;
          padding: ${PADDING}px 0;
          height: ${maxHeight}px;
        "
      >
        <img 
          style="display:block; margin: auto"
          width="${imageWidth}"
          height="${imageHeight}"
          src="${image.src}"/>
      </div>
      `
  }

  if (text) {
    let textWidth = '100%';
    let fontSize = '24px';
    
    if(!image){
      textWidth='60%';
      fontSize="36px"
    }

    textElement = `
      <div
        style="
          color: white;
          background-color: black;
          padding: 20px;
          text-align: center;
          display: table-cell;
          vertical-align: middle;
          line-height: 35px;
          box-sizing: border-box;
          width: ${textWidth};
          font-size: ${fontSize};
        ">
      ${text}
    </div>`;
  }



  const imageData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_HEIGHT}" height="${CANVAS_WIDTH}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" 
            style="
              background-color: transparent;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              align-content: center;
              flex-direction: column;
              justify-content: center;
            ">
              ${imageElement || ''}
              ${textElement || ''}
            </div>
      </foreignObject>
    </svg>
`;
  return {
    src: `data:image/svg+xml,${imageData}`,
    height: CANVAS_HEIGHT,
    width: CANVAS_WIDTH
  };
}