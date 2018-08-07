AFRAME.registerComponent('preview-space', {
  init() {
    const { el } = this;

    this.camera = el.querySelector('a-camera');
    this.cursor = this.camera.querySelector('a-cursor');

    this.camera.addEventListener('animationcomplete', (e) => {
      if (e.detail.name === "animation__zoom-in") {
        this.switchRoom(this.roomId);
      }
    });

    el.addEventListener('pause-narration-audio', () => {
      const narrationAudio = el.querySelector('.narration-audio');
      
      if (narrationAudio) {
        narrationAudio.components.sound.pauseSound();
      }
    });

    el.addEventListener('play-narration-audio', () => {
      const narrationAudio = el.querySelector('.narration-audio');

      if (narrationAudio) {
        narrationAudio.components.sound.playSound();
      }
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
