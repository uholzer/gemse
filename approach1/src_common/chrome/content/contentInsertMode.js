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
    this.commandHandler = new CommandHandler(this,contentInsertModeCommandOptions,contentInsertModeCommands);
    /** Set to true if the next character must not be added to the
     * content of the preceding element. This is useful if the user
     * wants to insert two mn elements behind each other.
     */
    this.forceNewElement = false;
}
ContentInsertMode.prototype = {
    name: "content",
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
                    var newElement = document.createElementNS(NS_MathML, "cn");
                    newElement.appendChild(document.createTextNode(c));
                    this.putElement(newElement, false);
                }
            }
            else if (ucd.isIdentifier(c)) { // Identifier
                var newElement = document.createElementNS(NS_MathML, "ci");
                newElement.appendChild(document.createTextNode(c));
                this.putElement(newElement, false);
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
    putElement: function(newElement, recursive) {
        // Puts an element where the cursor is located. If an element
        // follows which is marked with the missing attribute, it gets
        // deleted

        this.hideCursor();
 
        // Put element into the equation
        this.cursor.inElement.insertBefore(newElement, this.cursor.beforeElement);
        // Handle surrounding
        if (this.cursor.numberOfElementsToSurround) {
            for (var i=0; i<this.cursor.numberOfElementsToSurround; ++i) {
                newElement.insertBefore(
                    mml_previousSibling(newElement),
                    newElement.firstChild
                );
            }
        }

        // Place the cursor
        if (recursive) {
            // Remember old cursor
            this.cursorStack.push({
                beforeElement: this.cursor.beforeElement,
                inElement: this.cursor.inElement,
            });
            // Put the cursor at the end of the newly created element
            this.moveCursor({
                beforeElement: null,
                inElement: newElement,
            });
        }
        else {
            // Put the cursor where it already is
            this.moveCursor({
                beforeElement: this.cursor.beforeElement,
                inElement: this.cursor.inElement
            });
        }
    },
}

function contentInsertModeCommand_symbol(mode, instance, cd, name, pragmatic) {
    // If cd is given, don't look for cd argument in the instance, if name is given as well,
    // don't look for name argument either.
    // Should pragmatic be given, and the user whishes to use
    // pragmatic MathML, a pragmatic element is created. (TODO:
    // Automatic lookup?)
    // TODO: Implement an option for that. Right now, pragmatic is
    // always used if present.
    var argumentLines;
    if (instance.argument) {
        argumentLines = instance.argument.split("\n");
    }
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
    mode.putElement(newElement, false);
    return true;
}

function contentInsertModeCommand_ci(mode, instance) {
    var newElement = document.createNodeNS(NS_MathML, "ci");
    newElement.appendChild(document.createTextNode(instance.argument));
    mode.putElement(newElement, false);
    return true;
}

function contentInsertModeCommand_cn(mode, instance) {
    var newElement = document.createNodeNS(NS_MathML, "cn");
    newElement.appendChild(document.createTextNode(instance.argument));
    mode.putElement(newElement, false);
    return true;
}

function contentInsertModeCommand_apply(mode, instance) {
    var newElement = document.createElementNS(NS_MathML, "apply");
    mode.putElement(newElement, true);
    return true;
}

function contentInsertModeCommand_arbitraryOperator(mode, instance) {
    var newElement = document.createElementNS(NS_MathML, instance.argument);
    mode.putElement(newElement, false);
    return true;
}

function contentInsertModeCommand_forceNewElement(mode) {
    mode.forceNewElement = true;
    return true;
}

function contentInsertModeCommand_oneMoreToSurround(mode) {
    // TODO: Count preceding siblings and prevent to select too many
        mode.moveCursor({ 
            beforeElement: mode.cursor.beforeElement,
            inElement: mode.cursor.inElement,
            numberOfElementsToSurround: (mode.cursor.numberOfElementsToSurround||0) + 1
        });
    return true;
}

function contentInsertModeCommand_oneLessToSurround(mode) {
    if (mode.cursor.numberOfElementsToSurround > 0) {
        mode.moveCursor({ 
            beforeElement: mode.cursor.beforeElement,
            inElement: mode.cursor.inElement,
            numberOfElementsToSurround: (mode.cursor.numberOfElementsToSurround||0) - 1
        });
    }
    return true;
}

function contentInsertModeCommand_cursorJump(mode,instance) {
    if (mode.cursorStack.length<1) { 
        // If the stack is empty, the user is done with inserting, so exit
        return contentInsertModeCommand_exit(mode,instance);
    }
    mode.moveCursor(mode.cursorStack.pop());
    return true;
}


function contentInsertModeCommand_exit(mode) {
    mode.finish();
    return true;
}

