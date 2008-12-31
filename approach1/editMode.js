
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
    this.keyHandler = function(event) {
        if (event.altKey)  { this.editor.inputBuffer += KEYMOD_ALT }
        if (event.ctrlKey) { this.editor.inputBuffer += KEYMOD_CONTROL }
        //if (event.metaKey) { this.editor.inputBuffer += KEYMOD_META }
        editor.inputBuffer += String.fromCharCode(event.charCode || event.keyCode);
            // event.which does not seem to work, it returns 0 for the escape Key
        //if (event.keyCode) { event.preventDefault(); }
        event.preventDefault();
        event.stopPropagation();
        this.editor.inputEvent();
    }
    this.inputHandler = function() {
        command = editor.inputBuffer;
        if (command.charCodeAt(command.length-1) == KeyEvent.DOM_VK_ESCAPE) {
            // KeyEvent.DOM_VK_ESCAPE should be 0x1b
            //event.preventDefault();
            this.editor.inputBuffer = "";
            return;
        }
        commandObject = editModeCommands[command];
        if (commandObject) {
            commandObject.execute(this)
        }
        else {
            throw "Command not found";
        }
    };
    this.calledModeReturned = function () {
        this.infoAboutCalledMode.change.recordAfter(this.equationEnv.equation,this.infoAboutCalledMode.changeElement);
        this.equationEnv.history.reportChange(this.infoAboutCalledMode.change);
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
        if (!this.cursor) { this.cursor = this.equationEnd.equation }
    }
}

/* List of all commands */

editModeCommands = {
    "j": {
        type: "movement",
        execute: editModeCommand_moveDown
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
    ":set": {
        type: "long",
        execute: editModeCommand_set
    }
};
editModeCommands[KEYMOD_CONTROL + "r"] = {
        type: "action",
        execute: editModeCommand_redo
};

editModeOptions = { // Default values of options

}

function editModeCommand_moveLeft(mode) {
    var dest = mml_previousSibling(mode.cursor);
    if (dest) { mode.moveCursor(dest); }
    mode.editor.inputBuffer = "";
}

function editModeCommand_moveRight(mode) {
    var dest = mml_nextSibling(mode.cursor);
    if (dest) { mode.moveCursor(dest); }
    mode.editor.inputBuffer = "";
}

function editModeCommand_moveUp(mode) {
    var dest = mml_parent(mode.cursor);
    if (dest) { mode.moveCursor(dest); }
    mode.editor.inputBuffer = "";
}

function editModeCommand_moveDown(mode) {
    var dest = mml_firstChild(mode.cursor);
    if (dest) { mode.moveCursor(dest); }
    mode.editor.inputBuffer = "";
}

function editModeCommand_undo(mode) {
    // The glorious undo
    if (!mode.equationEnv.history.goBack(mode.equationEnv)) {
        throw "undo failed";
    }
    mode.editor.inputBuffer = "";
    mode.moveCursor(mode.cursor); // In order to update all views
}

function editModeCommand_redo(mode) {
    // The inverse of the glorious undo
    if (!mode.equationEnv.history.goForward(mode.equationEnv)) {
        throw "redo failed";
    }
    mode.editor.inputBuffer = "";
    mode.moveCursor(mode.cursor); // In order to update all views
}

function editModeCommand_kill(mode) {
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,mode.cursor.parentNode);
    var target = mode.cursor;
    mode.moveCursor(mode.cursor.parentNode);
    target.parentNode.removeChild(target);
    mode.editor.inputBuffer = "";
    change.recordAfter(mode.equationEnv.equation,mode.cursor);
    mode.moveCursor(mode.cursor); // In order to update all views
    mode.equationEnv.history.reportChange(change);
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
}

function editModeCommand_set(mode, argString) {

}

/* Child, Parent, Forward, Backward movements */

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
