
function VisualSelectionMode(editor, equationEnv, startElement) {
    // This insert mode inserts children into inElement, before the
    // silbing beforeElement. If beforeElement is null, it adds
    // children to the end of the inElement.
    this.name = "visual";
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.START = "start"; // denotes the left end of the selection
    this.END = "end"; // denotes the rigth end of the selection
    this.cursor = {
        startElement: startElement,
        endElement:   startElement,
        moving:       this.END,
    };
    this.createCursor = function() {
        return {
            startElement: this.cursor.startElement,
            endElement:   this.cursor.endElement,
            moving:       this.cursor.moving,
        }
    }
    this.init = function() {
        this.moveCursor(this.cursor);
    }
    this.hideCursor = function() {
        // Remove all "selected" attributes on selected nodes
        var current = this.cursor.startElement;
        while (current != this.cursor.endElement) {
            current.removeAttributeNS(NS_internal, "selected");
            current = mml_nextSibling(current);
        }
        current.removeAttributeNS(NS_internal, "selected");
    }
    this.showCursor = function() {
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
    }
    this.moveCursor = function(newCursor) {
        this.hideCursor();
        this.cursor = newCursor;
        this.showCursor();
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
        commandObject = visiualSelectionModeCommands[command[0]];
        if (commandObject) {
            commandObject.execute(this,command[0])
        }
        else {
            throw "Command not found";
        }
    };
    this.cancel = function() {
        // Exits this mode without doing anything, drops the selection
        this.hideCursor();
        this.equationEnv.finishMode();
    }
    this.dispatch = function() {
        // Exits this mode and runs the editMode command
        //TODO
        this.cancel();
    }
}

visiualSelectionModeCommands = {
    "h": {
        execute: visualSelectionModeCommand_moveLeft
    },
    "l": {
        execute: visualSelectionModeCommand_moveRight
    },
    "o": {
        execute: visualSelectionModeCommand_switchMoving
    }
}
visiualSelectionModeCommands[String.fromCharCode(0x1b)] = { // Escape
    execute: visualSelectionModeCommand_cancel
}


function visualSelectionModeCommand_moveLeft(mode) {
    var newCursor = mode.createCursor();
    if (mode.cursor.moving == mode.END) {
        // Move rigth end
        if (mode.cursor.endElement == mode.cursor.startElement) {
            // Right end goes over left end, so move left end instead
            newCursor.moving = mode.START;
        }
        else {
            newCursor.endElement = mml_previousSibling(mode.cursor.endElement);
            if (newCursor.endElement == null) { newCursor.endElement = mode.cursor.endElement }
        }
    }
    if (newCursor.moving == mode.START) {
        // Move left end (could also have to be done if mode.cursor.moving was mode.START)
        newCursor.startElement = mml_previousSibling(mode.cursor.startElement);
        if (newCursor.startElement == null) { newCursor.startElement = mode.cursor.startElement }
    }
    mode.moveCursor(newCursor);
    mode.editor.inputBuffer = "";
}

function visualSelectionModeCommand_moveRight(mode) {
    var newCursor = mode.createCursor();
    if (mode.cursor.moving == mode.START) {
        // Move left end
        if (mode.cursor.endElement == mode.cursor.startElement) {
            // Left end goes over right end, so move right end instead
            newCursor.moving = mode.END;
        }
        else {
            newCursor.startElement = mml_nextSibling(mode.cursor.startElement);
            if (newCursor.startElement == null) { newCursor.startElement = mode.cursor.startElement }
        }
    }
    if (newCursor.moving == mode.END) {
        // Move rigth end (could also have to be done if mode.cursor.moving was mode.START)
        newCursor.endElement = mml_nextSibling(mode.cursor.endElement);
        if (newCursor.endElement == null) { newCursor.endElement = mode.cursor.endElement }
    }
    mode.moveCursor(newCursor);
    mode.editor.inputBuffer = "";
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
    mode.editor.inputBuffer = "";
}

function visualSelectionModeCommand_cancel(mode) {
    mode.cancel();
    mode.editor.inputBuffer = "";
}

