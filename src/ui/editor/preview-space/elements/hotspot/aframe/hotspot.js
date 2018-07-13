import { getCoordinatePosition } from '../../../../util/iconPositionUtil';


AFRAME.registerComponent('hotspot', {
  schema: {
     coordinates: {
       type:"string",
       parse(val){
         const [ x, y ] = val.split(' ');
         return getCoordinatePosition(parseInt(x), parseInt(y))
       }
     }
  },
  hideHotspot(){
    this.el.setAttribute("visible", false);
  },
  showHotspot(){
    this.el.setAttribute('visible', true);
  },
  showOtherHotspots(){
    this.el.sceneEl.querySelectorAll('[hotspot]')
      .forEach(el => el.emit('show'))
  },
  hideOtherHotspots(){
    this.el.sceneEl.querySelectorAll('[hotspot]')
      .forEach(el => el !== this.el && el.emit('hide'))
  },
  showHotspotName(){
    this.hotspotName.setAttribute('visible', true);
  },
  hideHotspotName(){
    this.hotspotName.setAttribute('visible', false)
  },
  init(){
    const { x, y, z } = this.data.coordinates;

    //Setting up position of hotspot
    this.el.object3D.position.set(x,y,z);

    //Caching triggers
    this.centerHotspotTrigger = this.el.querySelector('.center-hotspot-trigger');
    this.outerHotspotTrigger = this.el.querySelector('.outer-hotspot-trigger');

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

    this.outerHotspotTrigger.addEventListener('raycaster-intersected',() => {
      this.pulsatingMarker.emit('scale-out');
      this.hiddenMarker.emit('fade-in');
      this.showHotspotName();
    });

    this.outerHotspotTrigger.addEventListener('raycaster-intersected-cleared',() => {
      this.pulsatingMarker.emit('scale-in');
      this.hiddenMarker.emit('fade-out');
      this.hideHotspotName();
    });

    this.centerHotspotTrigger.addEventListener('raycaster-intersected',() => {
      this.hiddenMarker.emit('fade-out');
      this.pulsatingMarker.emit('scale-out');
      this.hotspotContent.emit('show-content');
      this.hideOtherHotspots();
      this.hideHotspotName();
    });

    this.centerHotspotTrigger.addEventListener('raycaster-intersected-cleared',() => {
      this.hiddenMarker.emit('fade-in');
      this.hotspotContent.emit('hide-content');
      this.showOtherHotspots();
      this.showHotspotName();
    })
  }
})
