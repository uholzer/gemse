/*
The functions herein are used to query and manipulate the operator
dictionary.
*/

/* Expected format of the operator dictionary:
Basically, the format of the operator dictionary given in the MathML2
specification is used. However, attributes with the prefix "meta"
have a special meaning:
    meta:description     one-line description
    meta:id              Unique identification, used onlyto override default
    meta:disamb          Identification to disambiguate overriden operators
    meta:nr              Preference of the user. If set to 0, then
                         this operator is used by default.
    meta:grouping        Precedence of the operator
                         (Useful for automatic placement of mrows)
The id is by default the operator followed by meta:disamb. Please make
shure that this string is unique among all operators.

TODO: Somehow, we have to distinguish between MathML default entries
and additional ones. The default entries are entries that we think
that they are known to every MathML processor. So, the attributes of
such an entry do not need to be added to the XML structure. Most
important is that we can plug in the operator dictionary from the
specification without modification.
The best way would be to put them in one file and the user defined
ones in another.
*/

operatorDictionary = new OperatorDictionary();

function OperatorDictionary() {
    this.db = {}

    /* Public methods */

    this.entriesByContent = function(content) {
        var entries = [];
        for each (f in this.db[content]) {
            for each (entry in f) {
                entries.push(entry);
            }
        }
        return entries;
    }

    this.getNodesByElement= function(element) {

    }
    this.getNodesByElementDisamb = function(element,disamb) {

    }
    this.formByPosition = function(element) {
        // This function determines the form of an operator by
        // his position in the mrow it is contained in. The algorithm
        // used for that is described in
        // http://www.w3.org/TR/MathML2/chapter3.html#presm.formdefval
        // (which equals the respective section in the MathML 3
        // specification at the time of writing.)
    }

    /* Private methods */

    this.load = function() {
        this.loadFromFile("operatorDictionaryMathMLSpec.txt",true);
        this.loadFromFile("operatorDictionaryUser.txt",false);
    }
    this.loadFromFile = function(dictionaryFile, isSpec) {
        // Loads operator dictionary entries from a file. If isSpec is
        // true, they are handled as entries from the operator
        // dictionary from the MathML specification.
        var resolveEntities = function(sEscaped) {
            // Converts the hexadecimal XML entities found in sEscape
            // into the actual characters. Returns the resulting
            // string.
            var s = "";
            while (sEscaped) {
                if (sEscaped[0]!="&") {
                    s += sEscaped[0];
                    sEscaped = sEscaped.slice(1);
                }
                else {
                    // Since we only allow nummeric, hexadecimal entities,
                    // unescapedContent[1] must be #
                    if (sEscaped[1]!="#"||sEscaped[2]!="x") {
                        throw "Only hexadecimal entities allowed in content dictionary"
                    }
                    endIndex = sEscaped.indexOf(";");
                    if (endIndex==-1) { throw "Malformed entity in content dictionary" }
                    var hexString = sEscaped.slice(3,endIndex);
                    var codepoint = parseInt(hexString,16);
                    s += String.fromCharCode(codepoint);
                    sEscaped = sEscaped.slice(endIndex+1);
                }
            }
            return s;
        }

        // Create request
        var request = new XMLHttpRequest();
        request.open("GET", dictionaryFile, false);
        request.overrideMimeType("text/plain");
        request.send(null);
        var dictionaryString = request.responseText;
        var dictionaryLines = dictionaryString.split("\n");

        var entryRegex = /^ *"(([^<"]+)((<!--(([^-]|-(?!-))*)-->)([^<"]*))*)"(( +[^=]+="[^"]*")*)( +(<!--([^-]*)-->))? *$/;
        var emptyRegex = /^\s*$/;
        var commentRegex = /<!--(.*)-->/;
        var attributeRegex = /([^\s=]+)="([^"]*)"/g;

        var match;
        groupingPrecedenceAuto = 1000;
        for (var i=0; i<dictionaryLines.length; ++i) {
            var l = dictionaryLines[i];
            if (emptyRegex.test(l)) {
                groupingPrecedenceAuto += 1000;
            }
            else if (match = entryRegex.exec(l)) {
                var unparsedContent = match[1];
                var contentComment = "";
                var commentMatch;
                while (commentMatch = commentRegex.exec(unparsedContent)) {
                    contentComment += ", " + commentMatch[1];
                    unparsedContent = unparsedContent.replace(commentRegex,"");
                }
                contentComment = contentComment.slice(2);
                var content = resolveEntities(unparsedContent);
                
                var attributesString = match[8];
                var comment = match[12];

                var attributeMatch;
                var attributes = {};
                while (attributeMatch = attributeRegex.exec(attributesString)) {
                    attributes[attributeMatch[1]] = resolveEntities(attributeMatch[2]);
                }

                // Extract meta information from attributes
                var form = attributes["form"];
                var description = attributes["meta:description"];
                var groupingPrecedence = groupingPrecedenceAuto;
                if (attributes["meta:grouping"]!==undefined) {
                    groupingPrecedence = attributes["meta:grouping"];
                }
                var disamb = attributes["meta:disamb"] || null;
                var id = content + (disamb ? disamb : "");
                if (attributes["meta:id"]!==undefined) {
                    groupingPrecedence = attributes["meta:id"];
                }
                if (!form) { throw "form must always be given in operator dictionary. (Line " + (i+1) + ")" }
                var overloadKey = 0;

                // TODO: Remove "meta:" attributes


                var entry = { 
                    content: content,
                    form: form,
                    id: id,
                    disamb: disamb,
                    contentComment: contentComment,
                    description: description,
                    comment: comment,
                    attributes: attributes,
                    groupingPrecedence: groupingPrecedence,
                    isSpec: isSpec
                }

                if (!this.db[content]) { 
                    this.db[content] = { prefix: {}, infix: {}, postfix: {} };
                }
                //if (this.db[content][form][disamb||""]) { throw "You tried to overload the operator " + content + " " + form + " " + (disamb||"") }
                this.db[content][form][disamb||""] = entry;
            }
            else {
                throw "Error in operator dictionary at line " + (i+1);
            }
        }
    }

    this.getByContentDisamb = function() {

    }
    this.getByContentFormDisamb = function() {

    }
    this.getByContentForm = function() {

    }

    this.makeNodes = function() {

    }

    this.applyToElement = function(element,key) {

    }


    this.load();
}
