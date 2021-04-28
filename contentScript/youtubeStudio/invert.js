'use strict';

(() => {

  document.addEventListener('animationstart', (ev) => {
    if (ev.animationName !== 'previewDetection') return;
    const preview = document.querySelector('video#preview');
    preview.style.transform = 'rotateY(0deg)';
  }, false);

})();
