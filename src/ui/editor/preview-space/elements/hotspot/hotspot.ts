///<reference path="../../../../../../node_modules/@types/aframe/index.d.ts"/>
import { AfterViewInit, Component, NgZone, ViewChild, Input, ChangeDetectionStrategy } from '@angular/core';
import { getCoordinatePosition } from 'ui/editor/util/iconPositionUtil';
import { Universal } from 'data/scene/entities/universal';
import { getTextureSizeFromText } from 'ui/editor/preview-space/modules/textMaterialBuilder';
import { AssetInteractor } from 'core/asset/assetInteractor';
import { fitToMax } from 'data/util/imageResizeService';

import './aframe/hotspot-content';
import './aframe/hotspot-hidden-marker';
import './aframe/hotspot';
import './aframe/hotspot-pulsating-marker';

@Component({
  selector: '[nga-hotspot]',
  templateUrl: './hotspot.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Hotspot implements AfterViewInit {
  private assets: object;

  @Input() hotspot: Universal;
  @ViewChild('hotspotContent') hotspotContent: any;
  @ViewChild('assetImage') assetImage: any;
  @ViewChild('assetAudio') assetAudio: any;

  constructor(
    private assetInteractor: AssetInteractor,
    private ngZone: NgZone
  ) {
  }

  protected get isAudioOnly() {

    const hasImageContent: boolean = this.hotspot.imageContent.hasAsset();
    const hasTextContent: boolean = !!this.hotspot.textContent;
    const hasAudioContent: boolean = this.hotspot.audioContent.hasAsset();

    return hasAudioContent && !hasImageContent && !hasTextContent;
  }

  protected get hasAudio() {
    return this.hotspot.audioContent.hasAsset();
  }
  protected get hasImage() {
    return this.hotspot.imageContent.hasAsset();
  }

  protected get params() {
    return `coordinates: ${this.hotspot.location.getX()} ${this.hotspot.location.getY()};
            isAudioOnly: ${this.isAudioOnly}`;
  }

  setupAssets() {
    const hotspot = this.hotspot;
    const hasImageContent: boolean = hotspot.imageContent.hasAsset();
    const hasTextContent: boolean = !!hotspot.textContent;
    const hasAudio: boolean = !!hotspot.audioContent.hasAsset();
    const location = hotspot.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY(), 250);

    let width = 0;
    let height = 0;
    let textSize = null;
    let adjustedHeight = 0;

    if (hasTextContent) {
      textSize = getTextureSizeFromText(hotspot.textContent);

      width = textSize.width > width ? textSize.width : width;
      height += textSize.height;
    }

    // Building material
    const canvas: any = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;

    if (hasImageContent) {
      const imageTexture = this.assetInteractor.getTextureById(hotspot.getId());
      const imgWidth = imageTexture.image.width;
      const imgHeight = imageTexture.image.height;
      const adjustedWidth = imgWidth >= imgHeight && width > 0 ? width : imgWidth;

      adjustedHeight = imgHeight * (adjustedWidth / imgWidth);
      width = imageTexture.image.width > width ? imageTexture.image.width : width;

      height += adjustedHeight;
      canvas.width = width;
      canvas.height = height;

      canvasContext.drawImage(imageTexture.image, width / 2 - adjustedWidth / 2, 0, adjustedWidth, adjustedHeight);
    }

    if (textSize !== null) {
      const textCanvas: any = document.createElement('canvas');
      const textCanvasContext = textCanvas.getContext('2d');

      textCanvas.width = textSize.width;
      textCanvas.height = textSize.height;

      textCanvasContext.drawImage(textSize.drawCanvas, 0, 0, width, height, 0, 0, width, height);
      canvasContext.drawImage(textCanvas, 0, adjustedHeight, width, textSize.height);
    }
    const assets = {
      image: null,
      audio: null
    };

    if (hasTextContent || hasImageContent) {
      const imageSize = fitToMax(canvas.width, canvas.height, 3);
      assets.image = {
        src: canvas.toDataURL('png'),
        width: imageSize.getX(),
        height: imageSize.getY()
      };
    }

    if (hasAudio) {
      assets.audio = {
        src: hotspot.audioContent.getBinaryFileData(true),
        loop: hotspot.loop
      }
    }

    this.assets = assets;
  }

  get name() {
    return this.hotspot.getName();
  }

  ngOnInit() {
    this.setupAssets();
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      const assets: any = this.assets;

      if (this.hasImage) {
        const imageElement = this.assetImage.nativeElement;

        imageElement.setAttribute('width', assets.image.width);
        imageElement.setAttribute('height', assets.image.height);
        imageElement.setAttribute('src', assets.image.src);
      }

      if (this.hasAudio) {
        const audioElement = this.assetAudio.nativeElement;
        audioElement.setAttribute('loop', assets.audio.loop);
        audioElement.setAttribute('refDistance', 999);
        audioElement.setAttribute('src', assets.audio.src);
      }


    });
  }
}
