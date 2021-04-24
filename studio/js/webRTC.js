'use strict';

(() => {

  let pc1 = null;

  addEventListener('load', () => {
    document.querySelector('.connectionReset .checkbox input').addEventListener('change', (event) => {
      if (event.target.checked) {
        if (pc1 !== null) {
          pc1.close();
          pc1 = null;
        }
        setTimeout(() => {
          event.target.checked = false;
        }, 500);
      }
    }, false);
  }, false);

  chrome.runtime.onMessage.addListener((message) => {
    if ((pc1 === null) && (message.type === 'requestConnection')) {
      connection();
    }
  });

  function connection () {
    pc1 = new RTCPeerConnection();

    pc1.addEventListener('icecandidate', (event) => {
      chrome.runtime.sendMessage({
        type: 'addICECandidateToPC2',
        detail: event.candidate
      });
    }, false);

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'addICECandidateToPC1') {
        console.log(message);
        if (!message.detail) return;
        pc1.addIceCandidate(message.detail);
      }
      if (message.type === 'addDescriptionToPc1') {
        console.log(message);
        pc1.setRemoteDescription(message.detail);
      }
    });

    pc1.addTrack(videoTrack);
    pc1.addTrack(audioTrack);

    pc1.createOffer({
      offerToReceiveVideo: 1,
      offerToReceiveAudio: 1
    })
    .then((offer) => {
      pc1.setLocalDescription(offer);
      chrome.runtime.sendMessage({
        type: 'addDescriptionToPc2',
        detail: offer
      });
    })
    .catch((e) => console.error(e));
  }

})();
