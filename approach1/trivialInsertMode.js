
function AttributeMode(editor, equationEnv, inElement, beforeElement) {
    // This insert mode inserts children into inElement, before the
    // silbing beforeElement. If beforeElement is null, it adds
    // children to the end of the inElement.
    this.name = "insert (trivial)";
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.element = element;
    this.cursor = {
        inElement: inElement,
        beforeElement: beforeElement
    };
    this.init = function() {

    }
    this.finish = function() {
        // TODO: Clean up attribute mess
        this.equationEnv.finishMode();
    }
    this.hideCursor = function() {
        this.cursor.inElement.removeAttributeNS(NS_internal,"selected");
        if (this.cursor.beforeElement) {
            this.cursor.beforeElement.removeAttributeNS(NS_internal,"selected");
            if (this.cursor.beforeElement.previousSibling) {
                this.cursor.beforeElement.previousSibling.removeAttributeNS(NS_internal,"selected");
            }
        }
        else if (this.cursor.inElement.lastChild) {
            this.cursor.inElement.lastChild.removeAttribute(NS_internal,"selected");
        }
    }
    this.showCursor = function() {
        this.cursor.inElement.addAttributeNS(NS_internal,"selected","insertCursorIn");
        if (this.cursor.beforeElement) {
            this.cursor.beforeElement.addAttributeNS(NS_internal,"selected","insertCursorBefore");
            if (this.cursor.beforeElement.previousSibling) {
                this.cursor.beforeElement.previousSibling.addAttributeNS(NS_internal,"selected","insertCursorAfter");
            }
        }
        else if (this.cursor.inElement.lastChild) {
            this.cursor.inElement.lastChild.addAttribute(NS_internal,"selected","insertCursorAfter");
        }
    }
    this.moveCursor = function(newCursor) {
        this.hideCursor();
        this.cursor = newCursor; // TODO
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
        commandObject = attributeModeCommands[command[1]];
        if (commandObject) {
            commandObject.execute(this,command[1])
        }
        else {
            throw "Command not found";
        }
    };
    this.putElement(ns, name) {
        if (ns) { throw "putElement does not yet support namespaces" }
        // Create the new element
        newElement = document.createElement(name);
        for (var i = 2; i < arguments.length; ++i) {
            newElement.appendChild(arguments[i]);
        }
        // Put element into the equation
        this.cursor.inElement.insertBefore(newElement, this.cursor.beforeElement);
        // Position the cursor
        // TODO: Where?
    }
}

trivialInsertModeCommands = {
    "i": {
        execute: trivialInsertModeCommand_miSingle
    }
    "I": {
        execute: trivialInsertModeCommand_miLong
    }
    "n": {
        execute: trivialInsertModeCommand_mnNormal
    }
    "N": {
        execute: trivialInsertModeCommand_mnLong
    }
    "o": {
        execute: trivialInsertModeCommand_moNormal
    }
    "O": {
        execute: trivialInsertModeCommand_moLong
    }
    "t": {
        execute: trivialInsertModeCommand_mtext
    }
}

function trivialInsertModeCommand_miSingle(mode) {
    // Inserts an mi element with a single character as content
}

function trivialInsertModeCommand_miLong(mode) {
    // Inserts an mi element with several characters as content
}

function trivialInsertModeCommand_mnNormal(mode) {
    // Inserts a mn element, containg a number of the form /^[+-]?[0-9.]+$/
}

function trivialInsertModeCommand_mnLong(mode) {
    // Inserts an mn element containing anything
}

function trivialInsertModeCommand_moNormal(mode) {
    // Inserts an mo element with a single character as content
}

function trivialInsertModeCommand_moLong(mode) {
    // Inserts an mi element with several characters as content
}

function trivialInsertModeCommand_mtext(mode) {
    // Inserts an mtext element
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

