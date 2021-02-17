'use strict';

(() => {

  const title = document.createElement('title');
  title.innerText = 'Avatar Maker | Alice Live!';
  const url = chrome.runtime.getURL('manifest.json');

  addEventListener('load', () => {
    document.head.appendChild(title);
    fetch(url)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      }
    })
    .then((json) => {
      if (json.version) {
        title.innerText = `${title.innerText} v${json.version}`;
      }
    })
    .catch((e) => console.error(e));
  }, false);

})();
