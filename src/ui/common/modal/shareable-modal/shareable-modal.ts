import {
  Component,
  Input,
  Output,OnInit,
  EventEmitter,AfterViewInit,
  ViewChild,ElementRef
} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import * as QRCode from 'qrcode';
import { RequestOptions } from '@angular/http'
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
  @ViewChild('qrCodeElem') qrCodeElement;
  //@ViewChild('abc')abc: ElementRef;
  private isPublic = false;
  private publicLink = '';
  private projectName = '';
  private notificationIsVisible = false;
  private newLink = '';
  private newLinkkk = '';

  constructor(
    private projectInteractor: ProjectInteractor,
    private userInteractor: UserInteractor,
    private apiService: ApiService,

  ) {

  }


  ngOnInit() {

  }

    ngAfterViewInit() {

        const userId = this.shareableData.userId;
        const projectId = this.shareableData.projectId;
        this.projectInteractor.getProjectData(userId, projectId).map(
            response => {
              const publicLink = getShareableLink(response.public_url);
              //console.log(publicLink);
              this.newLink = publicLink;
              //this.getUrl(publicLink);
              this.isPublic = response.is_public;
              this.projectName = response.name;
              return this.isPublic ? publicLink : null;



            }

        )
       //.flatMap(
            //this.apiService.getShortenedUrl( this.newLink);
            //this.newLinkkk => this.newLink ? this.apiService.getShortenedUrl2(this.newLink) : Observable.empty();
           //console.log(this.newLinkkk);
         //)
         .subscribe(
            shortenedUrl => {


              //this.someMethod(this.newLink);
                //console.log(this.publicLink);
                this.apiService.getShortenedUrl2(this.newLink).subscribe(res => {
                    console.log(res);
                    this.publicLink = res;
                    setTimeout(() => {
                    QRCode.toCanvas(
                      this.qrCodeElement.nativeElement,
                      this.publicLink,
                      (error) => error ? console.error(error) : console.log('generated QR')
                    );

                }, 1000);

                  });
                console.log(this.publicLink);

              //this.setQRCode(this.newLink);
            },
            error => console.error('getShortUrl error', error),
          )





    }

    private someMethod() {
        console.log(this.newLink);
        this.apiService.getShortenedUrl2(this.newLink).subscribe(res => {
        console.log(res);
        this.publicLink = res;
      });
    }
    private newFunction(){
        const userId = this.shareableData.userId;
        const projectId = this.shareableData.projectId;
        console.log(projectId);
        this.projectInteractor.getProjectData(userId, projectId).map(
            response => {
              const publicLink = getShareableLink(response.public_url);
              console.log(publicLink);
              this.newLink = publicLink;
              //this.getUrl(publicLink);
              this.isPublic = response.is_public;
              this.projectName = response.name;
              return this.isPublic ? publicLink : null
            }
        ).subscribe(
            shortenedUrl => {
            //console.log(this.newLink);
              this.publicLink = this.newLink;
               console.log(this.publicLink);

              //this.setQRCode(this.newLink);
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
    console.log("sssssssssssssssss");
    const userId = this.shareableData.userId;
    const projectId = this.shareableData.projectId;
    this.isPublic = !this.isPublic;
    this.projectInteractor.updateSharableStatus(userId, projectId, this.isPublic)
      // Update fields from response
      .map(response => {
        const publicLink = getShareableLink(response.public_url);
        this.newLink = publicLink;
        this.isPublic = response.is_public
        return this.isPublic ? publicLink : null
      })
      // Pipe to Google API to shorten
      //.flatMap(
        //publicLink => publicLink ? this.apiService.getShortenedUrl(publicLink) : Observable.empty()
      //)
      .subscribe(
        shortenedUrl => {
          this.apiService.getShortenedUrl2(this.newLink).subscribe(res => {
                    console.log(res);
                    this.publicLink = res;
                    setTimeout(() => {
                    QRCode.toCanvas(
                      this.qrCodeElement.nativeElement,
                      this.publicLink,
                      (error) => error ? console.error(error) : console.log('generated QR')
                    );

                }, 1000);

           });
        },
        error => console.error('getShortUrl error', error),
      );
  }

  setQRCode(link: string) {
     console.log(link);
    QRCode.toCanvas(
      this.qrCodeElement.nativeElement,
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
