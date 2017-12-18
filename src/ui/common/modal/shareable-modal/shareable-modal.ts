import {Component, Input, Output, EventEmitter} from '@angular/core';

import {getShareableLink} from 'ui/editor/util/publicLinkHelper';
import {copyToClipboard} from 'ui/editor/util/clipboard';
import {ProjectInteractor} from 'core/project/projectInteractor';
import {UserInteractor} from 'core/user/userInteractor';

//added by ali for URL shortening
//var googl = require('goo.gl');
var goorl = require("goorl");

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
  //for goorl module url shortening
  private goorlOptions = {
    key: 'AIzaSyB6v7PJhqFaoC4fHQZ4ZpZtDCfo-CCl8qA',
    url: 'http://irl.studio'
  }

  constructor(
    private projectInteractor: ProjectInteractor,
    private userInteractor: UserInteractor
  ) {}


  ngOnInit() {
    //added by ali for url shortening, with googl module
    //googl.setKey('AIzaSyB6v7PJhqFaoC4fHQZ4ZpZtDCfo');

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

            //by ali to shorten URL
            //original line was:

            //this.publicLink = sharableLink;

            //with googl module
            // googl.shorten(sharableLink)
            //   .then(function (shortUrl) {
            //       console.log(shortUrl);
            //       this.publicLink = shortUrl;
            //   })
            //   .catch(function (err) {
            //       console.error(err.message);
            //   });
            //by ali to shorten url, for goorl module
            this.goorlOptions.url = sharableLink;
            goorl(this.goorlOptions)
              .then(url => {
                console.log("short ulr: ",url);
                this.publicLink = url;})
              .catch(error => console.error(error))


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
