// extension/background.js
import { supabase } from './supabaseClient.js';

const CACHE_DURATION_MINUTES = 5;

// Initialize the global setting on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ isHighlightingGloballyEnabled: true });
});

async function fetchPhrasesFromSupabase() {
  console.log('Fetching phrases from Supabase...');
  const { data, error } = await supabase
    .from('phrases')
    .select('id, phrase, definition, level');

  if (error) {
    console.error('Error fetching phrases:', error);
    return null;
  }

  const wordList = {};
  for (const item of data) {
    wordList[item.id] = {
      word: item.phrase,
      definition: item.definition,
      level: item.level,
    };
  }
  
  console.log('Successfully fetched and transformed phrases:', wordList);
  return wordList;
}

async function getPhrases(force = false) {
  const cache = await chrome.storage.local.get(['cachedPhrases', 'cacheTimestamp']);
  const now = new Date().getTime();

  if (!force && cache.cachedPhrases && cache.cacheTimestamp && (now - cache.cacheTimestamp) < CACHE_DURATION_MINUTES * 60 * 1000) {
    console.log('Loading phrases from cache.');
    return cache.cachedPhrases;
  }

  const phrases = await fetchPhrasesFromSupabase();
  if (phrases) {
    await chrome.storage.local.set({
      cachedPhrases: phrases,
      cacheTimestamp: now,
    });
  }
  return phrases;
}

// Listens for tab updates (like new pages loading)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    const data = await chrome.storage.local.get('isHighlightingGloballyEnabled');
    if (data.isHighlightingGloballyEnabled) {
      const wordList = await getPhrases();
      if (wordList) {
        chrome.tabs.sendMessage(tabId, { action: 'highlightWords', wordList: wordList });
      }
    }
  }
});

// Function to apply highlighting to all relevant tabs
function applyHighlightsToAllTabs() {
    getPhrases().then(wordList => {
        if (!wordList) return;
        chrome.tabs.query({ url: ["http://*/*", "https://*/*"] }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: 'highlightWords', wordList: wordList })
                    .catch(e => console.log("Could not contact tab, it might be closed or protected."));
            });
        });
    });
}

// Function to remove highlighting from all relevant tabs
function removeHighlightsFromAllTabs() {
    chrome.tabs.query({ url: ["http://*/*", "https://*/*"] }, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: "removeHighlights" })
                .catch(e => console.log("Could not contact tab, it might be closed or protected."));
        });
    });
}

// Handles messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "forceRefresh") {
        getPhrases(true).then(() => {
            // After refreshing, re-apply highlights to all tabs if enabled
            chrome.storage.local.get('isHighlightingGloballyEnabled', (data) => {
                if (data.isHighlightingGloballyEnabled) {
                    applyHighlightsToAllTabs();
                }
            });
            sendResponse({ status: "Cache refreshed and highlights updated." });
        });
        return true; 
    }

    if (message.action === "getHighlightingStatus") {
        chrome.storage.local.get('isHighlightingGloballyEnabled', (data) => {
            sendResponse({ isEnabled: !!data.isHighlightingGloballyEnabled });
        });
        return true;
    }
    
    if (message.action === "toggleHighlighting") {
        chrome.storage.local.get('isHighlightingGloballyEnabled', (data) => {
            const newStatus = !data.isHighlightingGloballyEnabled;
            chrome.storage.local.set({ isHighlightingGloballyEnabled: newStatus }, () => {
                if (newStatus) {
                    applyHighlightsToAllTabs();
                } else {
                    removeHighlightsFromAllTabs();
                }
                sendResponse({ isEnabled: newStatus });
            });
        });
        return true;
    }
});
