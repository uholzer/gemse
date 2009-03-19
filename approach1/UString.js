
function UString(s) {
    // s must be a string value or a String object, containing
    // well formed 16 bit characters
    this.value = s.toString();
    // Check whether the string is well formed and count the 
    /// length at the same time
    this.length = 0;
    for (var i=0; i<this.value.length; ++i) {
        if (UString.isSurrogate(this.value[i])==2) {
            // This is a high surrogate, so a low one must follow
            if (UString.isSurrogate(this.value[i+1])!=1) {
                throw "Malformed string: A low surrogate must follow a high one";
            }
            ++this.length;
        }
        else if (UString.isSurrogate(this.value[i])==1) {
            // This is a low surrogate, so a hogh one must precede
            if (UString.isSurrogate(this.value[i-1])!=2) {
                throw "Malformed string: A high surrogate must precede a low one";
            }
            // Do not increase length here!
        }
        else {
            ++this.length;
        }
    }
}
UString.prototype = {
    toString: function() {
        return this.value.toString();
    },
    valueOf: function() {
        return this.value.toString();
    },
    toUString: function() {
        // This is just for convenience, when someone calls toUString
        // on a string without knowing that it is already an UString.
        return this;
    },
    charAt: function(index) {
        // Returns a string value
        var internalIndex = this.indexToInternalIndex(index);
        if (UString.isSurrogate(this.value.charAt(internalIndex))) {
            return this.value.substring(internalIndex,internalIndex+2);
        }
        else {
            return this.value.charAt(internalIndex);
        }
    },
    charCodeAt: function(index) {
        // Returns an integer
        var internalIndex = this.indexToInternalIndex(index);
        if (UString.isSurrogate(this.value.charAt(internalIndex))) {
            var hi = this.value.charCodeAt(internalIndex);  
            var low = this.value.charCodeAt(internalIndex+1);  
            return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;  
        }
        else {
            return this.value.charCodeAt(internalIndex);
        }
    },
    concat: String.prototype.concat,
    indexOf: function(searchString, position) {
        var internalIndex = this.value.indexOf(searchString, position);
        if (internalIndex == -1) { return -1 }
        else { return this.internalIndexToIndex(internalIndex) }
    },
    lastIndexOf: function(searchString, position) {
        var internalIndex = this.value.lastIndexOf(searchString, position);
        if (internalIndex == -1) { return -1 }
        else { return this.internalIndexToIndex(internalIndex) }
    },
    slice: function(start, end) {
        if (end === undefined) { end = this.length }
        if (isNaN(start)) { start = 0 }
        if (isNaN(end)  ) { end   = 0 }
        if (start < 0) { start = this.length + start }
        if (end   < 0) { end   = this.length + end   }
        if (start < 0) { start = 0 }
        if (end   < 0) { end   = 0 }
        if (start > this.length) { start = this.length }
        if (end   > this.length) { end   = this.length }
        var internalStart = this.indexToInternalIndex(start);
        var internalEnd = this.indexToInternalIndex(end);
        return this.value.slice(internalStart, internalEnd);
    },
    substring: function(start, end) {
        if (end === undefined) { end = this.length }
        if (isNaN(start) || start<0) { start = 0 }
        if (isNaN(end)   || end<0  ) { end   = 0 }
        if (start > this.length) { start = this.length }
        if (end   > this.length) { end   = this.length }
        var internalStart = this.indexToInternalIndex(start);
        var internalEnd = this.indexToInternalIndex(end);
        return this.value.substring(internalStart, internalEnd);
    },

    
    /* For private use */
    indexToInternalIndex: function(index) {
        // For a given index, the corresponding index in the internal
        // string this.value is returned.
        // If the character at index is from a higher plane, the
        // internal index of its first surrogate is returned, i.e.
        // the index of its high surrogate
        // If index is less than 0, an error is thrown
        // If index is larger than this.length, an error is
        // thrown
        if (index < 0) { throw "negative index not accepted" }
        if (index == this.length) { return this.value.length }
        if (index > this.length) { throw "index" }
        var internalIndex = -1;
        for (var i=0; i<=index; ++i) {
            if (UString.isSurrogate(this.value[internalIndex+1])==1) {
                internalIndex += 2;
            }
            else {
                internalIndex += 1;
            }
        }
        return internalIndex;
    },
    internalIndexToIndex: function(internalIndex) {
        // For an index of thee internal this.value, returns an index
        // indicating the position of the corresponding unicode
        // character in the sequence of unicode characters.
        // internalIndex is allowed to point to a low or a high
        // surrogate.
        // If internalIndex is smaller than 0, an error is thrown
        // If internalIndex is larger tahen this.value.length,
        // an error is thrown
        if (index < 0) { throw "negative index not accepted" }
        if (index == this.value.length) { return this.length }
        if (index > this.value.length) { throw "string is shorter" }
        var index = -1;
        for (var i=0; i<=internalIndex; ++i) {
            if (UString.isSurrogate(this.value[i])!=1) {
                // Increase the internal index only if the current
                // character is not a low surrogate. This causes
                // surrogate pairs to be count only once.
                ++index;
            }
        }
        return index;
    },
}

UString.fromCharCode = function(codePt) {
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
UString.isSurrogate = function(character) {
    return UString.isSurrogateCode(character.charCodeAt(0));
}
UString.isSurrogateCode = function(characterCode) {
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


String.prototype.toUString = function() {
    return new UString(this.toString());
}

