///<reference path="../../../../../../node_modules/@types/aframe/index.d.ts"/>
import { AfterViewInit, Component, NgZone, ViewChild, Input, ChangeDetectionStrategy } from '@angular/core';
import { getCoordinatePosition } from 'ui/editor/util/iconPositionUtil';
import { Universal } from 'data/scene/entities/universal';
import { getTextureSizeFromText } from 'ui/editor/preview-space/modules/textMaterialBuilder';
import { AssetInteractor } from 'core/asset/assetInteractor';
import { fitToMax } from 'data/util/imageResizeService';
import { ICON_PATH } from 'ui/common/constants';
import processHotspotContent from 'ui/editor/util/processHotspotContentUtil'

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

  protected get name() {
    return this.hotspot.getName();
  }

  protected get iconHotspot() {
    return `${ICON_PATH}icon-hotspot-default.png`;
  }

  protected get iconHotspotHover() {
    return `${ICON_PATH}icon-hotspot-hover.png`;
  }

  protected get iconAudio() {
    return `${ICON_PATH}icon-audio.png`;
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
    return this.hotspot.imageContent.hasAsset() || !!this.hotspot.textContent;
  }

  protected get params() {
    return `coordinates: ${this.hotspot.location.getX()} ${this.hotspot.location.getY()};
            isAudioOnly: ${this.isAudioOnly}`;
  }

  async setupAssets() {
    const hotspot = this.hotspot;
    const hasImageContent: boolean = hotspot.imageContent.hasAsset();
    const hasTextContent: boolean = !!hotspot.textContent;
    const hasAudio: boolean = !!hotspot.audioContent.hasAsset();

    let hotspotContentImage;
    let width = 0;
    let height = 0;
    let textSize = null;
    let adjustedHeight = 0;

    // Building material
    const canvas: any = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');

    canvas.width = 1024;
    canvas.height = 768;

    let image;
    if(hasImageContent){
       image = this.assetInteractor.getTextureById(hotspot.getId()).image;
    }
    
    hotspotContentImage = processHotspotContent(image, hotspot.textContent);
    
    const assets = {
      image: null,
      audio: null
    };

    if (hasTextContent || hasImageContent) {
      const imageSize = fitToMax(hotspotContentImage.width, hotspotContentImage.height, 4);
      assets.image = {
        src: hotspotContentImage.src,
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
        audioElement.setAttribute('src', assets.audio.src);
      }


    });
  }
}
