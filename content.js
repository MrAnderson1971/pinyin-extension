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

// Function to convert Chinese text to Pinyin and log to console
function convertToPinyinAndLog(textNodes) {
    textNodes.forEach((node) => {
        const chineseText = node.nodeValue;
        const pinyinResult = pinyin(chineseText);
        console.log(pinyinResult.join(' ')); // Join the Pinyin array and log it
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
        convertToPinyinAndLog(textNodes); // Convert all found text nodes to Pinyin
        sendResponse({result: "Conversion successful"});
    }
});
