'use strict';

(() => {

  const url = chrome.runtime.getURL('LICENSE');

  addEventListener('load', () => {
    fetch(url)
    .then((response) => {
      if (response.status === 200) {
        return response.text();
      } else {
        return null;
      }
    })
    .then((text) => {
      if (text === null) return;
      const split = text.split('\n');
      split.forEach((text) => {
        if (text === '') {
          const br = document.createElement('br');
          document.body.appendChild(br);
        } else {
          const p = document.createElement('p');
          p.innerText = text;
          document.body.appendChild(p);
        }
      });
    })
    .catch((e) => console.error(e));
  }, false);

})();
