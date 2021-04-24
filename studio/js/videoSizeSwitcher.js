'use strict';

(() => {

  window.fullHD = true;

  addEventListener('load', () => {
    const canvas = document.querySelector('canvas');
    const input = document.querySelector('.hd input');
    input.addEventListener('change', (event) => {
      fullHD = !event.target.checked;
      if (fullHD) {
        canvas.width = 1920;
        canvas.height = 1080;
      } else {
        canvas.width = 1280;
        canvas.height = 720;
      }
    }, false);
  }, false);

})();
