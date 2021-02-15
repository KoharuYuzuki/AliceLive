'use strict';

(() => {

  window.getElements = (selectors) => {
    const elements = {};
    Object.keys(selectors).forEach((key) => {
      elements[key] = document.querySelector(selectors[key]);
    });
    return elements;
  };

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
