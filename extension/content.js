(function() {
  'use strict';
  
  // Listen for messages from the page (PWA) and forward to the background script.
  window.addEventListener('message', (evt) => {
    const msg = evt.data;
    if (msg?.type === 'START_TRACKING' || msg?.type === 'STOP_TRACKING' || msg?.type === 'PING_EXTENSION') {
      try {
        // Check if the extension context is still valid before sending.
        if (!chrome.runtime?.id) {
          console.error('[Extension Content] Context invalidated. Please reload the page or extension.');
          // Notify PWA to handle (e.g., show a "Reload required" message).
          window.postMessage({ type: 'EXTENSION_INVALIDATED' }, '*');
          return;
        }

        // Forward the message to the background script.
        chrome.runtime.sendMessage(msg, (response) => {
          try {
            if (chrome.runtime.lastError) {
              console.warn('[Extension Content] Could not send message:', chrome.runtime.lastError.message);
              // Specific check for invalidation.
              if (chrome.runtime.lastError.message.includes('context invalidated')) {
                window.postMessage({ type: 'EXTENSION_INVALIDATED' }, '*');
              }
            } else {
              console.log('[Extension Content] Message sent successfully:', msg.type);
            }
          } catch (e) {
            console.error('[Extension Content] Error in sendMessage callback:', e.message);
          }
        });
      } catch (e) {
        console.error('[Extension Content] Failed to send message:', e.message);
      }
    }
  });

  // Listen for messages from the background script and forward to the page (PWA).
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (['TAB_SWITCH', 'DOMAIN_CHANGE', 'WINDOW_FOCUS', 'EXTENSION_READY_PONG'].includes(msg.type)) {
      if (msg.type === 'EXTENSION_READY_PONG') {
        window.postMessage({ type: 'EXTENSION_READY' }, '*');
      } else {
        window.postMessage({ type: 'EXTENSION_TAB_EVENT', detail: msg }, '*');
      }
    }
  });

  // Initial handshake to notify the PWA that the content script is loaded and ready.
  window.postMessage({ type: 'EXTENSION_READY' }, '*');
  console.log('[Extension Content] Script loaded and ready.');

})();