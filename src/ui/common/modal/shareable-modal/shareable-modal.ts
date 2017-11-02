import {Component, Input, Output, EventEmitter} from '@angular/core';

import {getShareableLink} from 'ui/editor/util/publicLinkHelper';
import {copyToClipboard} from 'ui/editor/util/clipboard';
import {ProjectInteractor} from 'core/project/projectInteractor';
import {UserInteractor} from 'core/user/userInteractor';

@Component({
  selector: 'shareable-modal',
  styleUrls: ['./shareable-modal.scss'],
  templateUrl: './shareable-modal.html'
})
export class ShareableModal {

  @Output() onClose = new EventEmitter();
  @Input() shareableData;

  private isPublic = false;
  private publicLink = '';
  private projectName = '';
  private notificationIsVisible = false;

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
          this.isPublic = projectData.is_public;
          this.projectName = projectData.name;
          if (this.isPublic) {
            const sharableLink = getShareableLink(projectData.public_url);
            this.publicLink = sharableLink;
          }
        },
        error => console.log('getProjectData error', error)
      );
  }

  private closeModal($event, isAccepted: boolean) {
    this.onClose.emit({isAccepted});
  }

  private projectIsPublic(): boolean {
    return this.isPublic;
  }

  private onCheckboxChange() {
    const userId = this.shareableData.userId;
    const projectId = this.shareableData.projectId;
    this.isPublic = !this.isPublic;
    this.projectInteractor.updateSharableStatus(userId, projectId, this.isPublic)
      .subscribe(
        response => {
          if (response.is_public) {
            const sharableLink = getShareableLink(response.public_url);
            this.publicLink = sharableLink;
          }
          else {
            this.publicLink = '';
          }
        },
        error => console.log('error', error)
      );
  }

  onPublicLinkClick($event) {
    copyToClipboard(this.publicLink);

    copyToClipboard(this.publicLink)
      .then(copiedText => {
        this.notificationIsVisible = true;
        setTimeout(() => this.notificationIsVisible = false, 2000);
      })
      .catch(error => console.log('copyToClipboard error', error));
  }

}
