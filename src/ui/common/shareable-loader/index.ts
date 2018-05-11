import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectInteractor } from 'core/project/projectInteractor';
import { MetaDataInteractor } from 'core/scene/projectMetaDataInteractor';
import { SceneInteractor } from 'core/scene/sceneInteractor';
import { UserInteractor } from 'core/user/userInteractor';
import { ERROR_OPENING_PROJECT, FORMAT_ERROR, SERVER_ERROR } from 'ui/common/constants';

import { EventBus } from 'ui/common/event-bus';
import { decodeParam } from 'ui/editor/util/publicLinkHelper';


@Injectable()
export class ShareableLoader {

  constructor(
    private userInteractor: UserInteractor,
    private eventBus: EventBus,
    private projectInteractor: ProjectInteractor,
    private metaDataInteractor: MetaDataInteractor,
    private sceneInteractor: SceneInteractor,
    private router: Router,
  ) {
  }

  openDecodedProject(projectUrl) {
    this.eventBus.onStartLoading();
    this.projectInteractor.openPublicProject(projectUrl)
      .subscribe(
        response => {
          const homeRoomID = this.sceneInteractor.getHomeRoomId();
          this.sceneInteractor.setActiveRoomId(homeRoomID);
          this.eventBus.onSelectRoom(null, false);
          this.eventBus.onStopLoading();
          this.metaDataInteractor.setIsReadOnly(true);
          //this.router.navigateByUrl('/editor');
          this.router.navigate(['editor', { outlets: { 'view': 'preview' } }]);
        },
        error => {
          this.eventBus.onStopLoading();
          this.eventBus.onModalMessage(ERROR_OPENING_PROJECT, SERVER_ERROR);
        },
      );
  }

  openProject(shareableValue: string) {
    const params = decodeParam(shareableValue);

    if (params.message === 'ERROR') {
      this.eventBus.onModalMessage(ERROR_OPENING_PROJECT, FORMAT_ERROR);
      return;
    }

    this.openDecodedProject(params.data);
  }

}
