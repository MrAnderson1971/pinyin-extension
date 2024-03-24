// content.js
import pinyin from "pinyin";

// Function to find text nodes in a document
function findTextNodes(element) {
    let nodes = [];
    for (element = element.firstChild; element; element = element.nextSibling) {
        if (element.nodeType === 3) {
            nodes.push(element);
        } else {
            nodes = nodes.concat(findTextNodes(element));
        }
    }
    return nodes;
}

// Function to convert Chinese text to Pinyin and display it above the text
function convertToPinyinAndDisplay(textNodes) {
    textNodes.forEach((node) => {
        const chineseText = node.nodeValue;
        const pinyinResult = pinyin(chineseText, {style: pinyin.STYLE_TONE}).join(' ');

        // Create a new span element for the Pinyin text
        const pinyinElement = document.createElement('span');
        pinyinElement.style.cssText = 'display:block;'; // Ensure it displays above the text
        pinyinElement.textContent = pinyinResult;

        // Insert the Pinyin span before the original text node
        node.parentNode.insertBefore(pinyinElement, node);
    });
}

// Listening for the message from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "convertSelectionToPinyin") {
        let textToConvert = message.text;

        // If no text is selected, use the entire body text
        if (!textToConvert) {
            const bodyText = document.body.innerText || document.body.textContent;
            textToConvert = bodyText;
        }

        const textNodes = findTextNodes(document.body); // Get all text nodes
        convertToPinyinAndDisplay(textNodes); // Convert all found text nodes to Pinyin and display above the text
        sendResponse({result: "Conversion successful"});
    }
});
