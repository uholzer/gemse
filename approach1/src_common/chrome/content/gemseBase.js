/**
 * @class Environment for an equation
 * @param editor The editor object the new environment will belong to
 * @param container The DOM element that will contain this environment
 */
function EquationEnv(editor, container) {
    /** @private */
    this.container = container;
    /** @private */
    this.editor = editor;

    /* The container must provide some elements. They are
      located by the function attribute. */

    var nsResolver = standardNSResolver;

    /**
     * Root element of the equation.
     * The element with function "equation" is the one that
     * actually contains the MathML element. It must already
     * contain one now, not nessecairily empty.
     * @private
     */
    this.equation = document.evaluate(".//.[@internal:function='equation']/*", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;

    /**
     * The element containing the tree view.
     * The tree view shows the tree structure of the equation
     * using nested div elements. This view is always
     * regenerated based on the equation.
     * @private
     */
    this.treeView = new TreeView(this.editor, this, document.evaluate(".//.[@internal:function='treeView']", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue);

    /**
     * The element containing the attribute view.
     * The attribute view lists all attributes of the current
     * element
     * @private
     */
    this.attributeView = new AttributeView(this.editor, this, document.evaluate(".//.[@internal:function='attributeView']", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue);

    /**
     * The element containing the dictionary view.
     * The dictionary view shows information taken from a dictionary
     * about the current element.
     * @private
     */
    this.dictionaryView = new DictionaryView(this.editor, this, document.evaluate(".//.[@internal:function='dictionaryView']", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue);

    /**
     * The element containing the name of the current mode.
     * @private
     */
    this.modeNameIndicator = document.evaluate(".//.[@internal:function='modeName']", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;

    /**
     * The element containing various notifications.
     * @private
     */
    this.notificationDisplay = document.evaluate(".//.[@internal:function='notificationDisplay']", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;

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
    /* Methods */

    /** 
     * Replaces a currenly open equation with a different one.
     * You must not set this.equation directly. You must use
     * this method instead. You also have to call reInit of
     * the current mode afterwards.
     * @param e the root node of the new equation
     */
    replaceEquation: function(e) {
        this.equation.parentNode.replaceChild(e, this.equation);
        this.equation = e;
    },

    /** Rebuilds all currently visible views. */
    updateViews: function() {
        if (this.treeView) { this.treeView.build(); }
        if (this.attributeView && this.mode.contextNode) { 
            var element = this.mode.contextNode;
            while (element.nodeType != Node.ELEMENT_NODE) { element = element.parentNode; }
            this.attributeView.build(); 
        }
        if (this.dictionaryView && this.mode.contextNode) { 
            var element = this.mode.contextNode;
            while (element.nodeType != Node.ELEMENT_NODE) { element = element.parentNode; }
            this.dictionaryView.build(); 
        }
        if (this.modeNameIndicator) {
            this.modeNameIndicator.textContent = this.mode.name;
        }
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
        this.updateViews();
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
        this.updateViews();
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
     * Current woriking directory for this equation.
     * The woring directory is used if the user provides a relative
     * URI for load or save or whatever.
     * XXX: Load does not yet know about this.
     * XXX: Does always use the working directory given by the editor
     * object.
     */
    get workingDirectory() { return this.editor.workingDirectory; },

    /**
     * Turns an URI given as string into an URI object of the
     * nsIIOService. Relative URIs are considered to be relative to
     * the working directory of this equation.
     * @param {String} s the URI as string, may be relative
     */
    stringToURI: function(s) {
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
        return ios.newURI(s,null,ios.newURI(this.workingDirectory,null,null));
    },
    /**
     * Removes all attributes in the internal namespace. This method
     * must be applied on a subtree of a document.
     * @param doc  The document that contains the subtree
     * @param root The root node of the subtree
     */
    cleanSubtreeOfDocument: function(doc,root) {
        // Kills all attributes in the internal namespace
        // (Using TreeWalker, since createNodeIterator has been
        // introduced in firefox 3.1)
        // TODO: How to remove namespace declarations?
        var iterator = doc.createTreeWalker(
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
     * Saves the equation, as it currently looks like, to disk or to a remote
     * server.
     * @param destinationURIString URI where the equation should be
     *                             saved. If this is missing, the
     *                             default location will be used.
     *                             This is usually where the equation
     *                             has been saved to the last time or
     *                             where it was loaded from.
     */
    save: function(destinationURIString) {
        // Saves the equation to its origin if destination is empty.
        // Otherwise it will save it to destinationURI, creating a new
        // XML file with the math element as a root node. 

        // We have to distinguish between several cases

        if (!destinationURIString) {
            var uri = this.stringToURI(this.origin.uri);
            if (this.origin.doc && this.origin.element && uri.scheme == "file") { // Element in a local file
                // Modify the element (which has to be part of the
                // document), serialize the document and save it to the
                // file (which must be a file object)
                var newElement = this.origin.doc.importNode(this.equation, true);
                this.origin.element.parentNode.replaceChild(
                    newElement,
                    this.origin.element
                );
                this.origin.element = newElement;
                this.cleanSubtreeOfDocument(this.origin.doc, newElement);
                var serializer = new XMLSerializer();
                var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                   .createInstance(Components.interfaces.nsIFileOutputStream);
                var file = uri.QueryInterface(Components.interfaces.nsIFileURL).file;
                foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
                serializer.serializeToStream(this.origin.doc, foStream, "")
            }
            else if (this.origin.doc && this.origin.element && this.origin.uri) { // Element in a remote file
                // Modify the element, serialize the document and PUT it
                // to uri
                var newElement = this.origin.doc.importNode(this.equation, true);
                this.origin.element.parentNode.replaceChild(
                    newElement,
                    this.origin.element
                );
                this.cleanSubtreeOfDocument(this.origin.doc, newElement);
                var serializer = new XMLSerializer();
                var xmlString = serializer.serializeToString(doc);
                //var xmlString = XML(serializer.serializeToString(mode.equationEnv.equation)).toXMLString();
                var request = new XMLHttpRequest();
                request.open("PUT", this.origin.uri, false);
                request.setRequestHeader("Content-type", "application/xml"); //XXX: What is the correct Content-type?
                request.send(xmlString);
            }
            else if (this.origin.uri) { // Local or remote file containing only the equation
                destinationURIString = this.origin.uri;
            }
            else {
                throw "Can not save to origin";
            }
        }
        
        // destinationURIString may have been provided by the user or by one
        // of the cases above. If it is set, the target document
        // must contain only the equation. 
        if (destinationURIString) {
            // Create a new document and copy the math element into it
            var doc = document.implementation.createDocument(null, null, null);
            doc.appendChild(doc.importNode(this.equation, true));
            // Kill all attributes in the internal namespace
            this.cleanSubtreeOfDocument(doc,doc);

            var destinationURI = this.stringToURI(destinationURIString);
            
            if (destinationURI.scheme == "file") { // Write to a file
                var serializer = new XMLSerializer();
                var file = destinationURI.QueryInterface(Components.interfaces.nsIFileURL).file;
                var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                   .createInstance(Components.interfaces.nsIFileOutputStream);
                foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
                serializer.serializeToStream(doc, foStream, "")
            }
            else { // Try PUT
                var serializer = new XMLSerializer();
                var xmlString = serializer.serializeToString(doc);
                //var xmlString = XML(serializer.serializeToString(mode.equationEnv.equation)).toXMLString();
                var request = new XMLHttpRequest();
                request.open("PUT", destinationURI, false);
                request.setRequestHeader("Content-type", "application/mathml+xml");
                request.send(xmlString);
            }
            this.origin = { uri: destinationURIString };
        }

        // Tell the history object that we saved the current state
        this.history.reportSaving();
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
            // TODO: Inform user
        }

        // close
        this.editor.eliminateEquationEnv(this);
    },
}

/**
 * @class tree view
 */
function TreeView(editor,equationEnv,viewport) {
    this.editor = editor;
    this.equationEnv = equationEnv;
    /**
     * The element containing the view. (Can be any element.)
     */
    this.viewport = viewport;
}
TreeView.prototype = {    
    /** 
     * Builds the tree view. For showing the tree structure, nested
     * div elements are used. The view is built up from scratch every
     * time. The internal:selected attributes from elements in the
     * equation are also placed in the tree view. 
     */
    build: function() {
        var treeWalker = document.createTreeWalker(
            this.equationEnv.equation,
            NodeFilter.SHOW_ALL,
            { acceptNode: function(node) { return (node.nodeType == Node.ELEMENT_NODE || !(/^\s*$/.test(node.nodeValue))) ?  NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } },
            false
        );
        xml_flushElement(this.viewport);
        var root = document.createElement("div");
        this.viewport.appendChild(root);
        var pos = root;
        var reachedEnd = false;
        while (!reachedEnd) {
            // Create node
            var node = document.createElement("div");
            pos.appendChild(node);
            if (treeWalker.currentNode.nodeType == Node.ELEMENT_NODE) {
                node.setAttribute("class", "element");
                node.appendChild(document.createTextNode(treeWalker.currentNode.localName));
            }
            else {
                node.setAttribute("class", "nodeValue");
                node.appendChild(document.createTextNode(treeWalker.currentNode.nodeValue));
            }
            if (treeWalker.currentNode.nodeType == Node.ELEMENT_NODE && treeWalker.currentNode.getAttributeNS(NS_internal, "selected")) {
                node.setAttributeNS(NS_internal, "selected", treeWalker.currentNode.getAttributeNS(NS_internal, "selected"));
            }
            // Move to next node
            if (treeWalker.firstChild()) {
                pos = node;
            }
            else if (treeWalker.nextSibling()) {
                // do nothing
            }
            else {
                // Go up until there is a nextSibling, then select
                // it
                while (!treeWalker.nextSibling()) {
                    if (!treeWalker.parentNode()) { 
                        reachedEnd = true;
                        break;
                    }
                    pos = pos.parentNode;
                }
            }
        }
    },
}

/**
 * @class attribute view
 */
function AttributeView(editor,equationEnv,viewport) {
    this.editor = editor;
    this.equationEnv = equationEnv;
    /**
     * The element containing the view. (Can be any element.)
     */
    this.viewport = viewport;
}
AttributeView.prototype = {    
    /**
     * Builds the attribute view
     */
    build: function () {
        var forElement = this.equationEnv.mode.contextNode;

        xml_flushElement(this.viewport);
        // Place attribute information inside an Array
        var attributes = [];
        var attributeNodeMap = forElement.attributes;
        for (var i=0; i<attributeNodeMap.length; i++) {
            attributes.push(attributeNodeMap[i]);
        }

        // Sort the array (and filter out internal attributes)
        attributes = attributes.filter(function (a) { return a.namespaceURI != NS_internal });
        attributes = attributes.sort(
            function (a, b) { 
                if (a.namespaceURI < b.namespaceURI) return -1
                else if (a.namespaceURI > b.namespaceURI) return 1
                else if (a.localName < b.localName) return -1
                else if (a.localName > b.localName) return 1
                else return 0;
            }
        );

        generateRow = function (ns, name, value, cursor, selected) {
            var t_ns = document.createElement("td");
            t_ns.appendChild(document.createTextNode(ns));
            var t_name = document.createElement("td");
            t_name.appendChild(document.createTextNode(name));
            var t_value = document.createElement("td");
            t_value.appendChild(document.createTextNode(value));
            var row = document.createElement("tr");
            if (cursor) { row.setAttributeNS(NS_internal, "selected", "attributeCursor") }
            if (selected) { row.setAttributeNS(NS_internal, "selected", "selection") }
            if (selected && cursor) { row.setAttributeNS(NS_internal, "selected", "attributeCursor selection") }
            row.appendChild(t_ns);
            row.appendChild(t_name);
            row.appendChild(t_value);
            return row;
        }

        // Generate table
        var table = document.createElement("table");
        var caption = document.createElement("caption");
        caption.appendChild(document.createTextNode("attributes"));
        table.appendChild(caption);
        for (var i = 0; i < attributes.length; i++) {
            table.appendChild(generateRow(
                attributes[i].namespaceURI,
                attributes[i].localName,
                attributes[i].nodeValue,
                attributes[i].nodeName == forElement.getAttributeNS(NS_internal, "attributeCursor"),
                forElement.getAttributeNS(NS_internal, "selectedAttributes").split(' ').indexOf(attributes[i].nodeName) != -1
            ));
        }
        this.viewport.appendChild(table);

        // Generate table of default attributes
        if (elementDescriptions[forElement.localName] && elementDescriptions[forElement.localName].attributes) {
            table = document.createElement("table");
            table.setAttribute("class", "defaultAttribute");
            var caption = document.createElement("caption");
            caption.appendChild(document.createTextNode("default attributes"));
            table.appendChild(caption);
            var defaultAttributesHash = elementDescriptions[forElement.localName].attributes;
            var defaultAttributes = [];
            for (a in defaultAttributesHash) {
                defaultAttributes.push(defaultAttributesHash[a]);
            }
            for (var i = 0; i < defaultAttributes.length; i++) {
                table.appendChild(generateRow(
                    defaultAttributes[i].namespace || "",
                    defaultAttributes[i].name,
                    defaultAttributes[i].defaultValue,
                    false,
                    false
                ));
            }
            this.viewport.appendChild(table);
        }
    },
}

/**
 * @class dictionary view
 */
function DictionaryView(editor,equationEnv,viewport) {
    this.editor = editor;
    this.equationEnv = equationEnv;
    /**
     * The element containing the view. (Can be any element.)
     */
    this.viewport = viewport;
}
DictionaryView.prototype = {    
    /** 
     * Builds the dictionary view
     */
    build: function() {
        var forElement = this.equationEnv.mode.contextNode;
        
        xml_flushElement(this.viewport);
        // Return immediately if we are not on an mo element
        if (! (forElement.namespaceURI==NS_MathML && forElement.localName=="mo")) { return }

        var table = document.createElement("table");
        var caption = document.createElement("caption");
        caption.appendChild(document.createTextNode("dictionary entries"));
        table.appendChild(caption);
        var titleRow = document.createElement("tr");
        var th = document.createElement("th");
        th.appendChild(document.createTextNode("name"));
        th.setAttribute("colspan", "3");
        titleRow.appendChild(th);
        var th = document.createElement("th");
        th.appendChild(document.createTextNode("comments"));
        th.setAttribute("colspan", "3");
        titleRow.appendChild(th);
        var th = document.createElement("th");
        th.appendChild(document.createTextNode("attributes"));
        titleRow.appendChild(th);
        var th = document.createElement("th");
        th.appendChild(document.createTextNode("other"));
        th.setAttribute("colspan", "2");
        titleRow.appendChild(th);
        table.appendChild(titleRow);

        // XXX: Do we need to remove whitespacve at beginning and end?
        var entries = operatorDictionary.entriesByContent(forElement.textContent);
        entries.forEach(function (entry) {
            var tr = document.createElement("tr");
            
            var td = document.createElement("td");
            td.appendChild(document.createTextNode(entry.content));
            tr.appendChild(td);
            var td = document.createElement("td");
            td.appendChild(document.createTextNode(entry.form));
            tr.appendChild(td);
            var td = document.createElement("td");
            td.appendChild(document.createTextNode(entry.disamb));
            tr.appendChild(td);
            var td = document.createElement("td");
            td.appendChild(document.createTextNode(entry.contentComment));
            tr.appendChild(td);
            var td = document.createElement("td");
            td.appendChild(document.createTextNode(entry.comment));
            tr.appendChild(td);
            var td = document.createElement("td");
            td.appendChild(document.createTextNode(entry.description));
            tr.appendChild(td);
            
            var td = document.createElement("td");
            for (a in entry.attributes) {
                var text = document.createTextNode(
                    a + " = " + entry.attributes[a]
                );
                td.appendChild(text);
                td.appendChild(document.createElement("br"));
            }
            tr.appendChild(td);

            var td = document.createElement("td");
            td.appendChild(document.createTextNode(entry.groupingPrecedence));
            tr.appendChild(td);
            var td = document.createElement("td");
            td.appendChild(document.createTextNode(entry.isSpec ? "spec" : "user"));
            tr.appendChild(td);

            tr.setAttribute("class", entry.isSpec ? "spec" : "user");
            // If all attributes match, we mark the entry as "applied"
            var matches = true;
            for (a in entry.attributes) {
                if (entry.attributes[a] != forElement.getAttribute(a)) { matches = false }
            }
            if (matches) {
                tr.setAttribute("class", tr.getAttribute("class") + " applied");
            }
            
            table.appendChild(tr);
        });

        this.viewport.appendChild(table);
    },
}

/**
 * @class Register holding data that can be put somewhere (so to say, an
 * internal clipboard)
 * @param name the name the user has to use to access this Register,
 * consisting of one unicode character
 * @param content an array of DOM Nodes of the same type
 * @param [type] overrides the automatically detected type of the content
 */
function Register(name, content, type) {
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
        if (!change.ready) { throw "reported change is not ready" }
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
            throw "This Change instance is not ready for undo or redo";
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
            throw "This Change instance is not ready for undo or redo";
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
            throw "Only element nodes can be recorded.";
        }
        // Derive a pointer into the tree where the element is located
        this.treePointer = this.deriveTreePointer(equation, toBeChangedElement);

        // For debugging
        if (this.applyTreePointer(equation, this.treePointer) != toBeChangedElement) {
            throw "Tree pointer does not resolve to the element it has been creted for. (Bug in implementation.) "
                + "applyTreePointer returns a " + this.applyTreePointer(equation, this.treePointer).localName
                + " expected is a " + toBeChangedElement.localName;
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
            throw "Only element nodes can be recorded.";
        }
        // Check the pointer, it must be the same as computed
        // by recordBefore().
        if (this.treePointer.join(',') != this.deriveTreePointer(equation, changedElement).join(',')) {
            throw "Position of the element is not the same as recorded before: "
                + this.treePointer.join(',') + " != " + this.deriveTreePointer(equation, changedElement).join(',');
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
 * @class The Gemse main object. It hosts all equation environments, handles
 * input by the user, keeps registers, options, and so on.
 */
function GemsePEditor() {
    /**
     * Maps single unicode characters to register objects
     */
    this.registers = {};
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
     * The input box where the user enters commands
     * @private
     */
    this.inputElement;
    /**
     * A template as a DOM element of a container for a new equation environment
     * @private
     */
    this.containerTemplate;
    /**
     * Globally set options by name
     * @private
     */
    this.options = {};
    /**
     * Recordings of options created automatically or by the user 
     * @private
     */
    this.inputRecordings = { };
    /**
     * The DOM element that horts all equation Environments, it is
     * called pool. If it is null, then the user can not
     * create new equations.
     * @private
     */
    this.pool = null;
    /**
     * Internal input substitution method. This is implemented in
     * inputSubstitution/cors.js and is perhaps not even present.
     * @private
     */
    this.inputSubstitution = inputSubstitution;
}
GemsePEditor.prototype = {
    /**
     * The global working directory of the editor. An equation may have its own
     * working directory.
     */
    get workingDirectory() {
        var ios = Components.classes["@mozilla.org/network/io-service;1"].
                         getService(Components.interfaces.nsIIOService);
        var workingDirectoryFile = Components.classes["@mozilla.org/file/directory_service;1"].
                         getService(Components.interfaces.nsIProperties).
                         get("CurWorkD", Components.interfaces.nsIFile);
        var workingDirectory = ios.newFileURI(workingDirectoryFile).spec;
        return workingDirectory;
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
            while (this.inputBuffer && this.equations[this.focus].mode.inputHandler()) {};
        }
        catch (e if false) {
            this.equations[this.focus].notificationDisplay.textContent = "Last error: " + e;
        }
        finally {
            // Now, if there is still something in the buffer, it is
            // either an incomplete command or an invalid command. So,
            // if the remeining string ends with ESCAPE, the user
            // wants to clear the input buffer.
            if (this.inputBuffer.charCodeAt(this.inputBuffer.length-1) == KeyEvent.DOM_VK_ESCAPE) {
                this.inputBuffer = "";
            }
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

        if (event.altKey)  { editor.inputBuffer += KEYMOD_ALT }
        if (event.ctrlKey) { editor.inputBuffer += KEYMOD_CONTROL }
        //if (event.metaKey) { editor.inputBuffer += KEYMOD_META }
        if (event.charCode || event.keyCode) {
            editor.inputBuffer += String.fromCharCode(event.charCode || event.keyCode);
                // event.which does not seem to work, it returns 0 for the escape Key
        }
        //if (event.keyCode) { event.preventDefault(); }
        event.preventDefault();
        event.stopPropagation();
        editor.inputEvent();
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
        if (index < 0) { throw "This equationEnv is not even registered!" }

        var pool = document.getElementById("pool");
        pool.removeChild(this.equations[index].container);
        this.equations.splice(index,1);
        if (this.focus > index) { this.moveFocusTo(this.focus-1) }
        if (this.focus == index && index > 0) { --this.focus; this.moveFocusTo(this.focus) }
        else { this.moveFocusTo(this.focus) }

        // XXX: What to do if all equations are gone? Here, we just
        // close the window. (Perhaps this should be configurable?)
        if (this.equations.length==0) {
            window.close();
        }
    },
    /**
     * Attaches a new EquationEnv to an already present element in the
     * document. If one has created a complete container
     * (a dom element with internal:purpos="container") containing all
     * needed elements, including the equation, this method can be
     * used to create an equation environment object that is attached
     * to the container and added to the list of equations.
     * This method is mainly used internally but is also used from the
     * outside sometimes.
     * @param element the cotnainer element
     * @returns {EquationEnv} the new equation environment
     */
    attachNewEquationEnvToElement: function (element) {
        var newEquationEnv = new EquationEnv(this, element);
        newEquationEnv.init();
        this.equations.push(newEquationEnv);
        this.moveFocusTo(this.equations.length-1);
        return newEquationEnv;
    },
    /**
     * Create new equation and its environment. A new EquationEnv gets
     * created and also a new container element. For the new
     * container, this.containerTemplate is used.
     * @param equation this DOM element is used as the equation and
     *                 placed into its location in the container
     *                 element. No fullcopy is made beforehand. If
     *                 this parameter is missing, the equation from
     *                 the tamplate is used
     * @returns {EquationEnv} the new equation environment
     */
    newEquation: function (equation) {
        // Creates a new EquationEnv and also a new Element in the
        // document. If the argument equation is not given, an empty
        // one gets created. Returns the newly created EquationEnv.
        if (!this.containerTemplate) { throw "No template defined" }
        var pool = document.getElementById("pool");
        if (!pool) { throw "No pool element present" }
        // Create new container in the XML document
        var newContainer = this.containerTemplate.cloneNode(true);
        pool.appendChild(newContainer);
        // Attach element to it
        var newEquationEnv = new EquationEnv(this, newContainer);
        newEquationEnv.init();
        this.equations.push(newEquationEnv);
        if (equation) {
            newEquationEnv.replaceEquation(equation);
            newEquationEnv.mode.reInit(); //XXX: Find better solution
        }
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
     * @param {String} uri
     * @param {String} elementId
     * @param {String} xpathString
     */
    loadURI: function (uri, elementId, xpathString) {
        // Check whether uri is relative. Make an absolute one out of it.
        // XXX: Stupid hack:
        // (Fails, if the preivileges for accessing Components.classes
        // are missing. In such a case, do not make the uri absolute
        // and let that handle by the XMLHttpRequest. I think this
        // means that then the location of the editor.xhtml is taken
        // as base by XMLHttpRequest.)
        try {
            var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
            uri = ios.newURI(uri,null,ios.newURI(this.workingDirectory,null,null)).spec;
        }
        catch (e) { }

        // Create request
        var request = new XMLHttpRequest();
        request.open("GET", uri, false);
        request.send(null);
        var doc = request.responseXML;
        
        var mathElements = [];
        var origins = [];
        if (elementId) {
            mathElements[0] = doc.getElementById(elementId);
            origins[0] = {
                uri: uri,
                doc: doc,
                element: mathElements[0]
            }
        }
        else if (xpathString) {
            var xpathResult = doc.evaluate(xpathString, doc, standardNSResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            var resultNode;
            var i=0;
            while (resultNode = xpathResult.iterateNext()) { 
                mathElements.push(resultNode);
                origins.push({
                    uri: uri,
                    doc: doc,
                    element: resultNode
                });
                ++i;
            }
        }
        else {
            mathElements[0] = doc.documentElement;
            origins[0] = {
                uri: uri
            }
        }

        for (var i=0; i<mathElements.length; i++) {
            if (mathElements[i].localName != "math" || mathElements[i].namespaceURI != "http://www.w3.org/1998/Math/MathML") {
                throw "The element you load should be a math element in the MathML namespace";
            }

            // Create new environment using a deep copy
            var newEquationEnv = this.newEquation(document.importNode(mathElements[i], true));

            // Create Origin object
            newEquationEnv.origin = origins[i];

            // Tell the history object that this new equation is already
            // saved.
            newEquationEnv.history.reportSaving();
        }
    },
    /**
     * Load an equation from an already loaded document.
     * In order to edit an equation which is part of a document that
     * is loaded in this instance of Mozilla, one uses this method to
     * open it in Gemse. A deep copy of the equation is made and it
     * gets written back only when the user saves his changes.
     * @param doc DOM document containing the equation
     * @param element the root element of the equation
     */
    loadFromOpenDocument: function(doc,element) {
        if (element.localName != "math" || element.namespaceURI != "http://www.w3.org/1998/Math/MathML") {
            throw "The element you load should be a math element in the MathML namespace";
        }

        // Create new environment using a deep copy
        var newEquationEnv = this.newEquation(document.importNode(element, true));

        // Create Origin object
        newEquationEnv.origin = { uri: doc.URL, doc: doc, element: element }

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
        this.loadURI(uri,null,"//m:math");
    },
    /**
     * Moves the focus to another equation.
     * @dest {Integer}
     */
    moveFocusTo: function(dest) {
        if (dest >= this.equations.length) { return false }
        if (dest < 0) { return false }
        if (this.focus >= 0) {
            this.equations[this.focus].container.removeAttributeNS(NS_internal, "selected");
        }
        this.focus = dest;
        this.equations[this.focus].container.setAttributeNS(NS_internal, "selected", "equationFocus");
    },
    /**
     * Get an option's handler object, which defines a validator and a
     * parser.
     */
    getOptionHandler: function(key) {
        for (var i=0; i < GemsePEditor.knownClasses.length; ++i) {
            if (GemsePEditor.knownClasses[i].gemseOptions &&
                GemsePEditor.knownClasses[i].gemseOptions[key]) {
                return GemsePEditor.knownClasses[i].gemseOptions[key];
            }
        }
        return null;
    },
    /**
     * Get the value of an option as string.
     * @param key name of the option
     * @returns {String} current value of the option
     */
    getOption: function(key) {
        // Tries to get the option. This may depend on the focused
        // equation
        var value = undefined;
        if (this.focus >= 0) {
            value = this.equations[this.focus].options[key];
        }
        if (value === undefined) {
            value = this.options[key];
        }
        if (value === undefined) {
            var handler = this.getOptionHandler(key);
            if (!handler) { throw "Option " + key + " does not exist" }
            value = handler.defaultValue;
        }
        return value;
    },
    /**
     * Get the value of an option as suitable data structure.
     * The registered parser for the option in question is used to
     * transform the string value into an arbitrary object.
     * @param   key name of the requested option
     * @returns result as given by the registered parser
     */
    getOptionParsed: function(key) {
        var value = this.getOption(key);
        var handler = this.getOptionHandler(key);
        return handler.parser(value,this);
    },
    /**
     * Set an option to a string value, globally or locally.
     * The new value is checked for validity using the
     * registered validator. If the option does not exist or the value
     * is invalid, an error is thrown.
     * @param {String}  key    name of the option to be set
     * @param {String}  value  new value
     * @param {Boolean} global If true, the option is set for all
     *                         equations, if false, it is set only for
     *                         the current one.
     */
    setOption: function(key,value,global) {
        // Sets the option key to value for the current equation if
        // global is false. If global is true, the option is set on
        // all equations
        var handler = this.getOptionHandler(key);
        if (!handler) { throw "Option " + key + " does not exist" }
        if (!handler.validator(value,this)) {
            throw value + " is not a valid value for the option" + key;
        }
        if (global || this.focus == -1) {
            this.equations.forEach(function(e) { delete e.options[key]; })
            this.options[key] = value;
        }
        else {
            this.equations[this.focus].options[key] = value;
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
            throw "pos must be at least 1 here";
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
        if (this.pos > 0) { throw "scanRepeating requires pos to be 0"; }
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
                            throw "No argument expected";
                        }
                        else {
                            // move pos behind newline since no
                            // argument processing will be performed
                            this.pos += 1;
                        }
                    }
                    else if (commandInfo.argument!="newlineTerminated" && commandInfo.argument!="parameters") {
                        throw "Error in command table"
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
                throw "Unsupported command table entry type: " + commandInfo.type + " (for command " + command + ")" ; //TODO
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
                    throw "Invalid parameter syntax";
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
            throw "regex not yet supported";
        }
        else if (this.instance.commandInfo.argument=="selection") {
            // If selection is aleady set, we are done
            if (!this.selection) {
                // TODO
                throw "Selection by argument is not yet supported";
            }
        }
        else {
            throw "Unknown argument type: " + this.instance.commandInfo.argument;
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
            throw "This command instance is not ready to be executed!"
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
 * Returns the parent element. If the given element is a math element,
 * null is returned, since it is the root element of an equation.
 */
function mml_parent(element) {
    // Important: We must not go above the formula
    if (element.localName != "math" || element.namespaceURI != NS_MathML) {
        return element.parentNode;
    }
    return null;
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

