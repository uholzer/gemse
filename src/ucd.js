/**
 * @fileOverview Accessing the Unicode Character Database.
 * This file provides a class for querying the UCD,
 * specially tailored to the needs of Gemse.
 * When loading this file, a global object ucd is created and the UCD
 * gets loaded. So, one does not need to create a UCD4Gemse object,
 * but one should use the global object ucd instead.
 */


/**
 * @class Querying the Unicode Character Database.
 */
function UCD4Gemse() {
    /**
     * Content of the UCD.
     * <p>Only significant information is stored. Some information is
     * derived and can not directly be found in the UCD. This
     * datastructure may change over time, so it should not be
     * accessed from the outside directly.</p>
     *
     * <p>Database structure: The database is an array with the following
     * fields:</p>
     * <ul>
     * <li>0: Unicode name
     * <li>1: General category
     * <li>2: Position for combining characters (one of the MPOS_*)
     * <li>3: Only set for combining characters: The character (as string)
     *    that is the standalone version used for accents. It may be
     *    null even for a combining character. In this case, no
     *    standalone version is known.</li>
     * </ul>
     *
     * @private
     */
    this.db = {};
}
UCD4Gemse.prototype = {
    /**
     * Tells whether a character can be considered an identifier by
     * default.
     */
    isIdentifier: function(c) {
        return (this.lookupGeneralCategory(c)[0] == "L");
    },

    /**
     * Tells whether a character can be considered a digit by
     * default.
     */
    isDigit: function(c) {
        return (this.lookupGeneralCategory(c)[0] == "N");
    },

    /**
     * Tells whether a character can be considered an operator by
     * default.
     */
    isOperator: function(c) {
        return (this.lookupGeneralCategory(c)[0] == "S" || this.lookupGeneralCategory(c)[0] == "P");
    },

    /**
     * Tells whether a character is a combining character.
     * This may not be fully unicode conformant, since it uses the
     * property "combining class".
     */
    isCombining: function(c) {
        return (this.lookupCombiningPosition(c) != this.MPOS_NOTCOMBINING);
    },

    // They match the numbers used in Gemse_Combining.txt
    MPOS_UNKNOWN: -1,
    MPOS_NOTCOMBINING: 0,
    MPOS_SUPERIMPOSED: 1,
    MPOS_UNDER: 2,
    MPOS_SUB: 3,
    MPOS_SUP: 5,
    MPOS_OVER: 6,
    MPOS_PRESUP: 7,
    MPOS_PRESUB: 9,

    /* Lookup methods */

    /**
     * Tells the unicode name of a character
     */
    lookupName: function(c) {
        return this.db[c][0];
    },

    /**
     * Tells the general category of a character. The format of the
     * value is as it is found in the UCD.
     */
    lookupGeneralCategory: function(c) {
        return this.db[c][1];
    },
 
    /**
     * Tells for a combining character at which position it is placed.
     * It returns one of the MPOS_* values. This value is originally
     * derived from the combining class of the character. If its
     * combining class is 0, the character is considered not to be
     * combining and MPOS_NOTCOMBINING.
     */
    lookupCombiningPosition: function(c) {
        return this.db[c][2];
    },
 
    /**
     * Guesses the standalone version of a combining character.
     * The standalone version is a non-combining character having the
     * same form as the given character and is used in MathML together
     * with a mover, msup, munder or similar construct.
     */
    lookupCombiningStandalone: function(c) {
        return this.db[c][3];
    },



    /**
     * Fetches all database files and parses them.
     */
    load: function() {
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
            if (!res) { throw new Error("Error in UnicodeData.txt? " + l) }
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
            if (!res) { throw new Error("Error in Gemse_Combining.txt? " + l) }
            var codepoint = parseInt(res[1],16);
            var character = String.uFromCharCode(codepoint);
            db[character][2] = parseInt(res[2],10);
            if (res[2]) {
                db[character][3] = String.uFromCharCode(parseInt(res[3],16));
            }
        }
    },

}

var ucd = new UCD4Gemse();
ucd.load();

