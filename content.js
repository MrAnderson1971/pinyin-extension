// content.js
import pinyin from "pinyin";

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

function convertToPinyinAndDisplay(textNodes) {
    // Check if any .pinyinOverlayText elements already exist
    if (document.querySelector('span.pinyinOverlayText')) {
        console.log("Pinyin already converted");
        return; // Exit the function early if conversion has been done
    }

    textNodes.forEach((textNode) => {
        const parentNode = textNode.parentNode;
        const fullText = textNode.nodeValue;

        // Split the text into sentences or meaningful segments for better context
        // Here we split by periods for simplicity, adjust according to your needs
        const sentences = fullText.split(/([。！？\n])/).filter(Boolean);

        let newContent = '';

        sentences.forEach((sentence) => {
            if (/[\u3400-\u9FBF]/.test(sentence)) {

                // Convert the entire sentence to Pinyin, assuming the library can handle context
                const pinyinSentence = pinyin(sentence, {
                    style: pinyin.STYLE_TONE,
                    heteronym: true,
                    segment: true
                });

                // Since sentence is a string, use Array.from to iterate over each character
                let pinyinIndex = 0;
                Array.from(sentence).forEach((originalChar) => {
                    if (/[\u3400-\u9FbF]/.test(originalChar)) {
                        const pinyinCharData = pinyinSentence[pinyinIndex];
                        const pinyinWord = pinyinCharData ? pinyinCharData[0] : '';

                        newContent += `<span style="display: inline-block; text-align: center;" class="pinyinOverlayText">
                           <span style="display: block; font-size: smaller; color: #666;">${pinyinWord}</span>
                           ${originalChar}
                       </span>`;
                    } else {
                        // Directly append non-Chinese characters
                        newContent += originalChar;
                    }
                    pinyinIndex++;
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
