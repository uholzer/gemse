/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */

/*
    This is an insert mode that queries the Unicode Character Database
    in order to decide whether a chracter is an identifier, an operator
    or a number. 
*/

function UCDInsertMode(editor, equationEnv, inElement, beforeElement) {
    // This insert mode inserts children into inElement, before the
    // silbing beforeElement. If beforeElement is null, it adds
    // children to the end of the inElement.
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.d = this.equationEnv.document;
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
UCDInsertMode.prototype = {
    name: "insert (UCD)",
    init: function() {
        this.showCursor();
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
            // identifier, operator or number.
            if (ucd.isCombining(c)) {
                // The user entered a combining character, so, this
                // character interacts with the element before the
                // cursor.
                this.hideCursor();
                var position = ucd.lookupCombiningPosition(c);
                var standalone = ucd.lookupCombiningStandalone(c);
                if (!standalone) { 
                    // If there is now standalone from known, we build
                    // one by using 0x00A0 as base character
                    standalone = String.uFromCharCode(0x00A0) + c
                    // Or do we have to use 0x0020 or nothing at all?
                }
                var parentElement = this.cursor.inElement;
                var baseElement = this.cursor.beforeElement ? mml_previousSibling(this.cursor.beforeElement) : mml_lastChild(this.cursor.inElement);
                if (!baseElement) { throw new Error("No element before the cursor, so don't know what to do with the combining mark.") }
                var standaloneTextNode = this.d.createTextNode(standalone);
                var standaloneElement = this.d.createElementNS(NS_MathML, "mo");      //TODO!
                standaloneElement.appendChild(standaloneTextNode);
                var surroundingElementName;
                switch (position) {
                    case ucd.MPOS_OVER:
                        surroundingElementName = "mover";
                        break;
                    case ucd.MPOS_SUP:
                        surroundingElementName = "msup";
                        break;
                    case ucd.MPOS_SUB:
                        surroundingElementName = "msub";
                        break;
                    case ucd.MPOS_UNDER:
                        surroundingElementName = "munder";
                        break;
                    default:
                        surroundingElementName = "mover";
                }
                var surroundingElement = this.d.createElementNS(NS_MathML, surroundingElementName);  //TODO!
                parentElement.replaceChild(surroundingElement, baseElement);
                surroundingElement.appendChild(baseElement);
                surroundingElement.appendChild(standaloneElement);
                // this.cursor should still have correct values at
                // this point.
                this.showCursor();
            }
            else if (ucd.isOperator(c)) {
                this.putElement(null, "mo", this.d.createTextNode(c));
            }
            else if (ucd.isDigit(c)) {
                // We assume that it does not happen that the user
                // wants to have two consecutive mn elements. This is
                // not good, since for example in a subsup element,
                // both children can be mn.
                var precedingElement = this.cursor.beforeElement ? mml_previousSibling(this.cursor.beforeElement) : mml_lastChild(this.cursor.inElement);
                if (precedingElement && precedingElement.namespaceURI == NS_MathML && precedingElement.localName == "mn" && !this.forceNewElement) {
                    precedingElement.lastChild.nodeValue += c; //XXX: Is that good in case of entities or similar?
                }
                else {
                    this.putElement(null, "mn", this.d.createTextNode(c));
                }
            }
            else if (ucd.isIdentifier(c)) { // Identifier
                this.putElement(null, "mi", this.d.createTextNode(c));
            }
            else {
                throw new Error("I don't know what to do with " + c + ", it seems not to be an operator, a digit or an identifier.");
            }

            this.forceNewElement = false;
            return true;
        }
        else {
            return false;
        }
    },
    getNewPlaceholderElement: function() {
        var placeholder = this.d.createElementNS(NS_MathML, "mi");
        placeholder.setAttributeNS(NS_internal, "missing", "1")
        placeholder.appendChild(this.d.createTextNode("□"));
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
            newElement = this.d.createElementNS(ns, name);
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
                var surroundingMrow = this.d.createElementNS(NS_MathML,"mrow");
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
}

function ucdInsertModeCommand_forceNewElement(mode) {
    mode.forceNewElement = true;
    return true;
}

function ucdInsertModeCommand_exit(mode) {
    mode.finish();
    return true;
}



