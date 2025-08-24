// content.js
import chroma from "chroma-js";
import MessageSender = chrome.runtime.MessageSender;

interface PinyinNode {
    node: Node;
    text: string;
    parent: Node;
}

// Regex to capture supported Chinese characters
const chineseCharRegexBase = "[\u3400-\u9FBF]";
export const excludeChinese = new RegExp(`(${chineseCharRegexBase}+)`, "u");
export const detectChinese = new RegExp(chineseCharRegexBase, "u");

function findTextNodes(element: Node): number {
    let nodes = [];
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node: Node): number {
                // Only include text nodes not contained within a 'pinyinOverlayText' span
                let ancestor: Node | null = node.parentNode;
                while (ancestor && ancestor !== document) {
                    if (ancestor.nodeType === Node.ELEMENT_NODE &&
                        (ancestor as Element).tagName === 'SPAN' &&
                        (ancestor as Element).classList.contains('pinyinOverlayText')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    ancestor = ancestor.parentNode;
                }

                // Skip empty text nodes
                if (!node.nodeValue?.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }

                // Only process nodes that contain Chinese characters
                if (!detectChinese.test(node.nodeValue)) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }

    // Add all found nodes to processing queue and start processing
    if (nodes.length > 0) {
        nodes.forEach(node => {
            addNodeToQueue(node);
        });

        // Start processing if not already active
        if (!pinyinProcessingActive) {
            pinyinProcessingActive = true;
            processPinyinBatchWithYield();
        }
    }

    return nodes.length; // Return count of nodes found
}

const pinyinNodeQueue: PinyinNode[] = [];
let pinyinProcessingActive = false;
let pinyinProcessingIndex = 0;
let pinyinProcessedCount = 0;

// Time limits for processing batches
const PINYIN_MAX_PROCESSING_TIME = 50; // ms before yielding to UI thread
const PINYIN_UI_REFRESH_DELAY = 16; // ms pause for UI refresh (1 frame @60fps)

/**
 * Adds a text node to the processing queue
 * @param {Text} textNode
 */
function addNodeToQueue(textNode: Node) {
    if (!textNode || !textNode.nodeValue || !textNode.parentNode) {
        return;
    }

    pinyinNodeQueue.push({
        node: textNode,
        text: textNode.nodeValue,
        parent: textNode.parentNode
    });
}

/**
 * Process nodes in time-limited batches with UI thread yielding
 */
function processPinyinBatchWithYield() {
    // Exit conditions
    if (pinyinNodeQueue.length === 0) {
        pinyinProcessingActive = false;
        console.log(`Pinyin processing completed: ${pinyinProcessedCount} nodes processed`);
        return;
    }

    const startTime = performance.now();
    const nodesToProcess: PinyinNode[] = [];
    const textsToProcess: string[] = [];

    // Collect as many unprocessed nodes as possible within the time limit
    while (pinyinProcessingIndex < pinyinNodeQueue.length &&
    performance.now() - startTime < PINYIN_MAX_PROCESSING_TIME) {

        const nodeData = pinyinNodeQueue[pinyinProcessingIndex++];

        // Skip nodes no longer in DOM
        if (!nodeData?.node.parentNode) {
            continue;
        }

        nodesToProcess.push(nodeData);
        textsToProcess.push(nodeData.text);
    }

    // If we reached the end of the queue, reset index
    if (pinyinProcessingIndex >= pinyinNodeQueue.length) {
        pinyinProcessingIndex = 0;
        pinyinNodeQueue.length = 0; // Clear the processed queue
    }

    // If no nodes to process, yield and continue
    if (nodesToProcess.length === 0) {
        setTimeout(processPinyinBatchWithYield, PINYIN_UI_REFRESH_DELAY);
        return;
    }

    // Send batch to background script for processing
    chrome.runtime.sendMessage(
        {
            action: 'processPinyinBatch',
            textBatch: textsToProcess,
            nodeInfo: nodesToProcess.map(data => ({
                parentColor: window.getComputedStyle(data.parent as Element).color
            }))
        },
        response => {
            if (!response || response.error) {
                console.error("Error processing batch:", response?.error || "No response");

                // Continue processing with the next batch
                setTimeout(processPinyinBatchWithYield, PINYIN_UI_REFRESH_DELAY);
                return;
            }

            // Apply results to nodes
            const results = response.results;
            nodesToProcess.forEach((nodeData, i) => {
                const htmlContent = results[i];

                // Skip if node is no longer in DOM
                if (!nodeData.node.parentNode) {
                    return;
                }

                // Create and insert processed content
                if (htmlContent) {
                    try {
                        const fragment = document.createRange().createContextualFragment(htmlContent);
                        nodeData.parent.replaceChild(fragment, nodeData.node);
                        pinyinProcessedCount++;
                    } catch (e) {
                        console.error("Error replacing node:", e);
                    }
                }
            });

            // Yield to UI thread before continuing
            setTimeout(processPinyinBatchWithYield, PINYIN_UI_REFRESH_DELAY);
        }
    );
}

// Adjusts color to make it closer to gray.
export function adjustColor(color: string, desaturationLevel = 0.5, lightnessLevel = 0.8) {
    const luminance = chroma(color).luminance();

    // Adjust for very dark or very bright colors
    if (luminance < 0.1) { // very dark colors
        return chroma(100, 100, 100).css(); // dark gray
    } else if (luminance > 0.9) { // very bright colors
        return chroma(200, 200, 200).css(); // light gray
    }
    return chroma(color).desaturate(desaturationLevel).brighten(lightnessLevel).css();
}

function injectStyles() {
    // Check if styles already injected
    if (document.getElementById('pinyin-overlay-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'pinyin-overlay-styles';
    style.textContent = `
.pinyinOverlayText, .pinyinOverlayText > span {
    margin: 0;
    padding: 0;
    box-sizing: border-box; /* Ensures padding and borders are included in the width/height */
}
.pinyinOverlayText > span {
    line-height: normal;
    display: block;
}
.pinyinOverlayText > span:first-child {
    font-size: smaller; /* Apply only to the first span, i.e., the pinyin */
    font-family: sans-serif; /* Sans-serif font only for pinyin */
}
.pinyinOverlayText {
    white-space: nowrap; /* Prevents breaking and can help manage spacing */
    text-align: center;
    display: inline-block;
}
`;
    document.head.appendChild(style);
}

chrome.runtime.onMessage.addListener((message: any,
                                      sender: MessageSender,
                                      sendResponse: (response?: any) => void): boolean => {
    if (message.action === "convertSelectionToPinyin") {
        console.log("HERE");
        injectStyles();
        const nodesFound = findTextNodes(document.body);
        sendResponse({result: "Conversion started", nodesFound: nodesFound});
        return true; // Keep message channel open for async response
    }
    return false;
});
