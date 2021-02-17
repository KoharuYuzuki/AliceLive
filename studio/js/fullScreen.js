'use strict';

(() => {

  let input;

  addEventListener('load', () => {
    const canvas = document.querySelector('canvas');
    input = document.querySelector('.fullscreen input');
    input.addEventListener('change', (event) => {
      if (event.target.checked) canvas.requestFullscreen();
    }, false);
  }, false);

  addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement === null) input.checked = false;
  }, false);

})();
