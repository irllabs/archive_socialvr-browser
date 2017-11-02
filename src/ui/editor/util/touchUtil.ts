export function addTouchListenersToElement(element: HTMLElement) {
  const defaultEventValues = {
    view: window,
    bubbles: true,
    cancelable: true,
  };
  let lastPosition;

  element.addEventListener('touchstart', $event => {
    $event.stopPropagation();
    const clientX = $event.touches[0].clientX;
    const clientY = $event.touches[0].clientY;
    const screenX = $event.touches[0].screenX;
    const screenY = $event.touches[0].screenY;
    lastPosition = {clientX, clientY, screenX, screenY};
    const event = new MouseEvent('mousedown', {
      ...defaultEventValues,
      ...lastPosition
    });
    const element = $event.target;
    element.dispatchEvent(event);
  });

  (element.addEventListener as any)('touchmove', $event => {
    $event.preventDefault();
    $event.stopPropagation();

    const clientX = $event.touches[0].clientX;
    const clientY = $event.touches[0].clientY;
    const screenX = $event.touches[0].screenX;
    const screenY = $event.touches[0].screenY;
    const movementX = screenX - lastPosition.screenX;
    const movementY = screenY - lastPosition.screenY;
    lastPosition = {clientX, clientY, screenX, screenY};
    const event = new MouseEvent('mousemove', {
      ...defaultEventValues,
      ...lastPosition,
      movementX, movementY
    });
    const element = $event.target;
    element.dispatchEvent(event);
  }, {passive: false});

  element.addEventListener('touchend', $event => {
    $event.stopPropagation();
    const event = new MouseEvent('mouseup', {
      ...defaultEventValues,
      ...lastPosition,
    });
    const element = $event.target;
    element.dispatchEvent(event);
  });
}
