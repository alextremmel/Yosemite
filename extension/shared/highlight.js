// extension/shared/highlight.js

/**
 * Processes the word list and replaces underscores with spaces in words.
 * @param {object} wordList - The raw word list object.
 * @returns {object} - The processed word list.
 */
function processWordList(wordList) {
  const processedList = {};
  if (wordList) {
    Object.entries(wordList).forEach(([key, value]) => {
      processedList[key] = {
        ...value,
        word: value && value.word ? value.word.replace(/_/g, " ") : ""
      };
    });
  }
  return processedList;
}

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} string - The input string.
 * @returns {string} - The string with special characters escaped.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// extension/shared/highlight.js

/**
 * Highlights words on the page based on the provided word list.
 * This version is designed to solve the "fragmented text" problem where a phrase
 * is split across multiple HTML elements (like separate <span>s).
 * @param {object} wordList - The processed list of words to highlight.
 * @param {HTMLElement} [root=document.body] - The root element to search for words within.
 */
function highlightWords(wordList, root = document.body) {
    if (!root || !wordList || Object.keys(wordList).length === 0) {
        return;
    }

    const wordsArray = Object.values(wordList).filter(item => item && typeof item.word === 'string' && item.word.trim() !== '');
    if (wordsArray.length === 0) return;

    wordsArray.sort((a, b) => b.word.length - a.word.length);

    // This regex works, allowing spaces to be optional to handle different DOM structures.
    const patternText = wordsArray.map(item => 
        `(${escapeRegExp(item.word).replace(/ /g, '[\\s\\u00A0]*')})`
    ).join('|');
    const pattern = new RegExp(patternText, 'gi');

    // 1. READ: Find all relevant text nodes.
    const textNodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function(node) {
            if (node.parentNode.closest('script, style, .highlighted-word, textarea, input')) {
                return NodeFilter.FILTER_REJECT;
            }
            if (node.parentNode.isContentEditable) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    while(walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }
    if (textNodes.length === 0) return;

    // 2. MATCH: Join text and find all phrases.
    const fullText = textNodes.map(n => n.nodeValue).join('');
    const matches = [...fullText.matchAll(pattern)];
    
    // 3. WRITE: Apply highlights using a more robust method.
    for (const match of matches.reverse()) {
        const matchStart = match.index;
        const matchEnd = matchStart + match[0].length;
        
        let charCount = 0;
        let startNode, endNode, startOffset, endOffset;

        for (const node of textNodes) {
            const nodeLength = node.nodeValue.length;
            const nodeStart = charCount;
            const nodeEnd = nodeStart + nodeLength;

            if (startNode === undefined && matchStart >= nodeStart && matchStart < nodeEnd) {
                startNode = node;
                startOffset = matchStart - nodeStart;
            }
            if (endNode === undefined && matchEnd > nodeStart && matchEnd <= nodeEnd) {
                endNode = node;
                endOffset = matchEnd - nodeStart;
                break;
            }
            charCount = nodeEnd;
        }
        
        if (startNode && endNode) {
            const range = document.createRange();
            try {
                range.setStart(startNode, startOffset);
                range.setEnd(endNode, endOffset);
                
                if (range.cloneContents().querySelector('.highlighted-word')) {
                    continue;
                }

                let wordData = null;
                for (let i = 1; i < match.length; i++) {
                    if (match[i] !== undefined) {
                        wordData = wordsArray[i - 1];
                        break;
                    }
                }
                
                if (wordData) {
                    // --- THIS IS THE NEW "WRITE" LOGIC ---
                    // It's more robust than surroundContents.
                    const highlightSpan = document.createElement("span");
                    highlightSpan.className = `highlighted-word highlight-level-${wordData.level}`;
                    highlightSpan.title = wordData.definition || "";

                    const rangeContents = range.extractContents();
                    highlightSpan.appendChild(rangeContents);
                    range.insertNode(highlightSpan);
                    // ------------------------------------
                }
            } catch (e) {
                // Fails silently if a range is invalid.
            }
        }
    }
}