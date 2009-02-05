
function EditMode(editor, equationEnv) {
    this.name = "edit";
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.userSelectionForNextCommand = null; // This is set after visual mode. Otherwise allways null.
    this.init = function() {
        this.moveCursor(this.equationEnv.equation); // the element the cursor points to
    }
    this.moveCursor = function(element) {
        this.hideCursor();
        this.cursor = element;
        this.showCursor();
        this.equationEnv.updateViews();
    }
    this.showCursor = function() {
        this.cursor.setAttributeNS(NS_internal, "selected", "editcursor");
        if (this.cursor != this.equationEnv.equation) { this.cursor.parentNode.setAttributeNS(NS_internal, "selected", "parent"); }
    }
    this.hideCursor = function() {
        if (this.cursor) {
            this.cursor.removeAttributeNS(NS_internal, "selected");
            if (this.cursor != this.equationEnv.equation) { this.cursor.parentNode.removeAttributeNS(NS_internal, "selected"); }
        }
    }
    this.cursor = null;
    this.__defineGetter__("contextNode", function() { return this.cursor; }); // Required for every mode
    this.keyHandler = function(event) { standardKeyHandler(event,this.editor) }
    this.inputHandler = function() {
        // Call handleOneCommandFromInputBuffer as long as it can extract and execute a
        // full command from the input buffer.
        while (editor.inputBuffer.length > 0 && this.handleOneCommandFromInputBuffer()) {}
    }
    this.handleOneCommandFromInputBuffer = function() {
        // Returns true if it succeeded to execute the first command from the
        // input buffer. Else, it returns false.
        var command = this.editor.inputBuffer;
        var endOfCommandIndex = 0; // Points to the end of the command in the input buffer
        var commandArg = null;
        var forceFlag = false;
        var singleCharacterArgs = [];
        if (command.charCodeAt(command.length-1) == KeyEvent.DOM_VK_ESCAPE) {
            // KeyEvent.DOM_VK_ESCAPE should be 0x1b
            //event.preventDefault();
            this.editor.inputBuffer = "";
            return false; //XXX: Or true?
        }
        while (command[0] == '"') {
            if (command.length < 2) { return } // Returns if the user has not yet entered the character
            singleCharacterArgs.push(command[1]);
            command = command.slice(2);
            endOfCommandIndex += 2;
        }
        if (command[0] == ":") { // Treate this as a long command
            var inf = /^(:[^\s\n!]*)(!?)(\s+([^\n]*))?\n$/.exec(command);
            if (inf) {
                command = inf[1];
                if (inf[2]) { forceFlag = true }
                commandArg = inf[4] || ""; // Prevent commandArg from being null (XXX: is this good?)
                endOfCommandIndex += inf[0].length + 1;
            }
            else {
                return false;
            }
        }
        else {
            var firstCommand = command.slice(0,1);
            while (!editModeCommands[firstCommand] && firstCommand.length < command.length) { 
                firstCommand = command.slice(0,firstCommand.length + 1);
            }
            command = firstCommand;
            endOfCommandIndex += firstCommand.length;
        }
        commandObject = editModeCommands[command];
        if (commandObject) {
            if (commandObject.type == "long") {
                var executionResult = commandObject.execute(this,commandArg,forceFlag)
                // TODO: Only clear buffer if it returns true?
                editor.inputBuffer = editor.inputBuffer.slice(endOfCommandIndex);
            }
            else if (commandObject.type == "movement") {
                var executionResult = commandObject.execute(this,this.cursor)
                // A movement method must return a node or null
                // (A movement command is not allowed to have side
                // effect.)
                if (executionResult) {
                    this.moveCursor(executionResult);
                }
                // If executionResult is null, we do not move the
                // cursor
                editor.inputBuffer = editor.inputBuffer.slice(endOfCommandIndex);
            }
            else {
                if (this.userSelectionForNextCommand) {
                    // For debugging purposes:
                    if (!(this.userSelectionForNextCommand.startElement && this.userSelectionForNextCommand.endElement)) {
                        throw "A selection must have a startElement and an endElement.";
                    }
                }
                if (commandObject.type == "operator" && !this.userSelectionForNextCommand) {
                    // An operator expects a selection, so if none is present,
                    // take the cursor as the only selected element.
                    // This will be revised later.
                    this.userSelectionForNextCommand = {startElement: this.cursor, endElement: this.cursor};
                }
                var executionResult = commandObject.execute(this,command,singleCharacterArgs,this.userSelectionForNextCommand);
                // TODO: Only clear buffer if it returns true?
                editor.inputBuffer = editor.inputBuffer.slice(endOfCommandIndex);
            }
            this.userSelectionForNextCommand = null;
            return true; // TODO: Or should it return executionResult?
        }
        else {
            throw "Command not found";
            return false;
        }
    };
    this.calledModeReturned = function (returnValue) {
        if (this.infoAboutCalledMode) {
            if (this.infoAboutCalledMode.change) {
                this.infoAboutCalledMode.change.recordAfter(this.equationEnv.equation,this.infoAboutCalledMode.changeElement);
                this.equationEnv.history.reportChange(this.infoAboutCalledMode.change);
            }
        }
        if (returnValue && returnValue.userSelection) {
            this.userSelectionForNextCommand = returnValue.userSelection;
        }
        delete this.infoAboutCalledMode;
        this.moveCursor(this.cursor); // In order to update all views
    }
    this.reInit = function () {
        // Search equation for the cursor
        var nsResolver = function (prefix) { 
            if (prefix == "internal") { return NS_internal }
            else { return null }
        };
        this.cursor = document.evaluate(".//.[@internal:selected='editcursor']", this.equationEnv.equation, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
        if (!this.cursor) { this.cursor = this.equationEnv.equation }
        this.moveCursor(this.cursor); // In order to update all views
    }
}


editModeOptions = { // Default values of options

}

function editModeCommand_moveLeft(mode,currentElement) {
    return mml_previousSibling(currentElement);
}

function editModeCommand_moveRight(mode,currentElement) {
    return mml_nextSibling(currentElement);
}

function editModeCommand_moveUp(mode,currentElement) {
    return mml_parent(currentElement);
}

function editModeCommand_moveDown(mode,currentElement) {
    return mml_firstChild(currentElement);
}

function editModeCommand_moveDownLast(mode,currentElement) {
    return mml_lastChild(currentElement);
}

function editModeCommand_moveToFirstSibling(mode,currentElement) {
    return mml_firstSibling(currentElement);
}

function editModeCommand_moveToLastSibling(mode,currentElement) {
    return mml_lastSibling(currentElement);
}

function editModeCommand_moveToRoot(mode, currentElelment) {
    return mode.equationEnv.equation;
}

function editModeCommand_undo(mode) {
    // The glorious undo
    mode.hideCursor();
    if (!mode.equationEnv.history.goBack(mode.equationEnv)) {
        throw "undo failed";
    }
    mode.moveCursor(mode.cursor); // In order to update all views
    return true;
}

function editModeCommand_redo(mode) {
    // The inverse of the glorious undo
    mode.hideCursor();
    if (!mode.equationEnv.history.goForward(mode.equationEnv)) {
        throw "redo failed";
    }
    mode.moveCursor(mode.cursor); // In order to update all views
    return true;
}

function editModeCommand_kill(mode) {
    var target = mode.cursor;
    var parentOfTarget = target.parentNode;
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,parentOfTarget);
    mode.moveCursor(mml_nextSibling(target) || mml_previousSibling(target) || parentOfTarget);
    target.parentNode.removeChild(target);
    change.recordAfter(mode.equationEnv.equation,parentOfTarget);
    mode.moveCursor(mode.cursor); // In order to update all views
    mode.equationEnv.history.reportChange(change);
    return true;
}

function editModeCommand_delete(mode,command,singleCharacterArgs,userSelection) {
    var from = userSelection.startElement; // \ Those two must be siblings, in the right order!
    var to = userSelection.endElement;     // /
    if (!(from && to)) {
        throw "Delete wants a startElement and an endElement in the selection!";
    }
    var parentOfTargets = userSelection.startElement.parentNode;
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,parentOfTargets);
    TODO: mode.moveCursor(mml_nextSibling(to) || mml_previousSibling(from) || parentOfTargets);
    while (from != to) {
        var nextFrom = mml_nextSibling(from);
        parentOfTargets.removeChild(from);
        from = nextFrom;
    }
    parentOfTargets.removeChild(to);
    change.recordAfter(mode.equationEnv.equation,parentOfTargets);
    mode.moveCursor(mode.cursor); // In order to update all views
    mode.equationEnv.history.reportChange(change);
    return true;
}

function editModeCommand_change(mode,command,singleCharacterArgs,userSelection) {
    // TODO: This is broken :-(
    editModeCommand_delete(mode,command,singleCharacterArgs,userSelection);
    editModeCommand_insertBefore(mode);
    return true;
}

function editModeCommand_attributeMode(mode) {
    mode.infoAboutCalledMode = {
        change: mode.equationEnv.history.createChange(),
        changeElement: mode.cursor
    };
    mode.infoAboutCalledMode.change.recordBefore(mode.equationEnv.equation,mode.cursor);
    var newMode = new AttributeMode(mode.editor, mode.equationEnv, mode.cursor);
    newMode.init();
    mode.equationEnv.callMode(newMode);
    return true;
}

function editModeCommand_visualMode(mode) {
    /* TODO: How to handle changes in visual mode?
    mode.infoAboutCalledMode = {
        change: mode.equationEnv.history.createChange(),
        changeElement: mode.cursor
    };
    mode.infoAboutCalledMode.change.recordBefore(mode.equationEnv.equation,mode.cursor);
    */
    var newMode = new VisualSelectionMode(mode.editor, mode.equationEnv, mode.cursor);
    newMode.init();
    mode.equationEnv.callMode(newMode);
    return true;
}

function editModeCommand_insertBefore(mode) {
    mode.infoAboutCalledMode = {
        change: mode.equationEnv.history.createChange(),
        changeElement: mode.cursor.parentNode
    };
    mode.infoAboutCalledMode.change.recordBefore(mode.equationEnv.equation,mode.cursor.parentNode);
    var newMode = new trivialInsertMode(mode.editor, mode.equationEnv, mode.cursor.parentNode, mode.cursor);
    newMode.init();
    mode.equationEnv.callMode(newMode);
    return true;
}

function editModeCommand_insertAfter(mode) {
    mode.infoAboutCalledMode = {
        change: mode.equationEnv.history.createChange(),
        changeElement: mode.cursor.parentNode
    };
    mode.infoAboutCalledMode.change.recordBefore(mode.equationEnv.equation,mode.cursor.parentNode);
    var newMode = new trivialInsertMode(mode.editor, mode.equationEnv, mode.cursor.parentNode, mml_nextSibling(mode.cursor));
    newMode.init();
    mode.equationEnv.callMode(newMode);
    return true;
}

function editModeCommand_insertIn(mode) {
    // Thought for inserting into empty elements
    // (should be used seldomly)
    mode.infoAboutCalledMode = {
        change: mode.equationEnv.history.createChange(),
        changeElement: mode.cursor.parentNode
    };
    mode.infoAboutCalledMode.change.recordBefore(mode.equationEnv.equation,mode.cursor.parentNode);
    var newMode = new trivialInsertMode(mode.editor, mode.equationEnv, mode.cursor, null);
    newMode.init();
    mode.equationEnv.callMode(newMode);
    return true;
}

function editModeCommand_insertAtBeginning(mode) {
    mode.moveCursor(mml_firstSibling(mode.cursor));
    return editModeCommand_insertBefore(mode);
}

function editModeCommand_insertAtEnd(mode) {
    mode.moveCursor(mml_lastSibling(mode.cursor));
    return editModeCommand_insertAfter(mode);
}

function editModeCommand_set(mode, argString) {

}

function editModeCommand_redisplay(mode) {
    mode.moveCursor(mode.cursor);
    return true;
}

function editModeCommand_serialize(mode, argString) {
    var serializer = new XMLSerializer();
    var rootNode;
    if (argString.indexOf("raw") != -1) { //argString contains "raw"
        rootNode = mode.equationEnv.equation;
    }
    else {
        // Create new document, since cleanSubtreeOfDocument requires
        // a document.
        var doc = document.implementation.createDocument(null, null, null);
        rootNode = doc.importNode(mode.equationEnv.equation, true);
        doc.appendChild(rootNode);
        mode.equationEnv.cleanSubtreeOfDocument(doc, rootNode);
    }
    if (argString.indexOf("pretty") != -1) {
        var xmlString = XML(serializer.serializeToString(rootNode)).toXMLString();
    }
    else {
        var xmlString = serializer.serializeToString(rootNode);
    }

    mode.equationEnv.notificationDisplay.textContent = xmlString;
    return true;
}

function editModeCommand_newEquation(mode) {
    mode.editor.newEquation(null);
    return true;
}

function editModeCommand_load(mode, argString) {
    mode.editor.loadURI(argString);
    return true;
}
function editModeCommand_loadById(mode, argString) {
    var inf = argString.match(/^(\S+)\s(.*)$/);
    if (!inf) { throw "Wrong argument format" }
    var uri = inf[1];
    var id = inf[2];
    mode.editor.loadURI(uri, id);
    return true;
}
function editModeCommand_loadByXPath(mode, argString) {
    var inf = argString.match(/^(\S+)\s(.*)$/);
    if (!inf) { throw "Wrong argument format" }
    var uri = inf[1];
    var xpathString = inf[2];
    mode.editor.loadURI(uri,null,xpathString);
    return true;
}
function editModeCommand_loadAll(mode, argString) {
    mode.editor.loadURI(argString,null,"//m:math");
    return true;
}

function editModeCommand_save(mode, argString) {
    mode.equationEnv.save(argString); // argString may be null
    return true;
}

function editModeCommand_saveAll(mode, argString) {
    mode.editor.equations.forEach(function (e) {
        e.save();
    });
    return true;
}

function editModeCommand_close(mode, argString, forceFlag) {
    mode.equationEnv.close(forceFlag);
    return true;
}

function editModeCommand_nextEquation(mode) {
    if (mode.editor.focus >= mode.editor.equations.length-1) { 
        mode.editor.moveFocusTo(0)
    }
    else {
        mode.editor.moveFocusTo(mode.editor.focus+1);
    }
    return true;
}

function editModeCommand_previousEquation(mode) {
    if (mode.editor.focus <= 0) { 
        mode.editor.moveFocusTo(mode.editor.equations.length-1);
    }
    else {
        mode.editor.moveFocusTo(mode.editor.focus-1);
    }
    return true;
}

function editModeCommand_help(mode, argString) {
    var args = argString.split(/\s+/);
    if (args[0] == "tutorial") {
        window.open("doc/tutorial.xhtml", "_blank");
    }
    else if (args[0] == "element") {
        if (args[1] == null) { args[1] = mode.cursor.localName }
        if (elementDescriptions[args[1]]) {
            window.open(elementDescriptions[args[1]].help, "_blank");
        }
        else {
            throw "No description found for element " + args[1];
        }
    }
    else {
        window.open("doc/index.xhtml", "_blank");
    }
    return true;
}

function editModeCommand_putAfter(mode,commandString,args) {
    var registerName = "";
    if (args != null) { registerName = args[0]; }
    var position = mml_nextSibling(mode.cursor);
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,mode.cursor.parentNode);
    mode.editor.registers[registerName].content.forEach(function (e) {
        mode.cursor.parentNode.insertBefore(e.cloneNode(true), position);
    });
    change.recordAfter(mode.equationEnv.equation,mode.cursor.parentNode);
    mode.equationEnv.history.reportChange(change);
    // Put cursor on the last inserted element
    mode.moveCursor(position ? mml_previousSibling(position) : mml_lastChild(mode.cursor.parentNode));
    return true;
}

function editModeCommand_putBefore(mode,commandString,args) {
    var registerName = "";
    if (args != null) { registerName = args[0]; }
    var position = mode.cursor;
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,mode.cursor.parentNode);
    mode.editor.registers[registerName].content.forEach(function (e) {
        mode.cursor.parentNode.insertBefore(e.cloneNode(true), position);
    });
    change.recordAfter(mode.equationEnv.equation,mode.cursor.parentNode);
    mode.equationEnv.history.reportChange(change);
    // Put cursor on the last inserted element
    mode.moveCursor(position ? mml_previousSibling(position) : mml_lastChild(mode.cursor.parentNode));
    return true;
}

function editModeCommand_putIn(mode,commandString,args) {
    // Put the content of a register into an _empty_ element
    var registerName = "";
    if (args != null) { registerName = args[0]; }
    var position = null;
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,mode.cursor);
    mode.editor.registers[registerName].content.forEach(function (e) {
        mode.cursor.insertBefore(e.cloneNode(true), position);
    });
    change.recordAfter(mode.equationEnv.equation,mode.cursor);
    mode.equationEnv.history.reportChange(change);
    // Put cursor on the last inserted element
    mode.moveCursor(mml_lastChild(mode.cursor));
    return true;
}

function editModeCommand_mrowEnvelop(mode,commandString,args,userSelection) {
    // Put an mrow element around the selection
    var change = mode.equationEnv.history.createChange();
    var parentNode = userSelection.startElement.parentNode;
    var positionInParentNode = userSelection.endElement.nextSibling;
    change.recordBefore(mode.equationEnv.equation,parentNode);

    var newMrow = document.createElementNS(NS_MathML, "mrow");
    
    // Fill the new mrow
    var pos = userSelection.startElement;
    while (pos != userSelection.endElement) {
        var nextPos = mml_nextSibling(pos);
        newMrow.appendChild(pos);
        pos = nextPos;
    }
    newMrow.appendChild(userSelection.endElement);

    // Put the mrow where it belongs
    parentNode.insertBefore(newMrow, positionInParentNode);

    change.recordAfter(mode.equationEnv.equation,parentNode);
    mode.equationEnv.history.reportChange(change);
    // Put cursor on the last inserted element
    mode.moveCursor(newMrow);
    return true;
}

function editModeCommand_copyToRegister(mode,commandString,args,userSelection) {
    var registerName = "";
    if (args != null) { registerName = args[0]; }
    var from = userSelection.startElement; // \ Those two must be siblings, in the right order!
    var to = userSelection.endElement;     // /
    var registerContent = [];
    mode.hideCursor();
    while (from != to) {
        registerContent.push(from.cloneNode(true));
        from = mml_nextSibling(from);
    }
    registerContent.push(to.cloneNode(true));
    mode.editor.registers[registerName] = new Register (registerName, registerContent);
    mode.showCursor();
    return true;
}

/* They all return null if there is no more node in this direction */

function mml_nextSibling(element) {
    while (element = element.nextSibling) {
        if (element.nodeType == Node.ELEMENT_NODE) {
            return element;
        }
    }
    return null;
}

function mml_previousSibling(element) {
    while (element = element.previousSibling) {
        if (element.nodeType == Node.ELEMENT_NODE) {
            return element;
        }
    }
    return null;
}

function mml_firstSibling(element) {
    var next;
    while (next = mml_previousSibling(element)) {
        element = next;
    }
    return element;
}

function mml_lastSibling(element) {
    var next;
    while (next = mml_nextSibling(element)) {
        element = next;
    }
    return element;
}

function mml_firstChild(element) {
    var candidates = element.childNodes;
    for (var i = 0; i < candidates.length; i++) {
        if (candidates[i].nodeType == Node.ELEMENT_NODE) {
            return candidates[i];
        }
    }
    return null;
}

function mml_lastChild(element) {
    var candidates = element.childNodes;
    for (var i = candidates.length-1; i >= 0; i--) {
        if (candidates[i].nodeType == Node.ELEMENT_NODE) {
            return candidates[i];
        }
    }
    return null;
}

function mml_parent(element) {
    // Important: We must not go above the formula
    if (element.localName != "math") { //XXX: Not perfect
        return element.parentNode;
    }
    return null;
}
