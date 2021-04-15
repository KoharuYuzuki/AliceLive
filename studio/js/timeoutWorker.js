addEventListener('message', (event) => {
  setTimeout(() => postMessage(null), event.data.timeout);
}, false);
