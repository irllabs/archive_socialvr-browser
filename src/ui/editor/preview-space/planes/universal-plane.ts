import { THREE_CONST } from 'ui/common/constants';
import { Universal } from 'data/scene/entities/universal';
import { fitToMax } from 'data/util/imageResizeService';
import * as THREE from 'three';
import { getCoordinatePosition } from '../../util/iconPositionUtil';
import { AudioPlayService } from '../modules/audioPlayService';
import { getTextureSizeFromText } from '../modules/textMaterialBuilder';
import BasePlane from './base-plane';


export default class UniversalPlane extends BasePlane {
  private audioPlayService: AudioPlayService;
  private audioBufferSourceNode: AudioBufferSourceNode;

  public get hasPlaneMesh(): boolean {
    const universalProperty = this.prop as Universal;
    const hasImageContent: boolean = universalProperty.imageContent.hasAsset();
    const hasTextContent: boolean = !!universalProperty.textContent;

    return hasImageContent || hasTextContent;
  }

  protected get isAudioOnly() {
    const universalProperty = this.prop as Universal;
    const hasImageContent: boolean = universalProperty.imageContent.hasAsset();
    const hasTextContent: boolean = !!universalProperty.textContent;
    const hasAudioContent: boolean = universalProperty.audioContent.hasAsset();

    return hasAudioContent && !hasImageContent && !hasTextContent;
  }

  protected hoverIconGeometry(): any {
    if (this.isAudioOnly) {
      return new THREE.PlaneGeometry(THREE_CONST.HOTSPOT_DIM, THREE_CONST.HOTSPOT_DIM);
    } else {
      return super.hoverIconGeometry();
    }
  }

  protected hoverIconTexture() {
    if (this.isAudioOnly) {
      return this.assetInteractor.getTextureById('audio');
    } else {
      return super.hoverIconTexture();
    }
  }

  protected _render(): THREE.Mesh {
    const universalProperty = this.prop as Universal;
    const hasImageContent: boolean = universalProperty.imageContent.hasAsset();
    const hasTextContent: boolean = !!universalProperty.textContent;

    const location = universalProperty.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY(), 250);

    let width = 0;
    let height = 0;
    let textSize = null;
    let adjustedHeight = 0;

    if (hasTextContent) {
      textSize = getTextureSizeFromText(universalProperty.textContent);

      width = textSize.width > width ? textSize.width : width;
      height += textSize.height;
    }

    // Building material
    const canvas = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    if (hasImageContent) {
      const imageTexture = this.assetInteractor.getTextureById(universalProperty.getId());
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
      const textCanvas = document.createElement('canvas');
      const textCanvasContext = textCanvas.getContext('2d');

      textCanvas.width = textSize.width;
      textCanvas.height = textSize.height;

      textCanvasContext.drawImage(textSize.drawCanvas, 0, 0, width, height, 0, 0, width, height);
      canvasContext.drawImage(textCanvas, 0, adjustedHeight, width, textSize.height);
    }

    const texture = new THREE.Texture(canvas);

    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.FrontSide });

    // Create Plane Mesh
    const geometryDimensions = fitToMax(width, height, 140);
    const universalGeometry = new THREE.PlaneGeometry(geometryDimensions.getX(), geometryDimensions.getY());
    const universalMesh = new THREE.Mesh(universalGeometry, material);

    universalMesh.position.set(position.x, position.y, position.z);
    universalMesh.lookAt(this.camera.position);
    universalMesh.material['opacity'] = 1;
    universalMesh.scale.set(UniversalPlane.SCALE, UniversalPlane.SCALE, UniversalPlane.SCALE);

    return universalMesh;
  }

  public init(audioPlayService: AudioPlayService) {
    this.audioPlayService = audioPlayService;
  }

  public activate() {
    if (this.isAudioOnly) {
      this.onActivated();
      return Promise.resolve(true);
    } else {
      return super.activate();
    }
  }

  public deactivate(onlyPlaneAnimation: boolean = false) {
    if (this.isAudioOnly) {
      this.onDeactivated();
      return Promise.resolve();
    } else {
      return super.deactivate(onlyPlaneAnimation);
    }
  }

  public onActivated() {
    const universalProperty = this.prop as Universal;

    if (universalProperty.audioContent.hasAsset()) {
      this.audioBufferSourceNode = this.audioPlayService.playHotspotAudio(
        universalProperty.getId(),
        universalProperty.volume,
        universalProperty.loop
      );
    }
  }

  public onDeactivated() {
    if(this.audioBufferSourceNode) {
      this.audioPlayService.stopHotspotAudio(this.audioBufferSourceNode);
    }
  }
}
