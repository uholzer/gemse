
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
    this.cursorStack = [];
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
    this.inputHandler = function() {
        command = this.editor.inputBuffer;
        commandObject = trivialInsertModeCommands[command[0]];
        if (commandObject) {
            return commandObject.execute(this,command[0]);
        }
        else {
            // Command not found;
            return false;
        }
    };
    this.getNewPlaceholderElement = function() {
        var placeholder = document.createElementNS(NS_MathML, "mi");
        placeholder.setAttributeNS(NS_internal, "missing", "1")
        placeholder.appendChild(document.createTextNode("□"));
        return placeholder;
    }
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



function trivialInsertModeCommand_miSingle(mode,command) {
    // Inserts an mi element with a single character as content
    return trivialInsertModeCommandTool_elementWithSingleCharacter(mode,command,"mi");
}

function trivialInsertModeCommand_miLong(mode,command) {
    // Inserts an mi element with several characters as content
    return trivialInsertModeCommandTool_elementWithLongText(mode,command,"mi");
}

function trivialInsertModeCommand_mnNormal(mode,command) {
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

function trivialInsertModeCommand_mnLong(mode,command) {
    // Inserts an mn element containing anything
    return trivialInsertModeCommandTool_elementWithLongText(mode,command,"mn");
}

function trivialInsertModeCommand_moNormal(mode,command) {
    // Inserts an mo element with a single character as content
    return trivialInsertModeCommandTool_elementWithSingleCharacter(mode,command,"mo");
}

function trivialInsertModeCommand_moLong(mode,command) {
    // Inserts an mi element with several characters as content
    return trivialInsertModeCommandTool_elementWithLongText(mode,command,"mi");
}

function trivialInsertModeCommand_mtext(mode,command) {
    // Inserts an mtext element
    return trivialInsertModeCommandTool_elementWithLongText(mode,command,"mtext");
}

function trivialInsertModeCommand_table(mode,command) {
    // Inserts an mtr element if the parent is an mtable element, an
    // mtd element if the parent is an mtr element and otherwise an
    // mtable element.
    if (mode.cursor.inElement.localName=="mtable") {
        //insert an mtr
        mode.putElement(null, "mtr", mode.getNewPlaceholderElement());
    }
    else if (mode.cursor.inElement.localName=="mtr") {
        //insert an mtd
        mode.putElement(null, "mtd", mode.getNewPlaceholderElement());
    }
    else {
        //insert an mtable
        mode.putElement(null, "mtable", mode.getNewPlaceholderElement());
    }
    mode.editor.inputBuffer = mode.editor.inputBuffer.slice(command.length);
    return true;
}

function trivialInsertModeCommand_insertDescribedElement(mode, command, elementName) {
    // Inserts an mtext element
    var description = elementDescriptions[elementName];
    var placeholder = mode.getNewPlaceholderElement();
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
    else if (description.type == "empty") {
        // Let it empty. This also causes mode.putElement to position
        // the cursor behind the new element
    }
    else if (description.type == "mrow") {
        newElement.appendChild(placeholder.cloneNode(true));
    }
    else {
        throw description.type + " not yet supported by insertDescribedElement";
    }
    mode.putElement(newElement);
    mode.editor.inputBuffer = mode.editor.inputBuffer.slice(command.length);
    return true;
}

function trivialInsertModeCommand_cursorJump(mode,command) {
    if (mode.cursorStack.length<1) { 
        // If the stack is empty, the user is done with inserting, so exit
        return trivialInsertModeCommand_exit(mode);
    }
    mode.moveCursor(mode.cursorStack.pop());
    mode.editor.inputBuffer = mode.editor.inputBuffer.slice(command.length);
    return true;
}

function trivialInsertModeCommand_exit(mode,command) {
    mode.finish();
    mode.editor.inputBuffer = mode.editor.inputBuffer.slice(command.length);
    return true;
}

function trivialInsertModeCommandTool_elementWithSingleCharacter(mode,command,elementName) {
    if (mode.editor.inputBuffer.length < 2) { return false }
    mode.putElement(null, elementName, document.createTextNode(mode.editor.inputBuffer[1]));
    mode.editor.inputBuffer = mode.editor.inputBuffer.slice(command.length+1);
    return true;
}

function trivialInsertModeCommandTool_elementWithLongText(mode,command,elementName) {
    var endOfText = mode.editor.inputBuffer.indexOf("\n");
    if (mode.editor.inputBuffer[mode.editor.inputBuffer.length-1] != "\n") { return false } 
    mode.putElement(
        null, 
        elementName,
        document.createTextNode(
            mode.editor.inputBuffer.substring(1,mode.editor.inputBuffer.length-1)
        )
    );
    mode.editor.inputBuffer = mode.editor.inputBuffer.slice(endOfText+1);
    return true;
}


