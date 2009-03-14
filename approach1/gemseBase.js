function EquationEnv(editor, container) {
    this.container = container;
    this.editor = editor;

    /* The container must provide some elements. They are
      located by the function attribute. */

    var nsResolver = function (prefix) { 
        if (prefix == "internal") { return NS_internal }
        else { return null }
    };

    // The element with function "equation" is the one that
    // actually contains the MathML element. It must already
    // contain one now, not nessecairily empty.
    this.equation = document.evaluate(".//.[@internal:function='equation']/*", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;

    // The tree view shows the tree structure of the equation
    // using nested div elements. This view is always
    // regenerated based on the equation.
    this.treeView = document.evaluate(".//.[@internal:function='treeView']", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;

    // The attribute view lists all attributes of the current
    // element
    this.attributeView = document.evaluate(".//.[@internal:function='attributeView']", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;

    // The dictionary view shows information taken from a dictionary
    // about the current element.
    this.dictionaryView = document.evaluate(".//.[@internal:function='dictionaryView']", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;

    // The modeName element shows the name of the current mode
    this.modeNameIndicator = document.evaluate(".//.[@internal:function='modeName']", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;

    // The notificationDisplay element
    this.notificationDisplay = document.evaluate(".//.[@internal:function='notificationDisplay']", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;

    // The origin is an object that describes where exactly the
    // equation has been loaded from. If there is no origin, this
    // property should be set to null. This may happen for example
    // when the user creates a new equation. The write command uses
    // this property to find out where to write the equation by
    // default. This description of the origin must be stable in the
    // sense, that it must stay valid even if other equations in the
    // same document are modified.
    // (How this object has to look like is defined by the save method
    // below.)
    this.origin = null;

    // The working directory is used if the user provides a relative URI for
    // load or save or whatever. XXX: Load does not yet know about
    // this.
    this.__defineGetter__("workingDirectory", function() { return this.editor.workingDirectory; });

    // Options that are locally set for this equationEnv. A mode
    // should not read or write this array directly, it should use
    // getOption() and setOption() from the editor object.
    this.options = [];

    /* Methods */

    // Getting and setting the equation 
    // You must not set this.equation directly. You must use
    // the following method. You also have to call reInit of
    // the current mode afterwards.
    this.replaceEquation = function(e) {
        this.equation.parentNode.replaceChild(e, this.equation);
        this.equation = e;
    }

    this.updateViews = function() {
        if (this.treeView) { this.buildTreeView(); }
        if (this.attributeView && this.mode.contextNode) { 
            var element = this.mode.contextNode;
            while (element.nodeType != Node.ELEMENT_NODE) { element = element.parentNode; }
            this.buildAttributeView(element); 
        }
        if (this.dictionaryView && this.mode.contextNode) { 
            var element = this.mode.contextNode;
            while (element.nodeType != Node.ELEMENT_NODE) { element = element.parentNode; }
            this.buildDictionaryView(element); 
        }
        if (this.modeNameIndicator) {
            this.modeNameIndicator.textContent = this.mode.name;
        }
    }

    this.buildTreeView = function() {
        var treeWalker = document.createTreeWalker(
            this.equation,
            NodeFilter.SHOW_ALL,
            { acceptNode: function(node) { return (node.nodeType == Node.ELEMENT_NODE || !(/^\s*$/.test(node.nodeValue))) ?  NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } },
            false
        );
        while (this.treeView.hasChildNodes()) { this.treeView.removeChild(this.treeView.firstChild); }
        var root = document.createElement("div");
        this.treeView.appendChild(root);
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

    }

    this.buildAttributeView = function (forElement) {
        while (this.attributeView.hasChildNodes()) { this.attributeView.removeChild(this.attributeView.firstChild); }
        // Place attribute information inside an Array
        var attributes = [];
        var attributeNodeMap = forElement.attributes;
        for(var i=0; i<attributeNodeMap.length; i++) {
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
        this.attributeView.appendChild(table);

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
            this.attributeView.appendChild(table);
        }
    }

    this.buildDictionaryView = function (forElement) {
        while (this.dictionaryView.hasChildNodes()) { this.dictionaryView.removeChild(this.dictionaryView.firstChild); }
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

        this.dictionaryView.appendChild(table);
    }

    this.init = function() {
        this.mode.init();
    }

    this.callMode = function (mode) {
        // mode must be a properly created and initialized mode
        // When the mode finishes (by calling finishMode),
        // control is returned to the current mode.
        this.modeStack.push(mode);
        this.updateViews();
    }
    this.switchMode = function (mode) {
        // mode must be a properly created and initialized mode
        // Unlike callMode, this method kills the current mode
        // and puts the new one at its place.
        this.modeStack[this.modeStack.length-1] = mode;
        this.updateViews();
    }
    this.finishMode = function (returnValue) {
        // Closes the curent mode and reverts to the old one
        this.modeStack.pop();
        this.modeStack[this.modeStack.length-1].calledModeReturned(returnValue);
    }
    this.__defineGetter__("mode", function() { return this.modeStack[this.modeStack.length-1]; });

    this.stringToURI = function(s) {
        // Given a URI as a string, returns an uri object. 
        // The string may be a relative URI.
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
        return ios.newURI(s,null,ios.newURI(this.workingDirectory,null,null));
    }
    this.cleanSubtreeOfDocument = function(doc,root) {
        // Kills all attributes in the internal namespace
        // (Using TreeWalker, since createNodeIterator has been
        // introduced in firefox 3.1)
        // TODO: How to remove namespace desclarations?
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
    }
    this.save = function(destinationURIString) {
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
    }
    this.close = function(force) {
        // Closes this equation environment if their are no unsaved
        // changes or if force is set to true

        // Check whether there are unsaved changes
        if (this.history.hasChanges() && !force) {
            return false;
            // TODO: Inform user
        }

        // close
        this.editor.eliminateEquationEnv(this);
    }

    /* Additional objects */

    this.history = new History;   // An array of Change Elements
    this.modeStack = [new EditMode(editor, this)];
}

function Register(name, content, type) {
    this.name = name; // Should be one unicode character
    this.content = content;
    // content is an array of DOM Nodes of the same type
    // (Text nodes, element nodes, or attribute nodes)
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

function History() {
    this.position = -1; // Alway points to the last change applied
    this.savedState = -2; // Always points to the last change saved to disk
        // (Set to -2 so that -1!=-2 at the beginning)
    this.goBack = function (equationEnv) {
        if (this.position < 0) { return false; }
        this[this.position].undo(equationEnv);
        --this.position;
        return true;
    }
    this.goForward = function (equationEnv) {
        if (this.position >= this.length-1) { return false; }
        ++this.position;
        this[this.position].redo(equationEnv);
        return true;
    }
    this.createChange = function () {
        return new Change();
    }
    this.reportChange = function(change) {
        if (!change.ready) { throw "reported change is not ready" }
        this.length = this.position + 1; // Chop off succeeding changes
        this.push(change);
        ++this.position;
    }
    this.reportSaving = function() {
        // Marks the current state as saved
        this.savedState = this.position;
    }
    this.hasChanges = function() {
        // Returns false if the current state has been written to file
        return !(this.savedState == this.position);
    }
}
History.prototype = new Array();

function Change() {
    /* Default implementation of Change */
    // The equation element (or its descendants) is supposed
    // to carry the whole significant mode state, given as
    // attributes in the namespace NS_internal.
    // The method reInit of the mode is called after the
    // change so that the mode can update its data structures
    this.undo = function (equationEnv) {
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
    }
    this.redo = function (equationEnv) {
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
    }
    this.oldNode = null;
    this.newNode = null;
    this.treePointer = [];
    this.command = null; // Please set that, otherwise the command '.' will not work
    this.ready = false;
    this.recordBefore = function (equation,toBeChangedElement) {
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
    }
    this.recordAfter = function (equation,changedElement) {
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
    }
    this.deriveTreePointer = function (equation, target) {
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
    }
    this.applyTreePointer = function (equation, pointer) {
        var target = equation;
        pointer.forEach(function(siblingNumber) {
            target = target.childNodes[siblingNumber];
        });
        return target;
    }
}

function GemsePEditor() {
    this.registers = {}; // Maps unicode characters to register objects
    this.equations = []; // Array of EquationEnv objects.
    this.focus = -1; // Number of equation that has the focus
    this.inputElement; // A dom element that receives user input
    this.containerTemplate; // A dom element that can be sed to create new containers
    this.options = []; // Array of options wich differ from the defaults
    this.insertModes = {
        trivial: {
            constructor: trivialInsertMode
        },
        ucd: {
            constructor: ucdInsertMode
        }
    };

    // Find out the current working directory
    this.__defineGetter__("workingDirectory", function() {
        var ios = Components.classes["@mozilla.org/network/io-service;1"].
                         getService(Components.interfaces.nsIIOService);
        var workingDirectoryFile = Components.classes["@mozilla.org/file/directory_service;1"].
                         getService(Components.interfaces.nsIProperties).
                         get("CurWorkD", Components.interfaces.nsIFile);
        var workingDirectory = ios.newFileURI(workingDirectoryFile).spec;
        return workingDirectory;
    });

    /* Methods */
    this.inputEvent = function () {
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
    };
    this.inputSubstitution = inputSubstitution;
        // This is implemented in inputSubstitution/core.js and is
        // perhaps not even present.
    this.keyEvent = function (event) {
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
    };
    this.__defineGetter__("inputBuffer", function() { return this.inputElement.value; });
    this.__defineSetter__("inputBuffer", function(x) { this.inputElement.value = x; });
    // Modes must not set the inputBuffer directly. Instead, they
    // should use the mothod eatInput
    // eatInput(numberOfCharacters) removes numberOfCharacters from
    // the inputBuffers. Also, it does records the removed string for
    // command repeating.
    this.eatInput = function(numberOfCharacters) {
        for (r in this.inputRecordings) {
            this.inputRecordings[r] += this.inputBuffer.slice(0,numberOfCharacters);
        }
        this.inputBuffer = this.inputBuffer.slice(numberOfCharacters);
    }
    this.inputRecordings = { };
    this.startInputRecording = function(name) {
        this.inputRecordings[name] = "";
    }
    this.stopInputRecording = function(name) {
        var result = this.inputRecordings[name];
        delete this.inputRecordings[name];
        return result;
    }

    this.eliminateEquationEnv = function (equationEnv) {
        // This method must only be called by methods of equationEnv.
        // The equationEnv gets dropped from this.equations and this.focus
        // gets adjusted if needed.
        var index = this.equations.indexOf(equationEnv);
        if (index < 0) { throw "This equationEnv is not even registered!" }

        var pool = document.getElementById("pool");
        pool.removeChild(this.equations[index].container);
        this.equations.splice(index,1);
        if (this.focus > index) { this.moveFocusTo(this.focus-1) }
        if (this.focus == index && index > 0) { --this.focus; this.moveFocusTo(this.focus) }
        else { this.moveFocusTo(this.focus) }
        // TODO: What to do if all equations are gone?
    }
    this.attachNewEquationEnvToElement = function (element) {
        // Attaches a new EquationEnv to an already present element in
        // the document. Returns the newly created EquationEnv.
        var newEquationEnv = new EquationEnv(this, element);
        newEquationEnv.init();
        this.equations.push(newEquationEnv);
        this.moveFocusTo(this.equations.length-1);
        return newEquationEnv;
    }
    this.newEquation = function (equation) {
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
    }
    this.loadURI = function (uri, elementId, xpathString) {
        // Fetches the uri. If elementId and xpathString are empty, it
        // uses the root element as the MathML element. If elementId
        // is given, it uses the element with this id. Else, if
        // xpathString is given (and elementId is null), it evaluates
        // this xpath expression and uses the first result.
        // This is done using an XMLHttpRequest. This also works for
        // local files.

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
    }
    this.loadFromOpenDocument = function(doc,element) {
        // If the element to edit is part of an already open document,
        // call this method to load it
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
    }
    this.loadAll = function(uri) {
        // Loads all equations found in the file uri
        this.loadURI(uri,null,"//m:math");
    }
    this.moveFocusTo = function(dest) {
        if (dest >= this.equations.length) { return false }
        if (dest < 0) { return false }
        if (this.focus >= 0) {
            this.equations[this.focus].container.removeAttributeNS(NS_internal, "selected");
        }
        this.focus = dest;
        this.equations[this.focus].container.setAttributeNS(NS_internal, "selected", "equationFocus");
    }
    this.getOption = function(key) {
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
            value = defaultOptions[key];
        }
        return value;
    }
    this.setOption = function(key,value,global) {
        // Sets the option key to value for the current equation if
        // global is false. If global is true, the option is set on
        // all equations
        if (global || this.focus == -1) {
            this.equations.forEach(function(e) { delete e.options[key]; })
            this.options[key] = value;
        }
        else {
            this.equations[this.focus].options[key] = value;
        }
    }

    // The DOM element that horts all equation Environments is
    // called pool. If it is null, then the user can not
    // create new equations.
    this.pool = null;
}


/* For handling unicode characters from higher planes, we have to be
aware that such characters are represented by pairs! The following
functions help. */

function fromCharCode (codePt) {  
    if (codePt > 0xFFFF) {  
        codePt -= 0x10000;  
        return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));  
    }  
    else {  
        return String.fromCharCode(codePt);  
    }  
} 



