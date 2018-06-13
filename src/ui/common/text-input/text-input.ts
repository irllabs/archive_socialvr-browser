import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'text-input',
  styleUrls: ['./text-input.scss'],
  templateUrl: './text-input.html',
})
export class TextInput {

  @Input() isHotspot: boolean = false;
  @Input() isRowItem: boolean = false;
  @Input() isActive: boolean = false;
  @Input() isRoomName: boolean = false;
  @Input() isHotspotTitle: boolean = false;
  @Input() textModel: string;
  @Output() onTextChange = new EventEmitter();

  private onModelChange($event) {
    this.onTextChange.emit({
      text: $event,
    });
  }

}
