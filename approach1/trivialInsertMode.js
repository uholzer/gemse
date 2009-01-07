
function AttributeMode(editor, equationEnv, element) {
    // The attribute mode is specially created for one element!
    this.name = "insert (trivial)";
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.element = element;
    this.init = function() {

    }
    this.finish = function() {
        // TODO: Clean up attribute mess
        this.equationEnv.finishMode();
    }
    this.moveCursor = function(index) {
        this.cursor = ; // TODO
        this.equationEnv.updateViews();
    }
    this.cursor = null;
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
        commandObject = attributeModeCommands[command];
        if (commandObject) {
            commandObject.execute(this)
        }
        else {
            throw "Command not found";
        }
    };
}

trivialInsertModeCommands = {

}

function trivialInsertModeCommand_miSingle() {
    // Inserts an mi element with a single character as content
}

function trivialInsertModeCommand_miLong() {
    // Inserts an mi element with several characters as content
}

function trivialInsertModeCommand_mnNormal() {
    // Inserts a mn element, containg a number of the form /^[+-]?[0-9.]+$/
}

function trivialInsertModeCommand_mnLong() {
    // Inserts an mn element containing anything

}

function trivialInsertModeCommand_moNormal() {
    // Inserts an mo element with a single character as content
}

function trivialInsertModeCommand_moLong() {
    // Inserts an mi element with several characters as content
}

function trivialInsertModeCommand_mtext() {
    // Inserts an mtext element
}



