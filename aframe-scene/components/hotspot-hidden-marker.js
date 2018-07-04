AFRAME.registerComponent('hidden-marker', {
  init() {
    this.fadeIn = this.fadeIn.bind(this);
    this.fadeOut = this.fadeOut.bind(this);
    this.el.addEventListener('fade-in', this.fadeIn);
    this.el.addEventListener('fade-out', this.fadeOut);
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
