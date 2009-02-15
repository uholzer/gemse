
function trivialInsertMode(editor, equationEnv, inElement, beforeElement) {
    // This insert mode inserts children into inElement, before the
    // silbing beforeElement. If beforeElement is null, it adds
    // children to the end of the inElement.
    this.name = "insert (trivial)";
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.cursor = {
        inElement: inElement,
        beforeElement: beforeElement,
        numberOfElementsToSurround: 0
    };
    this.cursorStack = [];
    this.init = function() {
        this.moveCursor(this.cursor);
    }
    this.finish = function() {
        // TODO: Clean up attribute mess
        this.hideCursor();
        var newEditCursor;
        if (this.cursor.beforeElement && mml_previousSibling(this.cursor.beforeElement)) {
            newEditCursor = mml_previousSibling(this.cursor.beforeElement);
        }
        else if (this.cursor.beforeElement) {
            newEditCursor = this.cursor.beforeElement;
        }
        else if (mml_lastChild(this.cursor.inElement)) {
            newEditCursor = mml_lastChild(this.cursor.inElement);
        }
        else {
            newEditCursor = this.cursor.inElement;
        }
        this.equationEnv.finishMode({ 
            newCursor: newEditCursor
        });
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
        // remove selected="userSelection" attributes on preceding siblings
        var sibling;
        if (this.cursor.beforeElement) { 
            sibling = mml_previousSibling(this.cursor.beforeElement);
        }
        else {
            sibling = mml_lastChild(this.cursor.inElement);
        }
        while (sibling) {
            sibling.removeAttributeNS(NS_internal,"selected");
            sibling = mml_previousSibling(sibling);
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
        // Put selected="userSelection" for sorrounded elements
        var sibling;
        if (this.cursor.beforeElement) { 
            sibling = mml_previousSibling(this.cursor.beforeElement);
        }
        else {
            sibling = mml_lastChild(this.cursor.inElement);
        }
        for (var i=0; i < this.cursor.numberOfElementsToSurround; ++i, sibling=mml_previousSibling(sibling)) {
            sibling.setAttributeNS(NS_internal,"selected","userSelection");
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
        // Handle surrounding
        var description = elementDescriptions[newElement.localName];
        if (description.type=="fixedChildren" || description.type=="childList") {
            var surroundingMrow = document.createElementNS(NS_MathML,"mrow");
            for (var i=0; i<this.cursor.numberOfElementsToSurround; ++i) {
                surroundingMrow.insertBefore(
                    mml_previousSibling(newElement),
                    surroundingMrow.firstChild
                );
            }
            newElement.removeChild(mml_firstChild(newElement));
            newElement.insertBefore(surroundingMrow,newElement.firstChild);
        }
        else if (description.type=="mrow" || description.type=="inferred_mrow") {
            while (mml_firstChild(newElement) && mml_firstChild(newElement).getAttributeNS(NS_internal, "missing")) {
                newElement.removeChild(mml_firstChild(newElement));
            }
            for (var i=0; i<this.cursor.numberOfElementsToSurround; ++i) {
                newElement.insertBefore(
                    mml_previousSibling(newElement),
                    newElement.firstChild
                );
            }
        }
        else {
            // Do not handle surrounding for this element
        }
        // Position the cursor
        var firstMissing = mml_firstChild(newElement);
        while (firstMissing && !firstMissing.getAttributeNS(NS_internal, "missing")) {
            firstMissing = mml_nextSibling(firstMissing);
        }
        if (firstMissing) {
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
                beforeElement: firstMissing,
                inElement: newElement
            });
        }
        else {
            // Otherwise put it behind it (that's where it is already)
            this.moveCursor({
                beforeElement: this.cursor.beforeElement,
                inElement: this.cursor.inElement
            });
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
        mode.editor.eatInput(mode.editor.inputBuffer.length - res[3].length); // thats why the + in the regex is needed
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
    else if (mode.cursor.inElement.localName=="mtr"||mode.cursor.inElement.localName=="mlabeledtr") {
        //insert an mtd
        mode.putElement(null, "mtd", mode.getNewPlaceholderElement());
    }
    else {
        //insert an mtable
        mode.putElement(null, "mtable", mode.getNewPlaceholderElement());
    }
    mode.editor.eatInput(command.length);
    return true;
}

function trivialInsertModeCommand_mlabeledtr(mode,command) {
    mode.putElement(null, "mlabeledtr", mode.getNewPlaceholderElement());
    mode.editor.eatInput(command.length);
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
    mode.editor.eatInput(command.length);
    return true;
}

function trivialInsertModeCommand_cursorJump(mode,command) {
    if (mode.cursorStack.length<1) { 
        // If the stack is empty, the user is done with inserting, so exit
        return trivialInsertModeCommand_exit(mode,command);
    }
    mode.moveCursor(mode.cursorStack.pop());
    mode.editor.eatInput(command.length);
    return true;
}

function trivialInsertModeCommand_oneMoreToSurround(mode,command) {
    // TODO: Count preceding siblings and prevent to select too many
        mode.moveCursor({ 
            beforeElement: mode.cursor.beforeElement,
            inElement: mode.cursor.inElement,
            numberOfElementsToSurround: (mode.cursor.numberOfElementsToSurround||0) + 1
        });
    mode.editor.eatInput(command.length);
    return true;
}

function trivialInsertModeCommand_oneLessToSurround(mode,command) {
    if (mode.cursor.numberOfElementsToSurround > 0) {
        mode.moveCursor({ 
            beforeElement: mode.cursor.beforeElement,
            inElement: mode.cursor.inElement,
            numberOfElementsToSurround: (mode.cursor.numberOfElementsToSurround||0) - 1
        });
    }
    mode.editor.eatInput(command.length);
    return true;
}

function trivialInsertModeCommand_exit(mode,command) {
    mode.finish();
    mode.editor.eatInput(command.length);
    return true;
}

function trivialInsertModeCommandTool_elementWithSingleCharacter(mode,command,elementName) {
    if (mode.editor.inputBuffer.length < 2) { return false }
    mode.putElement(null, elementName, document.createTextNode(mode.editor.inputBuffer[1]));
    mode.editor.eatInput(command.length+1);
    return true;
}

function trivialInsertModeCommandTool_elementWithLongText(mode,command,elementName) {
    var endOfText = mode.editor.inputBuffer.indexOf("\n");
    if (endOfText==-1) { return false } 
    mode.putElement(
        null, 
        elementName,
        document.createTextNode(
            mode.editor.inputBuffer.substring(1,mode.editor.inputBuffer.length-1)
        )
    );
    mode.editor.eatInput(endOfText+1);
    return true;
}



