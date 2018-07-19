import { ICON_PATH, IMAGE_PATH } from 'ui/common/constants';


AFRAME.registerComponent('doorway-pulsating-marker', {
  init() {
    const { el } = this;

    this.scaleIn = this.scaleIn.bind(this);
    this.scaleOut = this.scaleOut.bind(this);

    this.pulsatingHotspot = this.el.querySelector('a-image');

    el.addEventListener('scale-in', this.scaleIn);
    el.addEventListener('scale-out', this.scaleOut);

  },
  scaleIn() {
    const { pulsatingHotspot } = this;
    const vectorFrom = pulsatingHotspot.getAttribute('scale').clone();

    pulsatingHotspot.emit('stop-scale-out');
    pulsatingHotspot.setAttribute('animation__scale-in', 'from', vectorFrom);
    pulsatingHotspot.emit('start-scale-in');

  },
  scaleOut() {
    const { pulsatingHotspot } = this;
    const vectorFrom = pulsatingHotspot.getAttribute('scale').clone();

    pulsatingHotspot.emit('stop-scale-in');
    pulsatingHotspot.setAttribute('animation__scale-out', 'from', vectorFrom);
    pulsatingHotspot.emit('start-scale-out');
  }
})
