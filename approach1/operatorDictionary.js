/*
The function herein are used to query and manipulate the operator
dictionary.
*/

operatorDictionary = new OperatorDictionary();

function OperatorDictionary() {
    this.db = {}

    /* Public methods */

    this.getNodesByElement= function(element) {

    }
    this.getNodesByElementKey = function(element,key) {

    }
    this.formByPosition = function(element) {

    }

    /* Private methods */

    this.load = function() {
        this.loadFromFile("operatorDictionary.txt");
    }
    this.loadFromFile = function(dictionaryFile) {
        var resolveEntities = function(sEscaped) {
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
                var form = attributes["form"];
                if (!form) { throw "form must always be given in operator dictionary. (Line " + (i+1) + ")" }
                var overloadKey = 0;

                var groupingPrecedence = groupingPrecedenceAuto;

                var entry = { 
                    content: content, 
                    form: form,
                    overloadKey: overloadKey,
                    contentComment: contentComment,
                    comment: comment,
                    attributes: attributes,
                    groupingPrecedence: groupingPrecedence,
                }

                if (!this.db[content]) { 
                    this.db[content] = { prefix: {}, infix: {}, postfix: {} };
                }
                if (this.db[content][form][overloadKey]) { 
                    if (overloadKey) { throw "You tried to overload the operator " + content + " " + form + " " + overloadKey }
                    while (this.db[content][form][overloadKey.toString()]) { ++overloadKey }
                }
                this.db[content][form][overloadKey.toString()] = entry;
            }
            else {
                throw "Error in operator dictionary at line " + (i+1);
            }
        }
    }

    this.getByContentKey = function() {

    }
    this.getByContentFormKey = function() {

    }
    this.getByContentForm = function() {

    }

    this.makeNodes() {

    }

    this.applyToElement = function(element,key) {

    }


    this.load();
}

