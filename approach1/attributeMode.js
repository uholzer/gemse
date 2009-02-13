
function AttributeMode(editor, equationEnv, element) {
    // The attribute mode is specially created for one element!
    this.name = "attribute";
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.element = element;
    this.attributes = [];
    this.cursor = null;
    this.init = function() {
        // Place attribute information inside an Array
        this.cursor = null;
        this.attributes = [];
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
    this.reInit = this.init;
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
    this.__defineGetter__("contextNode", function() { return this.element }); // XXX: good like this?
    this.inputHandler = function() {
        // Returns true if it succeeded to execute the first command from the
        // input buffer. Else, it returns false.
        // (This is mainly a copy from the same function of the edit
        // mode.)
        var command = this.editor.inputBuffer;
        var endOfCommandIndex = 0; // Points to the end of the command in the input buffer
        var commandArg = null;
        var forceFlag = false;
        var singleCharacterArgs = [];
        while (command[0] == '"') {
            if (command.length < 2) { return } // Returns if the user has not yet entered the character
            singleCharacterArgs.push(command[1]);
            command = command.slice(2);
            endOfCommandIndex += 2;
        }

        var firstCommand = command.slice(0,1);
        while (!attributeModeCommands[firstCommand] && firstCommand.length < command.length) { 
            firstCommand = command.slice(0,firstCommand.length + 1);
        }
        command = firstCommand;
        endOfCommandIndex += firstCommand.length;
        commandObject = attributeModeCommands[command];
        if (commandObject) {
            if (commandObject.type == "movement") {
                var executionResult = commandObject.execute(this,this.cursor)
                // A movement method must return a node or null
                // (A movement command is not allowed to have side
                // effect.)
                if (executionResult) {
                    this.moveCursor(executionResult);
                }
                // If executionResult is null, we do not move the
                // cursor
                editor.eatInput(endOfCommandIndex);
                return true;
            }
            else {
                var executionResult = commandObject.execute(this,command,singleCharacterArgs);
                // The input buffer has to be sliced by the called command
                return executionResult;
            }
        }
        else {
            return false;
        }
    }
}


function attributeModeCommand_exit(mode,command) {
    mode.editor.eatInput(command.length);
    mode.finish();
    return true;
}

function attributeModeCommand_up(mode,oldCursor) {
    if (oldCursor!=null && oldCursor > 0) {
        mode.moveCursor(oldCursor - 1);
    }
}

function attributeModeCommand_down(mode,oldCursor) {
    if (oldCursor!=null && oldCursor < mode.attributes.length-1) {
        mode.moveCursor(oldCursor + 1);
    }
}

function attributeModeCommand_kill(mode,command) {
    if (mode.cursor==null) { mode.editor.eatInput(command.length); return true; }
    mode.element.removeAttributeNode(mode.attributes[mode.cursor]);
    mode.attributes.splice(mode.cursor,1);
    if (mode.attributes.length == 0) { mode.moveCursor(null) }
    else if (mode.cursor >= mode.attributes.length) { mode.moveCursor(mode.cursor-1) }
    else { mode.moveCursor(mode.cursor) }

    mode.editor.eatInput(command.length);
    return true;
}

function attributeModeCommand_changeValue(mode,command) {
    if (mode.cursor==null) { mode.editor.eatInput(command.length); return true; }
    var endOfValue = editor.inputBuffer.indexOf("\n"); 
    if (endOfValue == -1) { return false; }
    var value = editor.inputBuffer.slice(command.length,endOfValue);

    mode.attributes[mode.cursor].nodeValue = value;
    mode.moveCursor(mode.cursor);

    editor.eatInput(endOfValue+1);
    return true;
}

function attributeModeCommand_changeName(mode,command) {
    if (mode.cursor==null) { mode.editor.eatInput(command.length); return true; }
    throw "todo!";
}

function attributeModeCommand_changeNS(mode) {
    if (mode.cursor==null) { mode.editor.eatInput(command.length); return true; }
    throw "todo!";
}

function attributeModeCommand_insertDefault(mode,command) {
    var r = /^([^\n]*)\n([^\n]*)\n/m;
    var info = r.exec(mode.editor.inputBuffer.slice(command.length));
    if (info) {
        mode.element.setAttribute(info[1], info[2]);
        editor.eatInput(command.length + info[0].length);
        mode.reInit();
        return true;
    }
    else {
        return false;
    }
}

function attributeModeCommand_insertForeign(mode,command) {
    var r = /^([^\n]*)\n([^\n]*)\n([^\n]*)\n/;
    var info = r.exec(mode.editor.inputBuffer.slice(command.length));
    if (info) {
        mode.element.setAttributeNS(info[1], info[2], info[3]);
        editor.eatInput(command.length + info[0].length);
        mode.reInit();
        return true;
    }
    else {
        return false;
    }
}


function attributeModeCommand_setDefaultForMissing(mode,command) {
    // Sets default value for attributes not already present
    var elementDesc = elementDescriptions[mode.element.localName];
    for each (var attributeDesc in elementDesc.attributes) {
        if (!mode.element.hasAttributeNS(attributeDesc.namespace||"",attributeDesc.name)) {
            mode.element.setAttributeNS(attributeDesc.namespace||"",attributeDesc.name,attributeDesc.defaultValue);
        }
    }
    mode.reInit();
    editor.eatInput(command.length);
    return true;
}

function attributeModeCommand_clearAll(mode,command) {
    // I delete all attributes using the folowing rather crazy way. I
    // do not know better. The problem is that, so it seems, if one
    // retrieves element.attributes and deletes some attributes via
    // element.removeAttributeNode, the retrieved attributes list
    // changes. The solution I use is to retrieve a new attributes
    // list with element.attributes after every removal.

    // Attributes with localName that begins with "-" are kept.

    var getaSignificantAttribute = function(e) {
        var attributes = e.attributes;
        for (var i=0; i<attributes.length; ++i) {
            var candidate = attributes.item(i);
            if (candidate) { return candidate }
        }
        return null;
    }

    var anAtribute;
    while (anAttribute = getaSignificantAttribute(mode.element)) {
        mode.element.removeAttributeNode(anAttribute);
    }

    mode.reInit();
    editor.eatInput(command.length);
    return true;
}



