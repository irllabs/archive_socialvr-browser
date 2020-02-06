import { Component, ElementRef, EventEmitter, HostListener, Input, NgZone, Output, ViewChild } from '@angular/core';
import { Door } from 'data/scene/entities/door';
import { Vector2 } from 'data/scene/entities/vector2';
import { RoomProperty } from 'data/scene/interfaces/roomProperty';
import { Subscription } from 'rxjs/Subscription';

import { ICON_PATH, ROOM_ICON_BUFFER_HEIGHT, ROOM_ICON_BUFFER_WIDTH } from 'ui/common/constants';
import { EventBus, EventType } from 'ui/common/event-bus';

import { Hotspot } from 'ui/editor/interfaces/hotspot';
import { CombinedHotspotUtil } from 'ui/editor/util/combinedHotspotUtil';

import { denormalizePosition, normalizeAbsolutePosition } from 'ui/editor/util/iconPositionUtil';
import { PropertyRemovalService } from 'ui/editor/util/propertyRemovalService';
import { RoomPropertyTypeService } from 'ui/editor/util/roomPropertyTypeService';
import { MetaDataInteractor } from '../../../../../core/scene/projectMetaDataInteractor';
import { debug } from 'util';
const el: HTMLElement = document.getElementById('draggableIcon');


const ICON_MAP = {
  universal: 'icon-add.png',

  text: 'icon-text.png',
  textAudio: 'icon-text-audio.png',

  image: 'icon-image.png',
  imageText: 'icon-image-text.png',
  imageAudio: 'icon-image-audio.png',
  imageTextAudio: 'icon-image-text-audio.png',
  audio: 'icon-audio.png',

  video: 'icon-video.png',
  door: 'icon-doorhotspot.png',
  link: 'link_filled.png',
};

const iconSizes = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
};

function getObject(){
  var targeta = event.target;
  console.log("test")
}

const instanceSet: Set<RoomIcon> = new Set<RoomIcon>();

window.addEventListener('resize', $event =>
  instanceSet.forEach((instance: RoomIcon) => instance.onResize()),
);

const ROUND_UNIT: number = 0.5;

function round(n: number, precision: number): number {
  return Math.round(n * precision) / precision;
}

function snapToGrid(position: Vector2): Vector2 {
  return new Vector2(
    round(position.getX(), ROUND_UNIT),
    round(position.getY(), ROUND_UNIT),
  );
}


@Component({
  selector: 'room-icon',
  styleUrls: ['./room-icon.scss'],
  templateUrl: './room-icon.html',
})
export class RoomIcon implements Hotspot {

  @ViewChild('iconElement') iconElement;
  @Output() onIconDragEnd = new EventEmitter();
  @Input() roomProperty: RoomProperty;

  private propertyEditorIsVisible: boolean = false;
  private screenPosition: Vector2 = new Vector2(0, 0);
  private iconPath: string;
  private subscriptions: Set<Subscription> = new Set<Subscription>();
  private windowDimensions: Vector2 = new Vector2(window.innerWidth, window.innerHeight);
  private isPossibleCombinedHotspot: boolean = false;
  private propertyType: string;
  private hotspotIconSize: string = iconSizes.LARGE;
  private deleteVisible: boolean = false;
  private isBeingInstantiated: boolean = false;

  private Xposition: number;
  private YPosition: number;

  constructor(
    protected eventBus: EventBus,
    private propertyRemovalService: PropertyRemovalService,
    private combinedHotspotUtil: CombinedHotspotUtil,
    protected ngZone: NgZone,
    private element: ElementRef,
    private metaDataInteractor: MetaDataInteractor
  ) {
  }

  @HostListener('document:click', ['$event'])
  private onDocumentClick($event) {
    const isClicked: boolean = this.element.nativeElement.contains($event.target);

    if (!isClicked) {
      this.setPropertyEditorVisibility(false);
    }
  }
  removeDummy() {
    var elem = document.getElementById('icon-element');
    elem.parentNode.removeChild(elem);
    return false;
  }

  isCollapsed(x: number, y: number){
    /*var rect = document.getElementById("icon-element");
    var dragMe = document.getElementById("icon-element");*/
    // var rect = document.querySelectorAll("#icon-element");
    console.log(x);
     console.log(y);
    var dragMe = document.querySelectorAll("#icon-element");
    var rect;
    rect = document.querySelectorAll("#icon-element");
    //const numBoxes = dragMe.length;
    console.log(el);
    
    

    for(var i = 0; i < dragMe.length; ++i) {
      for(var j = i+1; j< dragMe.length; ++j){
      //result = el[i];
      console.log("//////////////////////////////////////////" + j)
      
  
      var object_1 = dragMe[i].getBoundingClientRect();
      console.log(object_1);
      console.log(object_1.left, object_1.top)
      var object_2 = rect[j].getBoundingClientRect();
      console.log(object_2)
      console.log(object_2.left, object_2.top)
      console.log("=======================================")
      console.log(dragMe.length)
      console.log(dragMe)
      console.log(rect)
      
      
      
      
      
      if((dragMe.length>=i+1 )){
        console.log("primer if")
          if((object_1.left + object_1.height > object_2.left &&
              object_1.left < object_2.left + object_2.width) 
            &&
            ( object_1.top + object_1.height > object_2.top &&
              object_1.top < object_2.top + object_2.height ) )         
            {
              console.log("overlaping");
              this.iconElement.nativeElement.style.top = `${y}px`;
              this.iconElement.nativeElement.style.left = `${x}px`;
              
          }else{
            console.log("isn't overlpaing or the array is smaller than the iterator" )
            
          }
        }else{console.log("isn't working")}
      }
      console.log("incrementa i")
   }
    /*if(object_1[0].left > object_2[1].left + object_2[1].width  && object_1[0].left + object_1[0].width  > object_2[1].left &&
      object_1[0].top < object_2[1].top + object_2[1].height && object_1[0].top + object_1[0].height > object_2[1].top){
      console.log("Heeeeeeeeeeeeeeeeeeeeeee");
    }else{
      console.log("Hiiiiiiiiiiiiiiiiiiiiiiii");
      console.log(object_1[0].left);
      console.log(object_2[1].left);
    }*/

    // if(rect[0] + dragMe[1].left > 5){

    // }else{

    // }
  }  
    

  ngOnInit() {

    this.propertyType = RoomPropertyTypeService.getTypeString(this.roomProperty);


    this.subscriptions.add(
      this.eventBus.getObservable(EventType.SELECT_PROPERTY)
        .subscribe(
          event => {
            // if a door is added and there are more than 2 rooms, then open the property editor
            if (event.shouldOpenEditor && event.propertyId === this.roomProperty.getId()) {
              this.setPropertyEditorVisibility(true);
            }
          },
          error => console.log('error', error),
        ),
    );

    this.updatePosition();
    this.onResize();
    instanceSet.add(this);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    instanceSet.delete(this);
  }

  getIconPath() {
    const propertyIcon = this.roomProperty.getIcon();

    return `${ICON_PATH}${propertyIcon !== null ? propertyIcon : ICON_MAP[this.propertyType]}`;
  }

  setPosition(location: Vector2) {
    const absolutePosition: Vector2 = denormalizePosition(location.getX(), location.getY());
    const adjustedX: number = absolutePosition.getX() - ROOM_ICON_BUFFER_WIDTH;
    const adjustedY: number = absolutePosition.getY() - ROOM_ICON_BUFFER_HEIGHT;
    this.setPixelLocation(adjustedX, adjustedY);
    this.setScreenPosition(absolutePosition.getX(), absolutePosition.getY());
  }

  // Hotspot interface method
  setPixelLocationWithBuffer(x: number, y: number) {
    const adjustedX: number = x - ROOM_ICON_BUFFER_WIDTH;
    const adjustedY: number = y - ROOM_ICON_BUFFER_HEIGHT;
    this.setScreenPosition(adjustedX, adjustedY);
    this.setPixelLocation(adjustedX, adjustedY);
  }

  // $sidebar-width: 280px;
  // $property-editor-height: 200px;
  setScreenPosition(x: number, y: number) {
    const shift = {
      right: x < (280 / 2),
      left: x > this.windowDimensions.getX() - (280 / 2),
      up: y > this.windowDimensions.getY() - 200,
    };
    this.screenPosition.setPosition(x, y);
  }

  // Hotspot interface method
  //set absolute screen position without updating the data model
  setPixelLocation(x: number, y: number) {
    this.iconElement.nativeElement.style.top = `${y}px`;
    this.iconElement.nativeElement.style.left = `${x}px`;
  }

  onMouseDown($event){
     this.Xposition= $event.x ;
     this.YPosition=$event.y;
     console.log(this.Xposition);
     console.log(this.YPosition);
    
      event.stopPropagation();
  }

  onMove($event) {
 
    event.stopPropagation();
    const x: number = $event.x + ROOM_ICON_BUFFER_WIDTH;
    const y: number = $event.y + ROOM_ICON_BUFFER_HEIGHT;
  
    var dragHotspot = document.querySelectorAll("#icon-element");
    var objectHotspot = dragHotspot[0].getBoundingClientRect();

  //   for(var i = 0; i < dragHotspot.length; ++i) {
  //     //result = el[i];
  //     console.log(dragHotspot[i])
  // }
    if ($event.shiftKey) {
      if (this.onIconDragEnd.observers.length) {
        // snap to grid in 3D view
        this.onIconDragEnd.emit({
          setIconLocation: (x: number, y: number) => {
            this.setLocation(snapToGrid(new Vector2(x, y)));
          },
          x: x,
          y: y,
        });
      } else {
        // snap to grid in 2D view
        const normalizedLocation: Vector2 = normalizeAbsolutePosition(x, y);
        const snappedLocation: Vector2 = snapToGrid(normalizedLocation);
        const denormalizedPosition: Vector2 = denormalizePosition(snappedLocation.getX(), snappedLocation.getY());
        this.setScreenPosition(denormalizedPosition.getX(), denormalizedPosition.getY());
        this.setPixelLocation(
          denormalizedPosition.getX() - ROOM_ICON_BUFFER_WIDTH,
          denormalizedPosition.getY() - ROOM_ICON_BUFFER_HEIGHT,
        );
      }
    } else {
      // don't snap to grid
      this.setScreenPosition(x, y);
      this.setPixelLocation($event.x, $event.y);
    }
    return false;
    //this.combinedHotspotUtil.onIconMove(this.roomProperty, x, y);
  }

  onMoveEnd($event) {
    if (!$event.didMove) {
      setTimeout(() => {
        this.setPropertyEditorVisibility(true);
      }, 200);      //this.setPropertyEditorVisibility(true);
      return;
    }else{
      //this.setPixelLocation($event.x, $event.y);
      //console.log("Dragggggggggggg");
      //this.removeDummy();
      //this.isCollapsed($event.x+(Math.random()* (-200)), $event.y+(Math.random()* (200)));
      this.isCollapsed(this.Xposition,this.YPosition)
    }

    const adjustedX: number = $event.x + ROOM_ICON_BUFFER_WIDTH;
    const adjustedY: number = $event.y + ROOM_ICON_BUFFER_HEIGHT;

    // if parent components are observing onIconDragEnd
    // (such as edit-space-sphere), then notify parent
    // with coordinates and callback function to set model position
    if (this.onIconDragEnd.observers.length) {
      this.onIconDragEnd.emit({
        setIconLocation: (x: number, y: number) => {
          let location: Vector2 = new Vector2(x, y);
          if (!$event.shiftKey) {
            location = snapToGrid(location);
          }
          // this.roomProperty.setLocation(location);
          this.setLocation(location);
        },
        x: adjustedX,
        y: adjustedY,
      });
    }
    // if parent components are not observing onIconDragEnd
    // (such as edit-space-flat), then simply set the model position
    else {
      let location: Vector2 = normalizeAbsolutePosition(adjustedX, adjustedY);
      if (!$event.shiftKey) {
        location = snapToGrid(location);
      }
      // this.roomProperty.setLocation(location);
      this.setLocation(location);
    }

    // TODO: combined hotspot logic
    //const activeNeighborId: string = this.combinedHotspotUtil.getActiveNeighborId();
  }

  // Hotspot interface method
  getScreenPosition(): Vector2 {
    return this.screenPosition;
  }

  setPropertyEditorVisibility(isVisible: boolean) {
    if (this.propertyEditorIsVisible === isVisible) {
      return;
    }
    this.ngZone.run(() => {
      this.propertyEditorIsVisible = isVisible;
      this.eventBus.onHotspotVisibility(isVisible);
    });
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.windowDimensions.setX(width);
    this.windowDimensions.setY(height);
    if (width < 767) {
      this.hotspotIconSize = iconSizes.SMALL;
    }
    else if (width < 992) {
      this.hotspotIconSize = iconSizes.MEDIUM;
    }
    else {
      this.hotspotIconSize = iconSizes.LARGE;
    }
  }

  updatePosition() {
    this.setPosition(this.roomProperty.getLocation());
  }

  // Hotspot interface method
  getName(): string {
    return this.roomProperty.getName();
  }

  onNameChange($event) {
    this.roomProperty.setName($event.text);

    if (this.propertyIs('door')) {
      (this.roomProperty as Door).setNameIsCustom(true);
    }

    this.metaDataInteractor.onProjectChanged();
  }

  propertyIs(propertyType: string): boolean {
    return this.propertyType === propertyType;
  }

  onSelect($event) {
    this.eventBus.onSelectProperty(this.roomProperty.getId(), false);
  }

  onDeselect($event) {
    this.propertyEditorIsVisible = false;
    this.eventBus.onHotspotVisibility(this.propertyEditorIsVisible);
  }

  onDeleteClick($event) {
    this.propertyRemovalService.removeProperty(this.roomProperty);
  }

  onMouseOver($event) {
    this.deleteVisible = true;
  }

  isPossibleHotspot(): boolean {
    return this.roomProperty.getPossibleCombinedHotspot();
  }

  setIsPossibleHotsport(isPossibleCombinedHotspot: boolean) {
    this.roomProperty.setPossibleCombinedHotspot(isPossibleCombinedHotspot);
  }

  getLocation(): Vector2 {
    return this.roomProperty.getLocation();
  }

  setLocation(location: Vector2) {
    this.roomProperty.setLocation(location);
    this.metaDataInteractor.onProjectChanged();
  }

}
