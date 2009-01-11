
function trivialInsertMode(editor, equationEnv, inElement, beforeElement) {
    // This insert mode inserts children into inElement, before the
    // silbing beforeElement. If beforeElement is null, it adds
    // children to the end of the inElement.
    this.name = "insert (trivial)";
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.cursor = {
        inElement: inElement,
        beforeElement: beforeElement
    };
    this.init = function() {
        this.moveCursor(this.cursor);
    }
    this.finish = function() {
        // TODO: Clean up attribute mess
        this.hideCursor();
        this.equationEnv.finishMode();
    }
    this.hideCursor = function() {
        this.cursor.inElement.removeAttributeNS(NS_internal,"selected");
        if (this.cursor.beforeElement) {
            this.cursor.beforeElement.removeAttributeNS(NS_internal,"selected");
            if (mml_previousSibling(this.cursor.beforeElement)) {
                mml_previousSibling(this.cursor.beforeElement).removeAttributeNS(NS_internal,"selected");
            }
        }
        else if (mml_lastChild(this.cursor.inElement)) {
            mml_lastChild(this.cursor.inElement).removeAttribute(NS_internal,"selected");
        }
    }
    this.showCursor = function() {
        this.cursor.inElement.setAttributeNS(NS_internal,"selected","insertCursorIn");
        if (this.cursor.beforeElement) {
            this.cursor.beforeElement.setAttributeNS(NS_internal,"selected","insertCursorBefore");
            if (mml_previousSibling(this.cursor.beforeElement)) {
                mml_previousSibling(this.cursor.beforeElement).setAttributeNS(NS_internal,"selected","insertCursorAfter");
            }
        }
        else if (mml_lastChild(this.cursor.inElement)) {
            mml_lastChild(this.cursor.inElement).setAttribute(NS_internal,"selected","insertCursorAfter");
        }
    }
    this.moveCursor = function(newCursor) {
        this.hideCursor();
        this.cursor = newCursor;
        this.showCursor()
        this.equationEnv.updateViews();
    }
    this.__defineGetter__("contextNode", function() { /*TODO*/ }); // TODO
    this.keyHandler = function(event) { standardKeyHandler(event,this.editor) }
    this.inputHandler = function() {
        command = this.editor.inputBuffer;
        if (command.length > 1 && command.charCodeAt(command.length-1) == KeyEvent.DOM_VK_ESCAPE) {
            // KeyEvent.DOM_VK_ESCAPE should be 0x1b
            //event.preventDefault();
            this.editor.inputBuffer = "";
            return;
        }
        commandObject = trivialInsertModeCommands[command[0]];
        if (commandObject) {
            commandObject.execute(this,command[0])
        }
        else {
            throw "Command not found";
        }
    };
    this.putElement = function(ns, name) {
        if (ns==null) { ns = NS_MathML }
        // Hide cursor
        this.hideCursor();
        // Create the new element
        newElement = document.createElementNS(ns, name);
        for (var i = 2; i < arguments.length; ++i) {
            newElement.appendChild(arguments[i]);
        }
        // Put element into the equation
        this.cursor.inElement.insertBefore(newElement, this.cursor.beforeElement);
        // Position the cursor
        // TODO: Where? I guess where it already is
        this.moveCursor(this.cursor);
    }
}

trivialInsertModeCommands = {
    "i": {
        execute: trivialInsertModeCommand_miSingle
    },
    "I": {
        execute: trivialInsertModeCommand_miLong
    },
    "n": {
        execute: trivialInsertModeCommand_mnNormal
    },
    "N": {
        execute: trivialInsertModeCommand_mnLong
    },
    "o": {
        execute: trivialInsertModeCommand_moNormal
    },
    "O": {
        execute: trivialInsertModeCommand_moLong
    },
    "t": {
        execute: trivialInsertModeCommand_mtext
    },
}
trivialInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    execute: trivialInsertModeCommand_exit
}

function trivialInsertModeCommand_miSingle(mode) {
    // Inserts an mi element with a single character as content
    trivialInsertModeCommandTool_elementWithSingleCharacter(mode,"mi");
}

function trivialInsertModeCommand_miLong(mode) {
    // Inserts an mi element with several characters as content
    trivialInsertModeCommandTool_elementWithLongText(mode,"mi");
}

function trivialInsertModeCommand_mnNormal(mode) {
    // Inserts a mn element, containg a number of the form /^[+-]?[0-9.]+$/
    throw "Not yet implemented";
}

function trivialInsertModeCommand_mnLong(mode) {
    // Inserts an mn element containing anything
    trivialInsertModeCommandTool_elementWithLongText(mode,"mi");
}

function trivialInsertModeCommand_moNormal(mode) {
    // Inserts an mo element with a single character as content
    trivialInsertModeCommandTool_elementWithSingleCharacter(mode,"mo");
}

function trivialInsertModeCommand_moLong(mode) {
    // Inserts an mi element with several characters as content
    trivialInsertModeCommandTool_elementWithLongText(mode,"mi");
}

function trivialInsertModeCommand_mtext(mode) {
    // Inserts an mtext element
    trivialInsertModeCommandTool_elementWithLongText(mode,"mtext");
}

function trivialInsertModeCommand_exit(mode) {
    mode.editor.inputBuffer = "";
    mode.finish();
}


function trivialInsertModeCommandTool_elementWithSingleCharacter(mode,elementName) {
    if (mode.editor.inputBuffer.length < 2) { return false }
    mode.putElement(null, elementName, document.createTextNode(mode.editor.inputBuffer[1]));
    mode.editor.inputBuffer = "";
    return true;
}

function trivialInsertModeCommandTool_elementWithLongText(mode,elementName) {
    if (mode.editor.inputBuffer[mode.editor.inputBuffer.length-1] != "\n") { return false }
    mode.putElement(
        null, 
        elementName,
        document.createTextNode(
            mode.editor.inputBuffer.substring(1,mode.editor.inputBuffer.length-1)
        )
    );
}

