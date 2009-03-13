
/* Configuration */

inputSubstitutionActive = true;

inputSubstitutionSign = "\\";
manualLengthInputSubstitutionStart = "&";
manualLengthInputSubstitutionEnd = ";";

/* Loading of tables */

// The entries in this table must be prefix free and must not begin
// with u+ or U+.
inputSubstitutionTable = {
}

// Create request
var request = new XMLHttpRequest();
request.open("GET", "inputSubstitution/w3centities-f.ent", false);
request.overrideMimeType("text/plain");
request.send(null);
request.responseText;

// Prepare Regex
var entitiesLineRegex = /<!ENTITY\s+(\w+)\s+"([^"]+)"\s*>/g;
var valueRegex = /&#x([0-9A-Fa-f]+);/g;
var entryData;
while (entryData = entitiesLineRegex.exec(request.responseText)) {
    var entityName = entryData[1];
    var entityValueEscaped = entryData[2];
    var entityValue = "";
    var valueData;
    while (valueData = valueRegex.exec(entityValueEscaped)) {
        entityValue += String.fromCharCode(parseInt(valueData[1], 16));
    }
    inputSubstitutionTable[entityName] = entityValue;
}

/* Functionality */

function inputSubstitution() {
    // This function has to be used as member of the editor object.

    // Scans the inputBuffer for the substitution sign and does
    // a substitution according to the intutSubstitutionTable.
    // returns false if the user has begun to insert a to be substituted string.
    // So the event must not be handed on to the mode if it returns false!
    var startIndex;
    while (-1 != (startIndex = this.inputBuffer.indexOf(inputSubstitutionSign))) {
        // This loop never returns true, because it has to run 
        // through completely. True is returned after the loop.
        // However this loop _must_ return false if it detects
        // a paritally entered string that will be later substituted.
        // (It assumes that this is the case if it finds the
        // substitution sign but does not know with what to substitute
        // it.)
        if (this.inputBuffer.substring(startIndex+1,startIndex+3) == "u+") {
            // Insert unicode character using the following 4 characters as codepoint
            var codepointAsHex = this.inputBuffer.substring(startIndex+3,startIndex+3+4);
            if (codepointAsHex.length < 4) { return false }
            var codepoint = parseInt(codepointAsHex, 16);
            this.inputBuffer = 
                this.inputBuffer.substring(0,startIndex) + 
                String.fromCharCode(codepoint) +
                this.inputBuffer.substring(startIndex+3+4);
        }
        else if (this.inputBuffer.substring(startIndex+1,startIndex+3) == "U+") {
            // Insert unicode character using the following 8 characters as codepoint
            var codepointAsHex = this.inputBuffer.substring(startIndex+3,startIndex+3+8);
            if (codepointAsHex.length < 8) { return false }
            var codepoint = parseInt(codepointAsHex, 16);
            this.inputBuffer = 
                this.inputBuffer.substring(0,startIndex) + 
                String.fromCharCode(codepoint) +
                this.inputBuffer.substring(startIndex+3+8);
        }
        else {
            // Look up the table for a substitution
            var endIndex = startIndex+1;
            var replacement = undefined;
            while (endIndex < this.inputBuffer.length && replacement===undefined) {
                replacement = inputSubstitutionTable[this.inputBuffer.substring(startIndex+1,endIndex+1)];
                if (this.inputBuffer.charCodeAt(endIndex) == KeyEvent.DOM_VK_ESCAPE) {
                    replacement = "";
                }
                ++endIndex;
            }
            --endIndex; // Otherwise endIndex is one too high
            if (replacement!==undefined) {
                this.inputBuffer = 
                    this.inputBuffer.substring(0,startIndex) + 
                    replacement +
                    this.inputBuffer.substring(endIndex+1);
            }
            else {
                return false;
            }
        }
    }
    while (-1 != (startIndex = this.inputBuffer.indexOf(manualLengthInputSubstitutionStart))) {
        var endIndex = this.inputBuffer.substring(startIndex).indexOf(manualLengthInputSubstitutionEnd);
        if (endIndex == -1) { return false }
        endIndex += startIndex;
        var replacement = inputSubstitutionTable[this.inputBuffer.substring(startIndex+1,endIndex)];
        this.inputBuffer = 
            this.inputBuffer.substring(0,startIndex) + 
            replacement +
            this.inputBuffer.substring(endIndex+1);
    }
    // At this point all substitutions have been commited
    // and there is no substitution to be done at a later
    // time. This means we can hand on the event to the
    // mode, so return.
    return true;
}

