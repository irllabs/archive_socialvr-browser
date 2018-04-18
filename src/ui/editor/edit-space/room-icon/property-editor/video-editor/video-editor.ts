import {Component, Input} from '@angular/core';
import {Video} from 'data/scene/entities/video';
import { DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';


@Component({
  selector: 'video-editor',
  styleUrls: ['./video-editor.scss'],
  templateUrl: './video-editor.html'
})
export class VideoEditor {

  @Input() videoProperty: Video;

  constructor(private sanitizer: DomSanitizer) {
  }

  get safeVideoUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.videoProperty.fullExportUrl);
  }
}
