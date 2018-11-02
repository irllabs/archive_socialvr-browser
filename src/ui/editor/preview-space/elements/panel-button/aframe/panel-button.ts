import * as THREE from 'three';

AFRAME.registerComponent('panel-button', <any>{
  schema: {
    event: {
      type: 'string'
    }
  },
  animationScaleIn: {
    property: 'scale',
    dur: '700',
    to: '.001 .001 .001',
    from: '1 1 1',
    startEvents: 'start-scale-in',
    pauseEvents: 'stop-scale-in'
  },
  init() {
    this.trigger = this.el.querySelector('.button-trigger');
    this.image = this.el.querySelector('.button-image');

    this.image.setAttribute('animation__scale-in', this.animationScaleIn);

    this.trigger.addEventListener('raycaster-intersected', () => {
      this.image.emit('start-scale-in')
      this.eventTimeout = setTimeout(() => {
        this.el.sceneEl.emit(this.data.event);
      }, 700);
    });

    this.trigger.addEventListener('raycaster-intersected-cleared', () => {
      this.image.emit('stop-scale-in');
      this.image.setAttribute('scale', new THREE.Vector3(1, 1, 1));
      clearTimeout(this.eventTimeout);
    })

  }
})
