'use strict';

(() => {

  addEventListener('beforeunload', (event) => event.returnValue = '', false);

})();
