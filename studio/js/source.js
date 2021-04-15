'use strict';

(() => {

  window.Source = Source;

  function Source (name, type, data) {
    const _this = this;
    return new Promise(async (resolve, reject) => {
      setReadOnlyProperties(_this, {
        name,
        type,
        uuid: genUniqueUUID()
      });

      if (['avatar', 'picture', 'capture', 'comment', 'whiteboard'].includes(_this.type)) {
        _this.setReferencePoint(0);
        _this.deformation = {};
      }
      if (['soundInput', 'soundFile'].includes(_this.type)) {
        _this.setMute(false);
        _this.setVolume(100);
      }

      if (_this.type === 'avatar') {
        const intervalWorkers = [];
        const videoDevice = await selectDevice('video', {
          video: {width: 128, height: 128}
        }).catch((e) => reject(e));
        let video;
        if (videoDevice) video = await getVideo(videoDevice.stream).catch((e) => reject(e));
        else return;

        const audioDevice = await selectDevice('audio').catch((e) => reject(e));
        let audio;
        if (audioDevice) audio = await getAudio('stream', audioDevice.stream).catch((e) => reject(e));
        else return;

        if (!(video && audio)) return;

        _this.setDeformationAll(0, 0, data.canvasSize.width, data.canvasSize.height);
        _this.setVerticalValue(0.5);
        _this.setHorizontalValue(0.5);
        _this.setEyeOpen(true);
        _this.setMouthOpen(false);
        _this.setGate(0);
        setReadOnlyProperties(_this, {
          displayName: 'Avatar',
          data
        });

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const canvasCtx = canvas.getContext('2d');
        canvasCtx.scale(-1, 1);
        canvasCtx.translate(-canvas.width, 0);

        const objects = new tracking.ObjectTracker(['face']);
        objects.on('track', (event) => {
          if (event.data.length <= 0) return;
          const data = event.data[0];
          const verticalStep = ((data.y / (video.videoHeight - data.height)) - _this.getVerticalValue()) / 6;
          const horizontalStep = ((data.x / (video.videoWidth - data.width)) - _this.getHorizontalValue()) / 6;
          let counter = 0;
          const worker = new Worker('./js/intervalWorker.js');
          worker.postMessage({interval: 1000 / 10 / 6});
          worker.addEventListener('message', () => {
            if (counter >= 4) worker.terminate();
            const verticalValue = _this.getVerticalValue() + verticalStep;
            const horizontalValue = _this.getHorizontalValue() + horizontalStep;
            _this.setVerticalValue((verticalValue < 0) ? 0 : (verticalValue > 1) ? 1 : verticalValue);
            _this.setHorizontalValue((horizontalValue < 0) ? 0 : (horizontalValue > 1) ? 1 : horizontalValue);
            counter++;
          }, false);
        });

        const faceTrackingIntervalWorker = new Worker('./js/intervalWorker.js');
        faceTrackingIntervalWorker.postMessage({interval: 1000 / 10});
        faceTrackingIntervalWorker.addEventListener('message', () => {
          canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
          tracking.track(canvas, objects);
        }, false);
        intervalWorkers.push(faceTrackingIntervalWorker);

        const closeEyeIntervalWorker = new Worker('./js/intervalWorker.js');
        closeEyeIntervalWorker.postMessage({interval: 1000});
        closeEyeIntervalWorker.addEventListener('message', () => {
          const num = Math.floor(Math.random() * 10);
          if (num !== 0) return;
          _this.setEyeOpen(false);
          const worker = new Worker('./js/timeoutWorker.js');
          worker.postMessage({timeout: 100});
          worker.addEventListener('message', () => {
            _this.setEyeOpen(true);
          }, false);
        }, false);
        intervalWorkers.push(closeEyeIntervalWorker);

        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;

        const streamSource = audioCtx.createMediaStreamSource(audio.srcObject);
        streamSource.connect(analyser);

        const maxVolumeIntervalWorker = new Worker('./js/intervalWorker.js');
        maxVolumeIntervalWorker.postMessage({interval: 1000 / 10});
        maxVolumeIntervalWorker.addEventListener('message', () => {
          const data = new Uint8Array(analyser.fftSize);
          analyser.getByteTimeDomainData(data);
          const maxValue = data.reduce((a, b) => Math.max(a, b)) - 128;
          if (maxValue > _this.getGate()) {
            _this.setMouthOpen(true);
          } else {
            _this.setMouthOpen(false);
          }
          dispatchEvent(new CustomEvent('updateMaxVolume', {
            detail: {
              uuid: _this.getUUID(),
              volume: maxValue
            }
          }));
        }, false);
        intervalWorkers.push(maxVolumeIntervalWorker);

        setReadOnlyProperties(_this, {
          audioContext: audioCtx,
          intervalWorkers
        });
      }
      if (_this.type === 'picture') {
        const image = await getImage(data).catch((e) => reject(e));
        if (image) _this.setDeformationAll(0, 0, image.width, image.height);
        setReadOnlyProperties(_this, {
          displayName: 'Picture',
          data: image
        });
      }
      if (_this.type === 'capture') {
        const audioTracks = data.getAudioTracks();
        if (audioTracks.length > 0) {
          _this.audioTrack = true;
          _this.setMute(false);
          _this.setVolume(100);
        }
        const video = await getVideo(data).catch((e) => reject(e));
        if (video) _this.setDeformationAll(0, 0, video.videoWidth, video.videoHeight);
        _this.origSize = {};
        if (video) _this.setOrigSizeAll(video.videoWidth, video.videoHeight);
        setReadOnlyProperties(_this, {
          displayName: 'Capture',
          data: video
        });
      }
      if (_this.type === 'comment') {
        _this.setDeformationAll(0, 0, 500, 500);
        _this.setFrameOpacity(1);
        setReadOnlyProperties(_this, {
          displayName: 'Comment Viewer'
        });
      }
      if (_this.type === 'whiteboard') {
        _this.setDeformationAll(0, 0, 500, 500);
        _this.setFrameOpacity(1);
        const canvas = document.createElement('canvas');
        setReadOnlyProperties(_this, {
          displayName: 'Whiteboard',
          canvas
        });
      }
      if (_this.type === 'voiceChanger') {
        const audioDevice = await selectDevice('audio', {
          audio: {
            echoCancellation: false,
            noiseSuppression: true
          }
        }).catch((e) => reject(e));
        let audio;
        if (audioDevice) audio = await getAudio('stream', audioDevice.stream).catch((e) => reject(e));
        else return;

        if (!audio) return;

        _this.setMute(false);
        _this.setVolume(data.volume);
        setReadOnlyProperties(_this, {
          displayName: 'Voice Changer',
          data,
          stream: audio.srcObject
        });
      }
      if (_this.type === 'soundInput') {
        const audio = await getAudio('stream', data).catch((e) => reject(e));
        setReadOnlyProperties(_this, {
          displayName: 'Input',
          data: audio
        });
      }
      if (_this.type === 'soundFile') {
        const audio = await getAudio('base64', data).catch((e) => reject(e));
        if (audio) {
          audio.addEventListener('ended', () => {
            dispatchEvent(new CustomEvent('playingEnded', {
              detail: _this.getUUID()
            }));
          }, false);
        }
        setReadOnlyProperties(_this, {
          displayName: 'File',
          data: audio
        });
      }

      if (_this.type === 'avatarImage') {
        const image = await getImage(data).catch((e) => reject(e));
        _this.move = {};
        _this.setMoveAll(0, 0, 0, 0, 0);
        _this.setOpenEye(false);
        _this.setClosedEye(false);
        _this.setOpenMouth(false);
        _this.setClosedMouth(false);

        setReadOnlyProperties(_this, {
          data: image,
          size: {
            width: image.width,
            height: image.height
          }
        });
      }

      resolve(_this);
    });
  }

  Source.prototype = {
    getName: function () {
      return this.name;
    },
    getDisplayName: function () {
      return this.displayName;
    },
    getType: function () {
      return this.type;
    },
    getUUID: function () {
      return this.uuid;
    },
    getData: function () {
      return this.data;
    },
    getReferencePoint: function () {
      return this.referencePoint;
    },
    getDeformation: function () {
      return this.deformation;
    },
    getOrigSize: function () {
      return this.origSize;
    },
    getVideoSize: function () {
      return {
        w: this.data.videoWidth,
        h: this.data.videoHeight,
      };
    },
    getPlay: function () {
      return !this.data.paused;
    },
    getMute: function () {
      return this.mute;
    },
    getLoop: function () {
      return this.data.loop;
    },
    getVolume: function () {
      return this.volume;
    },
    getGate: function () {
      return this.gate;
    },
    getSize: function () {
      return this.size;
    },
    getMove: function () {
      return this.move;
    },
    getOpenEye: function () {
      return this.openEye;
    },
    getClosedEye: function () {
      return this.closedEye;
    },
    getOpenMouth: function () {
      return this.openMouth;
    },
    getClosedMouth: function () {
      return this.closedMouth;
    },
    getVerticalValue: function () {
      return this.verticalValue;
    },
    getHorizontalValue: function () {
      return this.horizontalValue;
    },
    getEyeOpen: function () {
      return this.eyeOpen;
    },
    getMouthOpen: function () {
      return this.mouthOpen;
    },
    getAudioContext: function () {
      return this.audioContext;
    },
    getIntervalWorkers: function () {
      return this.intervalWorkers;
    },
    getStream: function () {
      return this.stream;
    },
    getFrameOpacity: function () {
      return this.frameOpacity;
    },
    getCanvas: function () {
      return this.canvas;
    },
    setReferencePoint: function (referencePoint) {
      this.referencePoint = referencePoint;
    },
    setDeformationAll: function (x, y, w, h) {
      this.deformation.x = x;
      this.deformation.y = y;
      this.deformation.w = w;
      this.deformation.h = h;
    },
    setDeformationX: function (x) {
      this.deformation.x = x;
    },
    setDeformationY: function (y) {
      this.deformation.y = y;
    },
    setDeformationW: function (w) {
      this.deformation.w = w;
    },
    setDeformationH: function (h) {
      this.deformation.h = h;
    },
    setOrigSizeAll: function (w, h) {
      this.origSize.w = w;
      this.origSize.h = h;
    },
    setOrigSizeW: function (w) {
      this.origSize.w = w;
    },
    setOrigSizeH: function (h) {
      this.origSize.h = h;
    },
    setPlay: function (bool) {
      if (bool) this.data.play();
      else this.data.pause();
    },
    setMute: function (bool) {
      this.mute = bool;
    },
    setLoop: function (bool) {
      this.data.loop = bool;
    },
    setVolume: function (value) {
      this.volume = value;
    },
    setGate: function (value) {
      this.gate = value;
    },
    setMoveAll: function (left, right, top, bottom, splitScaling) {
      this.move.left = left;
      this.move.right = right;
      this.move.top = top;
      this.move.bottom = bottom;
      this.move.splitScaling = splitScaling;
    },
    setMoveLeft: function (left) {
      this.move.left = left;
    },
    setMoveRight: function (right) {
      this.move.right = right;
    },
    setMoveTop: function (top) {
      this.move.top = top;
    },
    setMoveBottom: function (bottom) {
      this.move.bottom = bottom;
    },
    setSplitScaling: function (splitScaling) {
      this.move.splitScaling = splitScaling;
    },
    setOpenEye: function (bool) {
      this.openEye = bool;
    },
    setClosedEye: function (bool) {
      this.closedEye = bool;
    },
    setOpenMouth: function (bool) {
      this.openMouth = bool;
    },
    setClosedMouth: function (bool) {
      this.closedMouth = bool;
    },
    setVerticalValue: function (value) {
      this.verticalValue = value;
    },
    setHorizontalValue: function (value) {
      this.horizontalValue = value;
    },
    setEyeOpen: function (bool) {
      this.eyeOpen = bool;
    },
    setMouthOpen: function (bool) {
      this.mouthOpen = bool;
    },
    setFrameOpacity: function (value) {
      this.frameOpacity = value;
    },
    stopStream: function () {
      const tracks = this.data.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  function getImage (base64) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => {
        resolve(image);
      }, {once: true});
      image.addEventListener('error', () => {
        reject('Image loading failed');
      }, {once: true});
      image.src = base64;
    });
  }

  function getVideo (stream) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.addEventListener('play', () => {
        video.muted = true;
        resolve(video);
      }, {once: true});
      video.addEventListener('error', () => {
        reject('Video loading failed');
      }, {once: true});
      video.autoplay = true;
      video.srcObject = stream;
    });
  }

  function getAudio (dataType, data) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.addEventListener('canplay', () => {
        resolve(audio);
      }, {once: true});
      audio.addEventListener('error', () => {
        reject('Audio loading failed');
      }, {once: true});
      if (dataType === 'stream') {
        audio.autoplay = true;
        audio.muted = true;
        audio.srcObject = data;
      } else if (dataType === 'base64') {
        audio.src = data;
      }
    });
  }

  function setReadOnlyProperties (obj, properties) {
    Object.keys(properties).forEach((key) => {
      Object.defineProperty(obj, key, {
        value: properties[key]
      });
    });
  }

})();
