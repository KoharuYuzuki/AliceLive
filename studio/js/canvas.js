'use strict';

(() => {

  let canvas, canvasCtx, backCanvas, backCanvasCtx, drawSkip = false;

  addEventListener('load', () => {
    canvas = document.querySelector('canvas');
    window.videoTrack = canvas.captureStream(60).getVideoTracks()[0];
    canvasCtx = canvas.getContext('2d');
    backCanvas = document.createElement('canvas');
    backCanvas.width = canvas.width;
    backCanvas.height = canvas.height;
    backCanvasCtx = backCanvas.getContext('2d');
    setInterval(draw, 1000 / 60);

    document.querySelector('.pause .checkbox input').addEventListener('change', (event) => {
      if (event.target.checked) {
        drawSkip = true;
      } else {
        drawSkip = false;
      }
    }, false);
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
      backCanvasCtx.drawImage(
        parts.getData(),
        deformation.x + (
          calcCoordinate(
            move.left,
            move.right,
            source.getHorizontalValue()
          ) +
          (data.canvasSize.width - size.width) / 2
        ) * times.width,
        deformation.y + (
          calcCoordinate(
            move.top,
            move.bottom,
            source.getVerticalValue()
          ) +
          (data.canvasSize.height - size.height) / 2
        ) * times.height,
        size.width * times.width,
        size.height * times.height
      );
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
    const viewer = {
      x: source.deformation.x,
      y: source.deformation.y,
      width: source.deformation.w,
      height: source.deformation.h
    };

    backCanvasCtx.beginPath();

    const opacity = source.getFrameOpacity();
    if (opacity > 0) {
      backCanvasCtx.strokeStyle = `rgba(25, 25, 25, ${opacity})`;
      backCanvasCtx.strokeRect(viewer.x, viewer.y, viewer.width, viewer.height);
      const num = opacity - 0.01;
      if (num > 0) source.setFrameOpacity(num);
      else source.setFrameOpacity(0);
    }

    backCanvasCtx.font = '28px \'Noto Sans JP\'';
    backCanvasCtx.fillStyle = '#252525';

    const uuids = [...commentUUIDs].reverse();
    let lineCounter = 0;

    for (let i = 0; i < uuids.length; i++) {
      const uuid = uuids[i];
      const str = `${comments[uuid].name}: ${comments[uuid].comment}`;
      const commentSplit = [];

      let loopFlag = true;
      let begin = 0;
      let allLength = 1;
      let length = 1;
      while (loopFlag) {
        const width = backCanvasCtx.measureText(str.substring(begin, length + begin)).width;
        if (width >= viewer.width) {
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
        backCanvasCtx.fillText(
          str,
          viewer.x,
          viewer.height - (lineCounter * (32)) + viewer.y
        );
        lineCounter++;
        if (((lineCounter + 1) * 32) > viewer.height) {
          breakFlag = true;
          break;
        }
      }

      if (breakFlag) break;

      lineCounter += 0.5;
    }

    backCanvasCtx.fill();
  }

  function copyCanvas () {
    canvasCtx.drawImage(backCanvas, 0, 0, canvas.width, canvas.height);
  }

})();
