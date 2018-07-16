AFRAME.registerComponent('pulsating-marker', {
  animationPulsation: {
    property: 'scale',
    from: '1 1 1',
    to: '1.3 1.3 1.3',
    loop: true,
    dur: 700,
    dir: 'alternate'
  },
  animationScaleOut: {
    property: 'scale',
    to: '.001 .001 .001',
    dur: 500,
    startEvents: 'start-scale-out',
    pauseEvents: 'stop-scale-out'
  },
  animationScaleIn: {
    property: 'scale',
    dur: 500,
    to: '1 1 1',
    startEvents: 'start-scale-in',
    pauseEvents: 'stop-scale-in'
  },
  init() {
    this.scaleIn = this.scaleIn.bind(this);
    this.scaleOut = this.scaleOut.bind(this);

    this.pulsatingHotspot = document.createElement('a-image');
    this.pulsatingHotspot.setAttribute('alpha-test', .5);
    this.pulsatingHotspot.setAttribute('animation__scale-in', this.animationScaleIn);
    this.pulsatingHotspot.setAttribute('animation__scale-out', this.animationScaleOut);
    this.pulsatingHotspot.setAttribute('src', 'assets/icons/icon-hotspot-default.png');

    this.el.setAttribute('animation__pulsation', this.animationPulsation);

    this.el.appendChild(this.pulsatingHotspot);

    this.el.addEventListener('scale-in', this.scaleIn);
    this.el.addEventListener('scale-out', this.scaleOut);
  },
  scaleIn() {
    const { pulsatingHotspot } = this
    const vectorFrom = pulsatingHotspot.getAttribute('scale').clone();

    pulsatingHotspot.emit('stop-scale-out');
    pulsatingHotspot.setAttribute('animation__scale-in', 'from', vectorFrom)
    pulsatingHotspot.emit('start-scale-in');
  },
  scaleOut() {
    const { pulsatingHotspot } = this
    const vectorFrom = pulsatingHotspot.getAttribute('scale').clone();
    pulsatingHotspot.emit('stop-scale-in');
    pulsatingHotspot.setAttribute('animation__scale-out', 'from', vectorFrom);
    pulsatingHotspot.emit('start-scale-out')
  }
})
