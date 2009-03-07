/*
    This is an insert mode that queries the Unicode Character Database
    in order to decide whether a chracter is an identifier, an operator
    or a number. 

    See
    http://www.unicode.org/reports/tr31/
    http://www.unicode.org/reports/tr29/
*/

function ucdInsertMode(editor, equationEnv, inElement, beforeElement) {
    // This insert mode inserts children into inElement, before the
    // silbing beforeElement. If beforeElement is null, it adds
    // children to the end of the inElement.
    this.name = "insert (UCD)";
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
        // Handle input as command if CTRL is pressed, otherwise
        // handle it as indicated by the UCD
        if (this.editor.inputBuffer[0] == KEYMOD_CONTROL || this.editor.inputBuffer[0] == String.fromCharCode(0x1b)) {
            command = this.editor.inputBuffer;
            commandObject = ucdInsertModeCommands[command[0]];
            if (commandObject) {
                return commandObject.execute(this,command[0]);
            }
            else {
                // Command not found;
                return false;
            } 
        }
        else {
            // Fetch next character, be careful if it is from a higher
            // plane, i.e. if the character is a high surrogate. 
            // (Remember the high one comes first, so a
            // low surrogate is hopefully not to be expected.)
            var c = this.editor.inputBuffer[0];
            this.editor.eatInput(1);
            if (0xD800 <= c && c <= 0xDBFF) {
                c += this.editor.inputBuffer[0];
                this.editor.eatInput(1);
            }

            // Find out wether we have to treat this character as
            // identifier, operator or number.
            if (ucd.isOperator(c)) {
                this.putElement(null, "mo", document.createTextNode(c));
            }
            else if (ucd.isDigit(c)) {

            }
            else { // Identifier
                this.putElement(null, "mi", document.createTextNode(c));
            }
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
        if (this.cursor.numberOfElementsToSurround) {
            var description = elementDescriptions[newElement.localName];
            if (description.type=="mrow" || description.type=="inferred_mrow" || this.cursor.numberOfElementsToSurround==1) {
                // clean out children of the new element that are marked as missing.
                // But clean at most as many elements as are selected
                for (var i=0; 
                    i<this.cursor.numberOfElementsToSurround 
                    && mml_firstChild(newElement)
                    && mml_firstChild(newElement).getAttributeNS(NS_internal, "missing");
                    ++i) {
                    newElement.removeChild(mml_firstChild(newElement)) 
                }
                // Put selected elements into the new one
                for (var i=0; i<this.cursor.numberOfElementsToSurround; ++i) {
                    newElement.insertBefore(
                        mml_previousSibling(newElement),
                        newElement.firstChild
                    );
                }
            }
            else if (description.type=="fixedChildren" || description.type=="childList") {
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
            else {
                // Do not handle surrounding for this element
            }
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



function ucdInsertModeCommand_exit(mode,command) {
    mode.finish();
    mode.editor.eatInput(command.length);
    return true;
}



