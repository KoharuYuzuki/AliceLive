'use strict';

(() => {

  addEventListener('load', () => {
    setInterval(checkComment, 200);
  }, false);

  function checkComment () {
    const comments = document.querySelectorAll(
      '#message.style-scope.yt-live-chat-text-message-renderer:not([data-checked])'
    );

    comments.forEach((comment) => {
      comment.setAttribute('data-checked', true);
      chrome.runtime.sendMessage({
        type: 'sendComment',
        detail: {
          name: comment.parentNode.querySelector('#author-name').innerText,
          comment: comment.innerText
        },
        uuid: genUniqueUUID()
      });
    });
  }

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
