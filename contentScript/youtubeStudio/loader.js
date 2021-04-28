'use strict';

(() => {

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('contentScript/hook.js');

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('contentScript/youtubeStudio/keyframe.css');

  addEventListener('DOMContentLoaded', () => {
    document.head.appendChild(script);
    console.log('[AliceLive!]: add hook.js');

    document.head.appendChild(link);
    console.log('[AliceLive!]: add keyframe.css');
  }, false);

})();
