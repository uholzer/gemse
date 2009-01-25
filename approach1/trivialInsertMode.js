
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
    this.cursorStack = [{
        inElement: this.cursor.inElement,
        beforeElement: this.cursor.beforeElement
    }];
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
            mml_lastChild(this.cursor.inElement).removeAttributeNS(NS_internal,"selected");
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
            mml_lastChild(this.cursor.inElement).setAttributeNS(NS_internal,"selected","insertCursorAfter");
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
    this.putElement = function() {
        // Puts an element where the cursor is located. If an element
        // follows which is marked with the missing attribute, it gets
        // deleted

        // First delete a possibly present element with attribute
        // missing
        if (this.cursor.beforeElement && this.cursor.beforeElement.getAttributeNS(NS_internal, "missing")) {
            var elementToBeDeleted = this.cursor.beforeElement;
            this.moveCursor({ 
                beforeElement: mml_nextSibling(elementToBeDeleted), 
                inElement: this.cursor.inElement 
            });
            elementToBeDeleted.parentNode.removeChild(elementToBeDeleted);
        }
 
        // Add new element
        var newElement;
        if (arguments.length > 1) {
            var ns = arguments[0];
            var name = arguments[1];
            if (ns==null) { ns = NS_MathML }
            // Hide cursor
            this.hideCursor();
            // Create the new element
            newElement = document.createElementNS(ns, name);
            for (var i = 2; i < arguments.length; ++i) {
                newElement.appendChild(arguments[i]);
            }
        }
        else {
            var newElement = arguments[0];
            this.hideCursor();
        }
        // Put element into the equation
        this.cursor.inElement.insertBefore(newElement, this.cursor.beforeElement);
        // Position the cursor
        if (mml_firstChild(newElement) && mml_firstChild(newElement).getAttributeNS(NS_internal, "missing")) {
            // If the element contains a "missing element" marker, put the 
            // cursor before it. But we must put a cursor behind the new
            // element on the stack.
            // XXX: Instead of looking for "missing element" marker elements,
            // we perhaps should look at the element description?
            this.cursorStack.push({
                beforeElement: this.cursor.beforeElement,
                inElement: this.cursor.inElement
            })
            this.moveCursor({
                beforeElement: mml_firstChild(newElement),
                inElement: newElement
            });
        }
        else {
            // Otherwise put it behind it (that's where it is already)
            this.moveCursor(this.cursor);
        }
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
    " ": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"mrow") }
    },
    "/": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"mfrac") }
    },
    "e": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"menclose") }
    },
    "R": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"msqrt") }
    },
    "r": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"mroot") }
    },
    "f": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"mfenced") }
    },
    "^": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"msup") }
    },
    "_": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"msub") }
    },
    "=": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"msubsup") }
    },
    "u": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"munder") }
    },
    "v": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"mover") }
    },
    "U": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"munderover") }
    },
    "\n": {
        execute: trivialInsertModeCommand_cursorJump
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
    var c = mode.editor.inputBuffer;
    var res = /^.([+-]?[0-9.]+)( ?([\S\s]*))$/.exec(c);
        //                         ^^^^^^ capture all characters, including \n
        //                               ^ This one is needed so res[3]
        //                                 contains the whole next command string
    if (res && res[2]) { 
        mode.putElement(
            null, 
            "mn",
            document.createTextNode(
                res[1]
            )
        );
        mode.editor.inputBuffer = res[3]; // thats why the + in the regex is needed
        return true;
    }
    else {
        return false;
    }
}

function trivialInsertModeCommand_mnLong(mode) {
    // Inserts an mn element containing anything
    trivialInsertModeCommandTool_elementWithLongText(mode,"mn");
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

function trivialInsertModeCommand_insertDescribedElement(mode, elementName) {
    // Inserts an mtext element
    var description = elementDescriptions[elementName];
    var placeholder = document.createElementNS(NS_MathML, "mi");
    placeholder.setAttributeNS(NS_internal, "missing", "1")
    placeholder.appendChild(document.createTextNode("□"));
    var newElement = document.createElementNS(description.namespace, description.name);
    if (description.type == "fixedChildren") {
        for (var i=0; i<description.childCount; ++i) {
            newElement.appendChild(placeholder.cloneNode(true));
        }
    }
    else if (description.type == "inferred_mrow") {
        newElement.appendChild(placeholder.cloneNode(true));
    }
    else if (description.type == "childList") {
        newElement.appendChild(placeholder.cloneNode(true));
    }
    else if (description.type == "mrow") {
        newElement.appendChild(placeholder.cloneNode(true));
    }
    else {
        throw description.type + " not yet supported by inserDescribedElement";
    }
    mode.putElement(newElement);
    mode.editor.inputBuffer = "";
    return true;
}

function trivialInsertModeCommand_cursorJump(mode) {
    if (mode.cursorStack.length<1) { 
        // If the stack is empty, the user is done with inserting, so exit
        return trivialInsertModeCommand_exit(mode);
    }
    mode.moveCursor(mode.cursorStack.pop());
    mode.editor.inputBuffer = "";
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
    if (mode.editor.inputBuffer[mode.editor.inputBuffer.length-1] != "\n") { return false } mode.putElement(
        null, 
        elementName,
        document.createTextNode(
            mode.editor.inputBuffer.substring(1,mode.editor.inputBuffer.length-1)
        )
    );
    mode.editor.inputBuffer = "";
    return true;
}


