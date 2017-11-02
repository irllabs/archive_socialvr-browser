import {
  Component,
  Input,
  Output,
  OnChanges,
  EventEmitter
} from '@angular/core';

import {SceneInteractor} from 'core/scene/sceneInteractor';
import {RoomProperty} from 'data/scene/interfaces/roomProperty';

import {RoomPropertyTypeService} from 'ui/editor/util/roomPropertyTypeService';
import {PropertyRemovalService} from 'ui/editor/util/propertyRemovalService';

@Component({
  selector: 'property-editor',
  styleUrls: ['./property-editor.scss'],
  templateUrl: './property-editor.html'
})
export class PropertyEditor {

  @Input() roomProperty: RoomProperty;
  @Output() onDeselect = new EventEmitter();

  private propertyType: string;

  constructor(
    private propertyRemovalService: PropertyRemovalService
  ) {}

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
