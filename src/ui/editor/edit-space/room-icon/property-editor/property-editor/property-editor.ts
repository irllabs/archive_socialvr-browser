import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RoomProperty } from 'data/scene/interfaces/roomProperty';
import { PropertyRemovalService } from 'ui/editor/util/propertyRemovalService';

import { RoomPropertyTypeService } from 'ui/editor/util/roomPropertyTypeService';

@Component({
  selector: 'property-editor',
  styleUrls: ['./property-editor.scss'],
  templateUrl: './property-editor.html',
})
export class PropertyEditor {

  @Input() roomProperty: RoomProperty;
  @Output() onDeselect = new EventEmitter();

  private propertyType: string;

  constructor(
    private propertyRemovalService: PropertyRemovalService,
  ) {
  }

  getName(): string {
    return this.roomProperty.getName();
  }

  onNameChange($event) {
    this.roomProperty.setName($event.text);
  }

  deleteProperty() {
    if (!this.roomProperty) {
      return;
    }
    this.propertyRemovalService.removeProperty(this.roomProperty);
  }

  ngOnChanges(changes) {
    if (!changes.roomProperty || !changes.roomProperty.currentValue) {
      return;
    }
    this.propertyType = RoomPropertyTypeService.getTypeString(this.roomProperty);
  }

  private getPropertyName(): string {
    return this.roomProperty.getName();
  }

  private propertyIs(propertyType: string) {
    return this.propertyType === propertyType;
  }

  private showNameEditor(): boolean {
    return this.propertyType !== 'door';
  }

}
