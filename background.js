// background.js
import {adjustColor, detectChinese, excludeChinese} from "./content";
import pinyin from "pinyin";

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
        files: ['content.js'] // Updated path
    }, () => {
        // After injecting the script, send a message to it
        chrome.tabs.sendMessage(tab.id, {action: "convertSelectionToPinyin"});
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle batch processing of text nodes
    if (request.action === 'processPinyinBatch') {
        const textBatch = request.textBatch;
        const nodeInfo = request.nodeInfo || [];

        if (!textBatch || !Array.isArray(textBatch)) {
            sendResponse({error: 'Invalid batch'});
            return true;
        }

        try {
            // Process each text in the batch
            const results = textBatch.map((text, index) => {
                const parentColor = nodeInfo[index]?.parentColor || '#000000';
                const lessSaturatedColor = adjustColor(parentColor);

                // Process the text to generate HTML with pinyin
                return processTextToPinyinHTML(text, lessSaturatedColor);
            });

            sendResponse({results: results});
        } catch (error) {
            console.error('Error processing pinyin batch:', error);
            sendResponse({error: error.message});
        }

        return true; // Keep message channel open
    }
});

/**
 * Process a text string to generate HTML with pinyin
 * @param {string} fullText - The original text to process
 * @param {string} lessSaturatedColor - The color to use for pinyin text
 * @returns {string} - HTML string with pinyin overlay
 */
function processTextToPinyinHTML(fullText, lessSaturatedColor) {
    // Split by any non-Chinese character
    const sentences = fullText.split(excludeChinese).filter(Boolean);

    let newContent = '';

    sentences.forEach((sentence) => {
        if (detectChinese.test(sentence)) {
            const pinyinSentence = pinyin(sentence, {
                style: pinyin.STYLE_TONE,
                heteronym: true,
                segment: true
            });

            let pinyinIndex = 0;
            Array.from(sentence).forEach((originalChar) => {
                const pinyinCharData = pinyinSentence[pinyinIndex++];
                const pinyinWord = pinyinCharData ? pinyinCharData[0] : '';

                newContent += `<span class="pinyinOverlayText">
                    <span style="color: ${lessSaturatedColor};">&nbsp;${pinyinWord}&nbsp;</span>
                    <span>${originalChar}</span>
                </span>`;
            });
        } else {
            newContent += sentence;
        }
    });

    return newContent;
}
