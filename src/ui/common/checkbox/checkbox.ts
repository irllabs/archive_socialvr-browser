import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';

import { generateUniqueId } from 'data/util/uuid';

@Component({
  selector: 'checkbox',
  styleUrls: ['./checkbox.scss'],
  templateUrl: './checkbox.html',
})
export class Checkbox {

  @Input() initialValue: boolean = false;
  @Input() disabled: boolean = false;
  @Output() changeEmitter = new EventEmitter();
  @ViewChild('input') inputElement;
  public uniqueId = generateUniqueId();

  public onChange(isChecked) {
    this.changeEmitter.emit({ value: isChecked });
  }
}
