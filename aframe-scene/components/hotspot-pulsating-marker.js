AFRAME.registerComponent('pulsating-marker', {
  init(){
    this.scaleIn = this.scaleIn.bind(this);
    this.scaleOut = this.scaleOut.bind(this);
    this.pulsatingHotspot = this.el.querySelector('.pulsating-hotspot');
    this.el.addEventListener('scale-in', this.scaleIn);
    this.el.addEventListener('scale-out', this.scaleOut);
  },
  scaleIn(){
    const { pulsatingHotspot } = this
    const { x, y, z } = this.pulsatingHotspot.getAttribute('scale');
    pulsatingHotspot.emit('stop-scale-out');
    pulsatingHotspot.setAttribute('animation__scale-in', 'from', `${x} ${y} ${z}`)
    pulsatingHotspot.emit('start-scale-in');
  },
  scaleOut(){
    let { pulsatingHotspot } = this
    pulsatingHotspot.emit('stop-scale-in');
    let { x, y, z } = pulsatingHotspot.getAttribute('scale');
    pulsatingHotspot.setAttribute('animation__scale-out', 'from', `${x} ${y} ${z}`)
    pulsatingHotspot.emit('start-scale-out')
  }
})
