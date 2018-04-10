import {Component, Input} from '@angular/core';

import {Video} from 'data/scene/entities/video';

@Component({
  selector: 'video-editor',
  styleUrls: ['./video-editor.scss'],
  templateUrl: './video-editor.html'
})
export class VideoEditor {

  @Input() videoProperty: Video;

}
