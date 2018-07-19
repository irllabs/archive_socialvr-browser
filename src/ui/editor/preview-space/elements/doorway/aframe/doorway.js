import { getCoordinatePosition } from 'ui/editor/util/iconPositionUtil';

const DEFAULT_TRANSITION_TIME = 700;

AFRAME.registerComponent('doorway', {
  schema: {
    coordinates: {
      type: "string",
      parse(val) {
        const [x, y] = val.split(' ');
        return getCoordinatePosition(parseInt(x), parseInt(y))
      }
    },
    autoTime: {
      type: "number",
      parse(val) {
        if (val == 0) {
          return DEFAULT_TRANSITION_TIME;
        }
        return val * 1000;
      }
    },
    roomId: {
      type: "string"
    }
  },
  hideDoorway() {
    this.el.setAttribute("visible", false);
  },
  showDoorway() {
    this.el.setAttribute('visible', true);
  },
  init() {
    const { x, y, z } = this.data.coordinates;

    // Setting up position of hotspot
    this.el.object3D.position.set(x, y, z);

    // If this is true, then on completion 
    // of fading-in user should be teleported
    this.inTransitionProcess = false;

    const centerDoorwayTrigger = this.el.querySelector('.center-doorway-trigger');
    const outerDoorwayTrigger = this.el.querySelector('.outer-doorway-trigger');
    const hotspotName = this.el.querySelector('.hotspot-name');
    const hiddenMarker = this.el.querySelector('[hidden-marker]');
    const doorwayPulsatingMarker = this.el.querySelector('[doorway-pulsating-marker]');

    hiddenMarker.setAttribute('animation__fade-out', 'dur', 5000);

    this.hideDoorway = this.hideDoorway.bind(this);
    this.showDoorway = this.showDoorway.bind(this);

    //Adding event listeners
    this.el.addEventListener('hide', this.hideDoorway);
    this.el.addEventListener('show', this.showDoorway);

    outerDoorwayTrigger.addEventListener('raycaster-intersected', () => {

      doorwayPulsatingMarker.emit('scale-out');
      hiddenMarker.emit('fade-in');
      hotspotName.setAttribute('visible', true);

    });

    outerDoorwayTrigger.addEventListener('raycaster-intersected-cleared', () => {

      doorwayPulsatingMarker.emit('scale-in');
      hiddenMarker.emit('fade-out');
      hotspotName.setAttribute('visible', false);

    });

    hiddenMarker.addEventListener('animationcomplete', (e) => {

      if (e.detail.name === "animation__fade-out" && this.inTransitionProcess) {
        this.el.sceneEl.emit('switch-room-smoothly', { roomId: this.data.roomId });
      }
    })

    centerDoorwayTrigger.addEventListener('raycaster-intersected', () => {
      this.inTransitionProcess = true;
      // Setting timeout of teleportation
      hiddenMarker.setAttribute('animation__fade-out', 'dur', this.data.autoTime);
      hiddenMarker.emit('fade-out');
    });

    centerDoorwayTrigger.addEventListener('raycaster-intersected-cleared', () => {
      this.inTransitionProcess = false;
      // Rollback timeout to default value
      hiddenMarker.setAttribute('animation__fade-out', 'dur', DEFAULT_TRANSITION_TIME);
    })
  },
})
