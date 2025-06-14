import { supabase } from './supabaseClient.js';

const CACHE_DURATION_MINUTES = 5;

// This function fetches the phrases from Supabase and transforms them
// into the object format that your highlight.js script expects.
async function fetchPhrasesFromSupabase() {
  console.log('Fetching phrases from Supabase...');
  const { data, error } = await supabase
    .from('phrases')
    .select('id, phrase, definition, level'); // We only need these fields

  if (error) {
    console.error('Error fetching phrases:', error);
    return null;
  }

  // The highlight.js script expects an object where keys are IDs
  // and the word property is named 'word'. Let's transform the data.
  const wordList = {};
  for (const item of data) {
    wordList[item.id] = {
      word: item.phrase, // Renaming 'phrase' to 'word' for the highlighter
      definition: item.definition,
      level: item.level,
    };
  }
  return wordList;
}

// This function gets phrases, using a cache to be efficient.
async function getPhrases() {
  const cache = await chrome.storage.local.get(['cachedPhrases', 'cacheTimestamp']);
  const now = new Date().getTime();

  if (cache.cachedPhrases && cache.cacheTimestamp && (now - cache.cacheTimestamp) < CACHE_DURATION_MINUTES * 60 * 1000) {
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

// This listener runs when you navigate to a new page or refresh a page.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Ensure the page is fully loaded and is a web page
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    const phrases = await getPhrases();
    if (phrases) {
      // Send the word list to the content script on the page
      chrome.tabs.sendMessage(tabId, { action: 'highlightWords', wordList: phrases }, (response) => {
        if (chrome.runtime.lastError) {
          // This error is normal on pages where the content script can't be injected.
          // console.log(`Could not send message to tab ${tabId}: ${chrome.runtime.lastError.message}`);
        }
      });
    }
  }
});