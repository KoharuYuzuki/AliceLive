'use strict';

(() => {

  window.shiftKeyPress = false;
  let mouseDown = false, verticalResize = false, horizontalResize = false, move = false;
  let referencePoint = 0;
  let canvas;

  addEventListener('load', () => {
    canvas = document.querySelector('canvas');
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
  }, false);

  addEventListener('keydown', (event) => {
    if (['ShiftLeft', 'ShiftRight'].includes(event.code)) {
      shiftKeyPress = true;
    }
  }, false);

  addEventListener('keyup', (event) => {
    if (['ShiftLeft', 'ShiftRight'].includes(event.code)) {
      shiftKeyPress = false;
      canvas.style.cursor = 'default';
    }
  }, false);

  function onMouseMove (event) {
    if (!shiftKeyPress) return;

    const selectSource = document.querySelector('input[name="selectList"]:checked ~ div div input:checked');
    if (!selectSource) return;

    const uuid = selectSource.parentNode.dataset.uuid;
    const source = sources.visual.filter((source) => source.getUUID() === uuid)[0];

    if (mouseDown && (verticalResize || horizontalResize)) {
      if ((event.movementX === 0) && (event.movementY === 0)) return;
      const pixels = calcPixels(event);
      setResize(
        source,
        pixels,
        verticalResize,
        horizontalResize,
        referencePoint
      );
      dispatchEvent(new CustomEvent('updatedSourceSize', {
        detail: source.getUUID()
      }));
      return;
    }

    const deformation = source.getDeformation();

    if (mouseDown && move) {
      if ((event.movementX === 0) && (event.movementY === 0)) return;
      const pixels = calcPixels(event);
      source.setDeformationAll(
        deformation.x + Math.round(pixels.x),
        deformation.y + Math.round(pixels.y),
        deformation.w,
        deformation.h
      );
      dispatchEvent(new CustomEvent('updatedSourceSize', {
        detail: source.getUUID()
      }));
      return;
    }

    const coordinates = calcCoordinates(event);
    const diff = 10;

    verticalResize = false;
    horizontalResize = false;
    move = false;
    referencePoint = 0;

    if (judgmentTopEdge(coordinates, deformation, diff) && judgmentLeftEdge(coordinates, deformation, diff)) {
      canvas.style.cursor = 'nwse-resize';
      verticalResize = true;
      horizontalResize = true;
      referencePoint = 3;
    } else if (judgmentBottomEdge(coordinates, deformation, diff) && judgmentRightEdge(coordinates, deformation, diff)) {
      canvas.style.cursor = 'nwse-resize';
      verticalResize = true;
      horizontalResize = true;
      referencePoint = 0;
    } else if (judgmentTopEdge(coordinates, deformation, diff) && judgmentRightEdge(coordinates, deformation, diff)) {
      canvas.style.cursor = 'nesw-resize';
      verticalResize = true;
      horizontalResize = true;
      referencePoint = 2;
    } else if (judgmentBottomEdge(coordinates, deformation, diff) && judgmentLeftEdge(coordinates, deformation, diff)) {
      canvas.style.cursor = 'nesw-resize';
      verticalResize = true;
      horizontalResize = true;
      referencePoint = 1;
    } else if (judgmentWidth(coordinates, deformation, diff) && judgmentTopEdge(coordinates, deformation, diff)) {
      canvas.style.cursor = 'ns-resize';
      verticalResize = true;
      referencePoint = 2;
    } else if (judgmentWidth(coordinates, deformation, diff) && judgmentBottomEdge(coordinates, deformation, diff)) {
      canvas.style.cursor = 'ns-resize';
      verticalResize = true;
      referencePoint = 0;
    } else if (judgmentHeight(coordinates, deformation, diff) && judgmentLeftEdge(coordinates, deformation, diff)) {
      canvas.style.cursor = 'ew-resize';
      horizontalResize = true;
      referencePoint = 1;
    } else if (judgmentHeight(coordinates, deformation, diff) && judgmentRightEdge(coordinates, deformation, diff)) {
      canvas.style.cursor = 'ew-resize';
      horizontalResize = true;
      referencePoint = 0;
    } else if (judgmentWidth(coordinates, deformation, diff) && judgmentHeight(coordinates, deformation, diff)) {
      canvas.style.cursor = 'move';
      move = true;
    } else {
      canvas.style.cursor = 'default';
    }
  }

  function onMouseDown () {
    if (verticalResize || horizontalResize || move) {
      mouseDown = true;
    }
  }

  function onMouseUp () {
    mouseDown = false;
  }

  function calcCoordinates (event) {
    const style = getComputedStyle(canvas);
    const width = Number(style.width.replace('px', ''));
    const height = Number(style.height.replace('px', ''));
    const x = Math.round(event.offsetX / width * canvas.width);
    const y = Math.round(event.offsetY / height * canvas.height);
    return {x, y};
  }

  function calcPixels (event) {
    const style = getComputedStyle(canvas);
    const width = Number(style.width.replace('px', ''));
    const height = Number(style.height.replace('px', ''));
    const x = Math.round(event.movementX / width * canvas.width);
    const y = Math.round(event.movementY / height * canvas.height);
    return {x, y};
  }

  function setResize (source, pixels, verticalResize, horizontalResize, referencePoint) {
    const def = source.getDeformation();
    let x = 0, y = 0;

    if (horizontalResize) {
      x = Math.round(pixels.x);
    }
    if (verticalResize) {
      y = Math.round(pixels.y);
    }

    switch (referencePoint) {
      case 0:
        source.setDeformationAll(
          def.x,
          def.y,
          def.w + x,
          def.h + y
        );
        break;
      case 1:
        source.setDeformationAll(
          def.x + x,
          def.y,
          def.w - x,
          def.h + y
        );
        break;
      case 2:
        source.setDeformationAll(
          def.x,
          def.y + y,
          def.w + x,
          def.h - y
        );
        break;
      case 3:
        source.setDeformationAll(
          def.x + x,
          def.y + y,
          def.w - x,
          def.h - y
        );
        break;
    }
  }

  function judgmentWidth (a, b, c) {
    return (a.x >= (b.x - c)) && (a.x <= (b.x + b.w + c));
  }

  function judgmentHeight (a, b, c) {
    return (a.y >= (b.y - c)) && (a.y <= (b.y + b.h + c));
  }

  function judgmentTopEdge (a, b, c) {
    return (a.y >= (b.y - c)) && (a.y <= (b.y + c));
  }

  function judgmentLeftEdge (a, b, c) {
    return (a.x >= (b.x - c)) && (a.x <= (b.x + c));
  }

  function judgmentRightEdge (a, b, c) {
    return (a.x >= (b.x + b.w - c)) && (a.x <= (b.x + b.w + c));
  }

  function judgmentBottomEdge (a, b, c) {
    return (a.y >= (b.y + b.h - c)) && (a.y <= (b.y + b.h + c));
  }

})();
