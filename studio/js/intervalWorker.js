addEventListener('message', (event) => {
  setInterval(() => postMessage(null), event.data.interval);
}, false);
