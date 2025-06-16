// content.js
let currentWordList = {}; // This will be populated by processWordList from shared/highlight.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "highlightWords" && message.wordList) {
    removeHighlights(); // Remove old highlights before applying new ones
    currentWordList = processWordList(message.wordList);
    debouncedApplyHighlighting();
    sendResponse({ status: "Highlighting initiated" });
  } else if (message.action === "removeHighlights") {
    removeHighlights();
    sendResponse({ status: "Highlights removed" });
  }
  return true; // Keep the message channel open for asynchronous response
});

// --- FUNCTION TO REMOVE HIGHLIGHTS ---
function removeHighlights() {
    const highlightedElements = document.querySelectorAll('.highlighted-word');
    highlightedElements.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
            const textNode = document.createTextNode(span.textContent);
            parent.replaceChild(textNode, span);
        }
    });

    // After replacing all spans, normalize the parent elements to merge adjacent text nodes.
    const uniqueParents = new Set([...highlightedElements].map(el => el.parentNode).filter(p => p));
    uniqueParents.forEach(parent => parent.normalize());
}


// Debounced function to reduce redundant highlighting calls
const debouncedApplyHighlighting = debounce(() => {
  if (Object.keys(currentWordList).length > 0) {
    highlightWords(currentWordList, document.body);
  }
}, 300);

function applyHighlightingToNode(rootNode) {
  if (Object.keys(currentWordList).length > 0) {
    highlightWords(currentWordList, rootNode);
  }
}

// Debounce utility function
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Set up a MutationObserver to watch for added nodes and apply highlighting to dynamic content
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.addedNodes.length) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE &&
            node.nodeName !== 'SCRIPT' &&
            node.nodeName !== 'STYLE') {
          applyHighlightingToNode(node);
        }
      });
    }
  });
});

// Start observing the document body for changes
observer.observe(document.body, { childList: true, subtree: true });
