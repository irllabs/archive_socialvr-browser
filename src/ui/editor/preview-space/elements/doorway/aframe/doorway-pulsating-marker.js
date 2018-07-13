AFRAME.registerComponent('doorway-pulsating-marker', {
  animationPulsation: {
    property:'scale',
    from: '1 1 1',
    to: '.001 .001 .001',
    loop: true,
    dur: 1500,
    dir: "normal"
  },
  animationScaleOut: {
    property:'scale',
    to: '.001 .001 .001',
    dur: 200,
    startEvents: 'start-scale-out',
    pauseEvents: 'stop-scale-out'
  },
  animationScaleIn: {
    property: 'scale',
    dur: 200,
    to: '1 1 1',
    startEvents: 'start-scale-in',
    pauseEvents: 'stop-scale-in'
  },
  init(){
    const { el } = this;
    this.scaleIn = this.scaleIn.bind(this);
    this.scaleOut = this.scaleOut.bind(this);

    this.pulsatingHotspot = document.createElement('a-image');
    this.pulsatingHotspot.setAttribute('animation__scale-out', this.animationScaleOut);
    this.pulsatingHotspot.setAttribute('animation__scale-in', this.animationScaleIn);
    this.pulsatingHotspot.setAttribute('src', 'assets/icons/icon-hotspot-default.png');
    this.pulsatingHotspot.setAttribute('apha-test', .5);

    el.setAttribute('animation__pulsation', this.animationPulsation);
    el.appendChild(this.pulsatingHotspot);
    el.addEventListener('scale-in', this.scaleIn);
    el.addEventListener('scale-out', this.scaleOut);

  },
  scaleIn(){
    const { pulsatingHotspot } = this;
    const { x, y, z } = pulsatingHotspot.getAttribute('scale');

    pulsatingHotspot.emit('stop-scale-out');
    pulsatingHotspot.setAttribute('animation__scale-in', 'from', new THREE.Vector3(x, y, z))
    pulsatingHotspot.emit('start-scale-in');

  },
  scaleOut(){
    const { pulsatingHotspot } = this;
    const  { x, y, z } = pulsatingHotspot.getAttribute('scale');
    
    pulsatingHotspot.emit('stop-scale-in');
    pulsatingHotspot.setAttribute('animation__scale-out', 'from', new THREE.Vector3(x, y, z))
    pulsatingHotspot.emit('start-scale-out');
  }
})
