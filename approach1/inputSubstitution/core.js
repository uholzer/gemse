
/* Configuration */

inputSubstitutionActive = true;

inputSubstitutionStartSign = "&";
inputSubstitutionEndSign = ";";

/* Loading of tables */

// The entries in this table must be prefix free and must not begin
// with u+ or U+.
inputSubstitutionTable = {
    
}

// Create request for entity declaration file
var request = new XMLHttpRequest();
request.open("GET", "inputSubstitution/w3centities-f.ent", false);
request.overrideMimeType("text/plain");
request.send(null);
request.responseText;

// Prepare Regex
var entitiesLineRegex = /<!ENTITY\s+(\w+)\s+"([^"]+)"\s*>/g;
var valueRegex = /&#x([0-9A-Fa-f]+);/g;

// Parse entity declarations
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
    
    var position = 0;
    while (-1 != (startIndex = this.inputBuffer.substring(position).indexOf(inputSubstitutionStartSign))) {
        // Find the end
        var endIndex = this.inputBuffer.substring(startIndex).indexOf(inputSubstitutionEndSign);
        if (endIndex == -1) { return false } // Return if end is missing
        endIndex += startIndex;

        // The name
        var name = this.inputBuffer.substring(startIndex+1,endIndex); // Without the StartSign and EndSign

        // Find the replacement string
        var replacement;
        if (name[0] == "#") {
            // Treat this as a code point
            if (name[1]=="x") {
                //In hexadecimal notation
                replacement = String.fromCharCode(parseInt(name.substring(2), 16));
            }
            else {
                //In decimal notation
                replacement = String.fromCharCode(parseInt(name.substring(1), 10));
            }
        }
        else {
            // Look into the inputSubstitutionTable
            // (If we find nothing, we take the empty string, so the user can try again.)
            var replacement = inputSubstitutionTable[this.inputBuffer.substring(startIndex+1,endIndex)] || "";
        }

        // Commit the substitution
        this.inputBuffer = 
            this.inputBuffer.substring(0,startIndex) + 
            replacement +
            this.inputBuffer.substring(endIndex+1);
        // In order to prevent that we do substitution on a part of
        // the inputBuffer that originates from an older substitution,
        // we have to increase position
        position = startIndex + replacement;
    }
    // At this point all substitutions have been commited
    // and there is no substitution to be done at a later
    // time. This means we can hand on the event to the
    // mode, so return.
    return true;
}

