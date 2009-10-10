var doc_commands = [];
var doc_commandsByImplementationNameOrId = {};
var modeCommands;

function doc_init() {
    doc_collectCommandInfo();
    doc_createCommandTable("command");
    doc_putCommandsIntoDocumentation();
}

function doc_collectCommandInfo() {
    // Find all elements that describe a command in this documentation
    // file.
    var documentations = document.evaluate(
        "//.[@class='commandDocumentation']", 
        document, 
        standardNSResolver, 
        XPathResult.UNORDERED_NODE_ITERATOR_TYPE, 
        null
    );

    // Loop over all of them
    var docElement;
    while (docElement = documentations.iterateNext()) {
        var commandEntry = {};
        commandEntry.docElement = docElement;
        commandEntry.id = docElement.getAttribute("id");
        commandEntry.titleElement = document.evaluate(
            ".//.[@class='commandTitle']", 
            docElement, 
            standardNSResolver, 
            XPathResult.ANY_UNORDERED_NODE_TYPE, 
            null
        ).singleNodeValue;
        commandEntry.title = commandEntry.titleElement.textContent;
        // Look for the implementation of this command.
        // This does not find implementations that are not part of the
        // global object (the window object). Those will be discovered
        // when processing bindings if they have a binding.
        if (window[commandEntry.id]) {
            commandEntry.implementation = window[commandEntry.id];
        }
        commandEntry.bindings = {};
        doc_commands.push(commandEntry);
        doc_commandsByImplementationNameOrId[commandEntry.id] = commandEntry;
    }

    // Go through all bindings
    for (b in modeCommands) {
        if (modeCommands[b].implementation) {
            // Command is implemented
            // Look for its documentation (if already present)
            var commandEntry = doc_commandsByImplementationNameOrId[modeCommands[b].implementation.name];
            if (commandEntry) {
                // There is a documentation of this command
                commandEntry.bindings[b] = modeCommands[b];
                commandEntry.primaryBinding = b; //XXX
                if (!commandEntry.implementation) {
                    // The implementation of this command is not yet
                    // known, so set it
                    commandEntry.implementation = modeCommands[b].implementation;
                }
            }
            else {
                // There is no documentation of this command, so we
                // add one
                var commandEntry = {
                    implementation: modeCommands[b].implementation,
                    bindings: {}, // Filled later
                    primaryBinding: b,
                };
                commandEntry.bindings[b] = modeCommands[b];
                doc_commands.push(commandEntry);
                doc_commandsByImplementationNameOrId[modeCommands[b].implementation.name] = commandEntry;
            }
        }
        else {
            // this binding has no implementation, perhaps because it
            // is of type disamb or longPrefix.
        }
    }
}


function doc_putCommandsIntoDocumentation() {
    doc_commands.filter(function(info) {return info.docElement}).forEach(function(info) {
        var detailTable = doc_commandDetailTable(info);
        detailTable.setAttribute("class", "doc_commandDetailTable");
        info.titleElement.parentNode.insertBefore(detailTable, info.titleElement.nextSibling);
        // Replace placeholder elements internal:command without ref attribute
        var placeholders = document.evaluate(
            ".//internal:cmdph[not(@ref)]",
            info.docElement, 
            standardNSResolver, 
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, 
            null
        );
        for (var i = 0; i < placeholders.snapshotLength; ++i) {
            var placeholder = placeholders.snapshotItem(i);
            placeholder.parentNode.replaceChild(
                document.createTextNode(doc_formattedCommandString(info.primaryBinding)),
                placeholder
            );
        }
    });
    doc_commands.forEach(function(info) {
        // Replace placeholder element internal:command with ref attribute
        // (Even for undocumented commands.)
        var ref = info.id ? info.id : info.implementation.name;
        var placeholders = document.evaluate(
            "//internal:cmdph[@ref='"+ ref +"']",
            document, 
            standardNSResolver, 
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, 
            null
        );
        for (var i = 0; i < placeholders.snapshotLength; ++i) {
            var placeholder = placeholders.snapshotItem(i);
            var select = placeholder.getAttribute("select");
            var bindingString;
            if (select) {
                bindingString = "[NO SUITABLE BINDING FOUND]";
                // Walk through all bindings and check whether they
                // match. This is done by evaluating the string
                // select. This string is supposed to be a expression
                // generating a boolean, using the object b for its
                // decision.
                for (s in info.bindings) {
                    var b = info.bindings[s];
                    if (eval(select)) { bindingString = s }
                }
            }
            else {
                bindingString = info.primaryBinding;
            }
            placeholder.parentNode.replaceChild(
                document.createTextNode(doc_formattedCommandString(bindingString)),
                placeholder
            );
        }
    });
}

function doc_createCommandTable(sortedBy) {
    var tableBody = document.getElementById("commandTableBody");
    while (tableBody.hasChildNodes()) { tableBody.removeChild(tableBody.firstChild) }
    doc_commands.sort(function(a, b) {
        var aKey; 
        var bKey;
        if (sortedBy == "command" || sortedBy == null) {
            aKey = a.primaryBinding;
            bKey = b.primaryBinding;
        }
        else if (sortedBy == "title") {
            aKey = a.title;
            bKey = b.title;
        }
        else if (sortedBy == "implementation") {
            aKey = a.implementation;
            bKey = b.implementation;
        }
        else if (sortedBy == "type") {
            aKey = a.bindings[a.primaryBinding].type;
            bKey = b.bindings[a.primaryBinding].type;
        }
        else if (sortedBy == "category") {
            aKey = a.bindings[a.primaryBinding].category;
            bKey = b.bindings[a.primaryBinding].category;
        }
        else if (sortedBy == "documentOrder") {
            // Does not change the order of the elements. (Well, I
            // hope JavaScripts sort algorithm is stable.)
            return 0;
        }
        else {
            throw new Error("Unknown sort key: " + sortedBy);
        }
        if (aKey < bKey) return -1;
        else if (aKey > bKey) return 1;
        else if (aKey == bKey) return 0;
    });
    doc_commands.forEach(function(c) {
        var td_command = document.createElement("td");
        var td_title = document.createElement("td");
        var td_implementationName = document.createElement("td");
        
        doc_formattedCommandList(c.bindings,td_command);
        if (c.docElement) {
            var titleLink = document.createElement("a");
            titleLink.setAttribute("href", "#" + c.id);
            titleLink.appendChild(document.createTextNode(c.title));
            td_title.appendChild(titleLink);
        }
        else {
            td_title.appendChild(document.createTextNode("not documented"));
        }
        td_implementationName.appendChild(document.createTextNode(c.implementation?c.implementation.name:"<none>"));

        var tr = document.createElement("tr");
        tr.appendChild(td_command);
        tr.appendChild(td_title);
        tr.appendChild(td_implementationName);

        tableBody.appendChild(tr);
    });
}

function doc_formattedCommandList(bindings, container) {
    listOfCommandStrings = [];
    for (s in bindings) { listOfCommandStrings.push(s); }
    listOfCommandStrings = listOfCommandStrings.sort();
    if (listOfCommandStrings.length > 0) {
        listOfCommandStrings.forEach(function (cs) {
            var kbdElement = document.createElement("kbd");
            cs = doc_formattedCommandString(cs);
            kbdElement.appendChild(document.createTextNode(cs));
            container.appendChild(kbdElement);
            container.appendChild(document.createTextNode(", "));
        });
        container.removeChild(container.lastChild);
    }
    else {
        container.appendChild(document.createTextNode("none"));
    }
}

function doc_commandDetailTable(info) {
    var table = document.createElement("table");
    var headtr = document.createElement("tr");
    var th1 = document.createElement("th");
    th1.appendChild(document.createTextNode("command"));
    headtr.appendChild(th1);
    var th2 = document.createElement("th");
    th2.appendChild(document.createTextNode("category"));
    headtr.appendChild(th2);
    var th3 = document.createElement("th");
    th3.appendChild(document.createTextNode("type"));
    headtr.appendChild(th3);
    var th4 = document.createElement("th");
    th4.appendChild(document.createTextNode("argument"));
    headtr.appendChild(th4);
    table.appendChild(headtr);
    for (s in info.bindings) {
        table.appendChild(doc_commandDetailTableRow(s, info.bindings[s]));
    }
    return table;
}

function doc_commandDetailTableRow(s, b) {
    var tr = document.createElement("tr");
    var td1 = document.createElement("td");
    var kbd = document.createElement("kbd");
    kbd.appendChild(document.createTextNode(doc_formattedCommandString(s)));
    td1.appendChild(kbd);
    tr.appendChild(td1);
    var td2 = document.createElement("td");
    td2.appendChild(document.createTextNode(b.category));
    tr.appendChild(td2);
    var td3 = document.createElement("td");
    td3.appendChild(document.createTextNode(b.type));
    tr.appendChild(td3);
    var td4 = document.createElement("td");
    if (b.argument == "characters") {
        td4.appendChild(document.createTextNode(
            b.argumentCharacterCount + (b.argumentCharacterCount > 1 ?  " characters" : " character")
        ));
    }
    if (b.argument == "newlineTerminated") {
        td4.appendChild(document.createTextNode(
            b.argumentLineCount > 1 ? (b.argumentLineCount + " lines") : "1 line"
        ));
    }
    else {
        td4.appendChild(document.createTextNode(b.argument));
    }
    tr.appendChild(td4);
    return tr;
}

function doc_formattedCommandString(cs) {
    cs = cs.replace(/ /gm,  "␣");
    cs = cs.replace(/\n/gm, "↵");
    cs = cs.replace((new RegExp("\\" + KEYMOD_CONTROL, "gm")), "CTRL+");
    cs = cs.replace((new RegExp("\\" + KEYMOD_ALT, "gm")), "ALT+");
    cs = cs.replace(/\u0009/gm, "TAB");
    cs = cs.replace(/\u001b/gm, "ESC");
    return cs;
}

