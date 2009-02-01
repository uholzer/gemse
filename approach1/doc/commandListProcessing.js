var commandInfo = [];

function init() {
    generateCommandInfo();
    createCommandTable("command");
    putCommandsIntoDocumentation();
}

function generateCommandInfo() {
    var nsResolver = function (prefix) {  };
    var documentations = document.evaluate(
        "//.[@class='commandDocumentation']", 
        document, 
        nsResolver, 
        XPathResult.UNORDERED_NODE_ITERATOR_TYPE, 
        null
    );
    var documentation;
    while (documentation = documentations.iterateNext()) {
        var commandEntry = {};
        commandEntry.documentation = documentation;
        commandEntry.functionName = commandEntry.id = documentation.getAttribute("id");
        commandEntry.titleElement = document.evaluate(
            ".//.[@class='commandTitle']", 
            documentation, 
            nsResolver, 
            XPathResult.ANY_UNORDERED_NODE_TYPE, 
            null
        ).singleNodeValue;
        commandEntry.title = commandEntry.titleElement.textContent;
                        
        commandEntry.associatedCommands = [];
        for (s in editModeCommands) {
            if (editModeCommands[s].execute.name == commandEntry.functionName) {
                commandEntry.associatedCommands.push(s);
                // Remember the type (which does not always is the same in this loop)
                if (commandEntry.type) {
                    if (commandEntry.type.indexOf(editModeCommands[s].type) == -1) {
                        commandEntry.type += ", " + editModeCommands[s].type;
                    }
                }
                else {
                    commandEntry.type = editModeCommands[s].type;
                }
                delete editModeCommands[s];
            }
        }

        commandInfo.push(commandEntry);
    }
    // Undocumented commands
    for (s in editModeCommands) {
        var commandEntry = {};
        commandEntry.documentation = null;
        commandEntry.functionName = commandEntry.id = editModeCommands[s].execute.name;
        commandEntry.titleElement = null;
        commandEntry.title = "NOT DOCUMENTED!";
                        
        commandEntry.associatedCommands = [s];
        commandEntry.type = editModeCommands[s].type;
        commandInfo.push(commandEntry);
    }            
    
}

function putCommandsIntoDocumentation() {
    commandInfo.filter(function(info) {return info.documentation}).forEach(function(info) {
        elementForCommand = document.createElement("p");
        elementForCommand.setAttribute("class", "commandInDocumentation");
        info.titleElement.parentNode.insertBefore(elementForCommand, info.titleElement.nextSibling);
        formattedCommandString(info.associatedCommands, elementForCommand);
    });
}

function createCommandTable(sortedBy) {
    var tableBody = document.getElementById("commandTableBody");
    while (tableBody.hasChildNodes()) { tableBody.removeChild(tableBody.firstChild) }
    commandInfo.sort(function(a, b) {
        if (a.command < b.command) return -1;
        else if (a.command > b.command) return 1;
        else if (a.command == b.command) return 0;
    });
    commandInfo.forEach(function(c) {
        var td_command = document.createElement("td");
        var td_title = document.createElement("td");
        var td_functionName = document.createElement("td");
        var td_type = document.createElement("td");
        
        formattedCommandString(c.associatedCommands,td_command);
        var titleLink = document.createElement("a");
        titleLink.setAttribute("href", "#" + c.id);
        titleLink.appendChild(document.createTextNode(c.title));
        td_title.appendChild(titleLink);
        td_functionName.appendChild(document.createTextNode(c.functionName));
        td_type.appendChild(document.createTextNode(c.type));

        var tr = document.createElement("tr");
        tr.appendChild(td_command);
        tr.appendChild(td_title);
        tr.appendChild(td_functionName);
        tr.appendChild(td_type);

        tableBody.appendChild(tr);
    });
}

function formattedCommandString(listOfCS, container) {
    if (listOfCS.length > 0) {
        listOfCS.forEach(function (s) {
            var kbdElement = document.createElement("kbd");
            s = s.replace(/ /gm,  "␣");
            s = s.replace(/\n/gm, "↵");
            //s = s.replace((new RegExp("\" + KEYMOD_CONTROL, "gm")), "CRTL+");
            //s = s.replace((new RegExp("\" + KEYMOD_ALT, "gm")), "ALT+");
            s = s.replace(/\u001b/gm, "ESC");
            kbdElement.appendChild(document.createTextNode(s));
            container.appendChild(kbdElement);
            container.appendChild(document.createTextNode(", "));
        });
        container.removeChild(container.lastChild);
    }
    else {
        container.appendChild(document.createTextNode("none"));
    }
}

