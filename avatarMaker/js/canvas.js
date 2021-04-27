'use strict';

(() => {

  let verticalValue = 0.5, horizontalValue = 0.5;
  let openEye = true, openMouth = false;
  let canvasCtx, tmpCanvasCtx, canvasSize, mouseMoveArea;
  let magnification = 1, enlarge = true;

  addEventListener('load', () => {
    window.canvas = document.querySelector('canvas');
    canvasCtx = canvas.getContext('2d');

    window.tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = canvas.width;
    tmpCanvas.height = canvas.height;
    tmpCanvasCtx = tmpCanvas.getContext('2d');

    canvasSize = getElements({
      width: '#controller .width',
      height: '#controller .height'
    });
    canvasSize.width.value = canvas.width;
    canvasSize.height.value = canvas.height;

    mouseMoveArea = document.querySelector('#mouseMoveArea');

    waitEvents();
    draw();
  }, false);

  function waitEvents () {
    mouseMoveArea.addEventListener('mousemove', (event) => {
      const style = getComputedStyle(mouseMoveArea);
      horizontalValue = event.offsetX / Number(style.width.replace('px', ''));
      verticalValue = event.offsetY / Number(style.height.replace('px', ''));
      draw();
    }, false);

    mouseMoveArea.addEventListener('mousedown', (event) => {
      if (event.button === 0) openEye = false;
      if (event.button === 2) openMouth = true;
      draw();
    }, false);

    mouseMoveArea.addEventListener('mouseup', (event) => {
      if (event.button === 0) openEye = true;
      if (event.button === 2) openMouth = false;
      draw();
    }, false);

    mouseMoveArea.addEventListener('contextmenu', (event) => event.preventDefault(), false);

    canvasSize.width.addEventListener('change', (event) => {
      let number = Number(event.target.value);
      if (number < 0) {
        number = 0;
        event.target.value = 0;
      }
      canvas.width = number;
      tmpCanvas.width = number;
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
      tmpCanvas.height = number;
      saved = false;
      draw();
    }, false);

    addEventListener('keydown', (event) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      if (magnification === 1) {
        enlarge = true;
        magnification++;
      } else if (magnification === 5) {
        enlarge = false;
        magnification--;
      } else {
        if (enlarge) magnification++;
        else magnification--;
      }
      canvas.style.width = `${magnification * 100}%`;
      canvas.style.height = `${magnification * 100}%`;
    }, false);

    addEventListener('updatedList', draw, false);
  }

  function draw () {
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

      const x = calcCoordinate(
        move.left,
        move.right,
        horizontalValue
      ) + (canvas.width - size.width) / 2;
      const y = calcCoordinate(
        move.top,
        move.bottom,
        verticalValue
      ) + (canvas.height - size.height) / 2;

      const magnification = (horizontalValue >= 0.5) ? ((horizontalValue - 0.5) * 2 * verticalValue) : ((1 - (horizontalValue * 2)) * verticalValue);
      const deg = (horizontalValue >= 0.5) ? (move.rotate * magnification) : (-move.rotate * magnification);
      const rad = deg * Math.PI / 180;

      tmpCanvasCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
      tmpCanvasCtx.translate(move.pointX, move.pointY);
      tmpCanvasCtx.rotate(rad);

      if (move.splitScaling !== 0) {
        const scaling = (horizontalValue < 0.5) ? (-move.splitScaling * (1 - (horizontalValue * 2))) : (move.splitScaling * ((horizontalValue - 0.5) * 2));
        const halfWidth = (size.width / 2);

        tmpCanvasCtx.drawImage(
          sources[i].getData(),
          0,
          0,
          halfWidth,
          size.height,
          x - move.pointX,
          y - move.pointY,
          halfWidth + scaling,
          size.height
        );

        tmpCanvasCtx.drawImage(
          sources[i].getData(),
          halfWidth,
          0,
          halfWidth,
          size.height,
          x - move.pointX + halfWidth + scaling - 1,
          y - move.pointY,
          halfWidth - scaling,
          size.height
        );
      } else {
        tmpCanvasCtx.drawImage(
          sources[i].getData(),
          0,
          0,
          size.width,
          size.height,
          x - move.pointX,
          y - move.pointY,
          size.width,
          size.height
        );
      }

      tmpCanvasCtx.rotate(-rad);
      tmpCanvasCtx.translate(-move.pointX, -move.pointY);
      canvasCtx.drawImage(tmpCanvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
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
