/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */


function VisualSelectionMode(editor, equationEnv, startElement) {
    // This insert mode inserts children into inElement, before the
    // silbing beforeElement. If beforeElement is null, it adds
    // children to the end of the inElement.
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.cursor = {
        startElement: startElement,
        endElement:   startElement,
        moving:       this.END,
    };
    this.commandHandler = new CommandHandler(this,visualSelectionModeCommandOptions,visualSelectionModeCommands);
}
VisualSelectionMode.prototype = {
    name: "visual",
    START: "start", // denotes the left end of the selection
    END: "end", // denotes the rigth end of the selection
    createCursor: function() {
        return {
            startElement: this.cursor.startElement,
            endElement:   this.cursor.endElement,
            moving:       this.cursor.moving,
        }
    },
    init: function() {
        this.showCursor();
    },
    hideCursor: function() {
        // Remove all "selected" attributes on selected nodes
        var current = this.cursor.startElement;
        while (current != this.cursor.endElement) {
            current.removeAttributeNS(NS_internal, "selected");
            current = mml_nextSibling(current);
        }
        current.removeAttributeNS(NS_internal, "selected");
    },
    showCursor: function() {
        // Put selected="userSelection" attributes on all selected
        // nodes
        // Begin at startElement and go through the following siblings
        // until endElement is reached. Descendants do not need to be
        // marked
        var current = this.cursor.startElement;
        while (current != this.cursor.endElement) {
            current.setAttributeNS(NS_internal, "selected", "userSelection");
            current = mml_nextSibling(current);
        }
        current.setAttributeNS(NS_internal, "selected", "userSelection");
        if (this.cursor.moving == this.START) {
            this.cursor.startElement.setAttributeNS(NS_internal, "selected", "userSelectionCursor");
        }
        else {
            this.cursor.endElement.setAttributeNS(NS_internal, "selected", "userSelectionCursor");
        }
    },
    moveCursor: function(newCursor) {
        this.hideCursor();
        this.cursor = newCursor;
        this.showCursor();
    },
    get contextNode() { return null }, // TODO
    isSibling: function(e1,e2) {
        // Returns true iff e1 and e2 are siblings
        return (e1.parentNode == e2.parentNode);
    },
    compareSiblings: function(e1, e2) {
        // Returns 0 if the siblings are equal, 1 if if e1 comes before e2,
        // and -1 if e2 precedes e1. -2 indicates that e1 and e2 are not Siblings
        if (e1.parentNode != e2.parentNode) { return -2 }
        if (e1 == e2) { return 0 }
        var parentNode = e1.parentNode;
        var nodeList = parentNode.childNodes;
        for (var i=0; i<nodeList.length; ++i) {
            if (nodeList[i] == e1) {
                return 1;
            }
            else if (nodeList[i] == e2) {
                return -1
            }
        }
        throw new Error("Never reached!");
    },
    inputHandler: function() {
        var instance = this.commandHandler.parse();
        if (instance.isReadyToExecute) {
            instance.execute();
            return true;
        }
        else if (instance.notFound) {
            // Handle the command as editMode command. 
            // TODO: If it
            // gets processed as such, leave visual mode, otherwise
            // stay in visual mode.

            // Check whether it is an editMode command (XXX: Assuming editMode)
            // TODO: Right now, there is no way to tell wether a
            // command exists, since the edit mode has a complex
            // command parsing. So, for the moment, we will always
            // assume that it exists. This can cause the visual mode
            // to terminate too soon. The command still gets executed
            // on the selection as soon as it has been entered
            // completely. Unfortunately it is not intutive for
            // the user. If he enters a nonexistant command, the
            // visual mode seems gone, but the selection will be
            // applied on the next command.
            // However, since the visual mode and the edit mode now use the
            // CommandHandler to parse input, this might be easier to
            // omplement.
            this.dispatch();
            return true;
            /*candidateCommand = command[0];
            while (candidateCommand.length < command.length && !editModeCommands[candidateCommand]) {
                candidateCommand = command.slice(0,candidateCommand.length + 1);
            }
            if (editModeCommands[candidateCommand]) {
                // If yes, dispatch
                this.dispatch()
            }
            else {
                throw new Error("Command not found");
                return false;
            }*/
        }
        else {
            return false;
        }
    },
    cancel: function() {
        // Exits this mode without doing anything, drops the selection
        this.hideCursor();
        this.equationEnv.finishMode();
    },
    dispatch: function() {
        // Exits this mode and tells the underlying mode the selection 
        // for the next command
        this.hideCursor();
        this.equationEnv.finishMode({userSelection: this.cursor});
        // editMode should now automatically execute the next command in
        // the buffer. (But we will enforce it now. XXX: Perhaps this is bad)
        this.equationEnv.mode.inputHandler();
    },
}

function visualSelectionModeExecutionHandler_movement(mode,instance) {
    var newCursor = mode.createCursor();
    var destNode = instance.implementation(
        mode,
        (mode.cursor.moving == mode.START) ? mode.cursor.startElement : mode.cursor.endElement
    )
    // We only move the cursor if the new element is a
    // sibling of the current one
    if (destNode && mode.isSibling(destNode,mode.cursor.startElement)) {
        if (mode.cursor.moving == mode.START) { // move start node
            if (mode.compareSiblings(destNode,mode.cursor.endElement) >= 0) { 
                newCursor.startElement = destNode;
            }
            else {
                newCursor.startElement = newCursor.endElement;
                newCursor.endElement = destNode;
                newCursor.moving = mode.END;
            }
        }
        else { // move end node
            if (mode.compareSiblings(mode.cursor.startElement,destNode) >= 0) { 
                newCursor.endElement = destNode;
            }
            else {
                newCursor.endElement = newCursor.startElement;
                newCursor.startElement = destNode;
                newCursor.moving = mode.START;
            }
        }
        mode.moveCursor(newCursor);
    }
    return true;
}


function visualSelectionModeCommand_switchMoving(mode) {
    var newCursor = mode.createCursor();
    if (mode.cursor.moving == mode.START) {
        newCursor.moving = mode.END;
    }
    else {
        newCursor.moving = mode.START;
    }
    mode.moveCursor(newCursor);
}

function visualSelectionModeCommand_cancel(mode) {
    mode.cancel();
}

