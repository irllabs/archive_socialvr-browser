import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';

import {EventBus, EventType} from 'ui/common/event-bus';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {Room} from 'data/scene/entities/room';
import {resizeImage} from 'data/util/imageResizeService';

@Component({
  selector: 'fullscreen',
  styleUrls: ['./fullscreen.scss'],
  templateUrl: './fullscreen.html'
})
export class Fullscreen {

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
