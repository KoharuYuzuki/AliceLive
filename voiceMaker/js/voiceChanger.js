'use strict';

(() => {

  const values = {};
  const elementsIds = [
    'pitch',
    'frequency',
    'highpass',
    'lowpass',
    'volume'
  ];

  let device;

  addEventListener('load', () => {
    elementsIds.forEach((id) => {
      const input = document.querySelector(`#${id}`);
      values[id] = Number(input.value);

      updateValue(input, id);
      updateRange(input, id);

      input.addEventListener('input', (event) => {
        if (!device) return;
        values[id] = Number(event.target.value);
        updateValue(input, id);
        updateRange(input, id);
      }, false);

      input.addEventListener('change', () => {
        if (!device) return;
        saved = false;
        initAudio();
      }, false);

      addEventListener('loadVoice', () => {
        updateValue(input, id);
        updateRange(input, id);
      }, false);
    });

    selectDevice('audio', {
      audio: {
        autoGainControl: false,
        echoCancellation: true,
        noiseSuppression: true
      }
    })
    .then((_device) => device = _device)
    .catch((e) => console.error(e));

    document.querySelector('#save').addEventListener('click', save, false);
    document.querySelector('#load').addEventListener('click', load, false);
  }, false);

  function updateValue (input, id) {
    const value = input.parentNode.querySelector('.value');
    value.innerText = values[id];
  }

  function updateRange (input, id) {
    const max = Number(input.max);
    const min = Number(input.min);
    const range = input.parentNode.querySelector('.range');
    range.style.width = `${(values[id] - min) / (max - min) * 600}px`;
  }

  function initAudio () {
    Tone.getContext().close();

    Tone.setContext(new AudioContext());
    const audioCtx = Tone.getContext();

    const gain = new Tone.Gain(values.volume / 100);
    Tone.connect(gain, audioCtx.destination);

    const pitchShifter = new Tone.PitchShift(values.pitch * 12);
    pitchShifter.connect(gain);

    const frequencyShifter = new Tone.FrequencyShifter(values.frequency);
    frequencyShifter.connect(pitchShifter);

    const lowpassFilter = new Tone.Filter(values.lowpass, 'lowpass');
    Tone.connect(lowpassFilter, frequencyShifter);

    const highpassFilter = new Tone.Filter(values.highpass, 'highpass');
    highpassFilter.connect(lowpassFilter);

    const streamSource = audioCtx.createMediaStreamSource(device.stream);
    Tone.connect(streamSource, highpassFilter);
  }

  function save () {
    const obj = {...values};
    obj.voiceVersion = 1;
    const json = JSON.stringify(obj, null, 2);
    const link = document.createElement('a');
    link.download = 'voice.json';
    link.href = URL.createObjectURL(new Blob([json], {type: 'application/json'}));
    link.click();
    saved = true;
  }

  function load () {
    if (!device) return;
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
          detail: 'Failed to load voice'
        });
        return;
      }
      if (
        (obj.voiceVersion === 1) &&
        ('pitch' in obj) &&
        ('frequency' in obj) &&
        ('highpass' in obj) &&
        ('lowpass' in obj) &&
        ('volume' in obj)
      ) {
        values.pitch     = obj.pitch;
        values.frequency = obj.frequency;
        values.highpass  = obj.highpass;
        values.lowpass   = obj.lowpass;
        values.volume    = obj.volume;
        initAudio();
        dispatchEvent(new Event('loadVoice'));
      } else {
        customAlert({
          title: 'Error',
          detail: 'Not compatible voice version'
        });
      }
      failedAlert(confirmed.failed);
    })
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

})();

(() => {

  window.getElements = (selectors) => {
    const elements = {};
    Object.keys(selectors).forEach((key) => {
      elements[key] = document.querySelector(selectors[key]);
    });
    return elements;
  };

})();

(() => {

  window.selectDevice = (deviceType, options) => {
    let deviceName;
    return new Promise((resolve, reject) => {
      tryGetUserMedia()
      .then(() => {
        return navigator.mediaDevices.enumerateDevices();
      })
      .then((devices) => {
        return selectDeviceAlert(devices.filter((device) => device.kind === `${deviceType}input`));
      })
      .then(({name, id}) => {
        deviceName = name;
        return getUserMedia(deviceType, id, options);
      })
      .then((stream) => {
        resolve({
          deviceName,
          stream
        });
      })
      .catch((e) => reject(e));
    });
  }

  function tryGetUserMedia () {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      .then((stream) => {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        resolve();
      })
      .catch((e) => {
        customAlert({
          title: 'Error',
          detail: '<p>Failed to access camera or microphone</p><p>Please connect correctly</p>'
        });
        reject(e);
      });
    });
  }

  function selectDeviceAlert (devices) {
    return new Promise((resolve) => {
      const list = document.createElement('div');
      list.classList.add('list');
      devices.forEach((device, index) => {
        const input = document.createElement('input');
        input.setAttribute('type', 'radio');
        input.setAttribute('name', 'selectDevice');
        if (index === 0) input.setAttribute('checked', null);
        list.appendChild(input);
        const p = document.createElement('p');
        p.innerText = device.label;
        p.setAttribute('data-deviceid', device.deviceId);
        list.appendChild(p);
        p.addEventListener('click', () => {
          p.previousElementSibling.checked = true;
        }, false);
      });
      customAlert({
        title: 'Please select a device',
        detail: list,
        callback: () => {
          const p = list.querySelector('input:checked + p');
          resolve({
            name: p.innerText,
            id: p.dataset.deviceid
          });
        }
      });
    });
  }

  function getUserMedia (deviceType, deviceId, options = false) {
    if (options) {
      options[deviceType].deviceId = deviceId;
    } else {
      options = {[deviceType]: {deviceId}};
    }
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia(options)
      .then((stream) => {
        resolve(stream);
      })
      .catch((e) => reject(e));
    });
  }

})();
