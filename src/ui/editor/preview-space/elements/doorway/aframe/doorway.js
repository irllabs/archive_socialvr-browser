import { getCoordinatePosition } from '../../../../util/iconPositionUtil';

AFRAME.registerComponent('doorway', {
  schema: {
    coordinates: {
      type: "string",
      parse(val) {
        const [x, y] = val.split(' ');
        return getCoordinatePosition(parseInt(x), parseInt(y))
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
  getPulsatingMarker() {
    this.pulsatingMarker = this.pulsatingMarker || this.el.querySelector('[doorway-pulsating-marker]');
    return this.pulsatingMarker
  },
  getHiddenMarker() {
    this.hiddenMarker = this.hiddenMarker || this.el.querySelector('[hidden-marker]');
    return this.hiddenMarker;
  },
  init() {
    const { x, y, z } = this.data.coordinates;

    //Setting up position of hotspot
    this.el.object3D.position.set(x, y, z);

    const centerDoorwayTrigger = this.el.querySelector('.center-doorway-trigger');
    const outerDoorwayTrigger = this.el.querySelector('.outer-doorway-trigger');
    const hotspotName = this.el.querySelector('.hotspot-name');

    this.hideDoorway = this.hideDoorway.bind(this);
    this.showDoorway = this.showDoorway.bind(this);

    //Adding event listeners
    this.el.addEventListener('hide', this.hideDoorway);
    this.el.addEventListener('show', this.showDoorway);

    outerDoorwayTrigger.addEventListener('raycaster-intersected', () => {
      this.getPulsatingMarker().emit('scale-out');
      this.getHiddenMarker().emit('fade-in');
      hotspotName.setAttribute('visible', true);
    });

    outerDoorwayTrigger.addEventListener('raycaster-intersected-cleared', () => {
      this.getPulsatingMarker().emit('scale-in');
      this.getHiddenMarker().emit('fade-out');
      hotspotName.setAttribute('visible', false);
    });

    centerDoorwayTrigger.addEventListener('raycaster-intersected', () => {
      this.switchRoomTimeout = setTimeout(() => {
        this.getHiddenMarker().emit('fade-out');
        this.el.sceneEl.emit('switch-room-smoothly', { roomId: this.data.roomId });
      }, 1500);
    });

    centerDoorwayTrigger.addEventListener('raycaster-intersected-cleared', () => {
      this.getHiddenMarker().emit('fade-in');
      clearTimeout(this.switchRoomTimeout);
    })
  },
})
