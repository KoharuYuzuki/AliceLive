'use strict';

(() => {

  const queue = [];
  let elements;

  window.customAlert = (alert) => {
    queue.push(alert);
    if (!elements.input.checked) openAlert();
  };

  addEventListener('load', () => {
    elements = getElements({
      input: '#customAlertCheckbox',
      customAlert: '#customAlert',
      title: '#customAlert .title',
      detail: '#customAlert .detail',
      button: '#customAlert .button'
    });

    elements.button.addEventListener('click', () => {
      displayAlert(false);
    }, false);

    elements.customAlert.addEventListener('transitionend', (event) => {
      if (!(
        (getComputedStyle(elements.customAlert).top === '-240px') &&
        (event.propertyName === 'top')
      )) return;
      queue.shift();
      if (queue.length > 0) openAlert();
    }, false);
  }, false);

  function openAlert () {
    elements.title.innerText = queue[0].title;
    if (queue[0].detail instanceof HTMLElement) {
      elements.detail.innerHTML = null;
      elements.detail.appendChild(queue[0].detail);
    } else {
      elements.detail.innerHTML = queue[0].detail;
    }
    elements.button.addEventListener('click', () => {
      if (queue[0].callback) queue[0].callback();
    }, {once: true});
    displayAlert(true);
  }

  function displayAlert (checked) {
    elements.input.checked = checked;
  }

})();
