'use strict';

(() => {

  window.sources = [];

  let buttons, editor, canvasSize;

  addEventListener('load', () => {
    buttons = getElements({
      add:    '#controller .button.add',
      remove: '#controller .button.remove',
      up:     '#controller .button.up',
      down:   '#controller .button.down',
      save:   '#controller .button.save',
      load:   '#controller .button.load'
    });

    editor = document.querySelector('#editor');

    canvasSize = getElements({
      width: '#controller .width',
      height: '#controller .height'
    });

    waitEvents();
  }, false);

  function waitEvents () {
    buttons.add.addEventListener('click', loadFiles, false);
    buttons.remove.addEventListener('click', removeSource, false);
    buttons.up.addEventListener('click', () => {
      sourceIndexSwap('up');
    }, false);
    buttons.down.addEventListener('click', () => {
      sourceIndexSwap('down');
    }, false);
    buttons.save.addEventListener('click', save, false);
    buttons.load.addEventListener('click', load, false);
  }

  function loadFiles () {
    const extensions = ['.png', '.PNG'];
    selectFiles(extensions)
    .then(async (files) => {
      const tmp = Array.from(files).reverse();
      files = tmp;
      const confirmed = extensionConfirm(files, extensions);
      for (let i = 0; i < confirmed.passed.length; i++) {
        const base64 = await readFile(files[i]);
        const source = await new Source(files[i].name, base64)
        .catch((e) => {
          customAlert({
            title: 'Error',
            detail: e
          });
        });
        sources.unshift(source);
      }
      failedAlert(confirmed.failed);
    })
    .finally(updateList)
    .catch((e) => console.error(e));
  }

  function selectFiles (extensions, multiple = true) {
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
      if (multiple) input.setAttribute('multiple', null);
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
      if (base64) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
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

  function removeSource () {
    const selectSource = document.querySelector('input[name="selectSource"]:checked');
    if (!selectSource) return;
    const uuid = selectSource.parentNode.dataset.uuid;
    for (let i = 0; i < sources.length; i++) {
      if (sources[i].getUUID() !== uuid) continue;
      sources.splice(i, 1);
      break;
    }
    updateList();
  }

  function sourceIndexSwap (direction) {
    const selectSource = document.querySelector('input[name="selectSource"]:checked');
    if (!selectSource) return;
    const uuid = selectSource.parentNode.dataset.uuid;
    for (let i = 0; i < sources.length; i++) {
      if (sources[i].getUUID() !== uuid) continue;
      if (
        ((i === 0) && (direction === 'up')) ||
        ((i === (sources.length - 1)) && (direction === 'down'))
      ) break;
      const index = (direction === 'up') ? (i - 1) : i;
      sources.splice(index, 2, sources[index + 1], sources[index]);
      break;
    }
    updateList(() => {
      const input = document.querySelector(`#editor div[data-uuid="${uuid}"] input`);
      input.checked = true;
    });
  }

  function save () {
    const obj = {
      avatarVersion: 1.2,
      canvasSize: {
        width: canvas.width,
        height: canvas.height
      },
      parts: []
    };
    sources.forEach((source) => {
      obj.parts.push({
        name: source.getName(),
        base64: source.getRawData(),
        move: source.getMove(),
        openEye: source.getOpenEye(),
        closedEye: source.getClosedEye(),
        openMouth: source.getOpenMouth(),
        closedMouth: source.getClosedMouth()
      });
    });
    const json = JSON.stringify(obj, null, 2);
    const link = document.createElement('a');
    link.download = 'avatar.json';
    link.href = URL.createObjectURL(new Blob([json], {type: 'application/json'}));
    link.click();
    saved = true;
  }

  function load () {
    const extensions = ['.json', '.JSON'];
    selectFiles(extensions, false)
    .then(async (files) => {
      const confirmed = extensionConfirm(files, extensions);
      const json = await readFile(files[0], false);
      let obj;
      try {
        obj = JSON.parse(json);
      } catch (e) {
        console.error(e);
        customAlert({
          title: 'Error',
          detail: 'Failed to load avatar'
        });
        return;
      }
      sources = [];
      if (obj.avatarVersion && ([1, 1.1, 1.2].includes(obj.avatarVersion))) {
        if (obj.canvasSize) {
          if (obj.canvasSize.width) {
            canvas.width = obj.canvasSize.width;
            tmpCanvas.width = obj.canvasSize.width;
            canvasSize.width.value = canvas.width;
          }
          if (obj.canvasSize.height) {
            canvas.height = obj.canvasSize.height;
            tmpCanvas.height = obj.canvasSize.height;
            canvasSize.height.value = canvas.height;
          }
        }
        if (obj.parts && (obj.parts.length > 0)) {
          for (let i = (obj.parts.length - 1); i >= 0; i--) {
            const parts = obj.parts[i];
            if (!parts.name) continue;
            if (!parts.base64) continue;
            const source = await new Source(parts.name, parts.base64);
            if (parts.move) {
              if (parts.move.left) source.setMoveLeft(parts.move.left);
              if (parts.move.right) source.setMoveRight(parts.move.right);
              if (parts.move.top) source.setMoveTop(parts.move.top);
              if (parts.move.bottom) source.setMoveBottom(parts.move.bottom);
              if (parts.move.splitScaling) source.setSplitScaling(parts.move.splitScaling);
              if (parts.move.pointX) source.setPointX(parts.move.pointX);
              if (parts.move.pointY) source.setPointY(parts.move.pointY);
              if (parts.move.rotate) source.setRotate(parts.move.rotate);
            }
            if (parts.openEye) source.setOpenEye(true);
            if (parts.closedEye) source.setClosedEye(true);
            if (parts.openMouth) source.setOpenMouth(true);
            if (parts.closedMouth) source.setClosedMouth(true);
            sources.unshift(source);
          }
        }
      } else {
        customAlert({
          title: 'Error',
          detail: 'Not compatible avatar version'
        });
      }
      failedAlert(confirmed.failed);
    })
    .finally(() => {
      updateList(() => saved = true);
    })
    .catch((e) => console.error(e));
  }

  function updateList (callback) {
    if (sources.length <= 0) {
      editor.innerHTML = '<p class="noImage">No Image</p>';
    } else {
      editor.innerHTML = null;
      sources.forEach((source) => {
        const div = document.createElement('div');
        div.setAttribute('data-uuid', source.getUUID());
        editor.appendChild(div);

        const input = document.createElement('input');
        input.setAttribute('type', 'radio');
        input.setAttribute('name', `selectSource`);
        div.appendChild(input);

        const p = document.createElement('p');
        p.innerText = source.getName();
        p.addEventListener('click', (event) => {
          event.target.previousSibling.checked = true;
        }, false);
        div.appendChild(p);

        const box = document.createElement('div');
        div.appendChild(box);

        ['left', 'right', 'top', 'bottom', 'splitScaling', 'pointX', 'pointY', 'rotate'].forEach((type) => {
          const input = document.createElement('input');
          input.setAttribute('type', 'number');
          input.setAttribute('step', '1');
          input.setAttribute('data-type', type);
          input.value = source.getMove()[type];
          input.addEventListener('change', (event) => {
            let number = Number(event.target.value);
            if (isNaN(number)) number = 0;
            event.target.value = number;
            switch (event.target.dataset.type) {
              case 'left':
                source.setMoveLeft(number);
                break;
              case 'right':
                source.setMoveRight(number);
                break;
              case 'top':
                source.setMoveTop(number);
                break;
              case 'bottom':
                source.setMoveBottom(number);
                break;
              case 'splitScaling':
                source.setSplitScaling(number);
                break;
              case 'pointX':
                source.setPointX(number);
                break;
              case 'pointY':
                source.setPointY(number);
                break;
              case 'rotate':
                source.setRotate(number);
                break;
            }
            saved = false;
          }, false);
          box.appendChild(input);
        });

        ['openEye', 'closedEye', 'openMouth', 'closedMouth'].forEach((type) => {
          const div = document.createElement('div');
          box.appendChild(div);

          const input = document.createElement('input');
          input.setAttribute('type', 'checkbox');
          input.setAttribute('data-type', type);
          switch (type) {
            case 'openEye':
              input.checked = source.getOpenEye();
              break;
            case 'closedEye':
              input.checked = source.getClosedEye();
              break;
            case 'openMouth':
              input.checked = source.getOpenMouth();
              break;
            case 'closedMouth':
              input.checked = source.getClosedMouth();
              break;
          }
          input.addEventListener('change', (event) => {
            const checked = event.target.checked;
            switch (event.target.dataset.type) {
              case 'openEye':
                if (checked) {
                  source.setOpenEye(true);
                  source.setClosedEye(false);
                  document.querySelector(
                    `div[data-uuid="${source.getUUID()}"] input[data-type="closedEye"]`
                  ).checked = false;
                } else {
                  source.setOpenEye(false);
                }
                break;
              case 'closedEye':
                if (checked) {
                  source.setOpenEye(false);
                  source.setClosedEye(true);
                  document.querySelector(
                    `div[data-uuid="${source.getUUID()}"] input[data-type="openEye"]`
                  ).checked = false;
                } else {
                  source.setClosedEye(false);
                }
                break;
              case 'openMouth':
                if (checked) {
                  source.setOpenMouth(true);
                  source.setClosedMouth(false);
                  document.querySelector(
                    `div[data-uuid="${source.getUUID()}"] input[data-type="closedMouth"]`
                  ).checked = false;
                } else {
                  source.setOpenMouth(false);
                }
                break;
              case 'closedMouth':
                if (checked) {
                  source.setOpenMouth(false);
                  source.setClosedMouth(true);
                  document.querySelector(
                    `div[data-uuid="${source.getUUID()}"] input[data-type="openMouth"]`
                  ).checked = false;
                } else {
                  source.setClosedMouth(false);
                }
                break;
            }
            saved = false;
          }, false);
          div.appendChild(input);

          const button = document.createElement('div');
          div.appendChild(button);
        });
      });
    }
    saved = false;
    if (callback) callback();
    dispatchEvent(new Event('updatedList'));
  }

})();
