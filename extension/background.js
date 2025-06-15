// extension/background.js

import { supabase } from './supabaseClient.js';

// The list of phrases will be cached for 5 minutes to improve performance.
const CACHE_DURATION_MINUTES = 5;

/**
 * Fetches the list of phrases from your Supabase database.
 * @returns {object | null} A wordlist object for the highlighter, or null on error.
 */
async function fetchPhrasesFromSupabase() {
  console.log('Fetching phrases from Supabase...');
  
  // Select only the columns needed for highlighting.
  const { data, error } = await supabase
    .from('phrases')
    .select('id, phrase, definition, level');

  if (error) {
    console.error('Error fetching phrases:', error);
    return null;
  }

  // Transform the data array into the object format that highlight.js expects.
  // The 'phrase' property is renamed to 'word'.
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

/**
 * Gets the list of phrases, using a local cache to prevent too many database calls.
 * @returns {object | null} The wordlist object.
 */
async function getPhrases() {
  // Try to get phrases from the cache first.
  const cache = await chrome.storage.local.get(['cachedPhrases', 'cacheTimestamp']);
  const now = new Date().getTime();

  // Check if a cache exists and is less than 5 minutes old.
  if (cache.cachedPhrases && cache.cacheTimestamp && (now - cache.cacheTimestamp) < CACHE_DURATION_MINUTES * 60 * 1000) {
    console.log('Loading phrases from cache.');
    return cache.cachedPhrases;
  }

  // If cache is old or doesn't exist, fetch from Supabase.
  const phrases = await fetchPhrasesFromSupabase();
  if (phrases) {
    // Save the newly fetched phrases and a new timestamp to the cache.
    await chrome.storage.local.set({
      cachedPhrases: phrases,
      cacheTimestamp: now,
    });
  }
  return phrases;
}

/**
 * Listens for when a tab is updated (e.g., page navigation or refresh).
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Run when the page is completely loaded.
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    const wordList = await getPhrases();
    
    if (wordList) {
      // Send the word list to the content script of the active tab.
      chrome.tabs.sendMessage(tabId, { action: 'highlightWords', wordList: wordList }, (response) => {
        if (chrome.runtime.lastError) {
          // This error is normal on pages where the script can't run, like the Chrome Web Store.
        }
      });
    }
  }
});