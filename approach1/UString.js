/* UString is an extension of the prototype of String. It adds some
 * useful methods which treat the string as a sequence of Unicode
 * characters instead of a sequence of UTF16 characters. */

String.prototype.__defineGetter__("uLength", function() {
    // This getter has runtime o(n) when it is first called and O(1)
    // if it has already been called at least once for this object.
    if (this.uLength_alreadyKnown === undefined) {
        this.uLength_alreadyKnown = 0;
        for (var i=0; i<this.length; ++i) {
            if (String.isSurrogate(this[i])==2) {
                // This is a high surrogate, so a low one must follow
                if (String.isSurrogate(this[i+1])!=1) {
                    throw "Malformed string: A low surrogate must follow a high one";
                }
                ++this.uLength_alreadyKnown;
            }
            else if (String.isSurrogate(this[i])==1) {
                // This is a low surrogate, so a hogh one must precede
                if (String.isSurrogate(this[i-1])!=2) {
                    throw "Malformed string: A high surrogate must precede a low one";
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
String.prototype.uCharCodeAt = function(index) {
    // Returns an integer
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
String.prototype.uIndexOf = function(searchString, position) {
    var position16 = (position!==undefined) ? this.index_UTo16(position) : undefined;
    var index16 = this.indexOf(searchString, position16);
    if (index16 == -1) { return -1 }
    else { return this.index_16ToU(index16) }
}
String.prototype.uLastIndexOf = function(searchString, position) {
    var position16 = (position!==undefined) ?  this.index_UTo16(position) : undefined;
    var index16 = this.lastIndexOf(searchString, position16);
    if (index16 == -1) { return -1 }
    else { return this.index_16ToU(index16) }
}
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

String.prototype.index_UTo16 = function(indexU) {
    // For a given unicode character based index, the corresponding 
    // UTF16 index is returned.
    // If the character at index is from a higher plane, the
    // internal index of its first surrogate is returned, i.e.
    // the index of its high surrogate.
    // If index is less than 0, an error is thrown
    // If index is larger than this.uLength, an error is
    // thrown
    if (indexU < 0) { throw "negative index not accepted" }
    if (indexU == this.uLength) { return this.length }
    if (indexU > this.uLength) { throw "index out of range" }
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
String.prototype.index_16ToU = function(index16) {
    // For an UTF16 based index, returns an index
    // indicating the position of the corresponding unicode
    // character in the sequence of unicode characters.
    // index is allowed to point to a low or a high
    // surrogate.
    // If index is smaller than 0, an error is thrown
    // If index is larger tahen this.value.length,
    // an error is thrown
    if (index16 < 0) { throw "negative index not accepted" }
    if (index16 == this.length) { return this.uLength }
    if (index16 > this.length) { throw "string is shorter" }
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

String.uFromCharCode = function(codePt) {
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
String.isSurrogate = function(character) {
    return String.isSurrogateCode(character.charCodeAt(0));
}
String.isSurrogateCode = function(characterCode) {
    // Returns 0 if characterCode is not the codepoint of a surrogate,
    // 1 if it is the codepoint of a low surrogate and 2 if it is the
    // codepoint of a high surrogate.
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

