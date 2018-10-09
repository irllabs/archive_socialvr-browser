AFRAME.registerComponent('preview-countdown', {
  init(){
    const { el } = this;
    
    el.addEventListener('run',() => {
      let time = 5;
      let textElement = el.querySelector('a-text')

      el.setAttribute('visible', true)
      
      let interval = setInterval(() => {
        time--
        textElement.setAttribute('value', `Your VR experience will begin in ${time}...`)

        if(time === 0) {
          clearInterval(interval)
          el.setAttribute('visible', false)
          el.sceneEl.emit('play-all-audio')
        }
        
      }, 1000)

    })
  }
})