'use strict';

(() => {

  window.commentUUIDs = [];
  window.comments = {};

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'sendComment') {
      if (!message.detail.uuid || commentUUIDs.includes(message.detail.uuid)) return;
      commentUUIDs.unshift(message.detail.uuid);
      comments[message.detail.uuid] = {
        name: message.detail.name,
        comment: message.detail.comment
      };
    } else if (message.type === 'sendDeleteCommentId') {
      if (!message.detail.uuid || (comments[message.detail.uuid] === null)) return;
      comments[message.detail.uuid] = null;
    }
  });

})();
