
export const audioDuration = function(file){
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const audioElement = <any>document.createElement('audio')

    audioElement.src = objectUrl;

    audioElement.addEventListener('canplaythrough', (e) => {
      resolve(e.currentTarget.duration)
      URL.revokeObjectURL(objectUrl)
    })

  })
}