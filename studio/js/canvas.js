'use strict';

(() => {

  const uuids = [];
  let canvas, canvasCtx, backCanvas, backCanvasCtx, drawSkip = false;

  addEventListener('load', () => {
    canvas = document.querySelector('canvas');
    window.videoTrack = canvas.captureStream(60).getVideoTracks()[0];
    canvasCtx = canvas.getContext('2d');

    backCanvas = document.createElement('canvas');
    backCanvas.width = canvas.width;
    backCanvas.height = canvas.height;
    backCanvasCtx = backCanvas.getContext('2d');

    const worker = new Worker('./js/intervalWorker.js');
    worker.postMessage({interval: 1000 / 60});
    worker.addEventListener('message', draw, false);

    document.querySelector('.pause .checkbox input').addEventListener('change', (event) => {
      if (event.target.checked) {
        drawSkip = true;
      } else {
        drawSkip = false;
      }
    }, false);

    changeCanvasAttribute();
    addEventListener('resize', changeCanvasAttribute, false);
  }, false);

  addEventListener('updatedList', () => {
    sources.visual.forEach((source) => {
      if (uuids.includes(source.getUUID())) return;
      if (source.getType() !== 'whiteboard') return;

      const undoStack = [];
      const whiteboard = source.getCanvas();
      const whiteboardCtx = whiteboard.getContext('2d');
      let x, y, draw = false;

      canvas.addEventListener('mousedown', (event) => {
        if (event.button === 0) {
          const image = whiteboardCtx.getImageData(
            0, 0, whiteboard.width, whiteboard.height
          );
          undoStack.push(image);
          const result = calcCoordinates(event);
          x = result.x;
          y = result.y;
          draw = true;
        } else if (event.button === 2) {
          if (undoStack.length <= 0) return;
          const image = undoStack.pop();
          whiteboardCtx.putImageData(image, 0, 0);
        }
      }, false);

      canvas.addEventListener('mousemove', (event) => {
        if (!draw) return;
        const deformation = source.getDeformation();
        const result = calcCoordinates(event);
        drawLine(
          whiteboardCtx,
          deformation.x, deformation.y,
          x, y,
          result.x, result.y
        );
        x = result.x;
        y = result.y;
      }, false);

      canvas.addEventListener('mouseup', (event) => {
        if (!draw) return;
        const deformation = source.getDeformation();
        const result = calcCoordinates(event);
        drawLine(
          whiteboardCtx,
          deformation.x, deformation.y,
          x, y,
          result.x, result.y
        );
        draw = false;
      }, false);

      uuids.push(source.getUUID());
    });
  }, false);

  function draw () {
    if (drawSkip) {
      fillBlack();
      copyCanvas();
      return;
    }

    fillWhite();

    for (let i = (sources.visual.length - 1); i >= 0; i--) {
      const source = sources.visual[i];
      const type = source.getType();
      if (type === 'avatar') {
        drawAvatar(source);
      }
      if (type === 'picture') {
        drawImage(source);
      }
      if (type === 'capture') {
        updateSourceSize(source);
        drawImage(source);
      }
      if (type === 'comment') {
        drawComments(source);
      }
      if (type === 'whiteboard') {
        drawWhiteboard(source);
      }
    }

    copyCanvas();
  }

  function fillWhite () {
    backCanvasCtx.fillStyle = '#FFFFFF';
    backCanvasCtx.fillRect(0, 0, backCanvas.width, backCanvas.height);
  }

  function fillBlack () {
    backCanvasCtx.fillStyle = '#000000';
    backCanvasCtx.fillRect(0, 0, backCanvas.width, backCanvas.height);
  }

  function drawAvatar (source) {
    const data = source.getData();
    const deformation = source.getDeformation();
    for (let j = (data.parts.length - 1); j >= 0; j--) {
      const parts = data.parts[j];
      if (
        (parts.getOpenEye() && !source.getEyeOpen()) ||
        (parts.getClosedEye() && source.getEyeOpen())
      ) continue
      if (
        (parts.getOpenMouth() && !source.getMouthOpen()) ||
        (parts.getClosedMouth() && source.getMouthOpen())
      ) continue;
      const move = parts.getMove();
      const size = parts.getSize();
      const times = {
        width: deformation.w / data.canvasSize.width,
        height: deformation.h / data.canvasSize.height
      };

      const x = deformation.x + (
        calcCoordinate(
          move.left,
          move.right,
          source.getHorizontalValue()
        ) +
        (data.canvasSize.width - size.width) / 2
      ) * times.width;
      const y = deformation.y + (
        calcCoordinate(
          move.top,
          move.bottom,
          source.getVerticalValue()
        ) +
        (data.canvasSize.height - size.height) / 2
      ) * times.height;

      if (move.splitScaling !== 0) {
        let scaling;
        if (source.getHorizontalValue() < 0.5) {
          scaling = -move.splitScaling * (1 - (source.getHorizontalValue() * 2));
        } else {
          scaling = move.splitScaling * ((source.getHorizontalValue() - 0.5) * 2);
        }

        backCanvasCtx.drawImage(
          parts.getData(),
          0,
          0,
          (size.width / 2),
          size.height,
          x,
          y,
          ((size.width / 2) + scaling) * times.width,
          size.height * times.height
        );

        backCanvasCtx.drawImage(
          parts.getData(),
          (size.width / 2),
          0,
          (size.width / 2),
          size.height,
          x + ((size.width / 2) + scaling) * times.width,
          y,
          ((size.width) / 2 - scaling) * times.width,
          size.height * times.height
        );
      } else {
        backCanvasCtx.drawImage(
          parts.getData(),
          x,
          y,
          size.width * times.width,
          size.height * times.height
        );
      }
    }
  }

  function calcCoordinate (a, b, percentage) {
    const tmp = a - b;
    return ((tmp < 0) ? -tmp * percentage : tmp * (1 - percentage)) + Math.min(a, b);
  }

  function drawImage (source) {
    const image = source.getData();
    const deformation = source.getDeformation();
    backCanvasCtx.drawImage(
      image,
      deformation.x,
      deformation.y,
      deformation.w,
      deformation.h
    );
  }

  function updateSourceSize (source) {
    let updated = false;
    const origSize = source.getOrigSize();
    const videoSize = source.getVideoSize();
    if (origSize.w !== videoSize.w) {
      source.setOrigSizeW(videoSize.w);
      source.setDeformationW(videoSize.w);
      updated = true;
    }
    if (origSize.h !== videoSize.h) {
      source.setOrigSizeH(videoSize.h);
      source.setDeformationH(videoSize.h);
      updated = true;
    }
    if (updated) dispatchEvent(new CustomEvent('updatedSourceSize', {
      detail: source.getUUID()
    }));
  }

  function drawComments (source) {
    const deformation = source.getDeformation();

    backCanvasCtx.beginPath();

    const opacity = source.getFrameOpacity();
    if (opacity > 0) {
      backCanvasCtx.lineWidth = 1;
      backCanvasCtx.strokeStyle = `rgba(25, 25, 25, ${opacity})`;
      backCanvasCtx.strokeRect(deformation.x, deformation.y, deformation.w, deformation.h);
      const num = opacity - 0.01;
      if (num > 0) source.setFrameOpacity(num);
      else source.setFrameOpacity(0);
    }

    backCanvasCtx.lineWidth = 6;
    backCanvasCtx.lineJoin = 'round';
    backCanvasCtx.font = '21px \'Noto Sans JP\', \'sans-serif\'';
    backCanvasCtx.strokeStyle = '#252525';
    backCanvasCtx.fillStyle = '#FFFFFF';

    const uuids = [...commentUUIDs].reverse();
    let lineCounter = 0;

    for (let i = 0; i < uuids.length; i++) {
      const uuid = uuids[i];
      const str = `${comments[uuid].name} : ${comments[uuid].comment}`;
      const commentSplit = [];

      let loopFlag = true;
      let begin = 0;
      let allLength = 1;
      let length = 1;
      while (loopFlag) {
        const width = backCanvasCtx.measureText(str.substring(begin, length + begin)).width;
        if (width >= deformation.w) {
          commentSplit.push(str.substring(begin, (length - 1) + begin));
          begin = allLength - 1;
          length = 1;
        }
        if (allLength < str.length) {
          allLength++;
          length++;
        } else {
          loopFlag = false;
          commentSplit.push(str.substring(begin, length + begin));
        }
      }

      let breakFlag = false;
      commentSplit.reverse();
      for (let i = 0; i < commentSplit.length; i++) {
        const str = commentSplit[i];
        backCanvasCtx.strokeText(
          str,
          deformation.x,
          deformation.h - (lineCounter * (21 + 4)) + deformation.y
        );
        backCanvasCtx.fillText(
          str,
          deformation.x,
          deformation.h - (lineCounter * (21 + 4)) + deformation.y
        );
        lineCounter++;
        if (((lineCounter + 1) * (21 + 4)) > deformation.h) {
          breakFlag = true;
          break;
        }
      }

      if (breakFlag) break;

      lineCounter += 0.5;
    }

    backCanvasCtx.fill();
  }

  function drawWhiteboard (source) {
    const deformation = source.getDeformation();

    backCanvasCtx.fillStyle = '#FFFFFF';
    backCanvasCtx.fillRect(deformation.x, deformation.y, deformation.w, deformation.h);

    const opacity = source.getFrameOpacity();
    if (opacity > 0) {
      backCanvasCtx.lineWidth = 1;
      backCanvasCtx.strokeStyle = `rgba(25, 25, 25, ${opacity})`;
      backCanvasCtx.strokeRect(deformation.x, deformation.y, deformation.w, deformation.h);
      const num = opacity - 0.01;
      if (num > 0) source.setFrameOpacity(num);
      else source.setFrameOpacity(0);
    }

    const whiteboard = source.getCanvas();
    const whiteboardCtx = whiteboard.getContext('2d');
    const image = whiteboardCtx.getImageData(0, 0, whiteboard.width, whiteboard.height);
    whiteboard.width = deformation.w;
    whiteboard.height = deformation.h;
    whiteboardCtx.putImageData(image, 0, 0);

    backCanvasCtx.drawImage(
      whiteboard,
      deformation.x, deformation.y,
      whiteboard.width, whiteboard.height
    );
  }

  function calcCoordinates (event) {
    const style = getComputedStyle(canvas);
    const width = Number(style.width.replace('px', ''));
    const height = Number(style.height.replace('px', ''));
    const x = event.offsetX / width * canvas.width;
    const y = event.offsetY / height * canvas.height;
    return {x, y};
  }

  function drawLine (context, offsetX, offsetY, x1, y1, x2, y2) {
    context.beginPath();
    context.strokeStyle = '#252525';
    context.lineWidth = 1;
    context.moveTo(x1 - offsetX, y1 - offsetY);
    context.lineTo(x2 - offsetX, y2 - offsetY);
    context.stroke();
    context.closePath();
  }

  function copyCanvas () {
    canvasCtx.drawImage(backCanvas, 0, 0, canvas.width, canvas.height);
  }

  function changeCanvasAttribute () {
    if ((innerWidth / (innerHeight * 0.6)) < (16 / 9)) {
      canvas.setAttribute('horizontal', null);
      canvas.removeAttribute('vertical');
    } else {
      canvas.setAttribute('vertical', null);
      canvas.removeAttribute('horizontal');
    }
  }

})();
