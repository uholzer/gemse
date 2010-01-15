/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */

/**
 * @fileOverview Extension of the String class for actions on true Unicode
 * characters.
 * UString is an extension of the prototype of String. It adds some
 * useful methods which treat the string as a sequence of Unicode
 * characters instead of a sequence of UTF16 characters as it is done
 * by Javascript. 
 */

/** The length of the string counting Unicode characters */
String.prototype.__defineGetter__("uLength", function() {
    // This getter has runtime o(n) when it is first called and O(1)
    // if it has already been called at least once for this object.
    if (this.uLength_alreadyKnown === undefined) {
        this.uLength_alreadyKnown = 0;
        for (var i=0; i<this.length; ++i) {
            if (String.isSurrogate(this[i])==2) {
                // This is a high surrogate, so a low one must follow
                if (String.isSurrogate(this[i+1])!=1) {
                    throw new Error("Malformed string: A low surrogate must follow a high one");
                }
                ++this.uLength_alreadyKnown;
            }
            else if (String.isSurrogate(this[i])==1) {
                // This is a low surrogate, so a hogh one must precede
                if (String.isSurrogate(this[i-1])!=2) {
                    throw new Error("Malformed string: A high surrogate must precede a low one");
                }
                // Do not increase length here!
            }
            else {
                ++this.uLength_alreadyKnown;
            }
        }
    }
    return this.uLength_alreadyKnown;
});
/** 
 * Like charAt but operates on unicode characters as opposed to UTF16
 * characters.
 */
String.prototype.uCharAt = function(index) {
    // Returns a string value
    var index16 = this.index_UTo16(index);
    if (String.isSurrogate(this.charAt(index16))) {
        // Here we relie on the fact that this.index_UTo16 always
        // points to the first surrogate, never to the second.
        return this.substring(index16,index16+2);
    }
    else {
        return this.charAt(index16);
    }
}
/** 
 * Like charCodeAt but operates on unicode characters as opposed to UTF16
 * characters.
 */
String.prototype.uCharCodeAt = function(index) {
    var index16 = this.index_UTo16(index);
    if (String.isSurrogate(this.charAt(index16))) {
        var hi = this.charCodeAt(index16);  
        var low = this.charCodeAt(index16+1);  
        return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;  
    }
    else {
        return this.charCodeAt(index16);
    }
}
/** 
 * Like indexOf but operates on unicode characters as opposed to UTF16
 * characters.
 */
String.prototype.uIndexOf = function(searchString, position) {
    var position16 = (position!==undefined) ? this.index_UTo16(position) : undefined;
    var index16 = this.indexOf(searchString, position16);
    if (index16 == -1) { return -1 }
    else { return this.index_16ToU(index16) }
}
/** 
 * Like lastIndexOf but operates on unicode characters as opposed to UTF16
 * characters.
 */
String.prototype.uLastIndexOf = function(searchString, position) {
    var position16 = (position!==undefined) ?  this.index_UTo16(position) : undefined;
    var index16 = this.lastIndexOf(searchString, position16);
    if (index16 == -1) { return -1 }
    else { return this.index_16ToU(index16) }
}
/** 
 * Like slice but operates on unicode characters as opposed to UTF16
 * characters.
 */
String.prototype.uSlice = function(start, end) {
    if (end === undefined) { end = this.uLength }
    if (isNaN(start)) { start = 0 }
    if (isNaN(end)  ) { end   = 0 }
    if (start < 0) { start = this.uLength + start }
    if (end   < 0) { end   = this.uLength + end   }
    if (start < 0) { start = 0 }
    if (end   < 0) { end   = 0 }
    if (start > this.uLength) { start = this.uLength }
    if (end   > this.uLength) { end   = this.uLength }
    var start16 = this.index_UTo16(start);
    var end16 = this.index_UTo16(end);
    return this.slice(start16, end16);
}
/** 
 * Like substring but operates on unicode characters as opposed to UTF16
 * characters.
 */
String.prototype.uSubstring = function(start, end) {
    if (end === undefined) { end = this.uLength }
    if (isNaN(start) || start<0) { start = 0 }
    if (isNaN(end)   || end<0  ) { end   = 0 }
    if (start > this.uLength) { start = this.uLength }
    if (end   > this.uLength) { end   = this.uLength }
    var start16 = this.index_UTo16(start);
    var end16 = this.index_UTo16(end);
    return this.substring(start16, end16);
}

/** 
 * Transforms a unicode character based index into an index based on
 * UTF16 characters. 
 * If the character at index belongs to a higher plane, the UTF16
 * index from its first surrogate is returned, that is, the index of
 * its high surrogate.
 * An error is thrown if the index is less than 0 or strictly larger
 * than this.uLength.
 */
String.prototype.index_UTo16 = function(indexU) {
    if (indexU < 0) { throw new Error("negative index not accepted") }
    if (indexU == this.uLength) { return this.length }
    if (indexU > this.uLength) { throw new Error("index out of range") }
    var index16 = -1;
    for (var i=0; i<=indexU; ++i) {
        if (String.isSurrogate(this[index16+1])==1) {
            index16 += 2;
        }
        else {
            index16 += 1;
        }
    }
    return index16;
}
/** 
 * Transforms an UTF16 based index into a unicode character based
 * index. Index is allowed to point to a high or a low surrogate. An
 * error is thrown if the given index is smaller than 0 or strictly
 * larger than this.length
 */
String.prototype.index_16ToU = function(index16) {
    if (index16 < 0) { throw new Error("negative index not accepted") }
    if (index16 == this.length) { return this.uLength }
    if (index16 > this.length) { throw new Error("string is shorter") }
    var indexU = -1;
    for (var i=0; i<=index16; ++i) {
        if (String.isSurrogate(this[i])!=1) {
            // Increase the internal index only if the current
            // character is not a low surrogate. This causes
            // surrogate pairs to be count only once.
            ++indexU;
        }
    }
    return indexU;
}

/** 
 * Returns the sequence of characters for a list of unicode
 * codepoints. This also works for characters that are not in the BMP,
 * unlike fromCharCode.
 * @returns {String}
 */
String.uFromCharCode = function() {
    // Returns a string value, not an object
    result = "";
    for (var i=0; i<arguments.length; ++i) {
        var codePt = arguments[i];
        if (codePt > 0xFFFF) {  
            codePt -= 0x10000;  
            result += String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));  
        }  
        else {  
            result += String.fromCharCode(codePt);  
        }  
    }
    return result;
}
/**
 * Tells whether a character is a surrogate.
 * @param character The UTF16 character in form of a string
 * @returns {Integer} 0 if the character is not a
 * surrogate, 1 if it is  a low surrogate and 2 if it
 * is a high surrogate.
 */
String.isSurrogate = function(character) {
    return String.isSurrogateCode(character.charCodeAt(0));
}
/**
 * Tells whether characterCode is the code of a surrogate character.
 * @param characterCode the codepoint of the character
 * @returns {Integer} 0 if characterCode is not the condepoint of a
 * surrogate, 1 if it is the codepoint of a low surrogate and 2 if it
 * is the codepoint of a high surrogate.
 */
String.isSurrogateCode = function(characterCode) {
    if (0xD800 <= characterCode && characterCode <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)  
        return 2;
    }  
    if (0xDC00 <= characterCode && characterCode <= 0xDFFF) { // Low surrogate  
        return 1;
    }  
    else {
        return 0;
    }
}

