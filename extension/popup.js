// extension/popup.js
document.addEventListener('DOMContentLoaded', () => {
    const reloadButton = document.getElementById('reloadButton');
    const toggleButton = document.getElementById('toggleButton');

    // Find the currently active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab) return;

        // --- NEW: Ask the background script for the current status ---
        chrome.runtime.sendMessage({ action: "getHighlightingStatus", tabId: activeTab.id }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error getting status:", chrome.runtime.lastError.message);
                return;
            }
            // Update the button text based on the response
            updateToggleButton(response.isEnabled);
        });

        // --- UPDATED: Add logic to the toggle button's click listener ---
        toggleButton.addEventListener('click', () => {
            // Send a message to the background script to flip the status
            chrome.runtime.sendMessage({ action: "toggleHighlighting", tabId: activeTab.id }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error toggling status:", chrome.runtime.lastError.message);
                    return;
                }
                // Update the button text with the new status
                updateToggleButton(response.isEnabled);
                // We will add logic here later to remove highlights immediately
            });
            window.close();
        });
    });

    reloadButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "forceRefresh" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error sending refresh message:", chrome.runtime.lastError.message);
            } else {
                console.log(response.status);
            }
        });
        window.close();
    });

    // --- NEW: A helper function to set the button text ---
    function updateToggleButton(isEnabled) {
        toggleButton.textContent = isEnabled ? 'Turn Highlighting Off' : 'Turn Highlighting On';
    }
});