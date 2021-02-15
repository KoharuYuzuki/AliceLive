'use strict';

(() => {

  //   variousNodes
  //        ↓
  //    gainNode0
  //        ↓
  //      split        →       gainNode1
  //        ↓                      ↓
  // streamDestination    audioCtx.destination

  const uuids = [], gainNodes = [];
  const audioCtx = new AudioContext();
  Tone.getContext().close();
  Tone.setContext(audioCtx);

  const gainNode0 = audioCtx.createGain();
  gainNode0.gain.value = 1;

  const gainNode1 = audioCtx.createGain();
  gainNode1.gain.value = 0;

  const split = new Tone.Split(2);

  const streamDestination = audioCtx.createMediaStreamDestination();
  window.audioTrack = streamDestination.stream.getAudioTracks()[0];

  gainNode1.connect(audioCtx.destination);
  Tone.connect(split, gainNode1);
  Tone.connect(split, streamDestination);
  Tone.connect(gainNode0, split);

  let volume = 1;

  addEventListener('load', () => {
    const rangeSwitch = document.querySelector('#rangeSwitch');

    document.querySelector('.loopBack .checkbox input').addEventListener('change', (event) => {
      if (event.target.checked) {
        gainNode1.gain.value = volume;
        rangeSwitch.checked = false;
      } else {
        gainNode1.gain.value = 0;
        rangeSwitch.checked = true;
      }
    }, false);

    const range = document.querySelector('.loopBack .range');
    const rangeBar = range.querySelector('.rangeBar');
    range.querySelector('input').addEventListener('input', (event) => {
      const number = Number(event.target.value);
      rangeBar.style.width = `${number * 130}px`;
      volume = number;
      gainNode1.gain.value = volume;
    }, false);

    document.querySelector('.pause .checkbox input').addEventListener('change', (event) => {
      if (event.target.checked) {
        gainNode0.gain.value = 0;
      } else {
        gainNode0.gain.value = 1;
      }
    }, false);
  }, false);

  addEventListener('updatedList', () => {
    checkUpdate();
  }, false);

  addEventListener('updatedMute', (event) => {
    setVolume(event.detail);
  }, false);

  addEventListener('updatedVolume', (event) => {
    setVolume(event.detail);
  }, false);

  function checkUpdate () {
    sources.visual.concat(sources.sound).forEach((source) => {
      if (uuids.includes(source.getUUID())) return;
      switch (source.getType()) {
        case 'capture':
          if (source.audioTrack) addMediaStream(source);
          break;
        case 'voiceChanger':
          addVoiceChanger(source);
          break;
        case 'soundInput':
          addMediaStream(source);
          break;
        case 'soundFile':
          addMediaElement(source);
          break;
      }
    });
  }

  function addVoiceChanger (source) {
    const values = source.getData();
    const stream = source.getStream();

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = source.getVolume() / 100;
    gainNode.connect(gainNode0);

    const lowpassFilter = new Tone.Filter(values.lowpass, 'lowpass');
    Tone.connect(lowpassFilter, gainNode);

    const highpassFilter = new Tone.Filter(values.highpass, 'highpass');
    highpassFilter.connect(lowpassFilter);

    const frequencyShifter = new Tone.FrequencyShifter(values.frequency);
    frequencyShifter.connect(highpassFilter);

    const pitchShifter = new Tone.PitchShift(values.pitch * 12);
    pitchShifter.connect(frequencyShifter);

    const streamSource = audioCtx.createMediaStreamSource(stream);
    Tone.connect(streamSource, pitchShifter);

    const uuid = source.getUUID();
    uuids.push(uuid);
    gainNodes.push({uuid, gainNode});
  }

  function addMediaStream (source) {
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = source.getVolume() / 100;
    gainNode.connect(gainNode0);

    const streamSource = audioCtx.createMediaStreamSource(source.getData().srcObject);
    streamSource.connect(gainNode);

    const uuid = source.getUUID();
    uuids.push(uuid);
    gainNodes.push({uuid, gainNode});
  }

  function addMediaElement (source) {
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = source.getVolume() / 100;
    gainNode.connect(gainNode0);

    const elementSource = audioCtx.createMediaElementSource(source.getData());
    elementSource.connect(gainNode);

    const uuid = source.getUUID();
    uuids.push(uuid);
    gainNodes.push({uuid, gainNode});
  }

  function setVolume (uuid) {
    const gainNode = gainNodes.filter((x) => x.uuid === uuid)[0].gainNode;
    const sourceAll = sources.visual.concat(sources.sound);
    const source = sourceAll.filter((source) => source.getUUID() === uuid)[0];
    if (source.getMute()) {
      gainNode.gain.value = 0;
    } else {
      gainNode.gain.value = source.getVolume() / 100;
    }
  }

})();
