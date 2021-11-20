export { GemsePEditor };

import "./UString.js";

import { NS, standardNSResolver } from "./namespace.js";
import { KeyMod, KeyRepresentation, KeynameQuote } from "./key.js";
import { xml_flushElement } from "./dom.js";
import { gemseGlobalOptions } from "./globalOptions.js";
import { OptionsAssistant } from "./optionsAssistant.js";
import { inputSubstitution, inputSubstitutionActive } from "./inputSubstitution/core.js";
import { EditMode } from "./editMode.js";
import { XMLHttpRequestDocStorage, ReadOnlyXMLHttpRequestDocStorage, InMemoryDocStorage } from "./storage.js";

import { viewClasses } from "./views.js"; // Sets 

import { attributeModeCommandOptions, attributeModeCommands } from "./attributeMode_commandTable.js";
import { contentInsertModeCommandOptions, contentInsertModeCommands } from "./contentInsertMode_commandTable.js";
import { editModeCommandOptions, editModeCommands } from "./editMode_commandTable.js";
import { trivialInsertModeCommandOptions, trivialInsertModeCommands } from "./trivialInsertMode_commandTable.js";
import { ucdInsertModeCommandOptions, ucdInsertModeCommands } from "./ucdInsertMode_commandTable.js";
import { visualSelectionModeCommandOptions, visualSelectionModeCommands } from "./visualSelectionMode_commandTable.js";

window.attributeModeCommandOptions = attributeModeCommandOptions;
window.attributeModeCommands = attributeModeCommands;
window.contentInsertModeCommandOptions = contentInsertModeCommandOptions;
window.contentInsertModeCommands = contentInsertModeCommands;
window.editModeCommandOptions = editModeCommandOptions;
window.editModeCommands = editModeCommands;
window.trivialInsertModeCommandOptions = trivialInsertModeCommandOptions;
window.trivialInsertModeCommands = trivialInsertModeCommands;
window.ucdInsertModeCommandOptions = ucdInsertModeCommandOptions;
window.ucdInsertModeCommands = ucdInsertModeCommands;
window.visualSelectionModeCommandOptions = visualSelectionModeCommandOptions;
window.visualSelectionModeCommands = visualSelectionModeCommands;


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
                    if (attrs[i].namespaceURI == NS.internal) { n.removeAttributeNode(attrs[i]) }
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
            destinationURIString = new URL(destinationURIString, this.workingDirectory);

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
            this.editor.showMessage("Refused to close equation, since it has unsaved changes.");
            return false;
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
        else if (clipboardDOM.documentElement.localName == "math" && clipboardDOM.documentElement.namespaceURI == NS.MathML) {
            // Put the child elements into an array
            var arrayOfElements = [];
            for (var i=0; i < clipboardDOM.documentElement.childNodes.length; ++i) {
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
        if (data.content.length != 1 || data.content[0].localName != "math" || data.content[0].namespaceURI != NS.MathML) {
            rootNode = doc.createElementNS(NS.MathML, "math");
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
    // attributes in the namespace NS.internal.
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
ViewsetManager.viewClasses = viewClasses;
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
            var className = viewports[i].getAttributeNS(NS.internal, "viewClass");
            var constructor = this.viewClasses[className];
            if (!constructor) {
                throw new Error("There is no view with the name " + className);
            }
            // Create view
            //XXX: Is this ok?
            var newview = new constructor(this.editor,this.editor.equations[this.editor.focus],viewports[i]);
            this.views.push(newview);
            // Reading in options from internal:options attribute of
            // the viewort is done by the views themselves.
        }
    },
    /**
     * Reads the options from the viewport's internal:options attribute
     */
    readOptionsFromViewport: function(view, viewport) {
        // Read in options from internal:options attribute of the Element element
        if (viewport.hasAttributeNS(NS.internal, "options")) {
            var options = this.parseOptionsString(viewport.getAttributeNS(NS.internal, "options"));
            for (var option of options) {
                try {
                    this.editor.optionsAssistant.set(option[0],option[1],null,view);
                }
                catch(e) {
                    this.editor.showMessage(e);
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
     * @param scope       "default" to define how to choose a viewset
     *                    by default, "eqindep" to set the viewset for
     *                    all equations, "eqlocal" to set it just for
     *                    the current equation. (If missing, "eqlocal"
     *                    is assumed.)
     */
    chooseViewset: function(viewsetName,scope) {
        if (scope=="default") {
            this.editor.optionsAssistant.set("defaultViewset", viewsetName);
        }
        else {
            this.editor.optionsAssistant.set("viewset", viewsetName, null, null, scope=="eqindep" ? false : true);
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
        var viewsetManager = this;
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
                viewsetManager: viewsetManager, 
                onunload: function() {viewsetManager.confWindow=null} 
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

/**
 * @class The Gemse main object. It hosts all equation environments, handles
 * input by the user, keeps registers, options, and so on.
 * @param callback A function which is called when the setup of the
 *                 editor object has been completed. It must not be 
 *                 used before this function has been called!
 *                 The first argument handed over to the callback is
 *                 the new editor object.
 */
function GemsePEditor(callback) {
    /* We split initialization up into multiple steps which are called
     * at the end. */

    var newEditor = this;

    var step1 = function(nextstep) {

    /**
     * Maps single unicode characters to register objects
     */
    newEditor.registerManager = new RegisterManager();
    /**
     * Array of EquationEnv objects
     * @private
     */
    newEditor.equations = [];
    /**
     * The number of the equation that currently has the focus
     * @private
     */
    newEditor.focus = -1;
    /**
     * List of open documents
     * @private
     */
    newEditor.storages = [];
    /**
     * The input box where the user enters commands
     * (The constructor of the editor looks for the element with id
     * "input".)
     * @private
     */
    newEditor.inputElement = document.getElementById("input");

    nextstep();
    
    }; // end of step1

    var step2 = function(nextstep) {

    /**
     * The current working directory for internal use. If you want to
     * get or set the working directory, use editor.workingDirectory.
     * This value has nothing to do with the real current working
     * directory of the application.
     * The value is an URI as string.
     * @private
     */
    newEditor._workingDirectory = document.URL;
    /**
     * A template as a DOM element of a new equation.
     * (The constructor of this class does set this property by
     * looking for an element with id "equationTemplate"
     * It also detaches this
     * element from the document itself.)
     * @private
     */
    newEditor.equationTemplate = document.getElementById("equationTemplate");
    newEditor.equationTemplate.parentNode.removeChild(newEditor.equationTemplate);
    newEditor.equationTemplate.removeAttribute("id");
    /**
     * OptionsAssistant that handles options
     */
    newEditor.optionsAssistant = new OptionsAssistant();
    /* Load global options and options from known classes */
    newEditor.optionsAssistant.loadDescriptions(gemseGlobalOptions);
    for (var i=0;i<GemsePEditor.knownClasses.length;++i) {
        newEditor.optionsAssistant.loadDescriptions(GemsePEditor.knownClasses[i].gemseOptions);
    }
    /**
     * Option object for global options
     */
    newEditor.o = newEditor.optionsAssistant.obtainOptionsObject();
    /**
     * Recordings of options created automatically or by the user 
     * @private
     */
    newEditor.inputRecordings = { };
    /**
     * The last messages for the user stored as DOM nodes.
     * Messages the user doesn't want to see anymore are deleted.
     */
    newEditor.messages = [];
    /**
     * Manages the view sets.
     * (The constructor of the editor does use the element with id
     * "viewsetDock" as dock. It also calls
     * viewsetManager.loadViewsets handing over the first
     * internal:viewsets element of the document. This element is
     * removed from the document afterwards.)
     * @private
     */
    newEditor.viewsetManager = new ViewsetManager(newEditor,document.getElementById("viewsetDock"));
    var viewsets = document.getElementsByTagNameNS(NS.internal, "viewsets")[0];
    newEditor.viewsetManager.loadViewsets(viewsets);
    viewsets.parentNode.removeChild(viewsets);
    /**
     * Internal input substitution method. This is implemented in
     * inputSubstitution/cors.js and is perhaps not even present.
     * @private
     */
    newEditor.inputSubstitution = inputSubstitution;

    nextstep();
    }; // end of step2

    // Now call the steps:
    var callbackcall = function() { callback(newEditor) };
    var step2call = function() { step2(callbackcall) }
    step1(step2call);
}
GemsePEditor.prototype = {
    /**
     * The working directory of the editor.
     */
    get workingDirectory() {
        return this._workingDirectory;
    },
    set workingDirectory(dir) {
        if (dir) {
            this._workingDirectory = dir;
        }
        else {
            // If dir is empty, we change to a useful default location.
            this._workingDirectory = document.URL;
        }
        this.showMessage("Changed working directory to " + this._workingDirectory);
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
            // if the remaining string ends with ESCAPE, the user
            // wants to clear the input buffer.
            if (this.inputBuffer[this.inputBuffer.length-1] == KeyRepresentation.Escape) {
                this.inputBuffer = "";
            }
            // Update the views
            if (updateOfViewsNeeded) { this.viewsetManager.build(); }
        }
    },
    /**
     * Handle key event. This is called by editor.xhtml when the user hits a
     * key. If a modifier is used or the key is a special key that would not
     * add a character by default (such as escape) a string representation of
     * the pressed key combination is added to the input buffer. Note: Not all
     * input generates key events, for example pasting from the clipboard.
     */
    keyEvent: function (event) {
        // Is called when a key gets hit. This also is called
        // if the key does not cause a character to be entered
        // into the input element (i.e. the input buffer).

        const editor = this;

        const modifiers = [
            "Alt",
            "AltGraph",
            "CapsLock",
            "Control",
            "Fn",
            "FnLock",
            "Hyper",
            "Meta",
            "NumLock",
            "ScrollLock",
            "Shift",
            "Super",
            "Symbol",
            "SymbolLock",
            "OS", // Firefox Bug, should be Meta. https://bugzilla.mozilla.org/show_bug.cgi?id=1232918
        ];

        const modifierPrefix = [["Alt", KeyMod.alt], ["Control", KeyMod.control]]
            .filter(([modifier, _]) => event.getModifierState(modifier))
            .map(([_, prefix]) => prefix)
            .join("");

        if (event.composing) {
            // The user should be capable to input via composing. In this case,
            // we must let the input box do the usual thing.
        }
        else if (modifiers.includes(event.key)) {
            // We do not treat key presses of modifiers as distinct key presses
            // because other events will be fired for any keys pressed while
            // this modifier is active.
        }
        else if (event.key.length > 1) {
            editor.inputBuffer += modifierPrefix + (KeyRepresentation[event.key] || KeynameQuote + event.key + KeynameQuote);
            stopDefaultBehaviour();
        }
        else if (modifierPrefix) {
            editor.inputBuffer += modifierPrefix + event.key;
            stopDefaultBehaviour();
        }
        else {
            // We do not do anything special, the respective character(s) will
            // be added by normal input box behaviour.
        }

        function stopDefaultBehaviour() {
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
        for (var r in this.inputRecordings) {
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
        var uri = new URL(uriString);

        if (uri.protocol == "http:") {
            return new XMLHttpRequestDocStorage(uriString);
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

        uri = new URL(uri, this.workingDirectory);

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
                var is_math = (m.localName == "math" && m.namespaceURI == NS.MathML);
                var is_OMOBJ = (m.localName == "OMOBJ" && m.namespaceURI == NS.OpenMath);
                var is_notation = (m.localName == "notation" && m.namespaceURI == NS.OMDoc);
                if (!this.o.loadAnyAsRoot && !is_math && !is_OMOBJ && !is_notation) {
                    //XXX: Maybe we should not throw here, but just skip this equation
                    throw new Error("The element you load must be a math element " + 
                                    "in the MathML namespace, an OMOBJ element " + 
                                    "in the OpenMath namespace or a notation " +
                                    "element in the OMDoc namespace");
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
        var is_math = (element.localName == "math" && element.namespaceURI == NS.MathML);
        var is_OMOBJ = (element.localName == "OMOBJ" && element.namespaceURI == NS.OpenMath);
        var is_notation = (element.localName == "notation" && element.namespaceURI == NS.OMDoc);
        if (!this.o.loadAnyAsRoot && !is_math && !is_OMOBJ && !is_notation) {
            throw new Error("The element you load must be a math element " + 
                            "in the MathML namespace, an OMOBJ element " + 
                            "in the OpenMath namespace or a notation " +
                            "element in the OMDoc namespace");
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
        this.loadURI(uri,null,"(//m:math|//om:OMOBJ|//o:notation)[not(ancestor::m:math|ancestor::om:OMOBJ|ancestor::o:notation)]");
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
            var errorElement = document.createElementNS(NS.HTML, "div");
            errorElement.setAttribute("class", "error");
            errorElement.appendChild(document.createTextNode(message.name + ": " + message.message));
            if (this.o.detailedErrors) {
                var stackBacktrace = document.createElementNS(NS.HTML, "pre");
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
            var newMessage = document.createElementNS(NS.HTML,"div");
            newMessage.appendChild(document.createTextNode(message.toString()));
            this.messages.push(newMessage);
        }
    },
}

GemsePEditor.knownClasses = [EditMode].concat(Object.values(viewClasses));
