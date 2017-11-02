import {Component, Input, Output, EventEmitter} from '@angular/core';


@Component({
  selector: 'text-input-material',
  styleUrls: ['./text-input-material.scss'],
  templateUrl: './text-input-material.html'
})
export class TextInputMaterial {

  @Input() inputType: string = 'text';
  @Input() inputLabel: string = '';
  @Input() textModel: string;
  @Output() onTextChange = new EventEmitter();
  @Output() onBlurEvent = new EventEmitter();

  private onModelChange($event) {
    this.onTextChange.emit({ text: $event });
  }

  private onBlur($event) {
    this.onBlurEvent.emit({ text: $event });
  }

}
