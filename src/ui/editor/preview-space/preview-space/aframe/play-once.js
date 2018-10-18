AFRAME.registerComponent('play-once', {
  init() {
    this.el.addEventListener('sound-ended',(e) => {
      var offset =  this.el.components.sound.pool.children[0].offset;

      if(offset === 0 || this.el.getAttribute('paused') === "false"){
        this.el.parentNode.removeChild(this.el)

      }
    })
  }
})

