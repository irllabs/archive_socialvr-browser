import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';

import {EventBus, EventType} from 'ui/common/event-bus';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {Room} from 'data/scene/entities/room';
import {resizeImage} from 'data/util/imageResizeService';

@Component({
  selector: 'edit-space-toggle',
  styleUrls: ['./edit-space-toggle.scss'],
  templateUrl: './edit-space-toggle.html'
})
export class EditSpaceToggle {

  private isInFlatMode: boolean = true;
  private isInFullscreen: boolean = false;
  private docElm = document.documentElement;


  constructor(
    private sceneInteractor: SceneInteractor,
    private eventBus: EventBus,
    private router: Router
  ) {}

  private editorIsFlat(): boolean {
    return this.router.url.includes('view:flat');
  }

  private editorIsSphere(): boolean {
    return this.router.url.includes('view:sphere');
  }

  private editorIsPreview(): boolean {
    return this.router.url.includes('view:preview');
  }

  // Edit space toggle is a draggable area for room background images
  private onFileLoad($event) {
    const fileName: string = $event.file.name;
    const binaryFileData: any = $event.binaryFileData;
    const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
    this.eventBus.onStartLoading();
    resizeImage(binaryFileData, 'backgroundImage')
      .then(resized => {
        const room: Room = this.sceneInteractor.getRoomById(activeRoomId);
        room.setFileData(fileName, resized.backgroundImage);
        room.setThumbnail(fileName, resized.thumbnail);
        this.eventBus.onSelectRoom(null, false);
        this.eventBus.onStopLoading();
      })
      .catch(error => this.eventBus.onModalMessage('Image loading error', error));
  }

  private onEditPlayChange($event) {
    if ($event.value == 1) {
      this.router.navigate(['editor', {outlets: {'view': 'preview'}}]);
    } else {
      if (this.isInFlatMode){
        this.router.navigate(['/editor', {outlets: {'view': 'flat'}}]);
      } else {
        this.router.navigate(['/editor', {outlets: {'view': 'sphere'}}]);
      }
    }
  }

  private setEditPlaySliderIsVisible(): boolean {
    return false;
  }

  private on2d3dChange($event) {
    if ($event.value == 1) {
      this.router.navigate(['editor', {outlets: {'view': 'sphere'}}]);
      this.isInFlatMode = true;
    } else {
      this.router.navigate(['/editor', {outlets: {'view': 'flat'}}]);
      this.isInFlatMode = false;
    }
  }

  private set2d3dSliderIsVisible(): boolean {
    return false;
  }

  private onFullscreenClick($event) {
    if (!this.isInFullscreen) {
      if (this.docElm.requestFullscreen) {
          this.docElm.requestFullscreen();
      } else if (this.docElm.webkitRequestFullScreen) {
          this.docElm.webkitRequestFullScreen();
      }
      /*
      else if (this.docElm.mozRequestFullScreen) {
          this.docElm.mozRequestFullScreen();
      }  else if (this.docElm.msRequestFullscreen) {
          this.docElm.msRequestFullscreen();
      }
      */
          this.isInFullscreen = true;
      } else {
          if (document.exitFullscreen) {
              document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
          }
          /*
          else if (document.mozCancelFullScreen) {
              document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
              document.msExitFullscreen();
          }
          */
          this.isInFullscreen = false;
      }
  }

  private isFullscreen(): boolean {
    return this.isInFullscreen;
  }

}
