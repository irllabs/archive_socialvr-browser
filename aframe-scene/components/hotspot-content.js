AFRAME.registerComponent('hotspot-content',{
  schema: {
    image:{
      type:'asset'
    },
    audio:{
      type:'asset'
    },
    text:{
      type:'string'
    }
  },
  init(){
    const { el } = this;
    const { audio, text, image } = this.data;
    const soundElement = document.createElement('a-sound');
    const imageElement = document.createElement('a-image');
    const textElement = document.createElement('a-text');

    textElement.setAttribute('value', text);
    imageElement.setAttribute('src', image.src);
    soundElement.setAttribute('src', audio);

    el.append(imageElement);
    el.append(soundElement);
    el.append(textElement);

    this.showContent = this.showContent.bind(this);
    this.hideContent = this.hideContent.bind(this);

    el.addEventListener('show-content', this.showContent);
    el.addEventListener('hide-content', this.hideContent)
  },
  showContent(){
    const { el } = this;
    const { x, y, z } = el.getAttribute('scale');
    el.setAttribute('animation__scale-in', 'from', `${x} ${y} ${z}`);
    el.emit('start-scale-in');

    let sound = el.querySelector('a-sound');
    if(sound){
      sound.components.sound.playSound()
    }
  },
  hideContent(){
      const { el } = this;
      const { x, y, z } = el.getAttribute('scale');
      el.setAttribute('animation__scale-out', 'from', `${x} ${y} ${z}`);
      el.emit('start-scale-out');

      const sound = el.querySelector('a-sound');

      if(sound){
        sound.components.sound.stopSound()
      }
    }
});
