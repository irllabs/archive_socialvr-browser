import {Component, Input} from '@angular/core';

import {Text} from 'data/scene/entities/text';

@Component({
  selector: 'text-editor',
  styleUrls: ['./text-editor.scss'],
  templateUrl: './text-editor.html'
})
export class TextEditor {

  @Input() textProperty: Text;

}
