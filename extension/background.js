let activeTabId = null;
let activeDomain = '';
let isTrackingEnabled = false;

// Keep worker alive with a periodic alarm
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'keepAlive') console.log('[Extension BG] Keep-alive ping');
});

// Init logs and dynamic content script registration
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Extension BG] onInstalled');
  await registerContentScripts();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[Extension BG] onStartup');
  await registerContentScripts();
});

// Function to dynamically register content scripts
async function registerContentScripts() {
  try {
    await chrome.scripting.registerContentScripts([{
      id: 'tts-content-script',
      js: ['content.js'],
      matches: ['<all_urls>'],
      runAt: 'document_start',
      world: 'ISOLATED'
    }]);
    console.log('[Extension BG] Content scripts registered dynamically');
  } catch (error) {
    console.error('[Extension BG] Failed to register content scripts:', error);
  }
}

// Helper to broadcast to all tabs
async function broadcastEvent(message) {
  console.log('[Extension BG] broadcasting message to all tabs:', message);
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch (error) {
        console.warn('[Extension BG] Failed to send to tab', tab.id, ':', error.message);
      }
    }
  }
}

// Message listener for commands from the PWA (via content script)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[Extension BG] onMessage', msg);
  if (msg.type === 'PING_EXTENSION') {
    sendResponse({ success: true });
    return true;
  }
  if (msg.type === 'START_TRACKING') {
    isTrackingEnabled = true;
    initializeActiveTab();
    sendResponse({ success: true });
    return true;
  }
  if (msg.type === 'STOP_TRACKING') {
    isTrackingEnabled = false;
    sendResponse({ success: true });
    return true;
  }
  sendResponse({ success: false, message: 'Unknown message type' });
  return true;
});

// Helper function to reliably send a message to a tab, injecting the script if necessary
async function sendMessageToTab(tabId, message) {
  try {
    // First attempt to send the message
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    // If it fails because the content script isn't there, inject it and retry
    if (error.message.includes('Receiving end does not exist')) {
      console.warn(`[Extension BG] Content script not found in tab ${tabId}. Injecting now.`);
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js'],
        });
        // Retry sending the message after successful injection
        await chrome.tabs.sendMessage(tabId, message);
      } catch (injectionError) {
        console.error(`[Extension BG] Failed to inject script or resend message to tab ${tabId}:`, injectionError);
      }
    } else {
      console.error(`[Extension BG] Failed to send message to tab ${tabId}:`, error);
    }
  }
}

// --- Event Listeners ---

chrome.tabs.onActivated.addListener(async info => {
  console.log('[Extension BG] onActivated', info, 'tracking?', isTrackingEnabled);
  if (!isTrackingEnabled) return;

  const tab = await chrome.tabs.get(info.tabId);
  const url = tab.url || '';
  
  // Skip non-web pages where content scripts can't run
  if (!/^https?:\/\//.test(url)) {
    console.log('[Extension BG] Skipping non-web tab:', url);
    return;
  }

  const newDomain = new URL(url).hostname;
  console.log('[Extension BG] domain check', activeDomain, '→', newDomain);
  if (newDomain !== activeDomain) {
    console.log('[Extension BG] broadcasting TAB_SWITCH');
    await broadcastEvent({
      type: 'TAB_SWITCH',
      fromDomain: activeDomain,
      toDomain: newDomain,
      timestamp: Date.now(),
      url: url
    });
    activeDomain = newDomain;
  }
  activeTabId = info.tabId;
});

// Apply the same robust sending logic for onUpdated and onFocusChanged  
chrome.tabs.onUpdated.addListener(async (id, changeInfo, tab) => {
  console.log('[Extension BG] onUpdated', id, changeInfo, 'tracking?', isTrackingEnabled);
  if (!isTrackingEnabled || id !== activeTabId || changeInfo.status !== 'complete') return;
  const url = tab.url || '';
  if (!/^https?:\/\//.test(url)) return;

  const newDomain = new URL(url).hostname;
  console.log('[Extension BG] updated domain', newDomain);
  if (newDomain !== activeDomain) {
    console.log('[Extension BG] broadcasting DOMAIN_CHANGE');
    await broadcastEvent({
      type: 'DOMAIN_CHANGE',
      fromDomain: activeDomain,
      toDomain: newDomain,
      timestamp: Date.now(),
      url: url
    });
    activeDomain = newDomain;
  }
});

chrome.windows.onFocusChanged.addListener(async winId => {
  console.log('[Extension BG] onFocusChanged', winId);
  if (!isTrackingEnabled || winId === chrome.windows.WINDOW_ID_NONE) return;

  const tabs = await chrome.tabs.query({ active: true, windowId: winId });
  if (!tabs.length) return;

  const tab = tabs[0];
  const url = tab.url || '';
  if (!/^https?:\/\//.test(url)) return;

  const newDomain = new URL(tabs[0].url).hostname;
  console.log('[Extension BG] window focus domain', newDomain);
  if (newDomain !== activeDomain) {
    console.log('[Extension BG] broadcasting WINDOW_FOCUS');
    await broadcastEvent({
      type: 'WINDOW_FOCUS',
      fromDomain: activeDomain,
      toDomain: newDomain,
      timestamp: Date.now(),
      url: url
    });
    activeDomain = newDomain;
    activeTabId = tabs[0].id;
  }
});

async function initializeActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url && /^https?:\/\//.test(tab.url)) {
    activeTabId = tab.id;
    activeDomain = new URL(tab.url).hostname;
    console.log('[Extension BG] initialized activeDomain=', activeDomain);
  }
}









