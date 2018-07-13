AFRAME.registerComponent('preview-space', {
  init() {
    this.camera = this.el.querySelector('a-camera');
    this.cursor = this.camera.querySelector('a-cursor');
    this.backgroundAudio = this.el.querySelector('.background-audio');
    this.narrationAudio = this.el.querySelector('.naration-audio');
    
    this.camera.addEventListener('animationcomplete', (e) => {
      if(e.detail.name === "animation__zoom-in"){
        this.switchRoom(this.roomId);
        this.camera.setAttribute('zoom', 1);
        this.cursor.setAttribute('scale', new THREE.Vector3(1, 1, 1))
      }
    })

    this.el.addEventListener('pause-background-audio',() => {
      if(this.backgroundAudio) {
        this.backgroundAudio.components.sound.pauseSound();
      }
    });
    
    this.el.addEventListener('play-background-audio', () => {
      if(this.backgroundAudio) {
        this.backgroundAudio.components.sound.playSound();
      }
    })

    this.el.addEventListener('switch-room-last', () => {
      this.switchRoom('last')
    })

    this.el.addEventListener('switch-room-home',() => {
      this.switchRoom('home')
    })

    this.el.addEventListener('switch-room-smoothly', (e) => {
      this.roomId = e.detail.roomId;
      this.zoomCamera();
    });
  },
  zoomCamera() {
    this.camera.emit('start-zoom-in');
    this.cursor.emit('start-scale-out');
  },
  switchRoom(roomId) {
    this.el.emit('switch-room', roomId)
  }
})
