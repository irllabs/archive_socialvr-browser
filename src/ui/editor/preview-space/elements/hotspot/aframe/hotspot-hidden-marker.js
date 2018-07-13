AFRAME.registerComponent('hidden-marker', {
  animationFadeIn:{
    property: 'opacity',
    from: 0,
    to: 1,
    dur: 500,
    pauseEvents: 'stop-fade-in',
    startEvents: 'start-fade-in'
  },
  animationFadeOut:{
    property: 'opacity',
    from: 1,
    to: 0,
    dur: 500,
    pauseEvents: 'stop-fade-out',
    startEvents: 'start-fade-out'
  },
  init() {
    const { el } = this;
    this.fadeIn = this.fadeIn.bind(this);
    this.fadeOut = this.fadeOut.bind(this);

    el.setAttribute('opacity', 0);
    el.setAttribute('position', new THREE.Vector3(0, 0, .1));
    el.setAttribute('animation__fade-in', this.animationFadeIn);
    el.setAttribute('animation__fade-out', this.animationFadeOut);
    el.setAttribute('transparent', true);

    el.addEventListener('fade-in', this.fadeIn);
    el.addEventListener('fade-out', this.fadeOut);
  },
  fadeOut() {
    this.el.emit('stop-fade-in');
    this.el.emit('start-fade-out');
  },
  fadeIn() {
    this.el.emit('stop-fade-out');
    this.el.emit('start-fade-in');
  }
})
