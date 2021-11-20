export const KeyMod = {
    /** 
     * The character Gemse uses to represent the ALT key. When the user
     * presses a key while holding ALT, this character followed by the
     * character of the key are added to the input buffer.
     * @constant
     */
    alt: String.fromCharCode(18),
    /** 
     * The character Gemse uses to represent the CONTROL key. When the user
     * presses a key while holding CONTROL, this character followed by the
     * character of the key are added to the input buffer.
     * @constant
     */
    control: String.fromCharCode(17),
};
/**
 * The characters Gemse uses to represent various keys.
 * @constant
 */
export const KeyRepresentation = {
    Backspace: String.fromCodePoint(0x08),
    Enter: "\n",
    Escape: String.fromCodePoint(0x1b),
};
/**
 * Quote character surrounding key names.
 */
export const KeynameQuote = '`';
