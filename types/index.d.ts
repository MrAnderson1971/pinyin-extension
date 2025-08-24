declare module 'pinyin' {
    interface PinyinOptions {
        heteronym?: boolean;
        segment?: boolean;
        group?: boolean;
        style?: number;
    }

    const STYLE_TONE: number;
    const STYLE_TONE2: number;
    const STYLE_TO3NE: number;
    const STYLE_NORMAL: number;
    const STYLE_FIRST_LETTER: number;

    function pinyin(text: string, options?: PinyinOptions): string[][];

    export = pinyin;
    export { STYLE_TONE, STYLE_TONE2, STYLE_TO3NE, STYLE_NORMAL, STYLE_FIRST_LETTER };
}

// Content script types (you'll need to define these based on your content.js)
declare module "./content" {
    export function adjustColor(color: string): string;
    export const detectChinese: RegExp;
    export const excludeChinese: RegExp;
}

// Chrome extension message types
interface ChromeMessage {
    action: string;
    [key: string]: any;
}