'use strict';

(() => {

  window.saved = true;

  addEventListener('beforeunload', (event) => {
    if (!saved) event.returnValue = '';
  }, false);

})();
