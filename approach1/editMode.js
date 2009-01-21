
function EditMode(editor, equationEnv) {
    this.name = "edit";
    this.editor = editor;
    this.equationEnv = equationEnv;
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
        var command = this.editor.inputBuffer;
        var commandArg = null;
        var singleCharacterArgs = [];
        if (command.charCodeAt(command.length-1) == KeyEvent.DOM_VK_ESCAPE) {
            // KeyEvent.DOM_VK_ESCAPE should be 0x1b
            //event.preventDefault();
            this.editor.inputBuffer = "";
            return;
        }
        while (command[0] == '"') {
            if (command.length < 2) { return } // Returns if the user has not yet entered the character
            singleCharacterArgs.push(command[1]);
            command = command.substring(2);
        }
        if (command[0] == ":") { // Treate this as a long command
            var inf = /(:\S*)(\s+(.*))?\n$/.exec(command);
            if (inf) {
                command = inf[1];
                commandArg = inf[3];
            }
            else {
                return
            }
        }
        commandObject = editModeCommands[command];
        if (commandObject) {
            if (commandObject.type == "long") {
                return commandObject.execute(this,commandArg)
                // TODO: clear buffer if it returns true?
            }
            else {
                return commandObject.execute(this,command,singleCharacterArgs,null)
                // TODO: clear buffer if it returns true?
                // (perhaps not, because there might be further
                // commands in the buffer.)
            }
        }
        else {
            throw "Command not found";
        }
    };
    this.calledModeReturned = function () {
        if (this.infoAboutCalledMode) {
            if (this.infoAboutCalledMode.change) {
                this.infoAboutCalledMode.change.recordAfter(this.equationEnv.equation,this.infoAboutCalledMode.changeElement);
                this.equationEnv.history.reportChange(this.infoAboutCalledMode.change);
            }
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

/* List of all commands */

editModeCommands = {
    "j": {
        type: "movement",
        execute: editModeCommand_moveDown
    },
    "J": {
        type: "movement",
        execute: editModeCommand_moveDownLast
    },
    "k": {
        type: "movement",
        execute: editModeCommand_moveUp
    },
    "h": {
        type: "movement",
        execute: editModeCommand_moveLeft
    },
    "l": {
        type: "movement",
        execute: editModeCommand_moveRight
    },
    "0": {
        type: "movement",
        execute: editModeCommand_moveToFirstSibling
    },
    "$": {
        type: "movement",
        execute: editModeCommand_moveToLastSibling
    },
    "x": {
        type: "operator",
        execute: editModeCommand_kill
    },
    "u": {
        type: "action",
        execute: editModeCommand_undo
    },
    "@": {
        type: "action",
        execute: editModeCommand_attributeMode
    },
    "i": {
        type: "action",
        execute: editModeCommand_insertBefore
    },
    "a": {
        type: "action",
        execute: editModeCommand_insertAfter
    },
    "I": {
        type: "action",
        execute: editModeCommand_insertAtBeginning
    },
    "A": {
        type: "action",
        execute: editModeCommand_insertAtEnd
    },
    "v": {
        type: "action",
        execute: editModeCommand_visualMode
    },
    "y": {
        type: "action",
        execute: editModeCommand_copyToRegister
    },
    "p": {
        type: "action",
        execute: editModeCommand_putAfter
    },
    ":set": {
        type: "long",
        execute: editModeCommand_set
    },
    ":serialize": {
        type: "long",
        execute: editModeCommand_serialize
    },
    ":new": {
        type: "long",
        execute: editModeCommand_newEquation
    },
    ":next": {
        type: "long",
        execute: editModeCommand_nextEquation
    },
    ":previous": {
        type: "long",
        execute: editModeCommand_previousEquation
    },
    ":load": {
        type: "long",
        execute: editModeCommand_load
    },
    ":loadid": {
        type: "long",
        execute: editModeCommand_loadById
    },
    ":loadxpath": {
        type: "long",
        execute: editModeCommand_loadByXPath
    },
    ":loadall": {
        type: "long",
        execute: editModeCommand_loadAll
    },
    ":save": {
        type: "long",
        execute: editModeCommand_save
    },
    ":close": {
        type: "long",
        execute: editModeCommand_close
    },
    ":help": {
        type: "long",
        execute: editModeCommand_help
    },
};
editModeCommands[KEYMOD_CONTROL + "r"] = {
        type: "action",
        execute: editModeCommand_redo
};
editModeCommands[KEYMOD_CONTROL + "l"] = {
        type: "action",
        execute: editModeCommand_redisplay
};

editModeOptions = { // Default values of options

}

function editModeCommand_moveLeft(mode) {
    var dest = mml_previousSibling(mode.cursor);
    if (dest) { mode.moveCursor(dest); }
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_moveRight(mode) {
    var dest = mml_nextSibling(mode.cursor);
    if (dest) { mode.moveCursor(dest); }
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_moveUp(mode) {
    var dest = mml_parent(mode.cursor);
    if (dest) { mode.moveCursor(dest); }
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_moveDown(mode) {
    var dest = mml_firstChild(mode.cursor);
    if (dest) { mode.moveCursor(dest); }
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_moveDownLast(mode) {
    // Moves to the last child
    var dest = mml_lastChild(mode.cursor);
    if (dest) { mode.moveCursor(dest); }
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_moveToFirstSibling(mode) {
    var dest = mml_firstSibling(mode.cursor);
    if (dest) { mode.moveCursor(dest); }
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_moveToLastSibling(mode) {
    var dest = mml_lastSibling(mode.cursor);
    if (dest) { mode.moveCursor(dest); }
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_undo(mode) {
    // The glorious undo
    mode.hideCursor();
    if (!mode.equationEnv.history.goBack(mode.equationEnv)) {
        throw "undo failed";
    }
    mode.editor.inputBuffer = "";
    mode.moveCursor(mode.cursor); // In order to update all views
    return true;
}

function editModeCommand_redo(mode) {
    // The inverse of the glorious undo
    mode.hideCursor();
    if (!mode.equationEnv.history.goForward(mode.equationEnv)) {
        throw "redo failed";
    }
    mode.editor.inputBuffer = "";
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
    mode.editor.inputBuffer = "";
    change.recordAfter(mode.equationEnv.equation,parentOfTarget);
    mode.moveCursor(mode.cursor); // In order to update all views
    mode.equationEnv.history.reportChange(change);
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
    mode.editor.inputBuffer = "";
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
    mode.editor.inputBuffer = "";
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
    mode.editor.inputBuffer = "";
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
    mode.editor.inputBuffer = "";
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
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_serialize(mode, argString) {
    var serializer = new XMLSerializer();
    var xmlString = serializer.serializeToString(mode.equationEnv.equation);
    //var xmlString = XML(serializer.serializeToString(mode.equationEnv.equation)).toXMLString();

    mode.equationEnv.notificationDisplay.textContent = xmlString;
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_newEquation(mode) {
    mode.editor.newEquation(null);
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_load(mode, argString) {
    mode.editor.loadURI(argString);
    mode.editor.inputBuffer = "";
    return true;
}
function editModeCommand_loadById(mode, argString) {
    var inf = argString.match(/^(\S+)\s(.*)$/);
    if (!inf) { throw "Wrong argument format" }
    var uri = inf[1];
    var id = inf[2];
    mode.editor.loadURI(uri, id);
    mode.editor.inputBuffer = "";
    return true;
}
function editModeCommand_loadByXPath(mode, argString) {
    var inf = argString.match(/^(\S+)\s(.*)$/);
    if (!inf) { throw "Wrong argument format" }
    var uri = inf[1];
    var xpathString = inf[2];
    mode.editor.loadURI(uri,null,xpathString);
    mode.editor.inputBuffer = "";
    return true;
}
function editModeCommand_loadAll(mode, argString) {
    mode.editor.loadURI(argString,null,"//m:math");
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_save(mode, argString) {
    mode.equationEnv.save(argString); // argString may be null
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_close(mode, argString) {
    mode.equationEnv.close();
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_nextEquation(mode) {
    if (mode.editor.focus >= mode.editor.equations.length-1) { 
        mode.editor.moveFocusTo(0)
    }
    else {
        mode.editor.moveFocusTo(mode.editor.focus+1);
    }
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_previousEquation(mode) {
    if (mode.editor.focus <= 0) { 
        mode.editor.moveFocusTo(mode.editor.equations.length-1);
    }
    else {
        mode.editor.moveFocusTo(mode.editor.focus-1);
    }
    mode.editor.inputBuffer = "";
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
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_putAfter(mode,commandString,args) {
    var registerName = "";
    if (args != null) { registerName = args[0]; }
    mode.cursor.parentNode.insertBefore(mode.editor.registers[registerName].content[0].cloneNode(true), mml_nextSibling(mode.cursor));
    mode.editor.inputBuffer = "";
    return true;
}

function editModeCommand_copyToRegister(mode,commandString,args) {
    var registerName = "";
    if (args != null) { registerName = args[0]; }
    mode.hideCursor();
    mode.editor.registers[registerName] = new Register (registerName, [mode.cursor.cloneNode(true)]);
    mode.showCursor();
    mode.editor.inputBuffer = "";
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
