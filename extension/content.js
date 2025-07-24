// extension/content.js
(function() {
  'use strict';

  console.log('[Extension Content] loaded on', window.location.href);

  // --- Listen for messages from the page (PWA) and forward to the background ---
  window.addEventListener('message', (evt) => {
    const m = evt.data;
    if (m?.type === 'START_TRACKING' ||
        m?.type === 'STOP_TRACKING' ||
        m?.type === 'PING_EXTENSION') {

      console.log('[Extension Content] Forwarding', m.type, 'to background');

      // Fire-and-forget one-off message:
      try {
        chrome.runtime.sendMessage({ type: m.type });
        // Reply to a ping
        if (m.type === 'PING_EXTENSION') {
          window.postMessage({ type: 'EXTENSION_READY' }, '*');
        }
        // Always forward the response
        window.postMessage({ type: 'EXTENSION_RESPONSE' }, '*');
      } catch (err) {
        console.warn('[Extension Content] sendMessage threw:', err.message);
      }
    }
  });

  // --- Listen for messages from the background and forward to the page (PWA) ---
  chrome.runtime.onMessage.addListener((msg) => {
    console.log('[Extension Content] onMessage from BG', msg);
    // This handles events like TAB_SWITCH broadcasted from the background.
    if (msg.type === 'TAB_SWITCH' || msg.type === 'DOMAIN_CHANGE' || msg.type === 'WINDOW_FOCUS') {
      console.log('[Extension Content] Relaying', msg.type, 'to page');
      window.postMessage({ type: 'EXTENSION_TAB_EVENT', detail: msg }, '*');
    }
  });

  // --- Initial handshake to notify the PWA that the content script is loaded ---
  console.log('[Extension Content] Broadcasting initial EXTENSION_READY');
  window.postMessage({ type: 'EXTENSION_READY' }, '*');
})();















