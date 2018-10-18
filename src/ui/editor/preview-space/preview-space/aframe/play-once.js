AFRAME.registerComponent('play-once', {
  init() {
    this.el.addEventListener('sound-ended',() => {
      this.el.setAttribute('audio-disabled', true)
    })
  }
})

