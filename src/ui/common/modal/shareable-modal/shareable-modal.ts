import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import * as QRCode from 'qrcode';

import {ApiService} from 'data/api/apiService';
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
  @ViewChild('qrCodeElem') qrCodeElem;
  private isPublic = false;
  private publicLink = '';
  private projectName = '';
  private notificationIsVisible = false;

  constructor(
    private projectInteractor: ProjectInteractor,
    private userInteractor: UserInteractor,
    private apiService: ApiService,
  ) {}


  ngOnInit() {
    const userId = this.shareableData.userId;
    const projectId = this.shareableData.projectId;
    this.projectInteractor.getProjectData(userId, projectId)
      // Update fields from response
      .map(
        response => {
          this.publicLink = getShareableLink(response.public_url);
          this.isPublic = response.is_public;
          this.projectName = response.name;
          return this.isPublic ? this.publicLink : null
        }
      )
      // Pipe to Google API to shorten
      .flatMap(
        publicLink => publicLink ? this.apiService.getShortenedUrl(publicLink) : Observable.empty()
      )
      .subscribe(
        shortenedUrl => {
          this.publicLink = shortenedUrl;
          this.setQRCode(this.publicLink);
        },
        error => console.error('getShortUrl error', error),
      )
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
      // Update fields from response
      .map(response => {
        this.publicLink = getShareableLink(response.public_url);
        this.isPublic = response.is_public
        return this.isPublic ? this.publicLink : null
      })
      // Pipe to Google API to shorten
      .flatMap(
        publicLink => publicLink ? this.apiService.getShortenedUrl(publicLink) : Observable.empty()
      )
      .subscribe(
        shortenedUrl => {
          this.publicLink = shortenedUrl;
          this.setQRCode(this.publicLink);
        },
        error => console.error('getShortUrl error', error),
      );
  }

  setQRCode(link: string) {
    QRCode.toCanvas(
      this.qrCodeElem.nativeElement,
      link,
      (error) => error ? console.error(error) : console.log('generated QR')
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
