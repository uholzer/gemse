/*
The function herein are used to query and manipulate the operator
dictionary.
*/

operatorDictionary = { };

function loadOperatorDictionary() {
    // Read dictionary from operatorDictionary.txt

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
    request.open("GET", "./operatorDictionary.txt", false);
    request.overrideMimeType("text/plain");
    request.send(null);
    var dictionaryString = request.responseText;

    var entryRegex = /^ *"([^<"]+)(<!--([^-]*)-->)?"(( +[^=]+="[^"]*")*)( +(<!--([^-]*)-->))? *$/mg;
    //    indentation  ^^^ 
    //           operator  ^^^^^^^^
    //   description of character  ^^^^^^^^^^^^^^^
    //                                    an attribute  ^^^^^^^^^^^^^^^
    //                                human readable description of operator  ^^^^^^^^^^^^^^^^
    var attributeRegex = /([^\s=]+)="([^"]*)"/g;

    var match;
    while (match = entryRegex.exec(dictionaryString)) {
        var content = resolveEntities(match[1]);
        var contentComment = match[3];
        var attributesString = match[4];
        var comment = match[8];

        var attributeMatch;
        var attributes = {};
        while (attributeMatch = attributeRegex.exec(attributesString)) {
            attributes[attributeMatch[1]] = resolveEntities(attributeMatch[2]);
        }
        var form = attributes["form"];
        if (!form) { throw "form must always be given in operator dictionary" }
        var overloadKey = "";

        var entry = { 
            content: content, 
            form: form,
            overloadKey: overloadKey,
            contentComment: contentComment,
            comment: comment,
            attributes: attributes,
        }

        if (!operatorDictionary[content]) { 
            operatorDictionary[content] = { prefix: {}, infix: {}, postfix: {} };
        }
        operatorDictionary[content][form][overloadKey] = entry;
    }
}

