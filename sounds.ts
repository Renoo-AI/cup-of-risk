export const enableMusic = () => {
  const iframe = document.getElementById("bg-music") as HTMLIFrameElement;
  if (iframe && iframe.src.includes("mute=1")) {
    iframe.src = iframe.src.replace("mute=1", "mute=0");
  }
};

export const setMusicMuted = (isMuted: boolean) => {
  const iframe = document.getElementById("bg-music") as HTMLIFrameElement;
  if (!iframe) return;
  const currentMute = isMuted ? "mute=1" : "mute=0";
  const otherMute = isMuted ? "mute=0" : "mute=1";
  if (iframe.src.includes(otherMute)) {
    iframe.src = iframe.src.replace(otherMute, currentMute);
  }
};

export type SoundType = 'click' | 'bomb' | 'heart_survive' | 'heart_die';

export const playSound = (type: SoundType, enabled: boolean) => {
  if (!enabled) return;

  let file = '';
  switch (type) {
    case 'click':
      file = 'click.mp3';
      break;
    case 'bomb':
      file = 'bomb.mp3';
      break;
    case 'heart_survive':
      file = '1-broken.mp3';
      break;
    case 'heart_die':
      file = '2-broken.mp3';
      break;
  }

  if (file) {
    const audio = new Audio(file);
    audio.play().catch(e => console.debug('Audio play failed', e));
  }
};

export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (!('vibrate' in navigator)) return;
  
  switch (style) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'medium':
      navigator.vibrate(30);
      break;
    case 'heavy':
      navigator.vibrate([50, 30, 50]);
      break;
  }
};