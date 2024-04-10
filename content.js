// content.js
import pinyin from "pinyin";

function findTextNodes(element) {
    let nodes = [];
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Only include text nodes not contained within a 'pinyinOverlayText' span
                let ancestor = node.parentNode;
                while (ancestor && ancestor !== document) {
                    if (ancestor.tagName === 'SPAN' && ancestor.classList.contains('pinyinOverlayText')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    ancestor = ancestor.parentNode;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        },
        false
    );

    while(walker.nextNode()) {
        nodes.push(walker.currentNode);
    }

    return nodes;
}

function convertToPinyinAndDisplay(textNodes) {
    textNodes.forEach((textNode) => {
        const parentNode = textNode.parentNode;
        const fullText = textNode.nodeValue;

        // Here we split by any non-Chinese character
        // Here we split by any non-Chinese character
        const sentences = fullText.split(/([^\u4e00-\u9fa5]+)/).filter(Boolean);

        let newContent = '';

        sentences.forEach((sentence) => {
            if (/[\u3400-\u9FBF]/.test(sentence)) {
                // Convert the entire sentence to Pinyin
                const pinyinSentence = pinyin(sentence, {
                    style: pinyin.STYLE_TONE,
                    heteronym: true,
                    segment: true
                });

                let pinyinIndex = 0;
                Array.from(sentence).forEach((originalChar) => {
                    if (/[\u3400-\u9FbF]/.test(originalChar)) {
                        const pinyinCharData = pinyinSentence[pinyinIndex++];
                        const pinyinWord = pinyinCharData ? pinyinCharData[0] : '';

                        newContent += `<span style="display: inline-block; text-align: center;" class="pinyinOverlayText">
                            <span style="display: block; font-size: smaller; color: #666;">${pinyinWord}</span>
                            ${originalChar}
                        </span>`;
                    } else {
                        // Directly append non-Chinese characters
                        newContent += originalChar;
                    }
                });
            } else {
                // Non-Chinese sentences are appended as-is
                newContent += sentence;
            }
        });

        // Replace the original text node with the new HTML content
        const fragment = document.createRange().createContextualFragment(newContent);
        parentNode.replaceChild(fragment, textNode);
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "convertSelectionToPinyin") {
        const textNodes = findTextNodes(document.body);
        convertToPinyinAndDisplay(textNodes);
        sendResponse({result: "Conversion successful"});
    }
});
