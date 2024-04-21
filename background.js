// background.js
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "convertToPinyin",
        title: "Convert to Pinyin | 换成拼音",
        contexts: ["all"]  // This makes the context menu appear in all contexts
    });
});

function injectAndConvert(tab) {
    // Use scripting API to inject the content script into the active tab
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['dist/content.bundle.js']
    }, () => {
        // After injecting the script, send a message to it
        chrome.tabs.sendMessage(tab.id, { action: "convertSelectionToPinyin" });
    });
}

// Run the extension script when the user clicks on the context menu option.
chrome.contextMenus.onClicked.addListener((info, tab) => {
    injectAndConvert(tab);
});

// Run the same script when the user clicks the extension on the extensions bar.
chrome.action.onClicked.addListener((tab) => {
    injectAndConvert(tab);
});
