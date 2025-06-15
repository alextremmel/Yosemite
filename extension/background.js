// extension/background.js
import { supabase } from './supabaseClient.js';

const CACHE_DURATION_MINUTES = 5;
let highlightingStatus = {};

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

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    const isEnabled = highlightingStatus[tabId] !== false;
    if (isEnabled) {
      const wordList = await getPhrases();
      if (wordList) {
        chrome.tabs.sendMessage(tabId, { action: 'highlightWords', wordList: wordList });
      }
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "forceRefresh") {
        console.log("Force refresh message received.");
        getPhrases(true).then(() => {
            sendResponse({ status: "Cache refreshed successfully!" });
        });
        return true;
    }

    if (message.action === "getHighlightingStatus") {
        // --- FIXED: Read tabId from the message, not the sender ---
        const tabId = message.tabId;
        const isEnabled = highlightingStatus[tabId] !== false;
        sendResponse({ isEnabled: isEnabled });
    }
    
    if (message.action === "toggleHighlighting") {
        // --- FIXED: Read tabId from the message, not the sender ---
        const tabId = message.tabId;
        highlightingStatus[tabId] = !(highlightingStatus[tabId] !== false);
        const isNowEnabled = highlightingStatus[tabId];
        sendResponse({ isEnabled: isNowEnabled });
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    delete highlightingStatus[tabId];
    console.log(`Cleaned up highlighting status for closed tab: ${tabId}`);
});