
function AttributeMode(editor, equationEnv, element) {
    // The attribute mode is specially created for one element!
    this.name = "attribute";
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.element = element;
    this.attributes = [];
    this.init = function() {
        // Place attribute information inside an Array
        var attributeNodeMap = this.element.attributes;
        for(var i=0; i<attributeNodeMap.length; i++) {
            this.attributes.push(attributeNodeMap[i]);
        }

        // Sort the array (and filter out internal attributes)
        this.attributes = this.attributes.filter(function (a) { return a.namespaceURI != NS_internal });
        this.attributes = this.attributes.sort(
            function (a, b) { 
                if (a.namespaceURI < b.namespaceURI) return -1
                else if (a.namespaceURI > b.namespaceURI) return 1
                else if (a.localName < b.localName) return -1
                else if (a.localName > b.localName) return 1
                else return 0;
            }
        );

        // The attribute selectedAttributes stores the list of the
        // full names of the selected attributes
        this.element.setAttributeNS(NS_internal, "selectedAttributes", "");
        // attributeCursor contains the full name of the attribute the
        // cursor is located on
        this.element.setAttributeNS(NS_internal, "attributeCursor", "");

        if (this.attributes.length > 0) {
            this.moveCursor(0);
        }
        else {
            this.moveCursor(null);
        }
    }
    this.finish = function() {
        // Clean up attribute mess
        this.element.removeAttributeNS(NS_internal, "selectedAttributes");
        this.element.setAttributeNS(NS_internal, "attributeCursor", "");
        this.equationEnv.finishMode();
    }
    this.moveCursor = function(index) {
        this.cursor = index; // index may be undef if there are no attributes present
        this.element.setAttributeNS(NS_internal, "attributeCursor", (index!=null) ? this.attributes[index].nodeName : "");
        this.equationEnv.updateViews();
    }
    this.cursor = null;
    this.__defineGetter__("contextNode", function() { return this.element }); // XXX: good like this?
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

attributeModeCommands = {
    "j": {
        type: "movement",
        execute: attributeModeCommand_down
    },
    "k": {
        type: "movement",
        execute: attributeModeCommand_up
    },
    "x": {
        type: "action",
        execute: attributeModeCommand_kill
    },
    "c": {
        type: "action",
        execute: attributeModeCommand_changeValue
    },
    "C": {
        type: "action",
        execute: attributeModeCommand_changeName
    },
    "n": {
        type: "action",
        execute: attributeModeCommand_changeNS
    },
    "i": {
        type: "action",
        execute: attributeModeCommand_insertMathML
    },
    "I": {
        type: "action",
        execute: attributeModeCommand_insertForeign
    }
}
attributeModeCommands[String.fromCharCode(0x1b)] = { // Escape
    type: "action",
    execute: attributeModeCommand_exit
}

function attributeModeCommand_exit(mode) {
    mode.editor.inputBuffer = "";
    mode.finish();
}

function attributeModeCommand_up(mode) {
    if (mode.cursor!=null && mode.cursor > 0) {
        mode.moveCursor(mode.cursor - 1);
    }
    editor.inputBuffer = "";
}

function attributeModeCommand_down(mode) {
    if (mode.cursor!=null && mode.cursor < mode.attributes.length-1) {
        mode.moveCursor(mode.cursor + 1);
    }
    editor.inputBuffer = "";
}

function attributeModeCommand_kill(mode) {
    if (mode.cursor==null) { return; }
    mode.element.removeAttributeNode(mode.attributes[mode.cursor]);
    mode.attributes.splice(mode.cursor,1);
    if (mode.attributes.length == 0) { mode.moveCursor(null) }
    else if (mode.cursor >= mode.attributes.length) { mode.moveCursor(mode.cursor-1) }
    else { mode.moveCursor(mode.cursor) }
    editor.inputBuffer = "";
}

function attributeModeCommand_changeValue(mode) {
    
}

function attributeModeCommand_changeName(mode) {
    
}

function attributeModeCommand_changeNS(mode) {
    
}

function attributeModeCommand_insertMathML(mode) {
    
}

function attributeModeCommand_insertForeign(mode) {
    
}

