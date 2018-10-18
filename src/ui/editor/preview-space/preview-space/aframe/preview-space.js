AFRAME.registerComponent('preview-space', {
  init() {
    const { el } = this;
    this.camera = el.querySelector('a-camera');
    this.cursor = this.camera.querySelector('a-cursor');
    this.countdown = el.querySelector('[preview-countdown]');
    this.enterVR = el.querySelector('.a-enter-vr');
    
    el.addEventListener('run-countdown', () => this.countdown.emit('run'))

    el.addEventListener('show-countdown', () => {
      this.countdown.setAttribute('visible', true);
    })

    el.addEventListener('hide-countdown', () => {
      this.countdown.setAttribute('visible', false)
    })

    this.camera.addEventListener('animationcomplete', (e) => {
      if (e.detail.name === "animation__zoom-in") {
        this.switchRoom(this.roomId);
      }
    });

    ['narration','background','soundtrack'].forEach((type) => {
      el.addEventListener(`pause-${type}-audio`, ()=>{
        const audio = el.querySelector(`.${type}-audio`);
        if (audio) {
          audio.components.sound.pauseSound()
        }
      })
      el.addEventListener(`play-${type}-audio`, ()=>{
        const audio = el.querySelector(`.${type}-audio`);
        if (audio && audio.getAttribute('audio-disabled')) {
          audio.components.sound.playSound()
        }
      })
    })

    el.addEventListener('play-all-audio',() => {
      el.emit('play-narration-audio')
      el.emit('play-soundtrack-audio')
      el.emit('play-background-audio')
    })

    el.addEventListener('pause-all-audio',() => {
      el.emit('pause-narration-audio')
      el.emit('pause-soundtrack-audio')
      el.emit('pause-background-audio')
    })

    el.addEventListener('switch-room-last', () => {
      this.switchRoom('last');
    });

    el.addEventListener('switch-room-home', () => {
      this.switchRoom('home');
    });

    el.addEventListener('switch-room-smoothly', (e) => {
      this.roomId = e.detail.roomId;
      this.zoomCamera();
    });

    el.addEventListener('reset-camera', (e) => {
      this.resetCamera();
    });

  },
  resetCamera() {
    this.camera.setAttribute('zoom', 1);
    this.cursor.setAttribute('scale', new THREE.Vector3(1, 1, 1))
  },
  zoomCamera() {
    this.camera.emit('start-zoom-in');
    this.cursor.emit('start-scale-out');
  },
  switchRoom(roomId) {
    this.el.emit('switch-room', roomId)
  }
})
