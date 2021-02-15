'use strict';

(() => {

  let verticalValue = 0.5, horizontalValue = 0.5;
  let openEye = true, openMouth = false;
  let canvas, canvasCtx, canvasSize;

  addEventListener('load', () => {
    canvas = document.querySelector('canvas');
    canvasCtx = canvas.getContext('2d');

    canvasSize = getElements({
      width: '#controller .width',
      height: '#controller .height'
    });
    canvasSize.width.value = canvas.width;
    canvasSize.height.value = canvas.height;

    waitEvents();
    draw();
  }, false);

  function waitEvents () {
    canvas.addEventListener('mousemove', (event) => {
      const style = getComputedStyle(canvas);
      horizontalValue = event.offsetX / Number(style.width.replace('px', ''));
      verticalValue = event.offsetY / Number(style.height.replace('px', ''));
      draw();
    }, false);

    canvas.addEventListener('mousedown', (event) => {
      if (event.button === 0) openEye = false;
      if (event.button === 2) openMouth = true;
      draw();
    }, false);

    canvas.addEventListener('mouseup', (event) => {
      if (event.button === 0) openEye = true;
      if (event.button === 2) openMouth = false;
      draw();
    }, false);

    canvas.addEventListener('contextmenu', (event) => event.preventDefault(), false);

    canvasSize.width.addEventListener('change', (event) => {
      let number = Number(event.target.value);
      if (number < 0) {
        number = 0;
        event.target.value = 0;
      }
      canvas.width = number;
      saved = false;
      draw();
    }, false);

    canvasSize.height.addEventListener('change', (event) => {
      let number = Number(event.target.value);
      if (number < 0) {
        number = 0;
        event.target.value = 0;
      }
      canvas.height = number;
      saved = false;
      draw();
    }, false);

    addEventListener('updatedList', draw, false);
  }

  function draw () {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    fillWhite();
    for (let i = (sources.length - 1); i >= 0; i--) {
      if (
        (sources[i].getOpenEye() && !openEye) ||
        (sources[i].getClosedEye() && openEye)
      ) continue

      if (
        (sources[i].getOpenMouth() && !openMouth) ||
        (sources[i].getClosedMouth() && openMouth)
      ) continue;

      const move = sources[i].getMove();
      const size = sources[i].getSize();
      canvasCtx.drawImage(
        sources[i].getData(),
        calcCoordinate(
          move.left,
          move.right,
          horizontalValue
        ) + (canvas.width - size.width) / 2,
        calcCoordinate(
          move.top,
          move.bottom,
          verticalValue
        ) + (canvas.height - size.height) / 2,
        size.width,
        size.height
      );
    }
  }

  function fillWhite () {
    canvasCtx.fillStyle = '#FFFFFF';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function calcCoordinate (a, b, percentage) {
    const tmp = a - b;
    return ((tmp < 0) ? -tmp * percentage : tmp * (1 - percentage)) + Math.min(a, b);
  }

})();
