'use strict';

(() => {

  chrome.runtime.onMessage.addListener((message) => {
    if (['addICECandidateToPC2', 'addDescriptionToPc2'].includes(message.type)) {
      getYouTubeTab()
      .then((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: message.type,
          detail: message.detail
        });
      })
      .catch((e) => console.error(e));
    }
    if (['addICECandidateToPC1', 'addDescriptionToPc1'.includes(message.type)]) {
      getStudioTab()
      .then((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: message.type,
          detail: message.detail
        });
      })
      .catch((e) => console.error(e));
    }
    if (message.type === 'requestConnection') {
      getStudioTab()
      .then((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: message.type
        });
      })
      .catch((e) => console.error(e));
    }
    if (message.type === 'sendComment') {
      getStudioTab()
      .then((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: message.type,
          detail: message.detail
        });
      })
      .catch((e) => console.error(e));
    }
  });

  function getYouTubeTab () {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({
        url: 'https://studio.youtube.com/*/livestreaming*'
      })
      .then((result) => {
        if (result.length <= 0) {
          reject('length of 0');
        } else {
          resolve(result[0]);
        }
      })
      .catch((e) => reject(e));
    });
  }

  function getStudioTab () {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({
        url: chrome.runtime.getURL('studio/index.html') + '*'
      })
      .then((result) => {
        if (result.length <= 0) {
          reject('length of 0');
        } else {
          resolve(result[0]);
        }
      })
      .catch((e) => reject(e));
    });
  }

})();

(() => {

  chrome.runtime.onInstalled.addListener(() => {
    createMenus([
      {id: 'studio',  title: 'Studio'},
      {id: 'avatar',  title: 'Avatar Maker'},
      {id: 'voice',   title: 'Voice Maker'},
      {id: 'license', title: 'License'}
    ]);
  });

  chrome.contextMenus.onClicked.addListener((event) => {
    switch (event.menuItemId) {
      case 'studio':
        openStudio();
        break;
      case 'avatar':
        openAvatarMaker();
        break;
      case 'voice':
        openVoiceMaker();
        break;
      case 'license':
        openLicense();
        break;
    }
  });

  chrome.action.onClicked.addListener(() => {
    openStudio();
  });

  function createMenus (menus) {
    chrome.contextMenus.removeAll();
    menus.forEach((menu) => {
      chrome.contextMenus.create({
        id: menu.id,
        title: menu.title,
        contexts: ['action']
      });
    });
  }

  function openStudio () {
    const url = chrome.runtime.getURL('studio/index.html');
    chrome.tabs.query({
      url: url + '*'
    })
    .then((result) => {
      if (result.length > 0) return;
      chrome.windows.create({
        url,
        width: 1280,
        height: 980,
        focused: true,
        type: 'popup'
      });
    })
    .catch((e) => console.error(e));
  }

  function openAvatarMaker () {
    const url = chrome.runtime.getURL('avatarMaker/index.html');
    openTab(url);
  }

  function openVoiceMaker () {
    const url = chrome.runtime.getURL('voiceMaker/index.html');
    openTab(url);
  }

  function openLicense () {
    const url = chrome.runtime.getURL('licensePage/index.html');
    openTab(url);
  }

  function openTab (url) {
    chrome.tabs.create({url});
  }

})();
