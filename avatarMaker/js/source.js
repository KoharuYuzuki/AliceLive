'use strict';

(() => {

  window.Source = Source;

  function Source (name, data) {
    const _this = this;
    return new Promise(async (resolve, reject) => {
      const image = await getImage(data).catch((e) => reject(e));
      _this.move = {};
      _this.setMoveAll(0, 0, 0, 0, 0, 0, 0, 0);
      _this.setOpenEye(false);
      _this.setClosedEye(false);
      _this.setOpenMouth(false);
      _this.setClosedMouth(false);

      setReadOnlyProperties(_this, {
        name,
        uuid: genUniqueUUID(),
        data: image,
        rawData: data,
        size: {
          width: image.width,
          height: image.height
        }
      });

      resolve(_this);
    });
  }

  Source.prototype = {
    getName: function () {
      return this.name;
    },
    getUUID: function () {
      return this.uuid;
    },
    getData: function () {
      return this.data;
    },
    getRawData: function () {
      return this.rawData;
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
    setMoveAll: function (left, right, top, bottom, splitScaling, pointX, pointY, rotate) {
      this.move.left = left;
      this.move.right = right;
      this.move.top = top;
      this.move.bottom = bottom;
      this.move.splitScaling = splitScaling;
      this.move.pointX = pointX;
      this.move.pointY = pointY;
      this.move.rotate = rotate;
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
    setPointX: function (pointX) {
      this.move.pointX = pointX;
    },
    setPointY: function (pointY) {
      this.move.pointY = pointY;
    },
    setRotate: function (rotate) {
      this.move.rotate = rotate;
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

  function setReadOnlyProperties (obj, properties) {
    Object.keys(properties).forEach((key) => {
      Object.defineProperty(obj, key, {
        value: properties[key]
      });
    });
  }

})();
