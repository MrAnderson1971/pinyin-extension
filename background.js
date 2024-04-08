// background.js
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "convertToPinyin",
        title: "Convert to Pinyin | 换成拼音",
        contexts: ["all"] // This makes the context menu appear in all contexts
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    // Directly send a message to the content script, no need to use executeScript here for the message sending
    chrome.tabs.sendMessage(tab.id, { action: "convertSelectionToPinyin" });
});
