/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */


if (window.GemsePEditor) { GemsePEditor.knownClasses.push(EditMode) }

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
     * Options object
     * @const
     */
    this.o = editor.optionsAssistant.obtainOptionsObject(EditMode);
    /**
     * The equation environment this object belongs to
     * @constant
     */
    this.equationEnv = equationEnv;
    this.d = this.equationEnv.document;
    this.commandHandler = new CommandHandler(this,editModeCommandOptions,editModeCommands);
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
     * Moves the cursor to another element.
     * @param element destination element
     */
    moveCursor: function(element) {
        this.hideCursor();
        this.cursor = element;
        this.showCursor();
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
     * called if the input buffer changes. It does not parse the
     * command itself but uses the CommandHandler.
     * @returns true if a command was removed from the input buffer.
     *          If there was nothing removed, that is, there was no
     *          complete command, false is returned.
     */
    inputHandler: function() {
        this.commandHandler.selection = 
            this.userSelectionForNextCommand || { startElement: this.cursor, endElement: this.cursor };
        var instance = this.commandHandler.parse();
        if (!instance.isReadyToExecute) { return false }
        this.userSelectionForNextCommand = null;
        instance.execute();
        return true;
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
        this.hideCursor();
        this.infoAboutCalledMode = {
            change: manualChange || this.equationEnv.history.createChange(),
            changeElement: manualChangeElement || this.equationEnv.equation
        };
        if (!manualChange) {
            this.infoAboutCalledMode.change.recordBefore(this.equationEnv.equation,this.infoAboutCalledMode.changeElement);
        }
        var editModeClass = this.o.insertMode;
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
        this.showCursor();
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
        this.cursor = this.d.evaluate(".//.[@internal:selected='editcursor']", this.equationEnv.equation, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
        if (!this.cursor) { this.cursor = this.equationEnv.equation }
    },
}

/**
 * Handlers for options that the edit mode provides. They contain
 * default values, validators, parsers.
 */
EditMode.gemseOptions = {
}

/* Some tools used by the Commands */

/**
 * Copies a sequence of elements to a register
 * @param mode
 * @param selection   An object descrbing the selection. (As given by
 *                    instance.selection.)  
 * @param resiterName If this is missing or
 *                    undefined, the default register * is used.

 */
function editModeTool_copySelectedElementsToRegister(mode,selection,registerName) {
    var from = selection.startElement; // \ Those two must be siblings, in the right order!
    var to = selection.endElement;     // /
    var registerContent = [];
    mode.hideCursor();
    while (from != to) {
        registerContent.push(from.cloneNode(true));
        from = mml_nextSibling(from);
    }
    registerContent.push(to.cloneNode(true));
    if (registerName) { // If an explicit register is given
        mode.editor.registerManager.set(registerName, new RegisterData(registerName, registerContent));
    }
    // Always fill the default register, like vim does
    mode.editor.registerManager.set('"', new RegisterData('"', registerContent));
    mode.showCursor();
    return true;
}

/* Execution handler for movement commands */

function editModeExecutionHandler_movement(mode,instance) {
    var destination = instance.implementation(mode,mode.cursor);
    if (destination) { mode.moveCursor(destination) }
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

function editModeCommand_followRef(mode, currentElement) {
    var destID;
    var destElement = null;
    if (destID = currentElement.getAttribute("xref")) {
        destElement = mode.d.evaluate(".//.[@id='"+destID+"' or @xml:id='"+destID+"']", mode.equationEnv.equation, standardNSResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
    }
    else if (destID = (currentElement.getAttribute("id")||currentElement.getAttributeNS(NS_XML,"id"))) {
        // Follow backwards
        destElement = mode.d.evaluate(".//.[@xref='"+destID+"']", mode.equationEnv.equation, standardNSResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
    }
    return destElement;
}

function editModeCommand_doNothing(mode,currentElement) {
    return true;
}

function editModeCommand_undo(mode,instance) {
    // The glorious undo
    mode.hideCursor();
    if (!mode.equationEnv.history.goBack(mode.equationEnv)) {
        throw new Error("undo failed");
    }
    return true;
}

function editModeCommand_redo(mode,instance) {
    // The inverse of the glorious undo
    mode.hideCursor();
    if (!mode.equationEnv.history.goForward(mode.equationEnv)) {
        throw new Error("redo failed");
    }
    return true;
}

function editModeCommand_kill(mode,instance) {
    var target = mode.cursor;
    var parentOfTarget = target.parentNode;
    // Copy element to default register
    editModeTool_copySelectedElementsToRegister(mode,{startElement: mode.cursor, endElement: mode.cursor},instance.singleCharacterPreArguments[0]);
    // Delete element under the cursor
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,parentOfTarget);
    mode.moveCursor(mml_nextSibling(target) || mml_previousSibling(target) || parentOfTarget);
    target.parentNode.removeChild(target);
    change.recordAfter(mode.equationEnv.equation,parentOfTarget);
    mode.equationEnv.history.reportChange(change);
    return true;
}

function editModeCommand_delete(mode,instance) {
    var from = instance.selection.startElement; // \ Those two must be siblings, in the right order!
    var to = instance.selection.endElement;     // /
    if (!(from && to)) {
        throw new Error("Delete wants a startElement and an endElement in the selection!");
    }
    var parentOfTargets = instance.selection.startElement.parentNode;
    // Copy the elements we are going to delete
    editModeTool_copySelectedElementsToRegister(mode,instance.selection,instance.singleCharacterPreArguments[0]);
    // Remove the elements
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
    mode.equationEnv.history.reportChange(change);
    return true;
}

function editModeCommand_change(mode,instance) {
    var from = instance.selection.startElement; // \ Those two must be siblings, in the right order!
    var to = instance.selection.endElement;     // /
    if (!(from && to)) {
        throw new Error("Change wants a startElement and an endElement in the selection!");
    }
    var parentOfTargets = instance.selection.startElement.parentNode;
    // Copy elements to be changed to register
    editModeTool_copySelectedElementsToRegister(mode,instance.selection,instance.singleCharacterPreArguments[0]);
    // Make the change
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

function editModeCommand_attributeMode(mode,instance) {
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

function editModeCommand_redisplay(mode) {
    mode.editor.viewsetManager.create();
    return true;
}

function editModeCommand_serialize(mode, instance) {
    var serializer = new XMLSerializer();
    var rootNode;
    if (instance.argument.indexOf("raw") != -1) { //argString contains "raw"
        rootNode = mode.equationEnv.equation;
    }
    else {
        // Create new document, since cleanSubtreeOfDocument requires
        // a document.
        var doc = mode.d.implementation.createDocument(null, null, null);
        rootNode = doc.importNode(mode.equationEnv.equation, true);
        doc.appendChild(rootNode);
        mode.equationEnv.cleanSubtreeOfDocument(doc, rootNode);
    }
    if (instance.argument.indexOf("pretty") != -1) {
        var xmlString = XML(serializer.serializeToString(rootNode)).toXMLString();
    }
    else {
        var xmlString = serializer.serializeToString(rootNode);
    }

    var pre = document.createElementNS(NS_HTML,"pre");
    pre.appendChild(document.createTextNode(xmlString));
    mode.editor.showMessage(pre);
    return true;
}

function editModeCommand_export(mode, instance) {

    // Fetch exporter stylesheet
    var stylesheet;
    if (instance.argument == "tex" || !instance.argument) {
        // Create request
        var request = new XMLHttpRequest();
        request.open("GET", "exporters/xsltml/mmltex.xsl", false);
        request.send(null);
        stylesheet = request.responseXML;
        delete request;
    }
    else {
        throw new Error("Unknown exporter: " + instance.argument);
    }

    // Create new document, since cleanSubtreeOfDocument requires
    // a document.
    var doc = mode.d.implementation.createDocument(null, null, null);
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

    var pre = document.createElementNS(NS_HTML,"pre");
    pre.appendChild(document.createTextNode(serialized));
    mode.editor.showMessage(pre);
    return true;
}

function editModeCommand_newEquation(mode, instance) {
    var rootInfo = /^([^\s]*)\s(.*)$/.exec(instance.argument);
    var root;
    if (rootInfo) {
        var ns = standardNSResolver(rootInfo[1]) || rootInfo[1];
        var name = rootInfo[2];
        root = document.createElementNS(ns, name);
    }
    else if (instance.argument == "m") {
        root = document.createElementNS(NS_MathML, "math");
    }
    else if (instance.argument == "om") {
        root = document.createElementNS(NS_OpenMath, "OMOBJ");
        root.setAttribute("version", "2.0");
    }
    else if (instance.argument == "ntn") {
        root = document.createElementNS(NS_OMDoc, "notation");
        root.appendChild(document.createElementNS(NS_OMDoc, "prototype"));
        root.appendChild(document.createElementNS(NS_OMDoc, "rendering"));
    }
    else {
        root = null;
    }
    mode.editor.newEquation(root);
    return true;
}

function editModeCommand_load(mode, instance) {
    mode.editor.loadURI(instance.argument);
    return true;
}
function editModeCommand_loadById(mode, instance) {
    var inf = instance.argument.match(/^(\S+)\s(.*)$/);
    if (!inf) { throw new Error("Wrong argument format") }
    var uri = inf[1];
    var id = inf[2];
    mode.editor.loadURI(uri, id);
    return true;
}
function editModeCommand_loadByXPath(mode, instance) {
    var inf = instance.argument.match(/^(\S+)\s(.*)$/);
    if (!inf) { throw new Error("Wrong argument format") }
    var uri = inf[1];
    var xpathString = inf[2];
    mode.editor.loadURI(uri,null,xpathString);
    return true;
}
function editModeCommand_loadAll(mode, instance) {
    mode.editor.loadAll(instance.argument);
    return true;
}

function editModeCommand_save(mode, instance) {
    mode.equationEnv.save(instance.argument, instance.forceFlag); // instance.argument may be null
    return true;
}

function editModeCommand_saveAll(mode, instance) {
    mode.editor.equations.forEach(function (e) {
        e.save(null,instance.forceFlag);
    });
    return true;
}

function editModeCommand_close(mode, instance) {
    mode.equationEnv.close(instance.forceFlag);
    return true;
}

function editModeCommand_closeAll(mode,instance) {
    for (var i=mode.editor.equations.length-1;i>=0;--i) {
        mode.editor.equations[i].close(instance.forceFlag);
    }
    return true;
}

function editModeCommand_saveclose(mode, instance) {
    return editModeCommand_save(mode, instance) && editModeCommand_close(mode, instance);
}

function editModeCommand_savecloseAll(mode,instance) {
    return editModeCommand_saveAll(mode, instance) && editModeCommand_closeAll(mode, instance);
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

function editModeCommand_gotoEquation(mode, instance) {
    var num = parseInt(instance.argument);
    if (num < mode.editor.equations.length && num >= 0) { 
        mode.editor.moveFocusTo(num);
    }
    else {
        throw "No such equation";
    }
    return true;
}

function editModeCommand_help(mode, instance) {
    var args = instance.argument.split(/\s+/);
    if (args[0] == "tutorial") {
        window.open("doc/tutorial.xhtml", "_blank");
    }
    else if (args[0] == "element") {
        if (args[1] == null) { args[1] = mode.cursor.localName }
        if (elementDescriptions[args[1]]) {
            window.open(elementDescriptions[args[1]].help, "_blank");
        }
        else {
            throw new Error("No description found for element " + args[1]);
        }
    }
    else if (args[0] == "installation-directory") {
        var p = document.createElementNS(NS_HTML, "p");
        p.appendChild(document.createTextNode("Installation directory of Gemse: "));
        var a = document.createElementNS(NS_HTML, "a");
        a.setAttribute("href", "file://" + mode.editor.installationDirectory.path);
        a.appendChild(document.createTextNode(mode.editor.installationDirectory.path));
        p.appendChild(a);
        mode.editor.showMessage(p);
    }
    else if (args[0]) {
        mode.editor.showMessage("'" + args[0] + "' is no legal argument for :help. " +
                                "Available arguments: tutorial, element, installation-directory. " +
                                "Use ':help' without argument to open the main help page.");
    }
    else {
        window.open("doc/index.xhtml", "_blank");
    }
    return true;
}

function editModeCommand_example(mode, instance) {
    var base = window.document.documentURI.substring(0, window.document.documentURI.lastIndexOf("/")) + "/";
    var exampleBase = base + "doc/examples/";
    mode.editor.loadURI(exampleBase + instance.argument);
}

function editModeCommand_putAfter(mode,instance) {
    var registerName = instance.singleCharacterPreArguments[0] || '"';
    var position = mml_nextSibling(mode.cursor);
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,mode.cursor.parentNode);
    mode.editor.registerManager.get(registerName).content.forEach(function (e) {
        mode.cursor.parentNode.insertBefore(e.cloneNode(true), position);
    });
    change.recordAfter(mode.equationEnv.equation,mode.cursor.parentNode);
    mode.equationEnv.history.reportChange(change);
    // Put cursor on the last inserted element
    mode.moveCursor(position ? mml_previousSibling(position) : mml_lastChild(mode.cursor.parentNode));
    return true;
}

function editModeCommand_putBefore(mode,instance) {
    var registerName = instance.singleCharacterPreArguments[0] || '"';
    var position = mode.cursor;
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,mode.cursor.parentNode);
    mode.editor.registerManager.get(registerName).content.forEach(function (e) {
        mode.cursor.parentNode.insertBefore(e.cloneNode(true), position);
    });
    change.recordAfter(mode.equationEnv.equation,mode.cursor.parentNode);
    mode.equationEnv.history.reportChange(change);
    // Put cursor on the last inserted element
    mode.moveCursor(position ? mml_previousSibling(position) : mml_lastChild(mode.cursor.parentNode));
    return true;
}

function editModeCommand_putIn(mode,instance) {
    // Put the content of a register into an _empty_ element
    var registerName = instance.singleCharacterPreArguments[0] || '"';
    var position = null;
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,mode.cursor);
    mode.editor.registerManager.get(registerName).content.forEach(function (e) {
        mode.cursor.insertBefore(e.cloneNode(true), position);
    });
    change.recordAfter(mode.equationEnv.equation,mode.cursor);
    mode.equationEnv.history.reportChange(change);
    // Put cursor on the last inserted element
    mode.moveCursor(mml_lastChild(mode.cursor));
    return true;
}

function editModeCommand_unwrap(mode,instance) {
    if (mode.cursor==mode.equationEnv.equation) {
        throw new Error("Unwrap can not be used on root element.")
    }
    var toBeRemoved = mode.cursor;
    var parentNode = toBeRemoved.parentNode;
    var change = mode.equationEnv.history.createChange();
    change.recordBefore(mode.equationEnv.equation,parentNode);
    mode.moveCursor(mml_firstChild(toBeRemoved) || parentNode);

    while (toBeRemoved.hasChildNodes()) {
        parentNode.insertBefore(toBeRemoved.firstChild, toBeRemoved);
    }
    parentNode.removeChild(toBeRemoved);

    mode.showCursor();
    change.recordAfter(mode.equationEnv.equation,parentNode);
    mode.equationEnv.history.reportChange(change);
    return true;
}

function editModeCommand_mrowEnvelop(mode,instance) {
    // Put an mrow or an apply element around the selection
    var change = mode.equationEnv.history.createChange();
    var parentNode = instance.selection.startElement.parentNode;
    var positionInParentNode = instance.selection.endElement.nextSibling;
    change.recordBefore(mode.equationEnv.equation,parentNode);

    // XXX: In order to partially support content, we have to use an
    // apply or OMA element some times. This is a hack which works
    // sometimes, but is completely wrong other times. It is important to
    // be careful that Presentation MathML support does not break.
    var newMrow;
    if (instance.selection.startElement.namespaceURI == NS_OpenMath) {
        newMrow = mode.d.createElementNS(NS_OpenMath, "OMA");
    }
    else if (instance.selection.startElement.localName[1]=="m" || elementDescriptions[instance.selection.startElement.localName]) {
        newMrow = mode.d.createElementNS(NS_MathML, "mrow");
    }
    else {
        newMrow = mode.d.createElementNS(NS_MathML, "apply");
    }
    
    // Fill the new mrow
    var pos = instance.selection.startElement;
    while (pos != instance.selection.endElement) {
        var nextPos = mml_nextSibling(pos);
        newMrow.appendChild(pos);
        pos = nextPos;
    }
    newMrow.appendChild(instance.selection.endElement);

    // Put the mrow where it belongs
    parentNode.insertBefore(newMrow, positionInParentNode);

    change.recordAfter(mode.equationEnv.equation,parentNode);
    mode.equationEnv.history.reportChange(change);
    // Put cursor on the last inserted element
    mode.moveCursor(newMrow);
    return true;
}

function editModeCommand_copyToRegister(mode,instance) {
    return editModeTool_copySelectedElementsToRegister(mode,instance.selection,instance.singleCharacterPreArguments[0]);
}

function editModeCommand_startstopUserRecording(mode,instance) {

}

function editModeCommand_cycleInsertMode(mode) {
    var current = mode.o["_currentInsertMode"];
    var selectable = mode.o.selectableInsertModes;
    var index = selectable.indexOf(current);
    if (index == selectable.length-1) { current = selectable[0] }
    else if (index >= 0) { current = selectable[index+1] }
    else { current = selectable[0] }
    mode.editor.optionsAssistant.set("currentInsertMode",current);
    mode.editor.showMessage("You changed the insert mode to " + current);
    return true;
}

function editModeCommand_contentInfo(mode) {
    // TODO: Improve that
    var s = "Contents: <";
    var content = new String(mode.cursor.textContent);
    for (var i = 0; i < content.uLength; ++i) {
        if (i>0) { s += ", " }
        s += "U+" + content.uCharCodeAt(i).toString(16) + " ";
        s += ucd.lookupName(content.uCharAt(i));
    }
    s += ">";
    var code = document.createElementNS(NS_HTML, "code");
    code.appendChild(document.createTextNode(s));
    mode.editor.showMessage(code);
    return true;
}

function editModeCommand_showView(mode, instance) {
    if (instance.argument == "all") {
        mode.editor.viewsetManager.showAllViews();
    }
    else {
        mode.editor.viewsetManager.showView(instance.argument);
    }
    return true;
}

function editModeCommand_hideView(mode, instance) {
    mode.editor.viewsetManager.hideView(instance.argument);
    return true;
}

function editModeCommand_chooseViewset(mode, instance) {
    if (instance.argument) {
        mode.editor.viewsetManager.chooseViewset(instance.argument);
    }
    else {
        // Present an overview of the available viewsets
        var table = document.createElementNS(NS_HTML, "table");
        var caption = document.createElementNS(NS_HTML, "caption");
        caption.appendChild(document.createTextNode("available viewsets"));
        table.appendChild(caption);
        var head = document.createElementNS(NS_HTML, "tr");
        var th = document.createElementNS(NS_HTML, "th");
        th.appendChild(document.createTextNode("name"));
        head.appendChild(th);
        var th = document.createElementNS(NS_HTML, "th");
        th.appendChild(document.createTextNode("description"));
        head.appendChild(th);
        table.appendChild(head);
        
        mode.editor.viewsetManager.viewsets.forEach(function (viewset) {
            var tr = document.createElementNS(NS_HTML, "tr");
            var td = document.createElementNS(NS_HTML, "td");
            td.appendChild(document.createTextNode(viewset.getAttribute("name")));
            tr.appendChild(td);
            var td = document.createElementNS(NS_HTML, "td");
            td.appendChild(document.createTextNode(viewset.getAttribute("description")));
            tr.appendChild(td);
            table.appendChild(tr);
        });

        mode.editor.showMessage(table);
    }
    return true;
}

function editModeCommand_viewsetconfWindow(mode, instance) {
    if (instance.argument=="close") {
        mode.editor.viewsetManager.closeConfWindow();
    }
    else {
        mode.editor.viewsetManager.openConfWindow();
    }
    return true;
}

function editModeCommand_printWorkingDirectory(mode, instance) {
    mode.editor.showMessage(mode.editor.workingDirectory);
    return true;
}

function editModeCommand_changeWorkingDirectory(mode, instance) {
    var absolute = mode.editor.makeURIAbsolute(instance.argument)
    if (absolute[absolute.length-1]!="/") { absolute += "/" }

    // If it is a file URL, check whether the file exists and is a
    // directory
    var ios;
    ios = Components.classes["@mozilla.org/network/io-service;1"].
                    getService(Components.interfaces.nsIIOService);
    var uri = ios.newURI(absolute,null,null);
    if (uri.scheme == "file") {
        file = uri.QueryInterface(Components.interfaces.nsIFileURL).file
        if (!file.exists()) {
            throw new Error("Directory " + absolute + " does not exist.");
        }
        else if (!file.isDirectory()) {
            throw new Error(absolute + " is not a directory.");
        }
    }

    // Set directory
    mode.editor.workingDirectory = absolute;
    return true;
}

function editModeCommand_set(mode, instance) {
    // TODO: Use parameter parsing facility from the CommandHandler
    // instead of doing our own. Problem: set global?
    var args = instance.argument.match(/^((all )|(-))?([^=\s]+)(=(.*))?$/);
    if (!args) { throw new Error("I do not understand " + instance.argument); }
    var eqindep = args[2];
    var remove = args[3];
    var key = args[4];
    var value = args[6];
    if (remove) {
        mode.editor.optionsAssistant.remove(key,null,null,eqindep ? false : true);
    }
    else if (value!==undefined) {
        // set the option
        mode.editor.optionsAssistant.set(key,value,null,null,eqindep ? false : true);
    }
    else {
        // Only show the user the current setting
        value = mode.editor.o["_" + key];
        mode.editor.showMessage("about option " + key + ": [" + mode.editor.optionsAssistant.inheritanceInfo(key,null,null,true) + "]");
    }
    return true;
}

function editModeCommand_printDocumentInformation(mode, instance) {
    mode.editor.showMessage("This equation is stored in: " + mode.equationEnv.origin.storage.toString());
    return true;
}

function editModeCommand_printAllDocumentInformation(mode, instance) {
    var mainDiv = document.createElementNS(NS_HTML, "div");
    var equationTable = document.createElementNS(NS_HTML, "table");
    var equationTableCaption = document.createElementNS(NS_HTML, "caption");
    equationTableCaption.appendChild(document.createTextNode("Equations"));
    equationTable.appendChild(equationTableCaption);
    var storageTable = document.createElementNS(NS_HTML, "table");
    var storageTableCaption = document.createElementNS(NS_HTML, "caption");
    storageTableCaption.appendChild(document.createTextNode("Documents"));
    storageTable.appendChild(storageTableCaption);
    mainDiv.appendChild(equationTable);
    mainDiv.appendChild(storageTable);

    var tr;
    var th;
    var td;

    tr = document.createElementNS(NS_HTML, "tr");
    th = document.createElementNS(NS_HTML, "th");
    th.appendChild(document.createTextNode("number"));
    tr.appendChild(th);
    th = document.createElementNS(NS_HTML, "th");
    th.appendChild(document.createTextNode("unsaved changes"));
    tr.appendChild(th);
    th = document.createElementNS(NS_HTML, "th");
    th.appendChild(document.createTextNode("read only"));
    tr.appendChild(th);
    th = document.createElementNS(NS_HTML, "th");
    th.appendChild(document.createTextNode("document"));
    tr.appendChild(th);
    equationTable.appendChild(tr);

    for (var i=0; i<mode.editor.equations.length; ++i) {
        var eq = mode.editor.equations[i];
        tr = document.createElementNS(NS_HTML, "tr");
        td = document.createElementNS(NS_HTML, "td");
        td.appendChild(document.createTextNode(i));
        tr.appendChild(td);
        td = document.createElementNS(NS_HTML, "td");
        td.appendChild(document.createTextNode(eq.history.hasChanges() ? "yes" : ""));
        tr.appendChild(td);
        td = document.createElementNS(NS_HTML, "td");
        td.appendChild(document.createTextNode(eq.readOnly ? "yes" : ""));
        tr.appendChild(td);
        td = document.createElementNS(NS_HTML, "td");
        td.appendChild(document.createTextNode(eq.origin ?  eq.origin.storage.toString() : ""));
        tr.appendChild(td);
        equationTable.appendChild(tr);
    }

    tr = document.createElementNS(NS_HTML, "tr");
    th = document.createElementNS(NS_HTML, "th");
    th.appendChild(document.createTextNode("document"));
    tr.appendChild(th);
    th = document.createElementNS(NS_HTML, "th");
    th.appendChild(document.createTextNode("used by equations"));
    tr.appendChild(th);
    storageTable.appendChild(tr);

    for (var i=0; i<mode.editor.storages.length; ++i) {
        var storage = mode.editor.storages[i];
        var usedBy = [];
        for (var eqn = 0; eqn < mode.editor.equations.length; ++eqn) {
            var eq = mode.editor.equations[eqn]
            if (eq.origin && eq.origin.storage === storage) {
                usedBy.push(eqn);
            }
        }
        tr = document.createElementNS(NS_HTML, "tr");
        td = document.createElementNS(NS_HTML, "td");
        td.appendChild(document.createTextNode(storage.toString()));
        tr.appendChild(td);
        td = document.createElementNS(NS_HTML, "td");
        td.appendChild(document.createTextNode(usedBy.join(", ")));
        tr.appendChild(td);
        storageTable.appendChild(tr);
    }

    mode.editor.showMessage(mainDiv);
    return true;
}

