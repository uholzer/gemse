/*
The functions herein are used to query the unicode character database
(UCD), specially tailored to the needs of Gemse.
*/

ucd = new UCD4Gemse();

function UCD4Gemse() {
    this.db = {};

    /* Public methods */

    this.isIdentifier = function(c) {
        return (this.lookupGeneralCategory(c)[0] == "L");
    }

    this.isDigit = function(c) {
        return (this.lookupGeneralCategory(c)[0] == "N");
    }

    this.isOperator = function(c) {
        return (this.lookupGeneralCategory(c)[0] == "S");
    }

    /* Lookup methods */

    this.lookupName = function(c) {
        return this.db[c][0];
    }

    this.lookupGeneralCategory = function(c) {
        return this.db[c][1];
    }

    /* Private methods for handling database */

    this.load = function() {
        // This function loads the whole UCD/UnicodeData.txt, but only
        // the first three fields (codepoint, name, general category)
        
        var db = this.db;

        // Create request
        var request = new XMLHttpRequest();
        request.open("GET", "UCD/UnicodeData.txt", false);
        request.overrideMimeType("text/plain");
        request.send(null);
        var dataLines = request.responseText.split("\n");

        var lineRegex = /^([^;]*);([^;]*);([^;]*);/;
        dataLines.forEach(function(l) {
            if (!l) { return }
            var res = lineRegex.exec(l);
            if (!res) { throw "Error in UnicodeData.txt? " + l }
            var codepoint = parseInt("0x" + res[1]);
            // We have to use the advanced fromCharCode shipped with
            // gemse, String.fromCharCode can not handle characters
            // from upper planes, unfortunately
            var character = fromCharCode(codepoint);
            db[character] = [res[2],res[3]];
        });
    }

    this.load();
}

