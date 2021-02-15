'use strict';

(() => {

  replaceEnumerateDevices();
  replaceGetUserMedia();

  function replaceEnumerateDevices () {
    navigator.mediaDevices._enumerateDevices = navigator.mediaDevices.enumerateDevices;
    navigator.mediaDevices.enumerateDevices = () => {
      return new Promise((resolve) => {
        resolve([
          {
            deviceId: 'default',
            groupId: '',
            kind: 'videoinput',
            label: 'AliceLive!-Camera'
          },
          {
            deviceId: 'default',
            groupId: '',
            kind: 'audioinput',
            label: 'AliceLive!-Microphone'
          }
        ]);
      });
    };
    console.log('[AliceLive!]: replace enumerateDevices');
  }

  function replaceGetUserMedia () {
    navigator.mediaDevices._getUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = () => {
      return new Promise((resolve) => {
        const video = document.querySelector('#aliceLiveVideo');
        resolve(video.srcObject);
      });
    };
    console.log('[AliceLive!]: replace getUserMedia');
  }

})();
