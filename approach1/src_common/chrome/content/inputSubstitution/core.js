/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */


/* Configuration */

var inputSubstitutionActive = true;

var inputSubstitutionStartSign = "&";
var inputSubstitutionEndSign = ";";

/* Loading of tables */

if (inputSubstitutionActive) { inputSubstitution_loadTables(); }

function inputSubstitution_loadTables() {
    var inputSubstitutionTable = {
        // Here you can add additional entries to the input substitution
        // table. They have to look like
        //   name: "character",
        // So, for example    
        //   alpha: "α",
        // (without the comment signs // at the beginning of the line, of
        // course. Don't forget the comma at the end of the line)
    }

    // Create request for entity declaration file
    var request = new XMLHttpRequest();
    request.open("GET", "inputSubstitution/entity_table.txt", false);
    request.overrideMimeType("text/plain");
    request.send(null);
    // Make a copy of the response text. (Using request.resonseText
    // later on in the while loop causes huge memory usage while this
    // function executes, around one gigabyte. So make a copy.)
    var lines = request.responseText.split("\n");
    delete request;

    // Parse entity declarations
    lines.forEach(function(line) {
        var separatorPos = line.indexOf("\t");
        inputSubstitutionTable[line.substring(0,separatorPos)] = line.substring(separatorPos+1);
    });
}

/* Functionality */

function inputSubstitution() {
    // This function has to be used as member of the editor object.

    // Scans the inputBuffer for the substitution sign and does
    // a substitution according to the intutSubstitutionTable.
    // returns false if the user has begun to insert a to be substituted string.
    // So the event must not be handed on to the mode if it returns false!
    
    var position = 0;
    var startIndex;
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

