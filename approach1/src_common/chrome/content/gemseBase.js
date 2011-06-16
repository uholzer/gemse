/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */

/**
 * @class Environment for an equation
 * @param editor The editor object the new environment will belong to
 * @param container The DOM element that will contain this environment
 */
function EquationEnv(editor, equation) {
    /** @private */
    this.editor = editor;

    var nsResolver = standardNSResolver;

    /**
     * Document that holds the equation.
     */
    this.document = document.implementation.createDocument(null,null,null);
    equation = this.document.adoptNode(equation); // XXX: Or better importNode?
    this.document.appendChild(equation);

    /**
     * Where the equation originates from.
     * The origin is an object that describes where exactly the
     * equation has been loaded from. If there is no origin, this
     * property should be set to null. This may happen for example
     * when the user creates a new equation. The write command uses
     * this property to find out where to write the equation by
     * default. This description of the origin must be stable in the
     * sense, that it must stay valid even if other equations in the
     * same document are modified.
     * (How this object has to look like is defined by the save method
     * below.)
     */
    this.origin = null;

    /**
     * True when the user has opened the equation read only.
     */
    this.readOnly = false;

    /**
     * Local options.
     * Options that are locally set for this equationEnv. A mode
     * should not read or write this array directly, it should use
     * getOption() and setOption() from the editor object.
     */
    this.options = [];

    /**
     * The change history of this equation
     */
    this.history = new History;   // An array of Change Elements

    /**
     * The stack of modes.
     * @private
     */
    this.modeStack = [new EditMode(editor, this)];
}
EquationEnv.prototype = {
    /**
     * Root element of the equation.
     */
    get equation() {
        return this.document.documentElement;
    },
    set equation(e) {
        this.document.replaceChild(e, this.document.firstChild);
    },

    /** 
     * Replaces a currently open equation with a different one.
     * You must not set this.equation directly. You must use
     * this method instead. You also have to call reInit of
     * the current mode afterwards.
     * XXX: Should get rid of this method?
     * @param e the root node of the new equation
     */
    replaceEquation: function(e) {
        this.equation = e;
    },

    /**
     * Does inportant initialisation and must be called after creating
     * the object.
     */
    init: function() {
        this.mode.init();
    },

    /**
     * Starts a new mode on top of the current one. When the new mode
     * terminates, the control is returned to the current mode.
     * @param mode properly created and initialized mode
     */
    callMode: function (mode) {
        this.modeStack.push(mode);
    },
    /**
     * Replaces the current mode with a new one. If the current mode
     * is the topmost mode, the new mode is not allowed to terminate.
     * Otherwise, when the new mode terminates, control is returned to
     * the parent mode of the current mode.
     * @param mode properly created and initialized mode
     */
    switchMode: function (mode) {
        this.modeStack[this.modeStack.length-1] = mode;
    },
    /**
     * Closes the current mode and returns control to its parent mode.
     * A must be ready to terminate before calling this method.
     * @param returnValue A value returned by the current mode to the
     *                    parent mode. This value may be of any type,
     *                    but the parent mode must know how to handle
     *                    it.
     */
    finishMode: function (returnValue) {
        // Closes the curent mode and reverts to the old one
        this.modeStack.pop();
        this.modeStack[this.modeStack.length-1].calledModeReturned(returnValue);
    },
    /**
     * The current mode
     */
    get mode() { return this.modeStack[this.modeStack.length-1]; },

    /**
     * Turns an URI given as string into an URI object of the
     * nsIIOService. Relative URIs are considered to be relative to
     * the working directory of this equation.
     * @param {String} s the URI as string, may be relative
     */
    stringToURI: function(s) {
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
        return ios.newURI(s,null,ios.newURI(this.editor.workingDirectory,null,null));
    },
    /**
     * Removes all attributes in the internal namespace. This method
     * must be applied on a subtree of a document.
     * @param root The root element of the subtree
     */
    cleanSubtree: function(root) {
        // Kills all attributes in the internal namespace
        // (Using TreeWalker, since createNodeIterator has been
        // introduced in firefox 3.1)
        // TODO: How to remove namespace declarations?
        var iterator = root.ownerDocument.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT,
            { acceptNode: function(node) { return NodeFilter.FILTER_ACCEPT } },
            false
        );
        var n = iterator.currentNode;
        while (n) {
            var attrs = n.attributes;
            if (attrs) {
                // It seems that the property "attributes" of document
                // objects are sometimes undefined in firefox. That's
                // the reason for this if.
                for (var i=0; i < attrs.length; ++i) {
                    if (attrs[i].namespaceURI == NS_internal) { n.removeAttributeNode(attrs[i]) }
                }
            }
            n =  iterator.nextNode();
        }
    },
    /**
     * Removes all attributes in the internal namespace. This method
     * must be applied on a subtree of a document.
     * This method is deprecated, use cleanSubtree instead.
     * @param doc  The document that contains the subtree
     * @param root The root node of the subtree
     */
    cleanSubtreeOfDocument: function(doc,root) {
        return this.cleanSubtree(root);
    },
    /**
     * Saves the equation, as it currently looks like, to disk or to a remote
     * server.
     * @param destinationURIString URI where the equation should be
     *                             saved. If this is missing, the
     *                             default location will be used.
     *                             This is usually where the equation
     *                             has been saved to the last time or
     *                             where it was loaded from.
     * @param force Causes the equation to be saved, even if the user
     *              has opened it or the destination file has changed
     *              by another application.
     */
    save: function(destinationURIString, force) {
        // Saves the equation to its origin if destination is empty.
        // Otherwise it will save it to destinationURI, creating a new
        // XML file with the math element as a root node. 

        var root = this.equation.cloneNode(true);
        this.cleanSubtreeOfDocument(this.document, root);

        if (this.readOnly && !force) {
            throw new Error("Refused to save the equation, because it is opened read only.");
        }
        else if (this.readOnly && force) {
            this.readOnly = false;
        }

        if (destinationURIString) {
            destinationURIString = this.editor.makeURIAbsolute(destinationURIString);

            var storage = this.editor.newDocStorageByURI(destinationURIString);
            if (storage.exists()==1 && !force) {
                throw new Error("The location you want to save to already exists.");
            }
            root = storage.document.adoptNode(root);
            storage.document.appendChild(root);
            this.origin = new StorageLink(storage, root);
            this.editor.storages.push(storage);
            this.editor.freeUnusedDocStorage();
            storage.write();
        }
        else {
            if (!this.origin) {
                throw new Error("This is a new equation and the location where it has to be saved is unknown.");
            }
            if (this.origin.storage.readOnly()==1) {
                throw new Error("This resource can not be written, maybe because of missing write privileges.");
            }
            if (this.origin.storage.hasChanged()==1 && !force) {
                throw new Error("The destination resource has changed since you loaded/wrote this equation the last time. Use force to write anyway.");
            }
            root = this.origin.storage.document.adoptNode(root);
            this.origin.node.parentNode.replaceChild(root, this.origin.node);
            this.origin.node = root;
            this.origin.storage.write();
        }

        // Tell the history object that we saved the current state
        this.history.reportSaving();

        this.editor.showMessage("Successfully saved in " + this.origin.storage.toString());
    },
    /**
     * Closes this equation if there are no unsaved changes or if
     * force is set to true
     * @param {Boolean} force if true, the equation is closed even if there are
     *                  unsaved changes.
     */
    close: function(force) {
        // Closes this equation environment if their are no unsaved
        // changes or if force is set to true

        // Check whether there are unsaved changes
        if (this.history.hasChanges() && !force) {
            return false;
            this.editor.showMessage("Neglected to close equation, since it has unsaved changes.");
        }

        // close
        this.editor.eliminateEquationEnv(this);
    },
}

/**
 * @class Manages the registers (sort of internal clipboards) for the
 * GemseEditor. 
 * The register * denotes the system clip board. So reading this
 * register actually reads the system clipboard, setting it writes to
 * the system clipboard.
 */
function RegisterManager() {
    /**
     * Holds the data of internal regisers, that is, all registers
     * except *.
     */
    this.internal = {};
}
RegisterManager.prototype = {
    set: function(name, data) {
        if (name == "*") {
            this.setSystemClipboard(data);
        }
        else {
            this.internal[name] = data;
        }
    },
    get: function(name) {
        if (name == "*") {
            return this.getSystemClipboard();
        }
        else {
            return this.internal[name];
        }
    },
    /**
     * Get data from system clipboard and create a RegisterData object
     * for it.
     * This is implemented according to
     * https://developer.mozilla.org/En/Using_the_Clipboard
     * @private
     */
    getSystemClipboard: function() {
        var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
        if (!clip) throw new Error("Error while obtaining clipboard component");
        var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
        if (!trans) throw new Error("Error while obtaining transferable component");
        trans.addDataFlavor("text/unicode"); //XXX: Should be application/mathml+xml

        clip.getData(trans, clip.kGlobalClipboard);
        var str       = new Object();
        var strLength = new Object();
        trans.getTransferData("text/unicode", str, strLength);
        str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
        var dataString = str.data.substring(0, strLength.value / 2);

        var parser = new DOMParser();
        var clipboardDOM = parser.parseFromString(dataString, "text/xml");

        var registerData;
        if (clipboardDOM.documentElement.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml") {
            throw new Error("An error occured while parsing the clipboard content:\n"
                        + clipboardDOM.documentElement.textContent);
        }
        else if (clipboardDOM.documentElement.localName == "math" && clipboardDOM.documentElement.namespaceURI == NS_MathML) {
            // Put the child elements into an array
            var arrayOfElements = [];
            for (i=0; i < clipboardDOM.documentElement.childNodes.length; ++i) {
                arrayOfElements.push(clipboardDOM.documentElement.childNodes[i]);
            }
            registerData = new RegisterData('*',arrayOfElements);
        }
        else {
            registerData = new RegisterData('*',[clipboardDOM.documentElement]);
        }

        return registerData;
    },
    /**
     * Put data on system clipboard from a RegisterData object.
     * This is implemented according to
     * https://developer.mozilla.org/En/Using_the_Clipboard
     * @private
     */
    setSystemClipboard: function(data) {
        if (data.type != "element") { throw new Error("clipboard interaction only supports elements") }

        // Serialize data.content[0]
        var doc = document.implementation.createDocument(null, null, null);
        var rootNode;
        if (data.content.length != 1 || data.content[0].localName != "math" || data.content[0].namespaceURI != NS_MathML) {
            rootNode = doc.createElementNS(NS_MathML, "math");
            data.content.forEach(function(e) {
                rootNode.appendChild(doc.importNode(e, true));
            });
        }
        else {
            rootNode = doc.importNode(data.content[0], true);
        }
        doc.appendChild(rootNode);
        //XXX: mode.equationEnv.cleanSubtreeOfDocument(doc, rootNode);
        var serializer = new XMLSerializer();
        var xmlString = serializer.serializeToString(doc);

        var str = Components.classes["@mozilla.org/supports-string;1"].  
        createInstance(Components.interfaces.nsISupportsString);  
        if (!str) throw new Error("Error while obtaining String component");
          
        str.data = xmlString;  
          
        var trans = Components.classes["@mozilla.org/widget/transferable;1"].  
        createInstance(Components.interfaces.nsITransferable);  
        if (!trans) throw new Error("Error while obtaining transferable component");
          
        trans.addDataFlavor("application/mathml+xml");  
        trans.setTransferData("application/mathml+xml", str, xmlString.length * 2);  
        trans.addDataFlavor("text/unicode");  
        trans.setTransferData("text/unicode", str, xmlString.length * 2);  
          
        var clipid = Components.interfaces.nsIClipboard;  
        var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);  
        if (!clip) throw new Error("Error while obtaining clipboard component");
          
        clip.setData(trans, null, clipid.kGlobalClipboard);  
    },
}

/**
 * @class Stores data (sequence of DOM nodes). It is used when
 * interacting with the RegisterManager, that is, to fill a
 * register or to read a register.
 * @param name the name the user has to use to access this Register,
 * consisting of one unicode character
 * @param content an array of DOM Nodes of the same type
 * @param [type] overrides the automatically detected type of the content
 */
function RegisterData(name, content, type) {
    /** 
     * Name of the register consisting of one unicode character 
     * @type String
     */
    this.name = name; // Should be one unicode character
    /**
     * The data the register is holding. This is an array of DOM nodes
     * of the same type. (Text nodes, elements nodes or attribute
     * nodes)
     */
    this.content = content;

    if (type) {
        this.type = type;
    }
    else if (content.length == 0) {
        this.type = "empty";
    }
    else if (content[0].nodeType == Node.ELEMENT_NODE) {
        this.type = "element";
    }
    else if (content[0].nodeType == Node.ATTRIBUTE_NODE) {
        this.type = "attribute";
    }
    else if (content[0].nodeType == Node.TEXT_NODE) {
        this.type = "text";
    }
}

/**
 * @class An array that holds the whole modification history for an equation. It
 * also makes it possible to move from one point to another in the
 * history, by undoing and reapplying changes. Changes made to the
 * equation must be registered using the methods of the corresponding
 * history object.
 */
function History() {
    /**
     * Current state of the equation. Points always to the last
     * applied change.
     * @private
     */
    this.position = -1; // Alway points to the last change applied
    /**
     * Saved state of the equation. Points always to the last state
     * that equals the state saved to disk. It is -2 if the equation
     * has not yet a saved state, that is, it has not been loaded from
     * disk and not been saved since it was created.
     * @private
     */
    this.savedState = -2; // Always points to the last change saved to disk
        // (Set to -2 so that -1!=-2 at the beginning)
}
History.prototype = {
    /** Go back one step in the history */
    goBack: function (equationEnv) {
        if (this.position < 0) { return false; }
        this[this.position].undo(equationEnv);
        --this.position;
        return true;
    },
    /** Go forward one step in the history */
    goForward: function (equationEnv) {
        if (this.position >= this.length-1) { return false; }
        ++this.position;
        this[this.position].redo(equationEnv);
        return true;
    },
    /** 
     * Used to get a fresh Change object in order to register a
     * change that will be made immediately afterwards.
     */
    createChange: function () {
        return new Change();
    },
    /** 
     * Reports a change that has been successfully commited on the
     * equation. 
     */
    reportChange: function(change) {
        if (!change.ready) { throw new Error("reported change is not ready") }
        this.length = this.position + 1; // Chop off succeeding changes
        this.push(change);
        ++this.position;
    },
    /**
     * Used to report that the equation has been saved, so that the
     * history object always knows whether the equation has changed
     * (relative to the saved verison). This is needed for example to
     * warn the user if there are unsaved changes, before he closes
     * the equation.
     */
    reportSaving: function() {
        // Marks the current state as saved
        this.savedState = this.position;
    },
    /** 
     * Tells whether the equation has been changed and the changes
     * have not yet been saved.
     */
    hasChanges: function() {
        // Returns false if the current state has been written to file
        return !(this.savedState == this.position);
    },
}
History.prototype.__proto__ = new Array();

/**
 * @class A Change object stores the changes made to the equation
 * from one point in the history to the next. It can be used to undo
 * and redo changes. It is also used to report changes.
 * Before modifying the equation, recordBefore has to be called,
 * after modifying, recordAfter has to be called. Afterwards, the
 * object is readyto undo and redo chages.
 */
function Change() {
    // The equation element (or its descendants) is supposed
    // to carry the whole significant mode state, given as
    // attributes in the namespace NS_internal.
    // The method reInit of the mode is called after the
    // change so that the mode can update its data structures
    /**
     * Full copy of the old version of the changed node
     * @private
     */
    this.oldNode = null;
    /**
     * Full copy of the new version of the changed node
     * @private
     */
    this.newNode = null;
    /**
     * DOM node independent pointer to the changed node. This pointer
     * is correct in the version of the equation before the change and
     * also after the change.
     * @private
     */
    this.treePointer = [];
    /**
     * The command that caused the change. It should be set by the
     * user of the Change object. It the future, it will perhaps be
     * used to implement the repeat command '.'.
     */
    this.command = null; // Please set that, otherwise the command '.' will not work
    /**
     * Tells whether this object is ready to perform undo and redo,
     * that is, recordBefore and recordAfter have been successfully
     * performed.
     * @private
     */
    this.ready = false;
}
Change.prototype = {
    /**
     * Undo this change on an equation.
     * Of course, this change must be the last change applied to the
     * equation.
     * @param {EquationEnv} equationEnv The equation environment the undo should be
     *                                  applied to
     */
    undo: function (equationEnv) {
        var equation = equationEnv.equation;
        if (!this.ready) {
            throw new Error("This Change instance is not ready for undo or redo");
        }
        var current = this.applyTreePointer(equation, this.treePointer);
        if (current == equation) {
            // special situation since the whole equation gets _replaced_
            equationEnv.replaceEquation(this.oldNode.cloneNode(true));
        }
        else {
            current.parentNode.replaceChild(this.oldNode.cloneNode(true), current);
            // Hint: It is replaceChild(newChild, oldChild), not the other way around
        }
        equationEnv.mode.reInit();
        return true;
    },
    /**
     * Reapply this change on an equation.
     * The last change applied to the equation must be the change
     * preceding this change in the history of the equation.
     * @param {EquationEnv} equationEnv The equation environment the redo should be
     *                                  applied to
     */
    redo: function (equationEnv) {
        var equation = equationEnv.equation;
        if (!this.ready) {
            throw new Error("This Change instance is not ready for undo or redo");
        }
        var current = this.applyTreePointer(equation, this.treePointer);
        if (current == equation) {
            // special situation since the whole equation gets _replaced_
            equationEnv.replaceEquation(this.newNode.cloneNode(true));
        }
        else {
            current.parentNode.replaceChild(this.newNode.cloneNode(true), current);
            // Hint: It is replaceChild(newChild, oldChild), not the other way around
        }
        equationEnv.mode.reInit();
        return true;
    },
    /**
     * Record the state of the equation before a change.
     * Right before making a change that the user should be able to undo,
     * this method has to be called.
     * @param equation The equation that is going to be changed
     * @param toBeChangedElement A DOM element node that is going to
     *                           be changed. Important: This node must
     *                           only be changed, not replaced. If
     *                           your replace a node, you have to take
     *                           the parent node as changed element!
     */
    recordBefore: function (equation,toBeChangedElement) {
        if (toBeChangedElement.nodeType != Node.ELEMENT_NODE) {
            throw new Error("Only element nodes can be recorded.");
        }
        // Derive a pointer into the tree where the element is located
        this.treePointer = this.deriveTreePointer(equation, toBeChangedElement);

        // For debugging
        if (this.applyTreePointer(equation, this.treePointer) != toBeChangedElement) {
            throw new Error("Tree pointer does not resolve to the element it has been creted for. (Bug in implementation.) "
                + "applyTreePointer returns a " + this.applyTreePointer(equation, this.treePointer).localName
                + " expected is a " + toBeChangedElement.localName);
        }

        // Make deep copy
        this.oldNode = toBeChangedElement.cloneNode(true);
    },
    /**
     * Record the state of an equation after a change.
     * Right after making a change that the user should be able to
     * undo, this method must be called.
     * @param equation The equation that hass been changed
     * @param changedElement The same DOM element node that has been
     *                       given to the recordBefore method. If it
     *                       is detected that an other node has been
     *                       given, an error is thrown.
     */
    recordAfter: function (equation,changedElement) {
        if (changedElement.nodeType != Node.ELEMENT_NODE) {
            throw new Error("Only element nodes can be recorded.");
        }
        // Check the pointer, it must be the same as computed
        // by recordBefore().
        if (this.treePointer.join(',') != this.deriveTreePointer(equation, changedElement).join(',')) {
            throw new Error("Position of the element is not the same as recorded before: "
                + this.treePointer.join(',') + " != " + this.deriveTreePointer(equation, changedElement).join(','));
        }

        // Make deep copy
        this.newNode = changedElement.cloneNode(true);

        // Flag this object as ready for undo and redo
        this.ready = true;
    },
    /**
     * Creates a pointer into the tree of an equation independent of
     * the DOM nodes. This is usefull when you need to point to an
     * element of an equation, but the DOM nodes may change, for
     * example because an equation gets replaced by an identical copy
     * of it. This is needed by the Change object, since recorded
     * Changes are full copies of a subtree of the equation and
     * undoing or redoing changes replaces nodes with such copies.
     * @private
     * @returns Tree pointer which is an array of integers
     */
    deriveTreePointer: function (equation, target) {
        var pointer = [];
        // We go from the target _backwards_ to the equation node
        while (equation != target) {
            var siblingNumber = 0;
            var sibling = target;
            while (sibling = sibling.previousSibling) { ++siblingNumber; }
            pointer.unshift(siblingNumber);
            target = target.parentNode;
        }
        return pointer;
    },
    /**
     * Finds the DOM node in an equation a pointer obtained by
     * deriveTreePointer points to.
     * @private
     * @returns A DOM node
     */
    applyTreePointer: function (equation, pointer) {
        var target = equation;
        pointer.forEach(function(siblingNumber) {
            target = target.childNodes[siblingNumber];
        });
        return target;
    },
}

/**
 * @class Manages viewsets.
 */
function ViewsetManager(editor,dock) {
    this.editor = editor;
    /**
     * The DOM element that acts as the dock, that is the element that
     * contains the current viewset.
     */
    this.dock = dock;
    /**
     * List of DOM elements which are viewsets
     */
    this.viewsets = [];
    /**
     * Contains the view objects of the current view used.
     * They have to be recreated when
     * - the focus is moved to another equation
     * - The viewset is changed
     */
    this.views = [];
    /**
     * The viewset to be used.
     * In the future, the user will be able to use different viewsets
     * for different formulas or modes.
     * @private
     */
    this.globalViewsetNumber = 0;
    /*
     *
     */
    this.confWindow = null;
}
ViewsetManager.viewClasses = {};
ViewsetManager.prototype = {
    /**
     * Maps names of classes (strings) to the constructor function.
     * Every view must be registered here.
     * XXX: To be stored somewhere else?
     * @private
     */
    viewClasses: ViewsetManager.viewClasses,
    /**
     * Builds all views.
     * It loops over all views of the current viewset and calls there
     * build method.
     */
    build: function() {
        this.views.forEach(function (v) { v.build() });
    },
    /**
     * Creates the views of a viewset
     */
    create: function() {
        // Find out which viewset to use
        this.decideViewset();
        var viewsetNumber = this.globalViewsetNumber;
        if (!this.viewsets[viewsetNumber]) {
            throw new Error("There is no viewset with number " + viewsetNumber);
        }
        // Get rid of current views
        this.views = [];
        // Clear the dock
        xml_flushElement(this.dock);
        // Make deep copy of the viewset
        var newViewset = this.viewsets[viewsetNumber].cloneNode(true);
        // Fill the dock
        var e;
        while (e = newViewset.firstChild) {
            this.dock.appendChild(e);
        }
        // Find the viewport elements
        var viewports = [];
        var xpathResult = document.evaluate(
            ".//*[@internal:function='viewport']", 
            this.dock, 
            standardNSResolver, 
            XPathResult.ORDERED_NODE_ITERATOR_TYPE,
            null
        );
        var viewport;
        while (viewport = xpathResult.iterateNext()) { viewports.push(viewport) }
        // Create view objects
        for (var i=0;i<viewports.length;++i) {
            // Find out the class
            var className = viewports[i].getAttributeNS(NS_internal, "viewClass");
            var constructor = this.viewClasses[className];
            if (!constructor) {
                throw new Error("There is no view with the name " + className);
            }
            // Create view
            //XXX: Is this ok?
            var newview = new constructor(this.editor,this.editor.equations[this.editor.focus],viewports[i]);
            this.views.push(newview);
            // Read in options from internal:options attribute of the viewort
            if (viewports[i].hasAttributeNS(NS_internal, "options")) {
                var options = this.parseOptionsString(viewports[i].getAttributeNS(NS_internal, "options"));
                for each (var option in options) {
                    try {
                        this.editor.optionsAssistant.set(option[0],option[1],null,newview);
                    }
                    catch(e) {
                        this.editor.showMessage(e);
                    }
                }
            }
        }
    },
    /**
     * Parses the value of an internal:options attribute and returns a
     * list of name/value pairs
     */
    parseOptionsString: function(optionsString) {
        var options = optionsString.split(/\$(?!\$)/);
        return options.map(function (s) { return s.split(/=/,2) });
    },
    /**
     * Parses the value of an internal:options attribute and returns a
     * list of name/value pairs
     */
    parseOptionsString: function(optionsString) {
        var options = optionsString.split(/\$(?!\$)/);
        return options.map(function (s) { return s.split(/=/,2) });
    },
    /**
     * Takes a list of name/value pairs and encodes them in a string
     * suitable for an internal:options attribute
     */
    encodeOptionsString: function(optionsList) {
        return optionsList.map(function (o) { return (o[0] + "=" + o[1]).replace("$","$$") }).join("$");
    },
    /**
     * Load viewsets contained in a DOM element.
     * @param element DOM element containing internal:viewset elements
     */
    loadViewsets: function(element) {
        var viewset = element.firstChild;
        while (viewset) {
            if (viewset.nodeType == Node.ELEMENT_NODE) {
                this.viewsets.push(viewset);
            }
            viewset = viewset.nextSibling;
        }
    },
    /**
     * Determines the viewset to be created based on the options
     * viewset and defaultViewset and sets this.globalViewsetNumber.
     * Returns nothing.
     */
    decideViewset: function() {
        this.globalViewsetNumber = 0;
        var viewsetName = this.editor.o.viewsetName;
        // If there is no viewset given, use the rules to determine
        // which is the default viewset
        if (!viewsetName || viewsetName=="auto") {
            viewsetName = null;
            for (var ruleIndex=0; ruleIndex<this.editor.o.defaultViewsetRules.length && !viewsetName; ++ruleIndex) {
                var rule = this.editor.o.defaultViewsetRules[ruleIndex];
                if (rule[0](this.editor.equations[this.editor.focus])) {
                    viewsetName = rule[1];
                }
            }
        }
        // Translate the name of the viewset into the index of the
        // corresponding viewset.
        var chosenViewset = this.viewsets.filter(function(viewset) { return viewset.getAttribute("name") == viewsetName })[0];
        if (chosenViewset) { 
            this.globalViewsetNumber = this.viewsets.indexOf(chosenViewset);
        }
        else {
            var num = parseInt(viewsetName);
            if (!isNaN(num)) { this.globalViewsetNumber = num }
        }
    },
    /**
     * Selects the viewset to be used from now on. This is normally
     * called from a command executed by the user. It basically just
     * sets the options viewset or defaultViewset.
     * @param viewsetName Name or number of the viewset to be used.
     * @param scope       Tells whether the viewset should be used for
     *                    all equations, just for the equation on
     *                    focus or for a given mode. 
     */
    chooseViewset: function(viewsetName,scope) {
        if (scope=="default") {
            this.editor.optionsAssistant.set("defaultViewset", viewsetName);
        }
        else {
            this.editor.optionsAssistant.set("viewset", viewsetName);
        }
        // XXX: Is the following a good idea or does it break something?
        this.create();
        this.build(); // XXX: necessary?
    },
    /**
     * Hides a view of the current viewset. Usually called by a command invoked by the user.
     */
    hideView: function(viewNumber) {
        // TODO: It is very important that hidden views are not built,
        // because one reason for deactivating a view is that it slows
        // down the editor. But this is not yet implemented!!
        this.views[viewNumber].viewport.style.display = "none";
    },
    /**
     * Shows a view of the current viewset. Usually called by a command invoked by the user.
     */
    showView: function(viewNumber) {
        this.views[viewNumber].viewport.style.display = "block";
    },
    /**
     * Shows all views of the current viewset. Usually called by a command invoked by the user.
     */
    showAllViews: function(viewNumber) {
        this.views.forEach(function (v) { v.viewport.style.display = "block" });
    },
    openConfWindow: function() {
        if (this.confWindow) {
            this.confWindow.focus();
        }
        else {
            // Use the wrappedJSObject trick as described in
            // https://developer.mozilla.org/en/Working_with_windows_in_chrome_code
            // in order to be able to pass arbitrary JavaScript objects.
            var arg = { 
                editor: this.editor, 
                editorWindow: window, 
                viewsetManager: this, 
                onunload: function() {this.confWindow=null} 
            };
            //arg.wrappedJSObject = arg;
            this.confWindow = window.openDialog("chrome://gemse/content/viewsetconf.xul", "_blank",
                "chrome,menubar,toolbar,status,resizable,dialog=no",
                arg);
        }
    },
    closeConfWindow: function() {
        if (this.confWindow) {
            this.confWindow.close();
        }
    },
}

function OptionsCache(debugusage) {
    this.__debugid = OptionsAssistant.debugidcounter++;
    this.__debugusage = debugusage;
}
/**
 * @class Facility for handling options
 * The scope of an option has two axis, an object axis
 * {global, class, object} and the equation axis {eqindep, eqlocal}.
 * Options can be desclared globally or by a class. In the second
 * case, the option can be declared as local to the class. The user
 * can set an option in some scope. If the option is declared local to
 * a class, the scope can not be global.
 *
 * In this implementation, the scope (object, eqlocal) does not exist.
 * same as (object, eqindep). (This is because the scope 
 * (object, eqlocal) is not used by any object. It would be possible
 * to implement it, but then the objects needing it would have to ask
 * the OptionsAssistant for changes everytime the current equation
 * changes.)
 *
 * Objects that whish to access options do not need to care about the
 * scope, they always get the options from (object, eqindep). When
 * setting options however, the scope has to be given. 
 * When an object O of class looks up an option while equation E is
 * the current equation, the scopes are searched for a
 * value in the following order (by traversing the prototype-chain):
 * (O, eqindep), (C, E), (C, eqindep), (global, E), (global, eqindep)
 *
 * Every object is supposed to get an options object (it should store
 * it as a member called 'o') through the OptionsAssistant, stating
 * which scope it cares about. The OptionsAssistant takes the freedom
 * to store its stuff in the objects using the property 
 * _optionsAssistantCache. In classes, the same property is used. 
 * Options in the scope
 * (global, E) and (Class, E) are stored in the equations themselves
 * in a property of the name _optionsAssistantCache. All these are not
 * referenced by the OptionsAssistant from anywhere else except by the options objects higher
 * in the prototype stack. This should prevent memory leaks. (In other
 * words, objects and equations that have options do not need to
 * opt-out when they get destroyed.)
 */
function OptionsAssistant() {
    /**
     * Holds all descriptions. Do not write directly, use
     * loadDescriptions to add options.
     */
    this.descs = {};
    /**
     * Holds global options
     * @private
     */
    this.global_eqindep_o = new OptionsCache('OptionsAssistant, global eqindep');
    this.global_eqlocal_o = new OptionsCache('OptionsAssistant, global eqlocal');;
    this.global_eqlocal_o.__proto__ = this.global_eqindep_o;
    /**
     * List of classes
     */
    this.classes = [];
    /**
     * Equation that is considered to be current. May be null. The
     * object it points to (if it is not null) must have property
     * _optionsAssistantCache pointing to an array.
     */
    this.currentEquation = null;
}
OptionsAssistant.prototype = {
    obtainOptionsObject: function(forClass,forObject,eqindep) {
        return this.obtainOptionsCache(forClass,forObject,(eqindep ?  null : true));
    },
    /**
     * @private
     */
    obtainOptionsCache: function(localToClass,localToObject,localToEquation) {
        // Note that if the class forClass is already known, then 
        // this.currentEquation._optionsAssistantCache.*[classIndex]
        // does already exist, as ensured by setCurrentEquation and
        // the block of the following if statement
        if (localToClass) {
            var classIndex;
            if (this.classes.lastIndexOf(localToClass)==-1) {
                classIndex = this.classes.push(localToClass) - 1;
                localToClass._optionsAssistantCache = { eqindep: new OptionsCache('class, classlocal eqindep'), eqlocal: new OptionsCache('class, classlocal eqlocal') };
                if (this.currentEquation) {
                    this.currentEquation._optionsAssistantCache.classlocal[classIndex] = new OptionsCache('equation, classlocal');
                }
                localToClass._optionsAssistantCache.eqlocal.__proto__ = localToClass._optionsAssistantCache.eqindep;
                localToClass._optionsAssistantCache.eqindep.__proto__ = this.global_eqlocal_o;
            }
        }
        if (localToObject) {
            if (!localToObject._optionsAssistantCache) {
                localToObject._optionsAssistantCache = new OptionsCache('object, objlocal');
                if (!localToClass) {
                    throw new Error("OptionsAssistant expects class to be specified when obtaining an object-local obtions object.");
                }
                localToObject._optionsAssistantCache.__proto__ = this.obtainOptionsCache(localToClass,null,true);
            }            
            return localToObject._optionsAssistantCache;
        }
        else if (localToEquation) { // Captures both cases
            if (localToClass) {
                return localToClass._optionsAssistantCache.eqlocal;
            }
            else {
                return this.global_eqlocal_o;
            }
        }
        else if (localToClass) { // and eqindep
            return localToClass._optionsAssistantCache.eqindep;
        }
        else {
            return this.global_eqindep_o;
        }
    },
    set: function(name,value,localToClass,localToObject,localToEquation) {
        if (!this.descs[name]) {
            throw new Error("There is no option called '" + name + "'.\n");
        }
        // Validate
        if (!this.descs[name].validator(value)) {
            throw new Error("'" + value + "' is not a valid value for the option '"
                        + name + "'.\n");
        }
        // Find out which options object to use
        var cache = this.obtainOptionsCache(localToClass||this.descs[name].localToClass,localToObject,localToEquation);
        // Set into the options object
        this.descs[name].setter(cache,value);
        cache["_" + name] = value;
    },
    remove: function(name,localToClass,localToObject,localToEquation) {
        var cache = this.obtainOptionsCache(localToClass||this.descs[name].localToClass,localToObject,localToEquation);
        this.descs[name].remover(cache);
        delete cache["_" + name];
    },
    inheritanceInfo: function(name,localToClass,localToObject,localToEquation) {
        //XXX: Might be broken, especially when this.currentEquation==null
        localToClass = localToClass || this.descs[name].localToClass;
        var top_o = this.obtainOptionsCache(localToClass,localToObject,localToEquation);
        var global_eqindep_v = this.global_eqindep_o["_"+name];
        var global_eqlocal_v = this.global_eqlocal_o["_"+name];
        var classlocal_eqindep_v = localToClass ? localToClass._optionsAssistantCache.eqindep["_"+name] : null;
        var classlocal_eqlocal_v = localToClass ? localToClass._optionsAssistantCache.eqlocal["_"+name] : null;
        var objlocal_eqindep_v = localToObject ? localToObject._optionsAssistantCache["_"+name] : null;

        function OptionInheritanceInfo() {
            this.global_eqindep = global_eqindep_v;
            this.global_eqlocal = global_eqlocal_v;
            this.classlocal_eqindep = classlocal_eqindep_v;
            this.classlocal_eqlocal = classlocal_eqlocal_v;
            this.objlocal_eqindep = objlocal_eqindep_v;
        }
        OptionInheritanceInfo.prototype = {
            toString: function() {
                var s = "";
                s += "global: (independent of equation: " + this.global_eqindep;
                s += ", local to equation: " + this.global_eqlocal + "); ";
                s += "local to class: (independent of equation: " + this.classlocal_eqindep;
                s += ", local to equation: " + this.classlocal_eqlocal + "); ";
                if (this.global_eqindep!==undefined) {
                    s += "local to object: (independent of equation: " + this.global_eqindep;
                    s += "); ";
                }
                return s;
            }
        };

       return new OptionInheritanceInfo();
    },
    setDefault: function(name) {
        this.set(name,this.descs[name].defaultValue);
    },
    /**
     * Loads option descriptions and sets defaults
     */
    loadDescriptions: function(newDescs) {
        // First load all options
        for (var name in newDescs) {
            this.descs[name] = newDescs[name];
        }
        // Set defaults for the loaded options
        // TODO: An option may depend on another one, so setting it
        // may require having set the other before. May there arise
        // problems out of this, is there an easy solution?
        for (var name in newDescs) {
            this.setDefault(name);
        }
    },
    /**
     * Changes the equation that is considered the current one by the
     * OptionsAssistant. It may not be set to null.
     */
    setCurrentEquation: function(equation) {
        // Note: Never set a __proto__ to null! This leads to problems
        // while debugging, since it becomes impossible to inspect an
        // object. (One can set it to Object.prototype)
        // Check availability of _optionsAssistantCache on equation
        if (!equation._optionsAssistantCache) {
            var emptyClasslocal = [];
            for (var i=0; i<this.classes.length; ++i) { 
                var obj = new OptionsCache('equation, classlocal');
                emptyClasslocal.push(obj);
            }
            var emptyGlobal = new OptionsCache('equation, global');
            equation._optionsAssistantCache = {global: emptyGlobal, classlocal: emptyClasslocal};
        }

        // Set global_eqlocal_o and make shure its prototype is correct
        if (this.currentEquation) {
            // Make copy of old eqlocal options
            this.clearProperties(this.currentEquation._optionsAssistantCache.global);
            this.copyProperties(this.currentEquation._optionsAssistantCache.global, this.global_eqlocal_o);
        }
        // Create empty object for equation if missing
        if (!equation._optionsAssistantCache.global) {
            equation._optionsAssistantCache.global = new OptionsCache('OptionsAssistant, global eqlocal');
        }
        // Copy over properties from object of equation
        this.clearProperties(this.global_eqlocal_o);
        this.copyProperties(this.global_eqlocal_o, equation._optionsAssistantCache.global);
        // Set prototype
        this.global_eqlocal_o.__proto__ = this.global_eqindep_o;

        // Loop over all classes
        this.classes.forEach(function (c, i) {
            if (this.currentEquation) {
                // Make copy of old eqlocal options
                this.clearProperties(this.currentEquation._optionsAssistantCache.classlocal[i]);
                this.copyProperties(this.currentEquation._optionsAssistantCache.classlocal[i], c._optionsAssistantCache.eqlocal);
            }

            // Create empty object for equation if missing
            if (!equation._optionsAssistantCache.classlocal[i]) {
                equation._optionsAssistantCache.classlocal[i] = new OptionsCache('equation, classlocal');
            }

            // Copy over properties from object of equation
            this.clearProperties(c._optionsAssistantCache.eqlocal);
            this.copyProperties(c._optionsAssistantCache.eqlocal, equation._optionsAssistantCache.classlocal[i]);

            // Set prototype of eqindep to global_eqdep_o
            c._optionsAssistantCache.eqlocal.__proto__ = c._optionsAssistantCache.eqindep;
        }, this);
            
        this.currentEquation = equation;
    },
    /**
     * @private
     */
    clearProperties: function(obj) { 
        // Although this also loops over properties inherited from the
        // prototype, they do not get deleted from the prototype.
        for (var key in obj) {
            delete obj[key];
        }
    },
    /**
     * Copies all enumerable Properties of the template to obj. (Properties from
     * the prototype-chain of template are not included.)
     */
    copyProperties: function(obj, template) {
        // XXX: Maybe we should use Object.defineProperties instead,
        // although it has been introduced in Mozilla 2.
        // XXX: Problem: The following loops also over properties
        // inherited from the prototype. Workaround: Remove prototype
        // temporarly.
        var preservedPrototype = template.__proto__;
        template.__proto__ = Object.prototype;
        for (var key in template) {
            obj[key] = template[key];
        }
        template.__proto__ = preservedPrototype;
    },
}
OptionsAssistant.debugidcounter = 0;
OptionsAssistant.validators = {
    /** For parsers.truthVal */
    truthVal: function(value) {
        return (value=="on" ||value=="true" ||value=="1"||value=="yes"||
                value=="off"||value=="false"||value=="0"||value=="no");
    },
    /** For parsers.number_integer */
    number_integer: function(value) {
        return /^[+-]?(0x)?\d+/.test(value);
    },
    /** For parsers.number_integer */
    number_positiveInteger: function(value) {
        return number_integer(value) && (OptionsAssistant.parsers.number_integer(value) > 0);
    },
    /** For parsers.number_integer */
    number_positiveIntegerOrZero: function(value) {
        return number_integer(value) && (OptionsAssistant.parsers.number_integer(value) >= 0);
    },
    /** For parsers.number_float */
    number_float: function(value) {
        return /^[+-]?\d+(.\d+)?/.test(value);
    },
    /** For parsers.number_float */
    number_positiveFloat: function(value) {
        return number_float(value) && (OptionsAssistant.parsers.number_float(value) > 0);
    },
    /** For parsers.number_float */
    number_positiveFloatOrZero: function(value) {
        return number_float(value) && (OptionsAssistant.parsers.number_float(value) >= 0);
    },
};
OptionsAssistant.parsers = {
    truthVal: function(value) {
        return (value=="on"||value=="true"||value=="1"||value=="yes");
    },
    number_integer: function(value) {
        return parseFloat(value);
    },
    number_float: function(value) {
        return parseFloat(value);
    },
};

/**
 * @class The Gemse main object. It hosts all equation environments, handles
 * input by the user, keeps registers, options, and so on.
 */
function GemsePEditor() {
    /**
     * Maps single unicode characters to register objects
     */
    this.registerManager = new RegisterManager();
    /**
     * Array of EquationEnv objects
     * @private
     */
    this.equations = [];
    /**
     * The number of the equation that currently has the focus
     * @private
     */
    this.focus = -1;
    /**
     * List of open documents
     * @private
     */
    this.storages = [];
    /**
     * The input box where the user enters commands
     * (The constructor of the editor looks for the element with id
     * "input".)
     * @private
     */
    this.inputElement = document.getElementById("input");
    /**
     * The directory where Gemse is installed as nsIFile (may be null
     * if Gemse does not run with chrome privileges).
     */
    this.installationDirectory = null;
    try {
        if (Components.interfaces.nsIExtensionManager) {
            // For Firefox 3.* (Mozilla 1.9.*)
            this.installationDirectory = Components.classes["@mozilla.org/extensions/manager;1"].  
                        getService(Components.interfaces.nsIExtensionManager).  
                        getInstallLocation("Gemse@andonyar.com"). // guid of extension  
                        getItemLocation("Gemse@andonyar.com");  
        }
        else {
            // For Firefox 4 (Mozilla 2.0) we have to use the new
            // AddonManager, the ExtensionManager doesn't exist
            // anymore.
            // TODO: Does this always work? I don't know how to work
            // with this callback stuff.
            Components.utils.import("resource://gre/modules/AddonManager.jsm");
            var newEditor = this;
            AddonManager.getAddonByID("Gemse@andonyar.com", function(a) { 
                var uri = a.getResourceURI("");
                newEditor.installationDirectory = uri.QueryInterface(Components.interfaces.nsIFileURL).file; 
            });
        }
    }
    catch (e) {}
    try {
        if (!this.installationDirectory) {
            // In a XULRunner application, Gemse is not an addon. So
            // if the above fails or results in null, we try to use the directory service.
            this.installationDirectory = Components.classes["@mozilla.org/file/directory_service;1"].
                             getService(Components.interfaces.nsIProperties).
                             get("CurProcD", Components.interfaces.nsIFile);
            //XXX: Or should we use XCurProcD?
        }
    }
    catch (e) {}
    /**
     * The current working directory for internal use. If you want to
     * get or set the working directory, use editor.workingDirectory.
     * This value has nothing to do with the real current working
     * directory of the application.
     * The value is an URI as string.
     * @private
     */
    this.internalWorkingDirectory = this.processWorkingDirectory;
    if (!this.internalWorkingDirectory) {
        // For some reason we are not able to find out the current
        // working directory of the process, so we try the base URI of
        // the editor.xul, which should always be available (DOM3,
        // Node interface)
        this.internalWorkingDirectory = document.baseURI;
    }
    /**
     * A template as a DOM element of a new equation.
     * (The constructor of this class does set this property by
     * looking for an element with id "equationTemplate"
     * It also detaches this
     * element from the document itself.)
     * @private
     */
    this.equationTemplate = document.getElementById("equationTemplate");
    this.equationTemplate.parentNode.removeChild(this.equationTemplate);
    this.equationTemplate.removeAttribute("id");
    /**
     * OptionsAssistant that handles options
     */
    this.optionsAssistant = new OptionsAssistant();
    /* Load global options and options from known classes */
    this.optionsAssistant.loadDescriptions(gemseGlobalOptions);
    for (var i=0;i<GemsePEditor.knownClasses.length;++i) {
        this.optionsAssistant.loadDescriptions(GemsePEditor.knownClasses[i].gemseOptions);
    }
    /**
     * Option object for global options
     */
    this.o = this.optionsAssistant.obtainOptionsObject();
    /**
     * Recordings of options created automatically or by the user 
     * @private
     */
    this.inputRecordings = { };
    /**
     * The last messages for the user stored as DOM nodes.
     * Messages the user doesn't want to see anymore are deleted.
     */
    this.messages = [];
    /**
     * Manages the view sets.
     * (The constructor of the editor does use the element with id
     * "viewsetDock" as dock. It also calls
     * viewsetManager.loadViewsets handing over the first
     * internal:viewsets element of the document. This element is
     * removed from the document afterwards.)
     * @private
     */
    this.viewsetManager = new ViewsetManager(this,document.getElementById("viewsetDock"));
    var viewsets = document.getElementsByTagNameNS(NS_internal, "viewsets")[0];
    this.viewsetManager.loadViewsets(viewsets);
    viewsets.parentNode.removeChild(viewsets);
    /**
     * Internal input substitution method. This is implemented in
     * inputSubstitution/cors.js and is perhaps not even present.
     * @private
     */
    this.inputSubstitution = inputSubstitution;
}
GemsePEditor.prototype = {
    /**
     * The working directory of the editor.
     */
    get workingDirectory() {
        return this.internalWorkingDirectory;
    },
    set workingDirectory(dir) {
        if (dir) {
            this.internalWorkingDirectory = dir;
        }
        else {
            // If dir is empty, we should change to the user's home
            // directory
            try {
                var ios = Components.classes["@mozilla.org/network/io-service;1"].
                                 getService(Components.interfaces.nsIIOService);
                var workingDirectoryFile = Components.classes["@mozilla.org/file/directory_service;1"].
                                 getService(Components.interfaces.nsIProperties).
                                 get("Home", Components.interfaces.nsIFile);
                var workingDirectory = ios.newFileURI(workingDirectoryFile).spec;
                this.internalWorkingDirectory = workingDirectory;
            }
            catch(e) {
                // If we fail, we should not change anything
                this.showMessage("Unable to change working directory")
                return;
            }
        }
        this.showMessage("Changed working directory to " + this.internalWorkingDirectory);
    },

    /**
     * Get the real current working directory of the application as
     * indicated by the io-service.
     * @private
     * @returns The current working directory as URI as string. If
     *          it is not possible to find out, null is returned (for
     *          example when Gemse runs outside the chrome).
     */
    get processWorkingDirectory() {
        try {
            var ios = Components.classes["@mozilla.org/network/io-service;1"].
                             getService(Components.interfaces.nsIIOService);
            var workingDirectoryFile = Components.classes["@mozilla.org/file/directory_service;1"].
                             getService(Components.interfaces.nsIProperties).
                             get("CurWorkD", Components.interfaces.nsIFile);
            var workingDirectory = ios.newFileURI(workingDirectoryFile).spec;
            return workingDirectory;
        }
        catch(e) {
            return null;
        }
    },

    /**
     * Handle new input. This is called by the input box event
     * handler, when the input buffer supposedly changed. That is, it
     * is callend in editor.xhtml. It basically calls the input
     * handler of the current mode of the focused equation. It does
     * that repeatedly until it returns false, so that all complete
     * commands are executed.
     */
    inputEvent: function () {
        // Is called when the input buffer supposedly changed
        this.messages = [];
        var updateOfViewsNeeded = false;
        if (inputSubstitutionActive) { 
            var allowPropagation = this.inputSubstitution();
            if (!allowPropagation) { return };
        }
        try {
            // Call the input handler as long as it finds commands.
            // (If the inputBuffer is empty, it can not find one, so,
            // for efficiency, do not call it)
            // This can cause an endless loop, so all modes must
            // correctly implement their inputHandler. The
            // inputHandler must return true if it found a command. In
            // this case, it must remove the command from the input
            // buffer. It must not remove following commands.
            while (this.inputBuffer && this.equations[this.focus].mode.inputHandler()) { updateOfViewsNeeded = true };
        }
        catch (e) {
            this.showMessage(e);
            updateOfViewsNeeded = true;
            // Since we stopped processing of input, we must remove
            // all remaining input. (This is problably no good
            // solution, see #13.)
            this.inputBuffer = "";
        }
        finally {
            // Now, if there is still something in the buffer, it is
            // either an incomplete command or an invalid command. So,
            // if the remeining string ends with ESCAPE, the user
            // wants to clear the input buffer.
            if (this.inputBuffer.charCodeAt(this.inputBuffer.length-1) == KeyEvent.DOM_VK_ESCAPE) {
                this.inputBuffer = "";
            }
            // Update the views
            if (updateOfViewsNeeded) { this.viewsetManager.build(); }
        }
    },
    /**
     * Handle key event. This is called by editor.xhtml when the user
     * hits a key. It adds the character gnerated by this key to the
     * input buffer and calls inputEvent on this object. (Not all
     * input generates key events, for example pasting from the
     * cpboard.)
     */
    keyEvent: function (event) {
        // Is called when a key gets hit. This also is called
        // if the key does not cause a character to be entered
        // into the input element (i.e. the input buffer).

        var nondefault = false;
        if (event.altKey)  { editor.inputBuffer += KEYMOD_ALT; nondefault=true; }
        if (event.ctrlKey) { editor.inputBuffer += KEYMOD_CONTROL; nondefault=true; }
        //if (event.metaKey) { editor.inputBuffer += KEYMOD_META }
        /*
        if (event.charCode || event.keyCode) {
            editor.inputBuffer += String.fromCharCode(event.charCode || event.keyCode);
                // event.which does not seem to work, it returns 0 for the escape Key
        }
        //if (event.keyCode) { event.preventDefault(); }
        event.preventDefault();
        event.stopPropagation();
        editor.inputEvent();
        */
        if (nondefault || ((!event.charCode) && event.keyCode)) {
            editor.inputBuffer += String.fromCharCode(event.charCode || event.keyCode);
                // event.which does not seem to work, it returns 0 for the escape Key
            event.preventDefault();
            event.stopPropagation();
            if (!editor.globalI) { editor.globalI = 1 }
            editor.showMessage('called inputEvent(), ' + (editor.globalI++));
            editor.inputEvent();
        }
    },
    /** 
     * Content of the input buffer
     * Modes must not set the inputBuffer directly. Instead, they
     * should use the mothod eatInput
     * @type String
     */
    get inputBuffer()  { return this.inputElement.value; },
    set inputBuffer(x) { this.inputElement.value = x;    },
    /**
     * Removes unicode characters from the beginning
     * of the input buffer. Also, it does record the removed string for
     * command repeating.
     * @param numberOfCharacters Amount of unicode characters to be
     * removed.
     * IMPORTANT: eatInput considers the numberOfCharacters to be the
     * number of the unicode characters, not the number of UTF16
     * characters. So characters from higher planes are counted once.
     * For eating input based on UTF16 characters, use eatInput16.
     */
    eatInput: function(numberOfCharacters) {
        for (r in this.inputRecordings) {
            this.inputRecordings[r] += this.inputBuffer.uSlice(0,numberOfCharacters);
        }
        this.inputBuffer = this.inputBuffer.uSlice(numberOfCharacters);
    },
    /**
     * Removes UTF16 characters from the beginning
     * of input buffer. Also, it does record the removed string for
     * command repeating.
     * @param numberOfCharacters Amount of UTF16 characters to be
     * removed.
     * IMPORTANT: eatInput considers this number to be the amount of
     * UTF16 characters, so characters on higher planes are trated as
     * surrogate paris, that is as two characters. However, if one
     * tries to eat only the first surrogate of a surrogate pair, the
     * second one is removed too in order to keep the string in the
     * input buffer to be valid UTF16.
     */
    eatInput16: function(numberOfUTF16Characters) {
        this.eatInput(this.inputBuffer.index_16ToU(numberOfUTF16Characters));
        // Using this.eatInput and index_16ToU has a nice side effect:
        // It is not possible to eat only one surrogate of a surrogate
        // pair. It will eat always both surrogates.
    },
    /**
     * Applies backspace at end of input buffer.
     * If there is a backspace at the end of the input buffer it is
     * removed together with the character preceding it.
     * @return true if the input buffer has been changed, false
     *         otherwise
     */
    applyBackspaceInInput: function() {
        var s = this.inputBuffer;
        if (s.charCodeAt(s.length-1) == 0x0008) { // U+0008 is backspace
            this.inputBuffer = s.slice(0,-2);
            return true;
        }
        else {
            return false;
        }
    },
    /**
     * Starts recording input for later use. It records all eaten
     * (that is executed) commands. Input recording must be stopped
     * using stopInputRecording.
     * @param {String} name name under which the recording should be
     *                      saved
     */
    startInputRecording: function(name) {
        this.inputRecordings[name] = "";
    },
    /**
     * Terminate input recording.
     * @param {String} name name under which the recording runs
     * @returns {Sting} the recorded command
     */
    stopInputRecording: function(name) {
        var result = this.inputRecordings[name];
        delete this.inputRecordings[name];
        return result;
    },

    /**
     * removes an equation.
     * This method must only be called by methods of equationEnv.
     * The equationEnv gets dropped from this.equations and this.focus
     * gets adjusted if needed.
     * If the last equation is removed, the window gets closed,
     * terminating Gemse.
     * @param equationEnv {EquationEnv} Equation environment to be
     *                                  eliminated
     */
    eliminateEquationEnv: function (equationEnv) {
        var index = this.equations.indexOf(equationEnv);
        if (index < 0) { throw new Error("This equationEnv is not even registered!") }

        this.equations.splice(index,1);
        if (this.focus > index) { this.moveFocusTo(this.focus-1) }
        if (this.focus == index && index > 0) { --this.focus; this.moveFocusTo(this.focus) }
        else { this.moveFocusTo(this.focus) }

        if (equationEnv.origin) { this.freeUnusedDocStorage(equationEnv.origin.storage) }

        // XXX: What to do if all equations are gone? Here, we just
        // close the window. (Perhaps this should be configurable?)
        if (this.equations.length==0) {
            window.close();
        }
    },
    /**
     * Creates a new doc storage for the given URI. The document
     * storage class is chosen according to the protocol.
     * @param uriString The URI as string. Must be absolute (except
     *                  if we do not have chrome privileges).
     * @Returns document storage
     */
    newDocStorageByURI: function(uriString) {
        var ios;
        try {
            ios = Components.classes["@mozilla.org/network/io-service;1"].
                            getService(Components.interfaces.nsIIOService);
        }
        catch(e) {
            // If we do not have chrome privileges, we just do
            return new XMLHttpRequestDocStorage(uriString);
        }

        var uri = ios.newURI(uriString,null,null);
        var protocol = uri.scheme;
        
        if (protocol == "http") {
            return new XMLHttpRequestDocStorage(uriString);
        }
        else if (protocol == "file") {
            // Create an nsIFile from the uri
            var file = uri.QueryInterface(Components.interfaces.nsIFileURL).file;
            return new FileDocStorage(file);
        }
        else {
            // Use XMLHttpRequest for loading and do not allow saving
            return new ReadOnlyXMLHttpRequestDocStorage(uriString);
        }
    },
    /**
     * Removes document storages that are not used by any equation.
     * @param storage If given, only this storage is checked. If
     *                missing, all storages are checked.
     */
    freeUnusedDocStorage: function(storage) {
        var storagesToCheck;
        if (storage) {
            storagesToCheck = [storage];
        }
        else {
            storagesToCheck = this.storages;
        }

        var unusedStorages = storagesToCheck.filter(function(s) {
            for (var i=0; i<this.equations.length; ++i) {
                if (this.equations[i].origin && s === this.equations[i].origin.storage) {
                    return false;
                }
            }
            return true;
        }, this);

        unusedStorages.forEach(function(s) {
            var index = this.storages.indexOf(s);
            this.showMessage("Remove unused storage " + s.toString());
            this.storages.splice(index,1);
        }, this);
    },
    /**
     * Checks whether an equivalent document storage already exists
     * and returns it
     * @param {DocStorage} forStorage
     * @returns The already existing storage or null
     */
    getEquivalentStorage: function(forStorage) {
        var filtered = this.storages.filter(function(s) { return forStorage.equals(s) });
        if (filtered.length > 0) { return filtered[0] }
        else { return null }
    },
    /**
     * Creates a new equation along with a new EquationEnv. 
     * To cunstruct the new equation, this.equationTemplate is used.
     * @param equation this DOM element is used as the equation
     *                 directly, no fullcopy is made beforehand. If
     *                 this parameter is missing, a copy of the equation
     *                 this.equationTemplate is used
     * @returns {EquationEnv} the new equation environment
     */
    newEquation: function (equation) {
        if (!this.equationTemplate) { throw new Error("No equation template defined") }
        // Create the equation if not given
        if (!equation) {
            equation = this.equationTemplate.cloneNode(true);
        }
        // Create new container in the XML document
        var newEquationEnv = new EquationEnv(this, equation);
        newEquationEnv.init();
        this.equations.push(newEquationEnv);
        this.moveFocusTo(this.equations.length-1);
        return newEquationEnv;
    },
    /**
     * Makes an URI absolute if we have chrome privileges. If not,
     * return the input
     * @param {String} uri 
     * @param {String}
     */
    makeURIAbsolute: function(uri) {
        // Check whether uri is relative. Make an absolute one out of it.
        try {
            // Fails, if the preivileges for accessing Components.classes
            // are missing. In such a case, do not make the uri absolute
            // and let that handle by the XMLHttpRequest. I think this
            // means that then the location of the editor.xul is taken
            // as base by XMLHttpRequest.
            // XXX: What happens if this fails for another reason?
            var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
            uri = ios.newURI(uri,null,ios.newURI(this.workingDirectory,null,null)).spec;
        }
        catch (e) { }
        return uri;
    },
    /** 
     * Loads the document at the given URI and loads its equations. 
     * If elementId and xpathString are empty, it
     * uses the root element as the MathML element. If elementId
     * is given, it uses the element with this id. Else, if
     * xpathString is given (and elementId is null), it evaluates
     * this xpath expression and uses the first result.
     * This is done using an XMLHttpRequest. This also works for
     * local files.
     * @param {String} uri Absolute or relative URL including a
     *                     fragment identifier or XPointer (only the
     *                     scheme xpath1 is supported)
     * @param {String} elementId
     * @param {String} xpathString
     */
    loadURI: function (uri, fragmentId, xpath) {
        var protocol = null;

        uri = this.makeURIAbsolute(uri);

        // Take URI apart
        // XXX: Most probably broken. We should really use nsIURI!
        var uriParts = /^((([^:]*):)?[^#]*)(#(.*))?$/.exec(uri);
        if (!uriParts) { throw new Error("Failed to parse URI") }
        protocol = uriParts[3];
        // decodeURIComponent seems to call .toString on its argument,
        // which yields "undefined" for undefined values. So make
        // shure it is the empty string in this case:
        var fragmentPart = decodeURIComponent(uriParts[5] ?  uriParts[5] : "");
        if (!fragmentId && !xpath && fragmentPart && fragmentPart.indexOf('(')!=-1) {
            // Parse fragmentPart as XPointer
            var fragmentPartInfo = /^xpath1\((.*)\)$/.exec(fragmentPart);
            if (fragmentPartInfo) {
                xpath = fragmentPartInfo[1];
            }
            else {
                throw new Error("Couldn't parse XPointer " + fragmentPart);
            }
        }
        else if (!fragmentId && !xpath) {
            fragmentId = fragmentPart;
        }
        var documentURI = uriParts[1];

        // Create a storage with this URI
        var newStorage = this.newDocStorageByURI(documentURI);
        this.showMessage("Created for URI " + documentURI + " a new storage " + newStorage.toString());

        // Check whether an equivalent storage already exists
        var eqStorage = this.getEquivalentStorage(newStorage);
        if (eqStorage) { newStorage = eqStorage }

        // If its a new storage, try to load the file
        this.showMessage("Using storage " + newStorage.toString());
        if (!eqStorage) {
            this.showMessage("Read storage " + newStorage.toString());
            newStorage.read();
        }

        // Find the math elements
        var mathElements = [];
        if (fragmentId) {
            mathElements[0] = newStorage.document.getElementById(fragmentId);
            if (!mathElements[0]) {
                mathElements.pop();
            }
        }
        else if (xpath) {
            var xpathResult = newStorage.document.evaluate(xpath, newStorage.document, standardNSResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            var resultNode;
            var i=0;
            while ((resultNode = xpathResult.iterateNext())) { 
                mathElements.push(resultNode);
                ++i;
            }
        }
        else {
            mathElements[0] = newStorage.document.documentElement;
            if (!mathElements[0]) {
                throw new Error("Can not open an empty document");
            }
        }

        if (!eqStorage) { this.storages.push(newStorage) }

        try {
            //loop over all significant math elements
            mathElements.forEach(function(m) {
                // Check whether this equation is already open
                if (this.equations.some(function (e) { return (e.origin && m === e.origin.node) })) {
                    //XXX: Maybe we should not throw here, but just skip this equation
                    throw new Error("Refused to load the same equation twice!");
                }

                // Only allow math elements except the option
                // loadAnyAsRoot is set to true
                var is_math = (m.localName == "math" && m.namespaceURI == NS_MathML);
                var is_OMOBJ = (m.localName == "OMOBJ" && m.namespaceURI == NS_OpenMath);
                if (!this.o.loadAnyAsRoot && !is_math && !is_OMOBJ) {
                    //XXX: Maybe we should not throw here, but just skip this equation
                    throw new Error("The element you load must be a math element in the MathML namespace or an OMOBJ element in the OpenMath namespace");
                }

                // Create new environment using a deep copy
                var newEquationEnv = this.newEquation(document.importNode(m, true));

                // Create Origin object
                newEquationEnv.origin = new StorageLink(newStorage, m);

                // Tell the history object that this new equation is already
                // saved.
                newEquationEnv.history.reportSaving();

                // Set the equationEnv to be read only if the storage is
                if (newStorage.readOnly()==1) {
                    newEquationEnv.readOnly = true;
                }

                this.showMessage("Succesfully loaded an equation from " + newStorage.toString());
            }, this);

            // If no equation has been opened
            if (mathElements.length == 0) {
                this.showMessage("No equation(s) found");
                this.freeUnusedDocStorage(newStorage);
            }
        }
        catch (e) {
            this.freeUnusedDocStorage(newStorage)
            throw e;
        }
    },
    /**
     * Load an equation from an already loaded document.
     * In order to edit an equation which is part of a document that
     * is loaded in this instance of Mozilla, one uses this method to
     * open it in Gemse. A deep copy of the equation is made and it
     * gets written back only when the user saves his changes.
     * It is important to know that, by default, the document itself 
     * is saved as well, when the user saves the equation.
     * @param doc      DOM document containing the equation
     * @param element  the root element of the equation
     * @param inMemory If set to true, the document itself is not saved,
     *                 only the DOM document is updated. If set to false
     *                 (the default), the document is saved as well.
     */
    loadFromOpenDocument: function(doc, element, inMemory) {
        // Only allow math elements except the option
        // loadAnyAsRoot is set to true
        var is_math = (element.localName == "math" && element.namespaceURI == NS_MathML);
        var is_OMOBJ = (element.localName == "OMOBJ" && element.namespaceURI == NS_OpenMath);
        if (!this.o.loadAnyAsRoot && !is_math && !is_OMOBJ) {
            throw new Error("The element you load must be a math element in the MathML namespace or an OMOBJ element in the OpenMath namespace");
        }

        // Create a storage with this URI
        var newStorage;
        if (inMemory) {
            newStorage = new InMemoryDocStorage(doc);
        }
        else if (doc.documentURI) {
            newStorage = this.newDocStorageByURI(doc.documentURI);
            newStorage.adoptDocument(doc);
        }
        else {
            throw "The document provides no URI";
        }

        // Check whether an equivalent storage already exists
        var eqStorage = this.getEquivalentStorage(newStorage);
        if (eqStorage) { 
            if (eqStorage.document !== doc) {
                throw "You have opened the same document twice " +
                      "and you want to edit equations from both " +
                      "instances. This is not possible.";
            }
            newStorage = eqStorage;
        }
        else {
            // Remember the storage
            this.storages.push(newStorage);
        }

        // Create new environment using a deep copy
        var newEquationEnv = this.newEquation(document.importNode(element, true));

        // Create Origin object
        newEquationEnv.origin = new StorageLink(newStorage, element);

        // Tell the history object that this new equation is already
        // saved.
        newEquationEnv.history.reportSaving();
    },
    /**
     * Load all equations of a document.
     * Fetches the document at the URI and locates all math elements
     * in it, which all get loaded.
     * @param {String} uri
     */
    loadAll: function(uri) {
        this.loadURI(uri,null,"(//m:math|//om:OMOBJ)[not(ancestor::m:math|ancestor::om:OMOBJ)]");
    },
    /**
     * Moves the focus to another equation.
     * @dest {Integer}
     */
    moveFocusTo: function(dest) {
        if (dest >= this.equations.length) { return false }
        if (dest < 0) { return false }
        this.focus = dest;
        this.optionsAssistant.setCurrentEquation(this.equations[dest]);
        this.viewsetManager.create();
        this.viewsetManager.build(); // XXX: necessairy?
    },
    /**
     * Shows a message to the user
     * If the message is an instance of Error, the error is shown to the user
     * in a meaningful way. If it is a DOM node, it is directly placed
     * in the DOM of the user interface. In any other case, the message
     * is transformed to a string using its toString method and the
     * result is presented to the user.
     * @param message The message as instance of the class Error, as DOM
     * node or any other object.
     */
    showMessage: function(message) {
        if (message instanceof Error) {
            // Message is an Error object, which we present nicely
            var errorElement = document.createElementNS(NS_HTML, "div");
            errorElement.setAttribute("class", "error");
            errorElement.appendChild(document.createTextNode(message.name + ": " + message.message));
            if (this.o.detailedErrors) {
                var stackBacktrace = document.createElementNS(NS_HTML, "pre");
                stackBacktrace.appendChild(document.createTextNode(message.stack));
                errorElement.appendChild(stackBacktrace);
            }
            this.messages.push(errorElement);
        }
        else if (message.nodeType) { //XXX: Is there a better way to test this?
            // message is a DOM node
            this.messages.push(message);
        }
        else {
            // message is a String or something that should be
            // presented as such, using its toString method
            var newMessage = document.createElementNS(NS_HTML,"div");
            newMessage.appendChild(document.createTextNode(message.toString()));
            this.messages.push(newMessage);
        }
    },
}

GemsePEditor.knownClasses = [];


/** 
 * @class Highly configurable command handler.
 * @param mode
 * @param options Options controlling the behaviour
 *        This has to be an object having the following
 *        fields:
 *        <dl>
 *        <dt>onNotExistingCommand (not implemented)</dt>
 *        <dd>forget,throw,inform,handBack</dd>
 *        <dt>onExistingButMalformedCommand (not implemented)</dt>
 *        <dd>forget,throw,inform,handBack</dd>
 *        <dt>backspace</dt>
 *        <dd>removeLast,asCommand</dd>
 *        <dt>repeating</dt>
 *        <dd>Boolean. When true, commands are not allowed to
 *        begin with a digit, except the command 0.</dd>
 *        </dl>
 * @param commandTable A table of all known commands
 *        For every command c, commandTable[c] must be an object
 *        holding the following fields:
 *        <dl>
 *        <td>category</dt>
 *        <dd>Can be set by the user to any value. It is not
 *        considered.</dd>
 *        <dt>type</dt>
 *        <dd>disamb,singleCharacterPreArgumentPrefix,command,longPrefix</dd>
 *        <dt>argument</dt>
 *        <dd>none,parameters,characters,newlineTerminated,manual,regex,selection</dd>
 *        <dt>argumentLineCount</dt>
 *        <dd>number of lines (only if argument=newlineTerminated,
 *        default is 1)</dd>
 *        <dt>argumentCharacterCount (only if argument=characters)</dt>
 *        <dd>unsigned integer</dd>
 *        <dt>extractArgument (only if argument=manual)</dt>
 *        <dd>function(commandHandler), returns undefined if not
 *        complete. (null is a valid argument!) This procedure must
 *        update commandHandler.pos! argument=manual is not
 *        recommended, since it tampers with the internals of the
 *        CommandHandler, so use it only if the other possiblilities
 *        for argument fail.</dd>
 *        <dt>argumentRegex (only if argument=regex)</dt>
 *        <dd>RegExp object, TODO</dd>
 *        <dt>repeating</dt>
 *        <dd>external,internal,prevent</dd>
 *        <dt>resultHandler</dt>
 *        <dd>function(mode,data,commandInfo,result)</dd>
 *        <dt>executionHandler</dt>
 *        <dd>function(mode,data,commandInfo)</dd>
 *        <dt>implementation</dt>
 *        <dd>function(mode,data,commandInfo)</dd>
 *        </dl>
 */
CommandHandler = function(mode,options,commandTable) {
    this.editor = mode.editor;
    this.mode = mode;
    this.options = options;
    this.commandTable = commandTable;
    this.selection = null;
}
CommandHandler.prototype = {
    pos: null,     // parsing state information
    buffer: null,  // parsing state information
    instance: null,// parsing state information
    repeatingRegex: /^([1-9][0-9]*)/,
    longRegex: /^([^\s!]+)(!?)((\s+)(.*))?\n/,
    /**
     * Parses the next command from the input buffer
     * @returns {CommandInstance} A CommandInstance containing all
     * information needed to execute the command. If an error has been
     * encountered or the command is incomplete, a CommandInstance is
     * returned as well and holds all information about the problem.
     */
    parse: function() {
        // Check handling of backspaces before copying the input
        // buffer
        if (this.options.backspace == "removeLast") {
            this.editor.applyBackspaceInInput();
        }
        // Make a string object from the buffer, so the optimisations
        // from UString kick in. (buffer must not be changed during
        // the parsing process.
        this.buffer = new String(this.editor.inputBuffer);
        // Track where the next unprocessed character is  
        // in the input buffer, counting unicode characters
        this.pos = 0;
        // The command instance we are going to populate
        this.instance = new CommandInstance();
        // How often to repeat
        this.instance.repeat = 1; // will be deleted after parsing

        // Tells whether we can continue parsing
        var goOn = true;

        /* Repeating */
        if (this.options.repeating) {
            goOn = this.scanRepeating();
        }
        if (!goOn) { return this.instance }

        /* single character arguments */
        goOn = this.scanSingleCharacterPreArguments();
        if (!goOn) { return this.instance }

        /* The command itself */
        goOn = this.scanCommand();
        if (!goOn) { return this.instance }

        /* Argument */
        goOn = this.scanArgument();
        if (!goOn) { return this.instance }

        /* Complete instance object */
        if (this.instance.commandInfo.repeating=="prevent") { repeat = 1 }
        if (this.instance.commandInfo.repeating=="internal") {
            this.instance.internalRepeat = this.instance.repeat;
        }
        else if (this.instance.commandInfo.repeating=="external") {
            this.instance.externalRepeat = this.instance.repeat;
        }
        delete this.instance.repeat;
        this.instance.mode = this.mode;
        this.instance.category = this.instance.commandInfo.category;
        this.instance.fullCommand = this.buffer.uSlice(0,this.pos);
        this.instance.selection = this.selection;
        this.instance.implementation = this.instance.commandInfo.implementation;
        this.instance.executionHandler = this.instance.commandInfo.executionHandler;
        this.instance.resultHandler = this.instance.commandInfo.resultHandler;

        this.instance.isComplete = true;

        /* Eat */
        if (this.pos < 1) {
            throw new Error("pos must be at least 1 here");
        }
        this.editor.eatInput(this.pos);

        return this.instance; // Success!
    },
    /* Maybe it will be possible to use the following procedures from
     * the outside. They could come in handy, if you just need to
     * parse a subexpression of a more complex command.
     * This is the reason why state information of the parsing is
     * stored as properties of the parser object.
     */
    scanRepeating: function() {
        // Fetch digits at the beginning. The first digit must not
        // be a 0.
        if (this.pos > 0) { throw new Error("scanRepeating requires pos to be 0"); }
        var matchRes = this.buffer.match(this.repeatingRegex);
        if (matchRes) {
            this.instance.repeat = parseInt(matchRes[1]);
            this.pos += matchRes[1].uLength;
        }
        return true; // Go on with parsing in any case
    },
    scanSingleCharacterPreArguments: function() {
        var firstChar = this.buffer.uCharAt(this.pos);
        var firstCharInfo = this.commandTable[firstChar];

        while (firstCharInfo && firstCharInfo.type == "singleCharacterPreArgumentPrefix") {
            ++this.pos; // Points now to the argument, if present
            if (this.buffer.uLength<=this.pos) { 
                // The user started to enter a single
                // characterPreArgument by entering the prefix, but
                // the argument is still missing
                return false;
            }
            this.instance.singleCharacterPreArguments.push(this.buffer.uCharAt(this.pos));
            ++this.pos;
            firstChar = this.buffer.uCharAt(this.pos);
            firstCharInfo = this.commandTable[firstChar];
        }
        return true;
        // After this loop, pos points to the next character after the
        // last single character argument. This characters exists,
        // since otherweise 0 would have already been returned by the
        // loop. firstChar holds this character and firstCharInfo
        // information about it from the command table.
    },
    scanCommand: function() {
        // Assure that there is at least one character
        if (this.pos >= this.buffer.uLength) { return false; }
        var command = "";
        var commandInfo = null;
        // The mainloop. It terminates on its only if the command
        // is not yet complete. (that is, the command type is disamb)
        // In all other cases, return is called from withing the loop.
        while (this.pos < this.buffer.uLength) {
            command += this.buffer.uCharAt(this.pos);
            ++this.pos;
            commandInfo = this.commandTable[command];
            if (!commandInfo) {
                // command does not exist
                this.instance.notFound = true;
                return false;
            }
            else if (commandInfo.type == "command") {
                // normal command
                this.instance.command     = command;
                this.instance.commandInfo = commandInfo;
                return true;
            }
            else if (commandInfo.type == "disamb") {
                // Command is not yet complete, so read more
                // characters, that is, let the loop continue
            }
            else if (commandInfo.type == "longPrefix") {
                // Fetch the whole long command at once.
                // Here, pos points to the first character after the
                // prefix. We set it back such that it points to the
                // first character of the prefix, that is, the first
                // character of the command. (XXX: Is it dangerous to
                // do that?)
                this.pos -= command.length;
                var matchRes = this.buffer.slice(this.pos).match(this.longRegex);
                if (matchRes) {
                    // The command seems to be complete
                    command = matchRes[1];
                    commandInfo = this.commandTable[command];
                    if (!commandInfo) {
                        // command does not exist
                        this.instance.notFound = true;
                        return false;
                    }
                    // Is the force flag set?
                    if (matchRes[2]) { this.instance.forceFlag = true }
                    // Move pos to first character of argument, or the
                    // newline if there is no argument. (That is, skip
                    // the command, the force flag and the whitespaces if present)
                    this.pos += matchRes[1].length;
                    if (matchRes[2]) { this.pos += matchRes[2].length; }
                    if (matchRes[4]) { this.pos += matchRes[4].length; }
                    // Check whether argument is none,
                    // newlineTerminated or parameters. Other values
                    // are not allowed.
                    if (commandInfo.argument=="none") {
                        if (matchRes[5]) {
                            // Throw error since the user provided argument anyway
                            throw new Error("No argument expected");
                        }
                        else {
                            // move pos behind newline since no
                            // argument processing will be performed
                            this.pos += 1;
                        }
                    }
                    else if (commandInfo.argument!="newlineTerminated" && commandInfo.argument!="parameters") {
                        throw new Error("Error in command table")
                    }
                    this.instance.command     = command;
                    this.instance.commandInfo = commandInfo;
                    return true;
                }
                else {
                    // The command is incomplete
                    this.editor.applyBackspaceInInput();
                    break; // terminate the loop
                }
            }
            else {
                throw new Error("Unsupported command table entry type: " + commandInfo.type + " (for command " + command + ")" ); //TODO
            }
        }
        // Since the loop terminated, command is not yet complete
        // entered by the user at this point.
        return false;
    },
    scanArgument: function() {
        var argument;
        var parameters;
        if (this.instance.commandInfo.argument=="none") {
            argument = null;
            parameters = null;
        }
        else if (this.instance.commandInfo.argument=="paramters") {
            // TODO: Parsing of paramters should be improved
            var end = this.buffer.uIndexOf("\n",this.pos);
            if (end==-1) {
                // Command is incomplete
                return false;
            }
            var paramterStringList = buffer.uSlice(this.pos,end).split(" ");
            parameters = {};
            parameterStringList.forEach(function(s) {
                var equalSignIndex = s.indexOf("="); // Counting UTF16 characters
                if (equalSignIndex == -1) {
                    throw new Error("Invalid parameter syntax");
                }
                parameters[s.slice(0,equalSignIndex)] = s.slice(equalSign+1);
            });
            argument = null;
            this.pos = end+1;
        }
        else if (this.instance.commandInfo.argument=="newlineTerminated") {
            var end = this.buffer.uIndexOf("\n",this.pos);
            if (this.instance.commandInfo.argumentLineCount) {
                for (var i=1; end!=-1 && i<this.instance.commandInfo.argumentLineCount; ++i) {
                    end = this.buffer.uIndexOf("\n",end+1);
                }
            }
            if (end==-1) {
                // Command is incomplete
                return false;
            }
            parameters = null;
            argument = this.buffer.slice(this.pos,end);
            this.pos = end+1;
        }
        else if (this.instance.commandInfo.argument=="characters") {
            var ccount = this.instance.commandInfo.argumentCharacterCount
            if (this.buffer.uLength < this.pos + ccount) {
                // Command is incomplete
                return false;
            }
            argument = this.buffer.uSlice(this.pos,this.pos+ccount);
            parameters = null;
            this.pos += ccount;
        }
        else if (this.instance.commandInfo.argument=="manual") {
            argument = this.instance.commandInfo.extractArgument(this);
            if (argument === undefined) {
                // Command is incomplete
                return false;
            }
            parameters = null;
        }
        else if (this.instance.commandInfo.argument=="regex") {
            // TODO
            throw new Error("regex not yet supported");
        }
        else if (this.instance.commandInfo.argument=="selection") {
            // If selection is aleady set, we are done
            if (!this.selection) {
                // TODO
                throw new Error("Selection by argument is not yet supported");
            }
        }
        else {
            throw new Error("Unknown argument type: " + this.instance.commandInfo.argument);
        }
        
        this.instance.argument = argument;
        this.instance.parameters = parameters;
        return true;
    },
}

/** 
 * @class Represents the command the user entered. It stores the name
 * of the command, the given arguments, repeating, information from
 * the command table, and so on. It is also used to represent
 * incomplete, unknown or invalid commands.
 * The method execute() can be used to execute the command.
 */
CommandInstance = function() {
    // Must create these objects for every object, since otherwise, the
    // array of the prototype could be modified accidentally
    /**
     * Array containing the single character pre-arguments.
     */
    this.singleCharacterPreArguments = [];
    /**
     * Parameters provided by the user.
     */
    this.parameters = {};
}
CommandInstance.prototype = {
    /**
     * Mode object this instance is bound to.
     */
    mode: null,
    /**
     * Name of the command, as the user entered it.
     */
    command: null,
    /**
     * The full command, including digits for repeating, single
     * character arguments, arguments, termination string and so on.
     */
    fullCommand: null,
    /**
     * The class of the command, as defined in the command table. The
     * CommandHandler and CommandInstance objects do not look at this
     * value.
     */
    category: null,
    /**
     * The entry of the command table associated to this command
     * instance.
     */
    commandInfo: null,
    /**
     * Long commands can have a force flag
     */
    forceFlag: false,
    /**
     * Argument as string
     */
    argument: null,
    /**
     * Selection
     */
    selection: null,
    /**
     * How many times the command should be repeated by the implementation itself
     */
    internalRepeat: 1,
    /**
     * How many times the execution mechanism has to call the
     * implementation
     */
    externalRepeat: 1,
    /**
     * Function that should be used to execute the command, instead of
     * executing it directly
     */
    executionHandler: null,
    /**
     * Function that has to be used to handle the result.
     */
    resultHandler: null,
    /**
     * The function that implements the command.
     * This function is caled by the execution mechanism, that is, by
     * the execute method of this object. The mode is given as first
     * parameter and this object as the second.
     */
    implementation: null,
    /**
     * Whether the instance can be executed. If not, it is maybe an
     * invalid command.
     */
    get isReadyToExecute() { return this.isComplete && !this.notFound && !this.isInvalid },
    /**
     * True if the command is complete, otherwise false.
     */
    isComplete: false,
    /**
     * True if the command does not exist. (In this case, the command
     * is still in the input buffer, since there is no way to find its
     * end.)
     */
    notFound: false,
    /**
     * True if the command has been found but can not be parsed since
     * its syntax is wrong.
     */
    isInvalid: false,
    /**
     * Executes the command
     */
    execute: function() {
        var result;
        if (!this.isReadyToExecute) {
            throw new Error("This command instance is not ready to be executed!")
        }
        for (var i = 0; i < this.externalRepeat; ++i) {
            if (this.executionHandler) {
                result = this.executionHandler(this.mode,this);
            }
            else {
                var result = this.implementation(this.mode,this);
                if (this.resultHandler) {
                    result = this.resultHandler(this.mode,this,result);
                }
            }
        }
        return result;
    },
};

/* Functions for navigating the DOM, specially tailored to MathML */

/**
 * Returns the element following the given one, null if the given one
 * is the last sibling element.
 */
function mml_nextSibling(element) {
    while (element = element.nextSibling) {
        if (element.nodeType == Node.ELEMENT_NODE) {
            return element;
        }
    }
    return null;
}

/**
 * Returns the element before the given one or null if no preceding
 * siblings exist.
 */
function mml_previousSibling(element) {
    while (element = element.previousSibling) {
        if (element.nodeType == Node.ELEMENT_NODE) {
            return element;
        }
    }
    return null;
}

/**
 * Returns the first element with the same parent
 */
function mml_firstSibling(element) {
    var next;
    while (next = mml_previousSibling(element)) {
        element = next;
    }
    return element;
}

/**
 * Returns the last element with the same parent
 */
function mml_lastSibling(element) {
    var next;
    while (next = mml_nextSibling(element)) {
        element = next;
    }
    return element;
}

/**
 * Returns the first child element.
 */
function mml_firstChild(element) {
    var candidates = element.childNodes;
    for (var i = 0; i < candidates.length; i++) {
        if (candidates[i].nodeType == Node.ELEMENT_NODE) {
            return candidates[i];
        }
    }
    return null;
}

/**
 * Returns the last child element
 */
function mml_lastChild(element) {
    var candidates = element.childNodes;
    for (var i = candidates.length-1; i >= 0; i--) {
        if (candidates[i].nodeType == Node.ELEMENT_NODE) {
            return candidates[i];
        }
    }
    return null;
}

/**
 * Returns the parent element. If the parent element is a document
 * node, null is returned, since this means that the given element
 * already is the root element. (More precisely: If the parent node is
 * not an element, null is returned)
 * @param element A DOM element
 */
function mml_parent(element) {
    return (element.parentNode.nodeType==1) ? element.parentNode : null;
}

/**
 * Returns the next leaf element in document order. A leaf element is
 * an element that has no child elements.
 */
function mml_nextLeaf(element) {
    var nextLeaf = null;
    var nextSibling = mml_nextSibling(element);
    if (!nextSibling) {
        // No next sibling, so we have to go up
        while (!nextSibling) {
            element = element.parentNode;
            nextSibling = mml_nextSibling(element);
            if (element.localName=="math" && element.namespaceURI == NS_MathML) { return null }
        }
        // Here we reached a point where nextSibling is defined.
        // It may be however, that it is not a leaf but an
        // ancestor of a leaf. So it may be that we have to
        // go down later.
    }
    if (mml_firstChild(nextSibling)) {
        // Next sibling is not a leaf but contains children.
        // So we have to go down.
        nextLeaf = nextSibling;
        var next;
        while (next = mml_firstChild(nextLeaf)) {
            nextLeaf = next;
        }
    }
    else if (nextSibling) {
        // Next sibling exists and is a leaf
        nextLeaf = nextSibling;
    }
    return nextLeaf;
}

/**
 * Returns the previous leaf element in document order. A leaf element is
 * an element that has no child elements.
 */
function mml_previousLeaf(element) {
    var previousLeaf = null;
    var previousSibling = mml_previousSibling(element);
    if (!previousSibling) {
        // No next sibling, so we have to go up
        while (!previousSibling) {
            element = element.parentNode;
            previousSibling = mml_previousSibling(element);
            if (element.localName=="math" && element.namespaceURI == NS_MathML) { return null }
        }
        // Here we reached a point where nextSibling is defined.
        // It may be however, that it is not a leaf but an
        // ancestor of a leaf. So it may be that we have to
        // go down later.
    }
    if (mml_lastChild(previousSibling)) {
        // Next sibling is not a leaf but contains children.
        // So we have to go down.
        previousLeaf = previousSibling;
        var next;
        while (next = mml_lastChild(previousLeaf)) {
            previousLeaf = next;
        }
    }
    else if (previousSibling) {
        // Next sibling exists and is a leaf
        previousLeaf = previousSibling;
    }
    return previousLeaf;
}

/**
 * Removes all child nodes of the element
 */
function xml_flushElement(element) {
    while (element.hasChildNodes()) { element.removeChild(element.firstChild); }
}

function stringTonsIURI(uri, base) {
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
    return ioService.newURI(uri, null, base);
}

function stringTonsIURL(uri, base) {
    var myURI = stringTonsIURI(uri, base);
    // Throws an error if it is no URL
    return myURI.QueryInterface(Components.interfaces.nsIURL);
}

function nsIURItonsIURL(uri) {
    return uri.QueryInterface(Components.interfaces.nsIURL);
}

function chromeURLtoFileURLString(chromeurl) {
    return chromeURLtoFileURLnsIURI(StringTonsIURI(chromeurl)).spec;    
}

function chromeURLtoFileURLnsIURI(chromeurl) {
    var chromeRegistry = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                         .getService(Components.interfaces.nsIChromeRegistry);
    return chromeRegistry.convertChromeURL(chromeurl);
}

