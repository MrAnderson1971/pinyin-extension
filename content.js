// content.js
import pinyin from "pinyin";

let isPinyinDisplayed = false;

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
function togglePinyinDisplay(textNodes) {
    textNodes.forEach((textNode) => {
        if (!isPinyinDisplayed) {
            // Convert to Pinyin
            const originalText = textNode.nodeValue;
            let newContent = '';
            Array.from(originalText).forEach((char) => {
                if (/[\u3400-\u9FBF]/.test(char)) {
                    const pinyinChar = pinyin(char, { style: pinyin.STYLE_TONE }).join('');
                    newContent += `<span class="pinyin-container" data-original-text="${char}">
                                        <span class="pinyin-text">${pinyinChar}</span>
                                        ${char}
                                   </span>`;
                } else {
                    newContent += char;
                }
            });
            const fragment = document.createRange().createContextualFragment(newContent);
            textNode.replaceWith(fragment);
        } else {
            // Revert to original text
            const pinyinContainers = textNode.parentNode.querySelectorAll('.pinyin-container');
            pinyinContainers.forEach((container) => {
                // Create a text node from the original text
                const originalChar = container.getAttribute('data-original-text');
                const originalTextNode = document.createTextNode(originalChar);
                // Replace the container with the original text node
                container.replaceWith(originalTextNode);
            });
        }
    });
    isPinyinDisplayed = !isPinyinDisplayed; // Toggle the state
}

// Listening for the message from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "convertSelectionToPinyin") {
        const textNodes = findTextNodes(document.body);
        togglePinyinDisplay(textNodes);
        sendResponse({result: "Toggle successful"});
    }
});
