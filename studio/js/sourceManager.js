'use strict';

(() => {

  window.sources = {
    visual: [],
    sound: []
  };

  let buttons,
      sourceTypes,
      visualTypes,
      soundTypes,
      sourceLists,
      sourceLabelInputs;

  addEventListener('load', () => {
    buttons = getElements({
      add:    '#controller .button.add',
      remove: '#controller .button.remove',
      up:     '#controller .button.up',
      down:   '#controller .button.down'
    });

    sourceTypes = getElements({
      visual: '#visualSourceType',
      sound:  '#soundSourceType'
    });

    visualTypes = getElements({
      avatar:     '#visualSourceType .list #avatar',
      picture:    '#visualSourceType .list #picture',
      capture:    '#visualSourceType .list #capture',
      comment:    '#visualSourceType .list #comment',
      whiteboard: '#visualSourceType .list #whiteboard',
    });

    soundTypes = getElements({
      voiceChanger: '#soundSourceType .list #voiceChanger',
      input:        '#soundSourceType .list #input',
      file:         '#soundSourceType .list #file'
    });

    sourceLists = getElements({
      visual: '#visualSource',
      sound:  '#soundSource'
    });

    sourceLabelInputs = getElements({
      visual: '#visual input',
      sound:  '#sound input'
    });

    waitEvents();
  }, false);

  function waitEvents () {
    buttons.add.addEventListener('click', clickedAddButton, false);
    buttons.remove.addEventListener('click', clickedRemoveButton, false);
    buttons.up.addEventListener('click', () => {
      sourceIndexSwap('up');
    }, false);
    buttons.down.addEventListener('click', () => {
      sourceIndexSwap('down');
    }, false);

    sourceTypes.visual.addEventListener('click', () => {
      displaySourceType('visual', 'none');
    }, false);
    sourceTypes.sound.addEventListener('click', () => {
      displaySourceType('sound', 'none');
    }, false);

    visualTypes.avatar.addEventListener('mouseup', () => {
      loadFiles('visual', 'avatar', ['.json']);
    }, false);
    visualTypes.picture.addEventListener('mouseup', () => {
      loadFiles('visual', 'picture', ['.png', '.jpeg', '.jpg']);
    }, false);
    visualTypes.capture.addEventListener('mouseup', addScreenCapture, false);
    visualTypes.comment.addEventListener('mouseup', addCommentViewer, false);
    visualTypes.whiteboard.addEventListener('mouseup', addWhiteboard, false);

    soundTypes.voiceChanger.addEventListener('mouseup', () => {
      loadFiles('sound', 'voiceChanger', ['.json']);
    }, false);
    soundTypes.input.addEventListener('mouseup', addSoundInput, false);
    soundTypes.file.addEventListener('mouseup', () => {
      loadFiles('sound', 'soundFile', ['.mp3', '.m4a', '.wav']);
    }, false);

    sourceLabelInputs.visual.addEventListener('click', clickedSourceLabel, false);
    sourceLabelInputs.sound.addEventListener('click', clickedSourceLabel, false);
  }

  function clickedAddButton () {
    const id = document.querySelector('input[name="selectList"]:checked').parentNode.id;
    displaySourceType(id, 'block');
  }

  function displaySourceType (sourceType, displayType) {
    const element = document.querySelector(`#${sourceType}SourceType`);
    element.style.display = displayType;
  }

  function clickedRemoveButton () {
    const elements = getElements({
      selectList: 'input[name="selectList"]:checked',
      selectSource: 'input[name="selectList"]:checked ~ div div input:checked'
    });
    if (!elements.selectSource) return;
    const id = elements.selectList.parentNode.id;
    const uuid = elements.selectSource.parentNode.dataset.uuid;
    for (let i = 0; i < sources[id].length; i++) {
      if (sources[id][i].getUUID() !== uuid) continue;
      const type = sources[id][i].getType();
      if (type === 'avatar') {
        sources[id][i].getIntervalIds().forEach((id) => clearInterval(id));
        sources[id][i].getAudioContext().close();
      }
      if (['capture', 'soundInput'].includes(type)) {
        sources[id][i].stopStream();
      }
      if (type === 'voiceChanger') {
        const tracks = sources[id][i].getStream().getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (type === 'soundFile') {
        sources[id][i].setPlay(false);
      }
      sources[id].splice(i, 1);
      break;
    }
    updateList(id);
  }

  function sourceIndexSwap (direction) {
    const elements = getElements({
      selectList: 'input[name="selectList"]:checked',
      selectSource: 'input[name="selectList"]:checked ~ div div input:checked'
    });
    if (!elements.selectSource) return;
    const id = elements.selectList.parentNode.id;
    const uuid = elements.selectSource.parentNode.dataset.uuid;
    for (let i = 0; i < sources[id].length; i++) {
      if (sources[id][i].getUUID() !== uuid) continue;
      if (
        ((i === 0) && (direction === 'up')) ||
        ((i === (sources[id].length - 1)) && (direction === 'down'))
      ) break;
      const index = (direction === 'up') ? (i - 1) : i;
      sources[id].splice(index, 2, sources[id][index + 1], sources[id][index]);
      break;
    }
    updateList(id, () => {
      const input = document.querySelector(`input[name="selectList"]:checked ~ div div[data-uuid="${uuid}"] input`);
      input.checked = true;
    });
  }

  function loadFiles (sourceType, fileType, extensions) {
    const tmp = [];
    extensions.forEach((extension) => {
      tmp.push(extension.toLowerCase());
      tmp.push(extension.toUpperCase());
    });
    extensions = tmp;
    selectFiles(extensions)
    .then(async (files) => {
      const tmp = Array.from(files).reverse();
      files = tmp;
      const confirmed = extensionConfirm(files, extensions);
      for (let i = 0; i < confirmed.passed.length; i++) {
        let data;
        if (fileType === 'avatar') {
          const json = await readFile(files[i], false);
          let obj;
          try {
            obj = JSON.parse(json);
          } catch (e) {
            console.error(e);
            customAlert({
              title: 'Error',
              detail: 'Failed to load avatar'
            });
            continue;
          }
          data = {};
          if (obj.avatarVersion && (obj.avatarVersion === 1)) {
            if (obj.canvasSize) {
              data.canvasSize = {};
              if (obj.canvasSize.width) data.canvasSize.width = obj.canvasSize.width;
              if (obj.canvasSize.height) data.canvasSize.height = obj.canvasSize.height;
            } else {
              customAlert({
                title: 'Error',
                detail: 'Failed to load avatar'
              });
              continue;
            }
            if (obj.parts && (obj.parts.length > 0)) {
              data.parts = [];
              for (let i = (obj.parts.length - 1); i >= 0; i--) {
                const parts = obj.parts[i];
                if (!parts.base64) continue;
                const source = await new Source(null, 'avatarImage', parts.base64);
                if (parts.move) {
                  if (parts.move.left) source.setMoveLeft(parts.move.left);
                  if (parts.move.right) source.setMoveRight(parts.move.right);
                  if (parts.move.top) source.setMoveTop(parts.move.top);
                  if (parts.move.bottom) source.setMoveBottom(parts.move.bottom);
                }
                if (parts.openEye) source.setOpenEye(true);
                if (parts.closedEye) source.setClosedEye(true);
                if (parts.openMouth) source.setOpenMouth(true);
                if (parts.closedMouth) source.setClosedMouth(true);
                data.parts.unshift(source);
              }
            } else {
              customAlert({
                title: 'Error',
                detail: 'Failed to load avatar'
              });
              continue;
            }
          } else {
            customAlert({
              title: 'Error',
              detail: 'Not compatible avatar version'
            });
            continue;
          }
        } else if (fileType === 'voiceChanger') {
          const json = await readFile(files[i], false);
          let obj;
          try {
            obj = JSON.parse(json);
          } catch (e) {
            console.error(e);
            customAlert({
              title: 'Error',
              detail: 'Failed to load avatar'
            });
            continue;
          }
          data = {};
          if (
            (obj.voiceVersion === 1) &&
            obj.pitch &&
            obj.frequency &&
            obj.highpass &&
            obj.lowpass &&
            obj.volume
          ) {
            data.pitch     = obj.pitch;
            data.frequency = obj.frequency;
            data.highpass  = obj.highpass;
            data.lowpass   = obj.lowpass;
            data.volume    = obj.volume;
          } else {
            customAlert({
              title: 'Error',
              detail: 'Not compatible voice version'
            });
            continue;
          }
        } else if (['picture', 'soundFile'].includes(fileType)) {
          data = await readFile(files[i]);
        }
        const source = await new Source(files[i].name, fileType, data)
        .catch((e) => {
          customAlert({
            title: 'Error',
            detail: e
          });
        });
        if (source) sources[sourceType].unshift(source);
      }
      failedAlert(confirmed.failed);
    })
    .finally(() => {
      updateList(sourceType);
    })
    .catch((e) => console.error(e));
  }

  function selectFiles (extensions) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.addEventListener('change', (event) => {
        resolve(event.target.files);
      }, {once: true});
      document.body.onfocus = () => {
        document.body.onfocus = null;
        setTimeout(() => {
          if (input.files.length <= 0) reject('Selection canceled');
        }, 1000);
      };
      input.setAttribute('type', 'file');
      input.setAttribute('accept', extensions.join(','));
      input.setAttribute('multiple', null);
      input.click();
    });
  }

  function extensionConfirm (files, extension) {
    const passed = [], failed = [];
    Array.from(files).forEach((file) => {
      if (extension.includes('.' + file.name.split('.').pop())) {
        passed.push(file);
      } else {
        failed.push(file);
      }
    });
    return {
      passed,
      failed
    };
  }

  function readFile (file, base64 = true) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', (event) => {
        resolve(event.target.result);
      }, false);
      reader.addEventListener('error', () => {
        reject(reader.error);
        reader.abort();
      }, false);
      if (base64) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });
  }

  function failedAlert (failed) {
    if (failed.length <= 0) return;
    let fileNames = '';
    failed.forEach((file) => fileNames += '\n' + file.name);
    customAlert({
      title: 'Unsupported extension',
      detail: fileNames
    });
  }

  function addScreenCapture () {
    navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: {
          ideal: 60
        }
      },
      audio: {
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false
      }
    })
    .then((stream) => {
      return new Source(stream.getVideoTracks()[0].label, 'capture', stream);
    })
    .then((source) => {
      sources.visual.unshift(source);
      updateList('visual');
    })
    .catch((e) => console.error(e));
  }

  function addCommentViewer () {
    new Source('Comment Viewer', 'comment')
    .then((source) => {
      sources.visual.unshift(source);
      updateList('visual');
    })
    .catch((e) => console.error(e));
  }

  function addWhiteboard () {
    new Source('Whiteboard', 'whiteboard')
    .then((source) => {
      sources.visual.unshift(source);
      updateList('visual');
    })
    .catch((e) => console.error(e));
  }

  function addSoundInput () {
    selectDevice('audio')
    .then(({deviceName, stream}) => {
      return new Source(deviceName, 'soundInput', stream);
    })
    .then((source) => {
      sources.sound.unshift(source);
      updateList('sound');
    })
    .catch((e) => {
      console.error(e);
      customAlert({
        title: 'Error',
        detail: e
      });
    });
  }

  function clickedSourceLabel () {
    dispatchEvent(new Event('clickedSourceLabel'));
  }

  function updateList (sourceType, callback) {
    if (sources[sourceType].length <= 0) {
      sourceLists[sourceType].innerHTML = '<p class="noSource">No Source</p>';
    } else {
      sourceLists[sourceType].innerHTML = null;
      sources[sourceType].forEach((source) => {
        const div = document.createElement('div');
        div.setAttribute('data-uuid', source.getUUID());
        sourceLists[sourceType].appendChild(div);

        const input = document.createElement('input');
        input.setAttribute('type', 'radio');
        input.setAttribute('name', `select${sourceType.slice(0, 1).toUpperCase() + sourceType.slice(1)}Source`);
        div.appendChild(input);

        const p = document.createElement('p');
        p.innerText = `[${source.getDisplayName()}] : ${source.getName()}`;
        div.appendChild(p);

        div.addEventListener('click', (event) => {
          event.target.previousSibling.checked = true;
          dispatchEvent(new CustomEvent('clickedListSource', {
            detail: event.target.parentNode.dataset.uuid
          }));
        }, false);
      });
    }
    if (callback) callback();
    dispatchEvent(new CustomEvent('updatedList', {
      detail: sourceType
    }));
  }

})();
