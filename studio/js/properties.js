'use strict';

(() => {

  let source;
  let propertySwitches,
      referencePoints,
      deformationInputs,
      aspectRatioLock,
      aspectRatioLockInput,
      sound,
      other;

  addEventListener('load', () => {
    propertySwitches = getElements({
      visual:       '#visualSwitch',
      sound:        '#soundSwitch',
      playAndPause: '#playAndPauseSwitch',
      loop:         '#loopSwitch',
      gate:         '#gateSwitch'
    });

    referencePoints = getElements({
      0: '#referencePoints input.radio0',
      1: '#referencePoints input.radio1',
      2: '#referencePoints input.radio2',
      3: '#referencePoints input.radio3',
      4: '#referencePoints input.radio4',
      5: '#referencePoints input.radio5',
      6: '#referencePoints input.radio6',
      7: '#referencePoints input.radio7',
      8: '#referencePoints input.radio8',
    });

    deformationInputs = getElements({
      x: '#deformation .box.x input',
      y: '#deformation .box.y input',
      w: '#deformation .box.w input',
      h: '#deformation .box.h input'
    });

    sound = getElements({
      playAndPause: '#playAndPause input',
      mute:         '#muteAndLoop .mute input',
      loop:         '#muteAndLoop .loop input',
      volume:       '#volume .range input',
      volumeBar:    '#volume .range div',
      volumeValue:  '#volume .value p'
    });

    other = getElements({
      gate:      '#gate .range input',
      gateBar:   '#gate .range .gateBar',
      volumeBar: '#gate .range .volumeBar',
      gateValue: '#gate .value p'
    });

    aspectRatioLock = document.querySelector('#deformation .aspectRatioLock');

    aspectRatioLockInput = document.querySelector('#deformation .aspectRatioLock input');

    waitEvents();
  }, false);

  function waitEvents () {
    Object.keys(referencePoints).forEach((key) => {
      referencePoints[key].addEventListener('click', (event) => {
        if (!source) return;
        const number = event.target.className.replace('radio', '');
        source.setReferencePoint(Number(number));
        setDeformation();
      }, false);
    });

    Object.keys(deformationInputs).forEach((key) => {
      deformationInputs[key].addEventListener('change', (event) => {
        if (!source) return;
        const deformationName = event.target.parentNode.className.replace('box ', '');
        let number = Number(event.target.value);
        if (isNaN(number)) number = 0;
        const deformation = source.getDeformation();
        switch (deformationName) {
          case 'x':
            source.setDeformationX(calcCoordinate(number, 'x'));
            break;
          case 'y':
            source.setDeformationY(calcCoordinate(number, 'y'));
            break;
          case 'w':
            setCoordinate(number, 'x');
            if (aspectRatioLockInput.checked) {
              const times = (deformation.w > 0) ? (number / deformation.w) : 1;
              const height = Math.round(deformation.h * times);
              setCoordinate(height, 'y');
              source.setDeformationH(height);
            }
            source.setDeformationW(number);
            break;
          case 'h':
            setCoordinate(number, 'y');
            if (aspectRatioLockInput.checked) {
              const times = (deformation.h) ? (number / deformation.h) : 1;
              const width = Math.round(deformation.w * times);
              setCoordinate(width, 'x');
              source.setDeformationW(width);
            }
            source.setDeformationH(number);
            break;
        }
        setDeformation();
        if (source.getType() === 'comment') source.setFrameOpacity(1);
      }, false);
    });

    aspectRatioLock.addEventListener('click', () => {
      if (propertySwitches.visual.checked) return;
      aspectRatioLockInput.checked = !aspectRatioLockInput.checked;
    }, false);

    sound.playAndPause.addEventListener('change', (event) => {
      source.setPlay(event.target.checked);
    }, false);

    sound.mute.addEventListener('change', (event) => {
      source.setMute(event.target.checked);
      dispatchEvent(new CustomEvent('updatedMute', {
        detail: source.getUUID()
      }));
    }, false);

    sound.loop.addEventListener('change', (event) => {
      source.setLoop(event.target.checked);
    }, false);

    sound.volume.addEventListener('input', (event) => {
      const number = Number(event.target.value);
      source.setVolume(number);
      const percentage = Math.round(number);
      sound.volumeBar.style.width = `${percentage / 2}%`;
      sound.volumeValue.innerText = `${percentage} %`;
      dispatchEvent(new CustomEvent('updatedVolume', {
        detail: source.getUUID()
      }));
    }, false);

    other.gate.addEventListener('input', (event) => {
      const number = Number(event.target.value);
      source.setGate(number);
      const value = Math.round(number);
      other.gateBar.style.width = `${value / 1.28}%`;
      other.gateValue.innerText = value;
    }, false);
  }

  addEventListener('clickedListSource', (event) => setProperties(event.detail), false);

  addEventListener('clickedSourceLabel', checkedSourceConfirm, false);

  addEventListener('updatedList', checkedSourceConfirm, false);

  addEventListener('updatedSourceSize', (event) => {
    const selectSource = document.querySelector('input[name="selectList"]:checked ~ div div input:checked');
    if (!selectSource) return;
    const uuid = selectSource.parentNode.dataset.uuid;
    if (event.detail !== uuid) return;
    setProperties(uuid);
  }, false);

  addEventListener('playingEnded', (event) => {
    const selectSource = document.querySelector('input[name="selectList"]:checked ~ div div input:checked');
    if (!selectSource) return;
    const uuid = selectSource.parentNode.dataset.uuid;
    if (event.detail !== uuid) return;
    setPlayOrPause();
  }, false);

  addEventListener('updateMaxVolume', (event) => {
    const selectSource = document.querySelector('input[name="selectList"]:checked ~ div div input:checked');
    if (!selectSource) return;
    const uuid = selectSource.parentNode.dataset.uuid;
    if (event.detail.uuid !== uuid) return;
    const value = Math.round(event.detail.volume);
    other.volumeBar.style.width = `${value / 1.28}%`;
  }, false);

  function checkedSourceConfirm () {
    const selectSource = document.querySelector('input[name="selectList"]:checked ~ div div input:checked');
    if (selectSource) {
      const uuid = selectSource.parentNode.dataset.uuid;
      setProperties(uuid);
    } else {
      source = null;
      sound.playAndPause.checked = false;
      sound.volumeValue.innerText = '0 %';
      hidePropertySwitches();
    }
  }

  function hidePropertySwitches () {
    displayVisualSwitch(true);
    displaySoundSwitch(true);
    displayGateSwitch(true);
  }

  function setProperties (uuid) {
    const sourceAll = sources.visual.concat(sources.sound);
    source = sourceAll.filter((source) => source.getUUID() === uuid)[0];
    const type = source.getType();

    if (type === 'avatar') {
      displayVisualSwitch(false);
      displaySoundSwitch(true);
      displayGateSwitch(false);
      setGate();
    } else {
      displayGateSwitch(true);
    }

    if (['picture', 'comment'].includes(type)) {
      displayVisualSwitch(false);
      displaySoundSwitch(true);
    }
    if (type === 'capture') {
      if (source.audioTrack) {
        displayVisualSwitch(false);
        displaySoundSwitch(false);
        setMute();
        setVolume();
        displayPlayAndPauseSwitch(true);
        displayLoopSwitch(true);
        sound.playAndPause.checked = false;
      } else {
        displayVisualSwitch(false);
        displaySoundSwitch(true);
      }
    }
    if (['avatar', 'picture', 'capture', 'comment'].includes(type)) {
      setReferencePoint();
      setDeformation();
    }

    if (['voiceChanger', 'soundInput', 'soundFile'].includes(type)) {
      displayVisualSwitch(true);
      displaySoundSwitch(false);
      setMute();
      setVolume();
    }
    if (['voiceChanger', 'soundInput'].includes(type)) {
      displayPlayAndPauseSwitch(true);
      displayLoopSwitch(true);
      sound.playAndPause.checked = false;
    }
    if (type === 'soundFile') {
      displayPlayAndPauseSwitch(false);
      displayLoopSwitch(false);
      setPlayOrPause();
      setLoop();
    }

  }

  function displayVisualSwitch (bool) {
    propertySwitches.visual.checked = bool;
  }

  function displaySoundSwitch (bool) {
    propertySwitches.sound.checked = bool;
  }

  function setReferencePoint () {
    referencePoints[source.getReferencePoint()].checked = true;
  }

  function setDeformation () {
    let x, y;
    const deformation = source.getDeformation();
    switch (source.getReferencePoint()) {
      case 0:
        x = deformation.x;
        y = deformation.y;
        break;
      case 1:
        x = deformation.x + (deformation.w / 2);
        y = deformation.y;
        break;
      case 2:
        x = deformation.x + deformation.w;
        y = deformation.y;
        break;
      case 3:
        x = deformation.x;
        y = deformation.y + (deformation.h / 2);
        break;
      case 4:
        x = deformation.x + (deformation.w / 2);
        y = deformation.y + (deformation.h / 2);
        break;
      case 5:
        x = deformation.x + deformation.w;
        y = deformation.y + (deformation.h / 2);
        break;
      case 6:
        x = deformation.x;
        y = deformation.y + deformation.h;
        break;
      case 7:
        x = deformation.x + (deformation.w / 2);
        y = deformation.y + deformation.h;
        break;
      case 8:
        x = deformation.x + deformation.w;
        y = deformation.y + deformation.h;
        break;
    }
    deformationInputs.x.value = x;
    deformationInputs.y.value = y;
    deformationInputs.w.value = deformation.w;
    deformationInputs.h.value = deformation.h;
  }

  function calcCoordinate (coordinate, coordinateName) {
    const referencePoint = source.getReferencePoint();
    const deformation = source.getDeformation();
    switch (coordinateName) {
      case 'x':
        switch (referencePoint) {
          case 0:
          case 3:
          case 6:
            return coordinate;
          case 1:
          case 4:
          case 7:
            return coordinate - (deformation.w / 2);
          case 2:
          case 5:
          case 8:
            return coordinate - deformation.w;
        }
        break;
      case 'y':
        switch (referencePoint) {
          case 0:
          case 1:
          case 2:
            return coordinate;
          case 3:
          case 4:
          case 5:
            return coordinate - (deformation.h / 2);
          case 6:
          case 7:
          case 8:
            return coordinate - deformation.h;
        }
        break;
      case 'w':
        switch (referencePoint) {
          case 0:
          case 3:
          case 6:
            return coordinate * 0;
          case 1:
          case 4:
          case 7:
            return coordinate * 0.5;
          case 2:
          case 5:
          case 8:
            return coordinate * 1;
        }
        break;
      case 'h':
        switch (referencePoint) {
          case 0:
          case 1:
          case 2:
            return coordinate * 0;
          case 3:
          case 4:
          case 5:
            return coordinate * 0.5;
          case 6:
          case 7:
          case 8:
            return coordinate * 1;
        }
        break;
    }
  }

  function setCoordinate (number, coordinate) {
    const deformation = source.getDeformation();
    switch (coordinate) {
      case 'x':
        const x = deformation.x - calcCoordinate(number - deformation.w, 'w');
        source.setDeformationX(x);
        break;
      case 'y':
        const y = deformation.y - calcCoordinate(number - deformation.h, 'h');
        source.setDeformationY(y);
        break;
    }
  }

  function displayPlayAndPauseSwitch (bool) {
    propertySwitches.playAndPause.checked = bool;
  }

  function displayLoopSwitch (bool) {
    propertySwitches.loop.checked = bool;
  }

  function displayGateSwitch (bool) {
    propertySwitches.gate.checked = bool;
  }

  function setPlayOrPause () {
    sound.playAndPause.checked = source.getPlay();
  }

  function setMute () {
    sound.mute.checked = source.getMute();
  }

  function setLoop () {
    sound.loop.checked = source.getLoop();
  }

  function setVolume () {
    sound.volume.value = source.getVolume();
    const percentage = Math.round(sound.volume.value);
    sound.volumeBar.style.width = `${percentage / 2}%`;
    sound.volumeValue.innerText = `${percentage} %`;
  }

  function setGate () {
    other.gate.value = source.getGate();
    const value = Math.round(other.gate.value);
    other.gateBar.style.width = `${value / 1.28}%`;
    other.gateValue.innerText = value;
  }

})();
