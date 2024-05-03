// content.js
import pinyin from "pinyin";
import chroma from "chroma-js";

// Regex to capture supported Chinese characters
const chineseCharRegexBase = "[\u3400-\u9FBF]";
const excludeChinese = new RegExp(`(${chineseCharRegexBase}+)`, "u");
const detectChinese = new RegExp(chineseCharRegexBase, "u");

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

        // Retrieve the original color and desaturate it
        const lessSaturatedColor = adjustColor(window.getComputedStyle(parentNode).color);

        // Here we split by any non-Chinese character
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
                    if (detectChinese.test(originalChar)) {
                        const pinyinCharData = pinyinSentence[pinyinIndex++];
                        const pinyinWord = pinyinCharData ? pinyinCharData[0] : '';

                        newContent += `<span style="display: inline-block; text-align: center;" class="pinyinOverlayText">
                    <span style="display: block; font-size: smaller; color: ${lessSaturatedColor};">&nbsp;${pinyinWord}&nbsp;</span>
                    <span style="display: block;">${originalChar}</span>
                </span>`; // Adding a non-breaking space character (&nbsp) so there's space between pinyin words.
                    } else {
                        newContent += originalChar;
                    }
                });
            } else {
                newContent += sentence;
            }
        });

        const fragment = document.createRange().createContextualFragment(newContent);
        parentNode.replaceChild(fragment, textNode);
    });
}

// Adjusts color to make it closer to gray.
function adjustColor(color, desaturationLevel = 0.5, lightnessLevel = 0.8) {
    const luminance = chroma(color).luminance();

    // Adjust for very dark or very bright colors
    if (luminance < 0.1) { // very dark colors
        return chroma(100, 100, 100).css(); // dark gray
    } else if (luminance > 0.9) { // very bright colors
        return chroma(200, 200, 200).css(); // light gray
    }
    return chroma(color).desaturate(desaturationLevel).brighten(lightnessLevel).css();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "convertSelectionToPinyin") {
        const textNodes = findTextNodes(document.body);
        convertToPinyinAndDisplay(textNodes);
        sendResponse({result: "Conversion successful"});
    }
});
