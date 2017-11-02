import {Component, Input, Output, EventEmitter, ViewChild} from '@angular/core';

import {generateUniqueId} from 'data/util/uuid';

@Component({
  selector: 'checkbox',
  styleUrls: ['./checkbox.scss'],
  templateUrl: './checkbox.html'
})
export class Checkbox {

  @Input() initialValue: boolean = false;
  @Output() changeEmitter = new EventEmitter();
  @ViewChild('input') inputElement;
  private uniqueId = generateUniqueId();

  private onChange(isChecked) {
    this.changeEmitter.emit({value: isChecked});
  }

}
