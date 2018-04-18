import BasePlane from "./base-plane";
import * as THREE from "three";
import {Video} from "data/scene/entities/video";
import {getCoordinatePosition} from "../../util/iconPositionUtil";
import {fitToMax} from "data/util/imageResizeService";
import {buildMaterialFromText} from "../modules/textMaterialBuilder";

export default class VideoPlane extends BasePlane {
  private _texture: THREE.CanvasTexture;
  private _mediaElement: HTMLVideoElement;
  private _canvasContext: CanvasRenderingContext2D;
  private _needToUpdateTexture: boolean = false;

  protected _hasPlaneMesh: boolean = true;

  protected _render(): THREE.Mesh {
    const videoProperty = this.prop as Video;
    const location = videoProperty.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY(), 250);

    if (videoProperty.hasValidUrl) {
      const videoUrl = videoProperty.exportUrl;
      const video = this.getVideoElement(videoUrl);
      const image = document.createElement('canvas');

      image.width = 480;
      image.height = 360;

      const imageContext = image.getContext('2d');

      imageContext.fillStyle = '#000000';
      imageContext.fillRect(0, 0, 480, 360);

      const videoTexture = new THREE.CanvasTexture(image);

      videoTexture.minFilter = THREE.LinearFilter;

      const geometryDimensions = fitToMax(480, 360, 140);
      const imageGeometry = new THREE.PlaneGeometry(geometryDimensions.getX(), geometryDimensions.getY());
      const imageMaterial = new THREE.MeshBasicMaterial({
        map: videoTexture
      });
      const imageMesh = new THREE.Mesh(imageGeometry, imageMaterial);

      imageMesh.position.set(position.x, position.y, position.z);
      imageMesh.lookAt(this.camera.position);
      imageMesh.material['opacity'] = 1;
      imageMesh.scale.set(VideoPlane.SCALE, VideoPlane.SCALE, VideoPlane.SCALE);

      this._texture = videoTexture;
      this._mediaElement = video;
      this._canvasContext = imageContext;

      return imageMesh;
    }

    const materialData = buildMaterialFromText(videoProperty.body);
    const geometryDimensions = fitToMax(materialData.width, materialData.height, 140);
    const textGeometry = new THREE.PlaneGeometry(geometryDimensions.getX(), geometryDimensions.getY());
    const textMesh = new THREE.Mesh(textGeometry, materialData.material);

    textMesh.position.set(position.x, position.y, position.z);
    textMesh.lookAt(this.camera.position);
    textMesh.material['opacity'] = 1;
    textMesh.scale.set(VideoPlane.SCALE, VideoPlane.SCALE, VideoPlane.SCALE);

    return textMesh
  }

  private getVideoElement(videoUrl: string): HTMLVideoElement {
    const video: HTMLVideoElement = document.createElement('video');

    video.crossOrigin = 'anonymous';
    video.setAttribute('playsinline', 'playsinline');
    video.setAttribute('webkit-playsinline', 'webkit-playsinline');
    video.width = 480;
    video.height = 360;
    video.src = videoUrl;

    document.body.appendChild(video);

    return video;
  }

  public onActivated() {
    this._mediaElement.play();
    this._needToUpdateTexture = true;
  }

  public onDeactivated() {
    this._mediaElement.pause();
    this._needToUpdateTexture = false;
  }

  public update() {
    if (this._needToUpdateTexture) {
      const video: HTMLVideoElement = this._mediaElement;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        this._canvasContext.drawImage(video, 0, 0);
        this._texture.needsUpdate = true;
      }
    }
  }
}
