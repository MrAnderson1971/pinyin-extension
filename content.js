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

// Function to convert Chinese text to Pinyin with tones and display it above each character
function convertToPinyinAndDisplay(textNodes) {
    textNodes.forEach((textNode) => {
        let newContent = '';
        const parentNode = textNode.parentNode;
        const chineseText = textNode.nodeValue;

        // Convert each character to Pinyin and wrap it in a span with the original character
        Array.from(chineseText).forEach((char) => {
            // Check if the character is Chinese
            if (/[\u3400-\u9FBF]/.test(char)) {
                const pinyinChar = pinyin(char, {style: pinyin.STYLE_TONE});
                // Create a span for Pinyin
                newContent += `<span style="display: inline-block; text-align: center;">
                                    <span style="display: block; font-size: smaller; color: #666;">${pinyinChar}</span>
                                    ${char}
                               </span>`;
            } else {
                // Non-Chinese characters are appended as-is
                newContent += char;
            }
        });

        // Replace the original text node with the new HTML content
        const fragment = document.createRange().createContextualFragment(newContent);
        parentNode.replaceChild(fragment, textNode);
    });
}

// Listening for the message from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "convertSelectionToPinyin") {
        const textNodes = findTextNodes(document.body); // Get all text nodes
        convertToPinyinAndDisplay(textNodes); // Convert all found text nodes to Pinyin and display above the text
        sendResponse({result: "Conversion successful"});
    }
});
