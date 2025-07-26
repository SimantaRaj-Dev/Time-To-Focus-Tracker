// extension/background.js

// --- Global State ---
let isTrackingEnabled = false;
let activeTabId = null;
let activeDomain = '';

// --- Core Logic: Event Listeners ---

// Define handlers as named functions so they can be added and removed precisely.
const onActivatedHandler = (info) => handleTabActivation(info);
const onUpdatedHandler = (id, changeInfo, tab) => handleTabUpdate(id, changeInfo, tab);
const onFocusChangedHandler = (winId) => handleWindowFocusChange(winId);

function addTrackingListeners() {
  // Prevent adding duplicate listeners.
  if (chrome.tabs.onActivated.hasListener(onActivatedHandler)) return;
  
  console.log('[Extension BG] Starting tracking. Adding event listeners.');
  chrome.tabs.onActivated.addListener(onActivatedHandler);
  chrome.tabs.onUpdated.addListener(onUpdatedHandler);
  chrome.windows.onFocusChanged.addListener(onFocusChangedHandler);
}

function removeTrackingListeners() {
  console.log('[Extension BG] Stopping tracking. Removing event listeners.');
  chrome.tabs.onActivated.removeListener(onActivatedHandler);
  chrome.tabs.onUpdated.removeListener(onUpdatedHandler);
  chrome.windows.onFocusChanged.removeListener(onFocusChangedHandler);
}

// Message listener for commands from the PWA (via content script)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'PING_EXTENSION':
      console.log('[Extension BG] Received PING from a tab.');
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { type: 'EXTENSION_READY_PONG' })
          .catch((error) => console.warn('[Extension BG] Ping response failed (ignored):', error.message));
      }
      sendResponse({ status: 'pong' });
      break;

    case 'START_TRACKING':
      console.log('[Extension BG] Received START_TRACKING');
      isTrackingEnabled = true;
      addTrackingListeners();
      initializeActiveTab(msg.payload?.currentDomain);
      sendResponse({ success: true, tracking: true });
      break;

    case 'STOP_TRACKING':
      console.log('[Extension BG] Received STOP_TRACKING');
      isTrackingEnabled = false;
      removeTrackingListeners();
      activeDomain = '';
      activeTabId = null;
      sendResponse({ success: true, tracking: false });
      break;
  }
  return true; 
});



// --- Event Handler Implementations ---

async function handleTabActivation(info) {
  if (!isTrackingEnabled) return;

  const tab = await getTabSafely(info.tabId);
  if (!tab) return; // Tab is not a standard web page or couldn't be accessed.

  const newDomain = new URL(tab.url).hostname;
  if (newDomain !== activeDomain) {
    await broadcastEvent({
      type: 'TAB_SWITCH',
      fromDomain: activeDomain,
      toDomain: newDomain,
      timestamp: Date.now(),
      url: tab.url,
    });
    activeDomain = newDomain;
  }
  activeTabId = info.tabId;
}

async function handleTabUpdate(id, changeInfo, tab) {
  if (!isTrackingEnabled || id !== activeTabId || !changeInfo.url) return;

  const newDomain = new URL(changeInfo.url).hostname;
  if (newDomain !== activeDomain) {
    await broadcastEvent({
      type: 'DOMAIN_CHANGE',
      fromDomain: activeDomain,
      toDomain: newDomain,
      timestamp: Date.now(),
      url: changeInfo.url,
    });
    activeDomain = newDomain;
  }
}

async function handleWindowFocusChange(winId) {
  if (!isTrackingEnabled || winId === chrome.windows.WINDOW_ID_NONE) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, windowId: winId });
    if (!tab || !tab.url || !tab.url.startsWith('http')) return;
    
    const newDomain = new URL(tab.url).hostname;
    if (newDomain !== activeDomain) {
       await broadcastEvent({
        type: 'WINDOW_FOCUS',
        fromDomain: activeDomain,
        toDomain: newDomain,
        timestamp: Date.now(),
        url: tab.url,
      });
      activeDomain = newDomain;
      activeTabId = tab.id;
    }
  } catch (e) {
    console.warn('[Extension BG] Could not query tab on focus change:', e.message);
  }
}

// --- Helper Functions ---

async function initializeActiveTab(pwaDomain) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.startsWith('http')) {
      activeDomain = pwaDomain || ''; // Fallback to domain from PWA.
      return;
    }
    
    activeTabId = tab.id;
    const initialDomain = new URL(tab.url).hostname;
    activeDomain = initialDomain;
    console.log(`[Extension BG] Tracking initialized. Active domain: ${activeDomain}`);
  } catch (e) {
    console.error('[Extension BG] Failed to initialize active tab:', e.message);
  }
}

async function getTabSafely(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    // Ensure it's a web page we can track.
    if (tab.url && tab.url.startsWith('http')) {
      return tab;
    }
  } catch (e) {
    // This can happen if the tab is closed or is a special chrome:// page.
  }
  return null;
}

async function broadcastEvent(message) {
  try {
    // FIX: Narrow query to only HTTP/HTTPS tabs to reduce unnecessary sends.
    // This minimizes "receiving end does not exist" errors.
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
      // FIX: Use Promise-based sendMessage with .catch to handle rejections gracefully.
      // No await here to avoid blocking—fire and forget.
      chrome.tabs.sendMessage(tab.id, message)
        .catch((error) => {
          // Ignore expected errors for tabs without content scripts (e.g., non-matching URLs).
          if (error.message.includes('Receiving end does not exist')) {
            // Optional: Log only in debug mode.
            // console.debug('[Extension BG] Ignored send to non-receiver tab:', tab.id);
          } else {
            console.warn('[Extension BG] Unexpected sendMessage error:', error.message);
          }
        });
    }
  } catch (e) {
    console.error('[Extension BG] Failed to broadcast event:', e.message);
  }
}

// --- Service Worker Keep-Alive ---
// A standard MV3 pattern to prevent the service worker from becoming inactive too quickly.
chrome.runtime.onStartup.addListener(() => {
  console.log('[Extension BG] Extension starting up.');
});

chrome.alarms.create('keepAlive', { periodInMinutes: 2 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'keepAlive') {
    // This empty listener is enough to keep the worker alive.
  }
});









