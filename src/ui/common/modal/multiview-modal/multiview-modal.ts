import {Component, Input, Output, EventEmitter} from '@angular/core';

import {getMultiViewLink} from 'ui/editor/util/publicLinkHelper';
import {copyToClipboard} from 'ui/editor/util/clipboard';
import {ProjectInteractor} from 'core/project/projectInteractor';
import {UserInteractor} from 'core/user/userInteractor';

@Component({
  selector: 'multiview-modal',
  styleUrls: ['./multiview-modal.scss'],
  templateUrl: './multiview-modal.html'
})
export class MultiviewModal {

  @Output() onClose = new EventEmitter();
  @Input() shareableData;

  private publicLink = '';
  private projectName = '';
  private notificationIsVisible: boolean = false;

  constructor(
    private projectInteractor: ProjectInteractor,
    private userInteractor: UserInteractor
  ) {}

  ngOnInit() {
    const userId = this.shareableData.userId;
    const projectId = this.shareableData.projectId;
    this.projectInteractor.getProjectData(userId, projectId)
      .subscribe(
        projectData => {
          this.projectName = projectData.name;
          this.publicLink = getMultiViewLink(userId, projectId);
        },
        error => console.log('getProjectData error', error)
      );
    console.log('modal on init', userId, projectId);
  }

  private closeModal($event, isAccepted: boolean) {
    this.onClose.emit({isAccepted});
  }

  onPublicLinkClick($event) {
    copyToClipboard(this.publicLink)
      .then(copiedText => {
        this.notificationIsVisible = true;
        setTimeout(() => this.notificationIsVisible = false, 2000);
      })
      .catch(error => console.log('copyToClipboard error', error));
  }

}
