import BasePlane from "./base-plane";
import * as THREE from "three";
import {Universal} from "data/scene/entities/universal";
import {getCoordinatePosition} from "../../util/iconPositionUtil";
import { getTextureSizeFromText} from "../modules/textMaterialBuilder";
import {fitToMax} from "data/util/imageResizeService";
import {AudioPlayService} from "../modules/audioPlayService";


export default class UniversalPlane extends BasePlane {
  private audioPlayService: AudioPlayService;
  private audioBufferSourceNode: AudioBufferSourceNode;

  public get hasPlaneMesh(): boolean {
    const universalProperty = this.prop as Universal;
    const hasImageContent: boolean = universalProperty.imageContent.hasAsset();
    const hasTextContent: boolean = !!universalProperty.textContent;

    return hasImageContent || hasTextContent;
  }

  protected _render(): THREE.Mesh {
    const universalProperty = this.prop as Universal;
    const hasImageContent: boolean = universalProperty.imageContent.hasAsset();
    const hasTextContent: boolean = !!universalProperty.textContent;

    const location = universalProperty.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY(), 250);

    let width = 0;
    let height = 0;
    let imageHeight = 0;
    let textSize = null;
    let imageTexture = null;


    if (hasImageContent) {
      imageTexture = this.assetInteractor.getTextureById(universalProperty.getId());

      if (imageTexture) {
        width = imageTexture.image.width > width ? imageTexture.image.width : width;
        imageHeight = imageTexture.image.height;
        height += imageHeight;
      }
    }

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

    if (imageTexture !== null) {
      canvasContext.drawImage(imageTexture.image, 0, 0, width, imageHeight);
    }

    if (textSize !== null) {
      const textCanvas = document.createElement('canvas');
      const textCanvasContext = textCanvas.getContext('2d');

      textCanvas.width = textSize.width;
      textCanvas.height = textSize.height;

      textCanvasContext.drawImage(textSize.drawCanvas, 0, 0, width, height, 0, 0, width, height);
      canvasContext.drawImage(textCanvas, 0, imageHeight, width, textSize.height);
    }

    const texture = new THREE.Texture(canvas);

    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({map: texture, transparent: true, side:THREE.FrontSide});

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

  public onActivated() {
    const universalProperty = this.prop as Universal;

    this.audioBufferSourceNode = this.audioPlayService.playHotspotAudio(
      universalProperty.getId(),
      universalProperty.loop
    );
  }

  public onDeactivated() {
    if(this.audioBufferSourceNode) {
      this.audioPlayService.stopPlaying(this.audioBufferSourceNode);
    }
  }
}
