'use strict';

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

  const uuidArray = [];

  window.genUniqueUUID = () => {
    while (true) {
      const uuid = genUUID();
      if (!uuidArray.includes(uuid)) {
        uuidArray.push(uuid);
        return uuid;
      }
    }
  };

  function genUUID () {
    let str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return str.replace(new RegExp('[xy]', 'g'), (match) => {
      if (match === 'x') {
        return Math.floor(Math.random() * 16).toString(16);
      } else {
        return (Math.floor(Math.random() * 4) + 8).toString(16);
      }
    });
  }

})();

(() => {

  window.selectDevice = (deviceType, options = null) => {
    let deviceName;
    return new Promise((resolve, reject) => {
      tryGetUserMedia()
      .then(() => {
        return navigator.mediaDevices.enumerateDevices();
      })
      .then((devices) => {
        return selectDeviceAlert(devices.filter((device) => device.kind === `${deviceType}input`));
      })
      .then((result) => {
        deviceName = result.name;
        if (options) {
          return getUserMedia(deviceType, result.id, options);
        } else {
          return getUserMedia(deviceType, result.id);
        }
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
