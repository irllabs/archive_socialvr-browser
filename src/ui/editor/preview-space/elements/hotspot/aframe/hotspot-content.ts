
AFRAME.registerComponent('hotspot-content', <any>{
  animationScaleOut: {
    property: 'scale',
    from: '1 1 1',
    to: '.001 .001 .001',
    startEvents: 'start-scale-out',
    pauseEvents: 'stop-scale-out',
    easing: 'easeInQuart'
  },
  animationScaleIn: {
    property: 'scale',
    from: '.001 .001 .001',
    to: '1 1 1',
    startEvents: 'start-scale-in',
    pauseEvents: 'stop-scale-in',
    easing: 'easeInQuart'
  },
  init() {
    const { el } = this;

    this.soundElement = this.el.querySelector('a-sound');
    this.imageElement = this.el.querySelector('a-image');

    el.addEventListener('show-content', this.showContent.bind(this));
    el.addEventListener('hide-content', this.hideContent.bind(this));

    el.setAttribute('animation__scale-in', this.animationScaleIn);
    el.setAttribute('animation__scale-out', this.animationScaleOut);

    el.addEventListener('animationcomplete', (e) => {
      if (e.detail.name === 'animation__scale-out') {
        this.imageElement.setAttribute('visible', false);
      }
    });

    el.addEventListener('animationbegin', (e) => {
      if (e.detail.name === 'animation__scale-in') {
        this.imageElement.setAttribute('visible', true);
      }
    })

  },
  showContent() {
    const { el, soundElement } = this;

    if (soundElement) {
      el.sceneEl.emit('pause-narration-audio');
      soundElement.components.sound.playSound();
    }

    if (!this.imageElement) return;

    const vectorFrom = el.getAttribute('scale').clone();

    el.setAttribute('animation__scale-in', 'from', vectorFrom);
    el.emit('start-scale-in');

  },
  hideContent() {
    const { el, soundElement } = this;

    if (soundElement) {
      el.sceneEl.emit('play-narration-audio');
      soundElement.components.sound.stopSound();
    }

    if (!this.imageElement) return;

    const vectorFrom = el.getAttribute('scale').clone();

    el.setAttribute('animation__scale-out', 'from', vectorFrom);
    el.emit('start-scale-out');
  }
});
