/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */

/*
The functions herein are used to query and manipulate the operator
dictionary.
*/

/* Expected format of the operator dictionary:
Basically, the format of the operator dictionary given in the MathML2
specification is used. However, attributes with the prefix "meta"
have a special meaning:
    meta:description     one-line description
    meta:id              Unique identification, used only to override default.
                         Do not use it!
    meta:disamb          Identification to disambiguate overriden operators
    meta:nr              Preference of the user. If set to 0, then
                         this operator is used by default.
    meta:grouping        Precedence of the operator
                         (Useful for automatic placement of mrows)
The id is by default the operator followed by the form
followed by meta:disamb. Please make
shure that this string is unique among all operators.
meta:dsiamb is used to disambiguate between operators that have the
same content and the same form.

TODO: Somehow, we have to distinguish between MathML default entries
and additional ones. The default entries are entries that we think
that they are known to every MathML processor. So, the attributes of
such an entry do not need to be added to the XML structure. Most
important is that we can plug in the operator dictionary from the
specification without modification.
The best way would be to put them in one file and the user defined
ones in another.
*/

var operatorDictionary = new OperatorDictionary();

function OperatorDictionary() {
    this.db = {}

    /* Public methods */

    this.entriesByContent = function(content) {
        var entries = [];
        for each (var f in this.db[content]) {
            for each (var entry in f) {
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
        // IMPORTANT: Here, embellished operators are not treated in a special way!

        var parentNode = element.parentNode;
        var parentIsMrow = (
            elementDescriptions[parentNode.localName] && (
            elementDescriptions[parentNode.localName].type == "mrow" ||
            elementDescriptions[parentNode.localName].type == "inferred_mrow"
            )
        );
        var parentLength = 0;
        var position = -1;
        // Count non-space elements
        var siblingList = parentNode.childNodes;
        for (var i = 0; i < siblingList.length; i++) {
            var sibling = siblingList[i];
            if (sibling.nodeType==Node.ELEMENT_NODE) {
                if (!(sibling.namespaceURI==NS_MathML&&sibling.localName=="mspace")) {
                    ++parentLength;
                }
                if (sibling==element) { position = parentLength-1 }
            }
        }

        if (parentIsMrow && parentLength > 1 && position==0) {
            return "prefix";
        }
        else if (parentIsMrow && parentLength > 1 && position==parentLength-1) {
            return "postfix";
        }
        else {
            return "infix";
        }
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
                        throw new Error("Only hexadecimal entities allowed in content dictionary")
                    }
                    var endIndex = sEscaped.indexOf(";");
                    if (endIndex==-1) { throw new Error("Malformed entity in content dictionary") }
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
        var dictionaryLines = request.responseText.split("\n");
        delete request;

        var entryRegex = /^ *"(([^<"]+)((<!--(([^-]|-(?!-))*)-->)([^<"]*))*)"(( +[^=]+="[^"]*")*)( +(<!--([^-]*)-->))? *$/;
        var emptyRegex = /^\s*$/;
        var commentRegex = /<!--(.*)-->/;
        var attributeRegex = /([^\s=]+)="([^"]*)"/g;

        var match;
        var groupingPrecedenceAuto = 1000;
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
                if (!form) { throw new Error("form must always be given in operator dictionary. (Line " + (i+1) + ")") }
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
                //if (this.db[content][form][disamb||""]) { throw new Error("You tried to overload the operator " + content + " " + form + " " + (disamb||"")) }
                this.db[content][form][disamb||""] = entry;
            }
            else {
                throw new Error("Error in operator dictionary at line " + (i+1));
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

