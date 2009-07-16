/*
    This is an insert mode tailored to Content MathML
*/

function ContentInsertMode(editor, equationEnv, inElement, beforeElement) {
    // This insert mode inserts children into inElement, before the
    // silbing beforeElement. If beforeElement is null, it adds
    // children to the end of the inElement.
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.cursor = {
        inElement: inElement,
        beforeElement: beforeElement,
        numberOfElementsToSurround: 0
    };
    this.cursorStack = [];
    this.commandHandler = new CommandHandler(this,ucdInsertModeCommandOptions,ucdInsertModeCommands);
    /** Set to true if the next character must not be added to the
     * content of the preceding element. This is useful if the user
     * wants to insert two mn elements behind each other.
     */
    this.forceNewElement = false;
}
ContentInsertMode.prototype = {
    name: "insert (UCD)",
    init: function() {
        this.moveCursor(this.cursor);
    },
    finish: function() {
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
    },
    hideCursor: function() {
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
    },
    showCursor: function() {
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
    },
    moveCursor: function(newCursor) {
        this.hideCursor();
        this.cursor = newCursor;
        this.showCursor()
        this.equationEnv.updateViews();
    },
    get contextNode() { return null }, // TODO
    inputHandler: function() {
        var instance = this.commandHandler.parse();
        if (instance.isReadyToExecute) {
            instance.execute();
            // Do not do
            //   this.forceNewElement = false;
            // here, since otherwise the user can not set it to true
            return true;
        }
        else if (instance.notFound) {
            // The input buffer does not begin with a command, so look
            // into the UCD to decide what to do.

            // Fetch next character, be careful if it is from a higher
            // plane, i.e. if the character is a high surrogate.
            // uCharAt and eatInput handle a surrogate pair as one
            // character.
            var c = this.editor.inputBuffer.uCharAt(0);
            this.editor.eatInput(1);

            // Find out wether we have to treat this character as
            // ci or as cn
            if (ucd.isDigit(c)) {
                // We assume that it does not happen that the user
                // wants to have two consecutive mn elements. This is
                // not good, since for example in a subsup element,
                // both children can be mn.
                var precedingElement = this.cursor.beforeElement ? mml_previousSibling(this.cursor.beforeElement) : mml_lastChild(this.cursor.inElement);
                if (precedingElement && precedingElement.namespaceURI == NS_MathML && precedingElement.localName == "cn" && !this.forceNewElement) {
                    precedingElement.lastChild.nodeValue += c; //XXX: Is that good in case of entities or similar?
                    this.equationEnv.updateViews();
                }
                else {
                    this.putElement(null, "cn", document.createTextNode(c));
                }
            }
            else if (ucd.isIdentifier(c)) { // Identifier
                this.putElement(null, "ci", document.createTextNode(c));
            }
            else {
                throw "I don't know what to do with " + c + ", it seems not to be a digit or an identifier.";
            }

            this.forceNewElement = false;
            return true;
        }
        else {
            return false;
        }
    },
    getNewPlaceholderElement: function() {
        var placeholder = document.createElementNS(NS_MathML, "mi");
        placeholder.setAttributeNS(NS_internal, "missing", "1")
        placeholder.appendChild(document.createTextNode("□"));
        return placeholder;
    },
    putElement: function() {
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
    },
    insertElement: function(element) {

    },
    insertElementRecursive: function(element) {

    },
}

function ContentInsertModeCommand_symbol(mode, instance, cd, name, pragmatic) {
    // If cd is given, don't look for cd argument in the instance, if name is given as well,
    // don't look for name argument either.
    // Should pragmatic be given, and the user whishes to use
    // pragmatic MathML, a pragmatic element is created. (TODO:
    // Automatic lookup?)
    // TODO: Implement an option for that. Right now, pragmatic is
    // always used if present.
    var argumentLines = instance.argument.split("\n");
    var newElement;
    if (pragmatic) {
        newElement = document.createElementNS(NS_MathML, pragmatic);
    }
    else {
        newElement = document.createElementNS(NS_MathML, "csymbol");
        if (cd) {
            newElement.setAttribute("cd", cd);
        }
        else {
            newElement.setAttribute("cd", argumentLines[0]);
        }
        if (name) {
            newElement.appendChild(document.createTextNode(name));
        }
        else {
            newElement.appendChild(document.createTextNode(argumentLines[1]));
        }
    }
    mode.insertElement(newElement);
    return true;
}

function ContentInsertModeCommand_ci(mode, instance) {
    var newElement = document.createNodeNS(NS_MathML, "ci");
    newElement.appendChild(document.createTextNode(instance.argument));
    mode.insertElement(newElement);
    return true;
}

function ContentInsertModeCommand_cn(mode, instance) {
    var newElement = document.createNodeNS(NS_MathML, "cn");
    newElement.appendChild(document.createTextNode(instance.argument));
    mode.insertElement(newElement);
    return true;
}

function ContentInsertModeCommand_apply(mode, instance) {
    var newElement = document.createNodeNS(NS_MathML, "apply");
    mode.insertElementRecursive(newElement);
    return true;
}

function ContentInsertModeCommand_arbitraryOperator(mode, instance) {
    var newElement = document.createNodeNS(NS_MathML, instance.argument);
    mode.insertElement(newElement);
    return true;
}

function ContentInsertModeCommand_forceNewElement(mode) {
    mode.forceNewElement = true;
    return true;
}


function ContentInsertModeCommand_exit(mode) {
    mode.finish();
    return true;
}

