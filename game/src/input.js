// input.js — mouse and keyboard, translated into game actions.
// The canvas is a fixed 1280x720 logical surface scaled by CSS, so every
// pointer event is converted back into logical coordinates before hit-testing.
// This file knows nothing about scoring or orders; it only calls the handlers
// main.js hands it.

import { hitTest } from './render-kitchen.js';
import { PANTRY_ORDER } from './recipes.js';

export function logicalPosition(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * 1280,
    y: ((clientY - rect.top) / rect.height) * 720,
  };
}

export function attachInput(canvas, layout, handlers) {
  const state = { mouse: { x: -100, y: -100 } };

  canvas.addEventListener('mousemove', (event) => {
    const pos = logicalPosition(canvas, event.clientX, event.clientY);
    state.mouse.x = pos.x;
    state.mouse.y = pos.y;
    if (handlers.onMouseMove) handlers.onMouseMove(pos);
  });

  canvas.addEventListener('mouseleave', () => {
    state.mouse.x = -100;
    state.mouse.y = -100;
  });

  canvas.addEventListener('click', (event) => {
    const pos = logicalPosition(canvas, event.clientX, event.clientY);
    state.mouse.x = pos.x;
    state.mouse.y = pos.y;
    const hit = hitTest(layout, pos.x, pos.y, handlers.getScreen?.() ?? 'playing');
    if (!hit) {
      if (handlers.onEmptyClick) handlers.onEmptyClick(pos);
      return;
    }
    switch (hit.type) {
      case 'bin': handlers.onBin?.(hit.id); break;
      case 'station': handlers.onStation?.(hit.kind); break;
      case 'plate': handlers.onPlate?.(hit.index); break;
      case 'trash': handlers.onTrash?.(); break;
      case 'pause': handlers.onPause?.(); break;
      case 'mute': handlers.onMute?.(); break;
      case 'start': handlers.onStart?.(); break;
      case 'next': handlers.onNext?.(); break;
      case 'retry': handlers.onRetry?.(); break;
      default: break;
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '9') {
      const id = PANTRY_ORDER[Number(key) - 1];
      if (id) handlers.onBin?.(id);
      return;
    }
    switch (key) {
      case 't': handlers.onTrash?.(); break;
      case 'p': case 'escape': handlers.onPause?.(); break;
      case 'm': handlers.onMute?.(); break;
      case 'enter': case ' ': handlers.onConfirm?.(); break;
      default: break;
    }
  });

  return state;
}
