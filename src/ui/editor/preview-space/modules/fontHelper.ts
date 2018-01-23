import * as THREE from 'three';

const fontPath = 'assets/fonts/Nunito_Regular.json';

class FontHelper {

  private font: THREE.Font;

  load(): Promise<any> {
    return new Promise((resolve, reject) => {
       new THREE.FontLoader()
        .load(fontPath,
          font => {
            this.font = <any>font;
            resolve(font);
          },
          progress => {},
          error => reject(error)
        );
    });

  }

  getBaseFont(): THREE.Font {
    return this.font;
  }

}

const fontHelper = new FontHelper();
export default fontHelper;
