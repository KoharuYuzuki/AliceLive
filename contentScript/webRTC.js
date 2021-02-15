'use strict';

(() => {

  const stream = new MediaStream();

  addEventListener('DOMContentLoaded', () => {
    const video = document.createElement('video');
    video.id = 'aliceLiveVideo';
    video.style.display = 'none';
    video.srcObject = stream;
    video.muted = true;
    document.body.appendChild(video);
  }, false);

  const pc2 = new RTCPeerConnection();

  pc2.addEventListener('icecandidate', (event) => {
    chrome.runtime.sendMessage({
      type: 'addICECandidateToPC1',
      detail: event.candidate
    });
  }, false);

  pc2.addEventListener('track', (event) => {
    console.log('[AliceLive!]:', event.track);
    stream.addTrack(event.track);
  }, false);

  chrome.runtime.onMessage.addListener((message) => {
    console.log('[AliceLive!]:', message);
    if (message.type === 'addICECandidateToPC2') {
      if (!message.detail) return;
      pc2.addIceCandidate(message.detail);
    }
    if (message.type === 'addDescriptionToPc2') {
      pc2.setRemoteDescription(message.detail)
      .then(() => {
        return pc2.createAnswer();
      })
      .then((answer) => {
        pc2.setLocalDescription(answer);
        chrome.runtime.sendMessage({
          type: 'addDescriptionToPc1',
          detail: answer
        })
      })
      .catch((e) => console.error('[AliceLive!]:', e));
    }
  });

  chrome.runtime.sendMessage({
    type: 'requestConnection'
  });

})();
