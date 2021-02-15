'use strict';

(() => {

  window.commentUUIDs = [];
  window.comments = {};

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== 'sendComment') return;
    if (!message.uuid) return;
    if (commentUUIDs.includes(message.uuid)) return;
    commentUUIDs.push(message.uuid);
    comments[message.uuid] = message.detail;
  });

})();
