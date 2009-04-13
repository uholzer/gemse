
GemsePEditor.knownClasses.push(EditMode);

/**
 * After creation of the object, its init method must be called.
 * @class Provides the functionality of the edit mode. For every
 * equation, an own edit mode object has to be used.
 * @param editor The editor that uses this mode object
 * @param equationenv The equation environment this mode object is
 * used for
 */
function EditMode(editor, equationEnv) {
    /**
     * The editor this object belongs to
     * @constant
     */
    this.editor = editor;
    /**
     * The equation environment this object belongs to
     * @constant
     */
    this.equationEnv = equationEnv;
    /**
     * The selection (as returned by the visual mode) the next command
     * will operate on. This is set after the visual mode terminates
     * and will be set back to null after issuing the next command. 
     */
    this.userSelectionForNextCommand = null;
    /**
     * The element the cursor is on
     */
    this.cursor = null;
}
EditMode.prototype = {
    /**
     * Name of the mode, as shown to the user
     * @constant
     */
    name: "edit",
    /**
     * Initialize.
     * Does some important initialisation and must be called after
     * creating this object.
     * XXX: Get rid of that for all modes?
     */
    init: function() {
        this.moveCursor(this.equationEnv.equation); // the element the cursor points to
    },
    /**
     * Moves the cursor to another element. Afterwards, the views are
     * rebuilt by callin this.equationEnv.updateViews()
     * @param element destination element
     */
    moveCursor: function(element) {
        this.hideCursor();
        this.cursor = element;
        this.showCursor();
        this.equationEnv.updateViews();
    },
    /**
     * Puts "selected" attributes for the cursor into the equation.
     */
    showCursor: function() {
        this.cursor.setAttributeNS(NS_internal, "selected", "editcursor");
        if (this.cursor != this.equationEnv.equation) { this.cursor.parentNode.setAttributeNS(NS_internal, "selected", "parent"); }
    },
    /**
     * Removes "selected" attributes for the current cursor.
     * It really only removes the attributes from the elements that
     * have set the "selected" attribute for the current cursor, it
     * does not go through all elements to remove them. So, when
     * changing the cursor, this method must be callsed before,
     * afterwards its too late.
     */
    hideCursor: function() {
        if (this.cursor) {
            this.cursor.removeAttributeNS(NS_internal, "selected");
            if (this.cursor != this.equationEnv.equation) { this.cursor.parentNode.removeAttributeNS(NS_internal, "selected"); }
        }
    },
    /**
     * The node for which the views should be created. For this mode,
     * it is always the element the cursor is on.
     */
    get contextNode() { return this.cursor; },
    /**
     * Handles the first command from the input buffer. This method is
     * called if the input buffer changes.
     * @returns true if the first command from the input buffer was
     *               successfully executed and removed from the input
     *               buffer, false if the command does not exist or is
     *               not yet complete
     */
    inputHandler: function() {
        var command = this.editor.inputBuffer;
        // endOfCommandIndex points to the end of the command in the
        // input buffer. It counts unicode characters, not UTF16
        // characters.
        var endOfCommandIndex = 0;
        var commandArg = null;
        var forceFlag = false;
        var singleCharacterArgs = [];
        while (command[0] == '"') {
            if (command.length < 2) { return } // Returns if the user has not yet entered the character
            singleCharacterArgs.push(command.uCharAt(1));
            command = command.uSlice(2);
            endOfCommandIndex += 2;
        }
        if (command[0] == ":") { // Treate this as a long command
            var inf = /^(:[^\s\n!]*)(!?)(\s+([^\n]*))?\n$/.exec(command);
            if (inf) {
                command = inf[1];
                if (inf[2]) { forceFlag = true }
                commandArg = inf[4] || ""; // Prevent commandArg from being null (XXX: is this good?)
                endOfCommandIndex += inf[0].uLength + 1;
            }
            else {
                return false;
            }
        }
        else {
            var firstCommand = command.uSlice(0,1);
            while (!editModeCommands[firstCommand] && firstCommand.length < command.length) { 
                firstCommand = command.uSlice(0,firstCommand.uLength + 1);
            }
            command = firstCommand;
            endOfCommandIndex += firstCommand.uLength;
        }
        commandObject = editModeCommands[command];
        if (commandObject) {
            if (commandObject.type == "long") {
                var executionResult = commandObject.execute(this,commandArg,forceFlag)
                // TODO: Only clear buffer if it returns true?
                editor.eatInput(endOfCommandIndex);
            }
            else if (commandObject.type == "movement") {
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
            }
            else {
                if (this.userSelectionForNextCommand) {
                    // For debugging purposes:
                    if (!(this.userSelectionForNextCommand.startElement && this.userSelectionForNextCommand.endElement)) {
                        throw "A selection must have a startElement and an endElement.";
                    }
                }
                if (commandObject.type == "operator" && !this.userSelectionForNextCommand) {
                    // An operator expects a selection, so if none is present,
                    // take the cursor as the only selected element.
                    // This will be revised later.
                    this.userSelectionForNextCommand = {startElement: this.cursor, endElement: this.cursor};
                }
                var executionResult = commandObject.execute(this,command,singleCharacterArgs,this.userSelectionForNextCommand);
                // TODO: Only clear buffer if it returns true?
                editor.eatInput(endOfCommandIndex);
            }
            this.userSelectionForNextCommand = null;
            return true; // TODO: Or should it return executionResult?
        }
        else {
            // Command not found
            return false;
        }
    },
    /** 
     * Starts insert mode. This is useful for commands that open the
     * insert mode. 
     * @param cursorInElement     The element the initial cursor is placed
     *                            in
     * @param cursorBeforeElement The element right after the initial
     *                            cursor. If this is null, the cursor
     *                            is placed behind the last child of
     *                            the element given by
     *                            cursorInElement.
     * @param manualChange        Already existing Change object that
     *                            has to be used to record the changes
     *                            the edit mode makes. If this
     *                            parameter is missing or null, a
     *                            fresh change object gets created.
     *                            Otherwise, the given one is used to
     *                            record changes after the edit mode
     *                            returns. The method recordBefore
     *                            must be called on the Change object
     *                            before hading it over to this
     *                            method.
     * @param manualChangeElement Points to the element that the
     *                            Change object manualChange is
     *                            observing.
     */
    callInsertMode: function (cursorInElement, cursorBeforeElement, manualChange, manualChangeElement) {
        // Calls the insert mode
        // If manual change is supplied, then its recordBefore must already have been called.
        this.infoAboutCalledMode = {
            change: manualChange || this.equationEnv.history.createChange(),
            changeElement: manualChangeElement || cursorInElement
        };
        if (!manualChange) {
            this.infoAboutCalledMode.change.recordBefore(this.equationEnv.equation,cursorInElement);
        }
        var editModeClass = this.editor.getOptionParsed("currentInsertMode");
        var newMode = new editModeClass(this.editor, this.equationEnv, cursorInElement, cursorBeforeElement);
        newMode.init();
        this.equationEnv.callMode(newMode);
        return true;
    },
    /**
     * Do things that have to be done after a mode returns.
     * This method is always called when a mode that has been called
     * on top of this mode returns. It records changes, remembers user
     * selections and places the cursor at a good place.
     * @param returnValue The value the terminated mode handed back.
     */
    calledModeReturned: function (returnValue) {
        if (this.infoAboutCalledMode) {
            if (this.infoAboutCalledMode.change) {
                this.infoAboutCalledMode.change.recordAfter(this.equationEnv.equation,this.infoAboutCalledMode.changeElement);
                this.equationEnv.history.reportChange(this.infoAboutCalledMode.change);
            }
        }
        if (returnValue && returnValue.userSelection) {
            this.userSelectionForNextCommand = returnValue.userSelection;
        }
        if (returnValue && returnValue.newCursor) {
            // XXX: This is a hack. It relies on this.hideCursor to be
            // called before a mode gets called that returns a
            // newCursor value.
            this.cursor = returnValue.newCursor;
        }
        delete this.infoAboutCalledMode;
        this.moveCursor(this.cursor); // In order to update all views
    },
    /**
     * Resets internal data about the equation, including the position
     * of the cursor. This is called after an undo or redo, which only
     * change the equation, note the equation environment or the mode
     * object, but they preserve internal attributes, so all needed
     * information can be found in the equation.
     */
    reInit: function () {
        // Search equation for the cursor
        var nsResolver = standardNSResolver;
        this.cursor = document.evaluate(".//.[@internal:selected='editcursor']", this.equationEnv.equation, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
        if (!this.cursor) { this.cursor = this.equationEnv.equation }
        this.moveCursor(this.cursor); // In order to update all views
    },
}

/**
 * Handlers for options that the edit mode provides. They contain
 * default values, validators, parsers.
 */
EditMode.gemseOptions = {
    "selectableInsertModes": {
        defaultValue: "trivial,ucd",
        validator: function(value,editor) {
            return (value == "trivial,ucd" || value == "ucd,trivial" ||
                    value == "trivial"     || value == "ucd");
        },
        parser: function(value,editor) {
            return value.split(",");
        }
    },
    "currentInsertMode": {
        defaultValue: "trivial",
        validator: function(value,editor) {
            return (value == "trivial" || value == "ucd");
        },
        parser: function(value,editor) {
            // Returns a class
            if (value == "trivial") {
                return TrivialInsertMode;
            }
            else {
                return UCDInsertMode;
            }
        }
    },
}


/* Commands */
/* For documentation look into the user documentation */

function editModeCommand_moveLeft(mode,currentElement) {
    return mml_previousSibling(currentElement);
}

function editModeCommand_moveRight(mode,currentElement) {
    return mml_nextSibling(currentElement);
}

function editModeCommand_moveUp(mode,currentElement) {
    return mml_parent(currentElement);
}

function editModeCommand_moveDown(mode,currentElement) {
    return mml_firstChild(currentElement);
}

function editModeCommand_moveDownLast(mode,currentElement) {
    return mml_lastChild(currentElement);
}

function editModeCommand_moveToFirstSibling(mode,currentElement) {
    return mml_firstSibling(currentElement);
}

function editModeCommand_moveToLastSibling(mode,currentElement) {
    return mml_lastSibling(currentElement);
}

function editModeCommand_moveToRoot(mode, currentElelment) {
    return mode.equationEnv.equation;
}

function editModeCommand_moveToNextLeaf(mode, currentElement) {
    return mml_nextLeaf(currentElement);
}

function editModeCommand_moveToPreviousLeaf(mode, currentElement) {
    return mml_previousLeaf(currentElement);
}

function editModeCommand_undo(mode) {
    // The glorious undo
    mode.hideCursor();
    if (!mode.equationEnv.history.goBack(mode.equationEnv)) {
        throw "undo failed";
    }
    mode.moveCursor(mode.cursor); // In order to update all views
    return true;
}

function editModeCommand_redo(mode) {
    // The inverse of the glorious undo
    mode.hideCursor();
    if (!mode.equationEnv.history.goForward(mode.equationEnv)) {
        throw "redo failed";
    }
    mode.moveCursor(mode.cursor); // In order to update all views
    return true;
}

function editModeCommand_kill(mode) {
    var target = mode.cursor;
    var parentOfTarget = target.parentNode;
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,parentOfTarget);
    mode.moveCursor(mml_nextSibling(target) || mml_previousSibling(target) || parentOfTarget);
    target.parentNode.removeChild(target);
    change.recordAfter(mode.equationEnv.equation,parentOfTarget);
    mode.moveCursor(mode.cursor); // In order to update all views
    mode.equationEnv.history.reportChange(change);
    return true;
}

function editModeCommand_delete(mode,command,singleCharacterArgs,userSelection) {
    var from = userSelection.startElement; // \ Those two must be siblings, in the right order!
    var to = userSelection.endElement;     // /
    if (!(from && to)) {
        throw "Delete wants a startElement and an endElement in the selection!";
    }
    var parentOfTargets = userSelection.startElement.parentNode;
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,parentOfTargets);
    mode.moveCursor(mml_nextSibling(to) || mml_previousSibling(from) || parentOfTargets);
    while (from != to) {
        var nextFrom = mml_nextSibling(from);
        parentOfTargets.removeChild(from);
        from = nextFrom;
    }
    parentOfTargets.removeChild(to);
    change.recordAfter(mode.equationEnv.equation,parentOfTargets);
    mode.moveCursor(mode.cursor); // In order to update all views
    mode.equationEnv.history.reportChange(change);
    return true;
}

function editModeCommand_change(mode,command,singleCharacterArgs,userSelection) {
    var from = userSelection.startElement; // \ Those two must be siblings, in the right order!
    var to = userSelection.endElement;     // /
    if (!(from && to)) {
        throw "Change wants a startElement and an endElement in the selection!";
    }
    var parentOfTargets = userSelection.startElement.parentNode;
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,parentOfTargets);
    var cursorBefore = mml_nextSibling(to);
    mode.moveCursor(mml_nextSibling(to) || mml_previousSibling(from) || parentOfTargets);
    while (from != to) {
        var nextFrom = mml_nextSibling(from);
        parentOfTargets.removeChild(from);
        from = nextFrom;
    }
    parentOfTargets.removeChild(to);

    // Start the insert mode
    return mode.callInsertMode(parentOfTargets, cursorBefore, change, parentOfTargets);
}

function editModeCommand_attributeMode(mode) {
    mode.infoAboutCalledMode = {
        change: mode.equationEnv.history.createChange(),
        changeElement: mode.cursor
    };
    mode.infoAboutCalledMode.change.recordBefore(mode.equationEnv.equation,mode.cursor);
    var newMode = new AttributeMode(mode.editor, mode.equationEnv, mode.cursor);
    newMode.init();
    mode.equationEnv.callMode(newMode);
    return true;
}

function editModeCommand_visualMode(mode) {
    /* TODO: How to handle changes in visual mode?
    mode.infoAboutCalledMode = {
        change: mode.equationEnv.history.createChange(),
        changeElement: mode.cursor
    };
    mode.infoAboutCalledMode.change.recordBefore(mode.equationEnv.equation,mode.cursor);
    */
    var newMode = new VisualSelectionMode(mode.editor, mode.equationEnv, mode.cursor);
    newMode.init();
    mode.equationEnv.callMode(newMode);
    return true;
}

function editModeCommand_insertBefore(mode) {
    return mode.callInsertMode(mode.cursor.parentNode, mode.cursor);
}

function editModeCommand_insertAfter(mode) {
    return mode.callInsertMode(mode.cursor.parentNode, mml_nextSibling(mode.cursor));
}

function editModeCommand_insertIn(mode) {
    // Thought for inserting into empty elements
    return mode.callInsertMode(mode.cursor, null);
}

function editModeCommand_insertAtBeginning(mode) {
    mode.moveCursor(mml_firstSibling(mode.cursor));
    return editModeCommand_insertBefore(mode);
}

function editModeCommand_insertAtEnd(mode) {
    mode.moveCursor(mml_lastSibling(mode.cursor));
    return editModeCommand_insertAfter(mode);
}

function editModeCommand_set(mode, argString) {

}

function editModeCommand_redisplay(mode) {
    mode.moveCursor(mode.cursor);
    return true;
}

function editModeCommand_serialize(mode, argString) {
    var serializer = new XMLSerializer();
    var rootNode;
    if (argString.indexOf("raw") != -1) { //argString contains "raw"
        rootNode = mode.equationEnv.equation;
    }
    else {
        // Create new document, since cleanSubtreeOfDocument requires
        // a document.
        var doc = document.implementation.createDocument(null, null, null);
        rootNode = doc.importNode(mode.equationEnv.equation, true);
        doc.appendChild(rootNode);
        mode.equationEnv.cleanSubtreeOfDocument(doc, rootNode);
    }
    if (argString.indexOf("pretty") != -1) {
        var xmlString = XML(serializer.serializeToString(rootNode)).toXMLString();
    }
    else {
        var xmlString = serializer.serializeToString(rootNode);
    }

    mode.equationEnv.notificationDisplay.textContent = xmlString;
    return true;
}

function editModeCommand_export(mode, argString) {

    // Fetch exporter stylesheet
    var stylesheet;
    if (argString == "tex" || !argString) {
        // Create request
        var request = new XMLHttpRequest();
        request.open("GET", "exporters/xsltml/mmltex.xsl", false);
        request.send(null);
        stylesheet = request.responseXML;
        delete request;
    }
    else {
        throw "Unknown exporter: " + argString;
    }

    // Create new document, since cleanSubtreeOfDocument requires
    // a document.
    var doc = document.implementation.createDocument(null, null, null);
    var rootNode = doc.importNode(mode.equationEnv.equation, true);
    doc.appendChild(rootNode);
    mode.equationEnv.cleanSubtreeOfDocument(doc, rootNode);

    // Prepare the processor
    var processor = new XSLTProcessor();
    processor.importStylesheet(stylesheet);
    
    // Do the tranformation
    var resultDoc = processor.transformToDocument(doc);

    // Serialize the result
    var serialized;
    if (resultDoc.documentElement.nodeName == "transformiix:result") {
        // The output of the transformation is text.
        // XXX: Is the above comparison correct?
        serialized = resultDoc.documentElement.textContent;
    }
    else {
        // The output of the transformation is XML
        var serializer = new XMLSerializer();
        serialized = serializer.serializeToString(resultDoc);
    }

    mode.equationEnv.notificationDisplay.textContent = serialized;
    return true;
}

function editModeCommand_newEquation(mode) {
    mode.editor.newEquation(null);
    return true;
}

function editModeCommand_load(mode, argString) {
    mode.editor.loadURI(argString);
    return true;
}
function editModeCommand_loadById(mode, argString) {
    var inf = argString.match(/^(\S+)\s(.*)$/);
    if (!inf) { throw "Wrong argument format" }
    var uri = inf[1];
    var id = inf[2];
    mode.editor.loadURI(uri, id);
    return true;
}
function editModeCommand_loadByXPath(mode, argString) {
    var inf = argString.match(/^(\S+)\s(.*)$/);
    if (!inf) { throw "Wrong argument format" }
    var uri = inf[1];
    var xpathString = inf[2];
    mode.editor.loadURI(uri,null,xpathString);
    return true;
}
function editModeCommand_loadAll(mode, argString) {
    mode.editor.loadURI(argString,null,"//m:math");
    return true;
}

function editModeCommand_save(mode, argString) {
    mode.equationEnv.save(argString); // argString may be null
    return true;
}

function editModeCommand_saveAll(mode, argString) {
    mode.editor.equations.forEach(function (e) {
        e.save();
    });
    return true;
}

function editModeCommand_close(mode, argString, forceFlag) {
    mode.equationEnv.close(forceFlag);
    return true;
}

function editModeCommand_nextEquation(mode) {
    if (mode.editor.focus >= mode.editor.equations.length-1) { 
        mode.editor.moveFocusTo(0)
    }
    else {
        mode.editor.moveFocusTo(mode.editor.focus+1);
    }
    return true;
}

function editModeCommand_previousEquation(mode) {
    if (mode.editor.focus <= 0) { 
        mode.editor.moveFocusTo(mode.editor.equations.length-1);
    }
    else {
        mode.editor.moveFocusTo(mode.editor.focus-1);
    }
    return true;
}

function editModeCommand_help(mode, argString) {
    var args = argString.split(/\s+/);
    if (args[0] == "tutorial") {
        window.open("doc/tutorial.xhtml", "_blank");
    }
    else if (args[0] == "element") {
        if (args[1] == null) { args[1] = mode.cursor.localName }
        if (elementDescriptions[args[1]]) {
            window.open(elementDescriptions[args[1]].help, "_blank");
        }
        else {
            throw "No description found for element " + args[1];
        }
    }
    else {
        window.open("doc/index.xhtml", "_blank");
    }
    return true;
}

function editModeCommand_putAfter(mode,commandString,args) {
    var registerName = "";
    if (args != null) { registerName = args[0]; }
    var position = mml_nextSibling(mode.cursor);
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,mode.cursor.parentNode);
    mode.editor.registers[registerName].content.forEach(function (e) {
        mode.cursor.parentNode.insertBefore(e.cloneNode(true), position);
    });
    change.recordAfter(mode.equationEnv.equation,mode.cursor.parentNode);
    mode.equationEnv.history.reportChange(change);
    // Put cursor on the last inserted element
    mode.moveCursor(position ? mml_previousSibling(position) : mml_lastChild(mode.cursor.parentNode));
    return true;
}

function editModeCommand_putBefore(mode,commandString,args) {
    var registerName = "";
    if (args != null) { registerName = args[0]; }
    var position = mode.cursor;
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,mode.cursor.parentNode);
    mode.editor.registers[registerName].content.forEach(function (e) {
        mode.cursor.parentNode.insertBefore(e.cloneNode(true), position);
    });
    change.recordAfter(mode.equationEnv.equation,mode.cursor.parentNode);
    mode.equationEnv.history.reportChange(change);
    // Put cursor on the last inserted element
    mode.moveCursor(position ? mml_previousSibling(position) : mml_lastChild(mode.cursor.parentNode));
    return true;
}

function editModeCommand_putIn(mode,commandString,args) {
    // Put the content of a register into an _empty_ element
    var registerName = "";
    if (args != null) { registerName = args[0]; }
    var position = null;
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,mode.cursor);
    mode.editor.registers[registerName].content.forEach(function (e) {
        mode.cursor.insertBefore(e.cloneNode(true), position);
    });
    change.recordAfter(mode.equationEnv.equation,mode.cursor);
    mode.equationEnv.history.reportChange(change);
    // Put cursor on the last inserted element
    mode.moveCursor(mml_lastChild(mode.cursor));
    return true;
}

function editModeCommand_mrowEnvelop(mode,commandString,args,userSelection) {
    // Put an mrow element around the selection
    var change = mode.equationEnv.history.createChange();
    var parentNode = userSelection.startElement.parentNode;
    var positionInParentNode = userSelection.endElement.nextSibling;
    change.recordBefore(mode.equationEnv.equation,parentNode);

    var newMrow = document.createElementNS(NS_MathML, "mrow");
    
    // Fill the new mrow
    var pos = userSelection.startElement;
    while (pos != userSelection.endElement) {
        var nextPos = mml_nextSibling(pos);
        newMrow.appendChild(pos);
        pos = nextPos;
    }
    newMrow.appendChild(userSelection.endElement);

    // Put the mrow where it belongs
    parentNode.insertBefore(newMrow, positionInParentNode);

    change.recordAfter(mode.equationEnv.equation,parentNode);
    mode.equationEnv.history.reportChange(change);
    // Put cursor on the last inserted element
    mode.moveCursor(newMrow);
    return true;
}

function editModeCommand_copyToRegister(mode,commandString,args,userSelection) {
    var registerName = "";
    if (args != null) { registerName = args[0]; }
    var from = userSelection.startElement; // \ Those two must be siblings, in the right order!
    var to = userSelection.endElement;     // /
    var registerContent = [];
    mode.hideCursor();
    while (from != to) {
        registerContent.push(from.cloneNode(true));
        from = mml_nextSibling(from);
    }
    registerContent.push(to.cloneNode(true));
    mode.editor.registers[registerName] = new Register (registerName, registerContent);
    mode.showCursor();
    return true;
}

function editModeCommand_startstopUserRecording(name) {

}

function editModeCommand_cycleInsertMode(mode) {
    var current = mode.editor.getOption("currentInsertMode");
    var selectable = mode.editor.getOptionParsed("selectableInsertModes");
    var index = selectable.indexOf(current);
    if (index == selectable.length-1) { current = selectable[0] }
    else if (index >= 0) { current = selectable[index+1] }
    else { current = selectable[0] }
    mode.editor.setOption("currentInsertMode",current);
    mode.equationEnv.notificationDisplay.appendChild(
        document.createTextNode("You changed the insert mode to " + mode.editor.getOption("currentInsertMode"))
    );
    return true;
}

function editModeCommand_set(mode, argString) {
    var args = argString.match(/^(global )?([^=\s]+)(=(.*))?$/);
    if (!args) { throw "I do not understand " + argString; }
    var global = args[1];
    var key = args[2];
    var value = args[4];
    if (value!==undefined) {
        // set the option
        mode.editor.setOption(key,value,global?true:false);
    }
    else {
        // Only show the user the current setting
        value = mode.editor.getOption(key);
        mode.equationEnv.notificationDisplay.textContent = value;
    }
    return true;
}

