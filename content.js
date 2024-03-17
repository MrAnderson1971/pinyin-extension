// Assuming the `pinyin` library is imported and bundled using Webpack
const pinyin = require('pinyin');

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
        const pinyinResult = pinyin(chineseText, {
            style: pinyin.STYLE_TONE, // Choose the style you prefer
            heteronym: false // Set to true if you want to include multiple pronunciations
        });
        console.log(pinyinResult.join(' ')); // Join the Pinyin array and log it
    });
}

// Run the above functions on the document body to find text and convert it
const textNodes = findTextNodes(document.body);
convertToPinyinAndLog(textNodes);
