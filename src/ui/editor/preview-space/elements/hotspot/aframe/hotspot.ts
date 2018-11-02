import { getCoordinatePosition } from 'ui/editor/util/iconPositionUtil';


AFRAME.registerComponent('hotspot', <any>{
  schema: {
    coordinates: {
      type: "string",
      parse(val) {
        const [x, y] = val.split(' ');
        return getCoordinatePosition(parseInt(x), parseInt(y))
      }
    },
    isAudioOnly: {
      type: "boolean",
    }
  },
  hideHotspot() {
    this.el.setAttribute("visible", false);
  },
  showHotspot() {
    this.el.setAttribute('visible', true);
  },
  showOtherHotspots() {
    this.el.sceneEl.querySelectorAll('.hotspot, .doorway')
      .forEach(el => el.emit('show'))
  },
  hideOtherHotspots() {
    this.el.sceneEl.querySelectorAll('.hotspot, .doorway')
      .forEach(el => el !== this.el && el.emit('hide'))
  },
  showHotspotName() {
    this.hotspotName.setAttribute('visible', true);
  },
  hideHotspotName() {
    this.hotspotName.setAttribute('visible', false)
  },
  init() {
    const { x, y, z } = this.data.coordinates;

    //If content revealed, then it should be
    // hidden after clear intersection of content zone
    this.contentIsActive = false;

    //Setting up position of hotspot
    this.el.object3D.position.set(x, y, z);

    //Caching triggers
    this.centerTrigger = this.el.querySelector('.center-trigger');
    this.outerTrigger = this.el.querySelector('.outer-trigger');
    this.contentZoneTrigger = this.el.querySelector('.content-zone-trigger');
    
    //Caching elements
    this.hotspotContent = this.el.querySelector('[hotspot-content]');
    this.hiddenMarker = this.el.querySelector('[hidden-marker]');
    this.pulsatingMarker = this.el.querySelector('[pulsating-marker]');
    this.hotspotName = this.el.querySelector('.hotspot-name');

    //Binding current scope to event`s callbacks
    this.hideHotspot = this.hideHotspot.bind(this);
    this.showHotspot = this.showHotspot.bind(this);

    //Adding event listeners
    this.el.addEventListener('hide', this.hideHotspot);
    this.el.addEventListener('show', this.showHotspot);
    
    
    this.outerTrigger.addEventListener('raycaster-intersected', () => {
      this.pulsatingMarker.emit('scale-out');
      this.hiddenMarker.emit('fade-in');
      this.showHotspotName();
    });

    this.outerTrigger.addEventListener('raycaster-intersected-cleared', () => {
      this.pulsatingMarker.emit('scale-in');
      this.hiddenMarker.emit('fade-out');
      this.hideHotspotName();
    });

    this.centerTrigger.addEventListener('raycaster-intersected', () => {
      if(this.contentIsActive) return;

      this.contentIsActive = true;

      if(!this.data.isAudioOnly){
        this.hiddenMarker.emit('fade-out');
      }

      this.pulsatingMarker.emit('scale-out');
      this.hotspotContent.emit('show-content');
      this.hideOtherHotspots();
      this.hideHotspotName();
    });

    this.contentZoneTrigger.addEventListener('raycaster-intersected-cleared', () => {
      
      if(!this.data.isAudioOnly){
        this.hiddenMarker.emit('fade-in');
      }
      this.hotspotContent.emit('hide-content');
      this.showOtherHotspots();
      this.showHotspotName();
      this.contentIsActive = false;
    });
  }
})
