let audioContext = null;

export function getAudioContext() {
  if (audioContext === null) {
    audioContext = new AudioContext();
  }

  return audioContext;
};
