/*
The functions herein are used to query the unicode character database
(UCD), specially tailored to the needs of Gemse.
*/

ucd = new UCD4Gemse();
ucd.load();

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
        return (this.lookupGeneralCategory(c)[0] == "S" || this.lookupGeneralCategory(c)[0] == "P");
    }

    this.isCombining = function(c) {
        return (this.lookupCombiningPosition(c) != this.MPOS_NOTCOMBINING);
    }

    // They match the numbers used in Gemse_Combining.txt
    this.MPOS_UNKNOWN = -1;
    this.MPOS_NOTCOMBINING = 0;
    this.MPOS_SUPERIMPOSED = 1;
    this.MPOS_UNDER = 2;
    this.MPOS_SUB = 3;
    this.MPOS_SUP = 5;
    this.MPOS_OVER = 6;
    this.MPOS_PRESUP = 7;
    this.MPOS_PRESUB = 9;

    /* Lookup methods */

    this.lookupName = function(c) {
        return this.db[c][0];
    }

    this.lookupGeneralCategory = function(c) {
        return this.db[c][1];
    }
 
    this.lookupCombiningPosition = function(c) {
        return this.db[c][2];
    }
 
    this.lookupCombiningStandalone = function(c) {
        return this.db[c][3];
    }

    /* Private methods for handling database */

    /* Database structure: The database is an array with the following
       fields:
       0: Unicode name
       1: General category
       2: Set to
          0  for characters that are not combining characters
          -1 for unknown combining characters
          for known combining characters, that is, combining
          characters found in Gemse_Combining.txt, the position found
          therein is used.
       3: Only set for combining characters: The character (as string)
          that is the standalone version used for accents. It may be
          null even for a combining character. In this case, no
          standalone version is known.
    */

    this.load = function() {
        // This function traverses the whole UnicodeData.txt in order
        // to build the database.
        // Additionally Gemse_Combining.txt is loaded
        
        var db = this.db;
        
        // We use the list of standalones temporarly. Its data gets
        // integrated into db.
        var standalones = [];

        // Create request for UnicodeData.txt
        var request = new XMLHttpRequest();
        request.open("GET", "UCD/UnicodeData.txt", false);
        request.overrideMimeType("text/plain");
        request.send(null);
        var dataLines = request.responseText.split("\n");
        delete request;

        var lineRegex = /^([^;]*);([^;]*);([^;]*);([^;]*);([^;]*);([^;]*);/;
                       //  ^^^^^ code point
                       //          ^^^^^ Unicode name
                       //                  ^^^^^ general category
                       //                          ^^^^^ combining class
                       //                                  ^^^^^ bidi class
                       //                                          ^^^^^  decomposition
        var standaloneRegex = /0020 (\S+)$/;
        for (var i=0; i<dataLines.length; ++i) {
            var l = dataLines[i];
            if (!l) { continue }
            var res = lineRegex.exec(l);
            if (!res) { throw "Error in UnicodeData.txt? " + l }
            var codepoint = parseInt(res[1],16);
            // We have to use the advanced fromCharCode shipped with
            // gemse, String.fromCharCode can not handle characters
            // from upper planes, unfortunately
            var character = String.uFromCharCode(codepoint);
            var mpos;
            switch (parseInt(res[4],10)) {
                case 0:
                    mpos = this.MPOS_NOTCOMBINING;
                    break;
                case 1:
                    mpos = this.MPOS_SUPERIMPOSED;
                    break;
                case 220:
                    mpos = this.MPOS_UNDER;
                    break;
                case 230:
                    mpos = this.MPOS_OVER;
                    break;
                //TODO: There are more of them!
                default:
                    mpos = this.MPOS_UNKNOWN;
            }
            db[character] = [res[2],res[3],mpos,null];
            // If this is the standalone version of some combining
            // mark, remember that:
            if (res[6]) {
                var standaloneRes = standaloneRegex.exec(res[6]);
                if (standaloneRes && standaloneRes[1]) {
                    standalones.push([String.uFromCharCode(parseInt(standaloneRes[1],16)), character]);
                }
            }
        }

        // Go through standalones and integrate them into db
        for (var i=0; i<standalones.length; ++i) {
            var e = standalones[i];
            db[e[0]][3] = e[1];
        }

        // Create request for Gemse_Combining.txt
        var request = new XMLHttpRequest();
        request.open("GET", "UCD/Gemse_Combining.txt", false);
        request.overrideMimeType("text/plain");
        request.send(null);
        var dataLines = request.responseText.split("\n");
        delete request;

        var lineRegex = /^([^;]*);([^;]*);([^;]*)/;
        for (var i=0; i<dataLines.length; ++i) {
            var l = dataLines[i];
            if (!l || l[0]=="#") { continue }
            var res = lineRegex.exec(l);
            if (!res) { throw "Error in Gemse_Combining.txt? " + l }
            var codepoint = parseInt(res[1],16);
            var character = String.uFromCharCode(codepoint);
            db[character][2] = parseInt(res[2],10);
            if (res[2]) {
                db[character][3] = String.uFromCharCode(parseInt(res[3],16));
            }
        }
    }

}

