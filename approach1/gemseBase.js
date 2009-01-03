const NS_internal = "http://www.andonyar.com/math/editor";
const NS_MathML = "http://www.w3.org/1998/Math/MathML";
//const KEYMOD_ALT = String.fromCharCode(KeyEvent.DOM_VK_ALT);
//const KEYMOD_CONTROL = String.fromCharCode(KeyEvent.DOM_VK_CONTROL);
//XXX: Knows the heck why KeyEvent.DOM_VK_* are undefined here ...
const KEYMOD_ALT = String.fromCharCode(18);
const KEYMOD_CONTROL = String.fromCharCode(17);
const KEYMOD_META = KeyEvent.VK_META;

function standardNSResolver(prefix) {
    if (prefix == "internal") { return NS_internal }
    else if (prefix == "m") { return NS_MathML }
    else if (prefix == "math") { return NS_MathML }
    else if (prefix == "mathml") { return NS_MathML }
    else { return null }
}

function EquationEnv(editor, container) {
    this.container = container;

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

    // The modeName element shows the name of the current mode
    this.modeNameIndicator = document.evaluate(".//.[@internal:function='modeName']", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;

    // The notificationDisplay element
    this.notificationDisplay = document.evaluate(".//.[@internal:function='notificationDisplay']", container, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;

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
    this.finishMode = function () {
        // Closes the curent mode and reverts to the old one
        this.modeStack.pop();
        this.modeStack[this.modeStack.length-1].calledModeReturned();
    }
    this.__defineGetter__("mode", function() { return this.modeStack[this.modeStack.length-1]; });

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
            throw "Position of the element is not the same as recorded before";
        }

        // Make deep copy
        this.newNode = changedElement.cloneNode(true);

        // Flag this object as ready for undo and redo
        this.ready = true;
    }
    this.deriveTreePointer = function (equation, target) {
        var pointer = [];
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
        while (pointer.length) {
            target = target.childNodes[pointer.shift()];
        }
        return target;
    }
}

function GemsePEditor() {
    this.registers = {}; // Maps unicode characters to register objects
    this.equations = []; // Array of EquationEnv objects.
    this.focus = -1; // Number of equation that has the focus
    this.inputElement; // A dom element that receives user input
    this.containerTemplate; // A dom element that can be sed to create new containers

    this.inputEvent = function () {
        // Is called when the input buffer supposedly changed
        this.equations[this.focus].mode.inputHandler();
    };
    this.keyEvent = function (event) {
        // Is called when a key gets hit. This also is called
        // if the key does not cause a character to be entered
        // into the input element (i.e. the input buffer).
        this.equations[this.focus].mode.keyHandler(event);
    };
    this.__defineGetter__("inputBuffer", function() { return this.inputElement.value; });
    this.__defineSetter__("inputBuffer", function(x) { this.inputElement.value = x; });

    this.attachNewEquationEnvToElement = function (element) {
        // Attaches a new EquationEnv to an already present element in
        // the document
        var newEquationEnv = new EquationEnv(this, element);
        newEquationEnv.init();
        this.equations.push(newEquationEnv);
        this.moveFocusTo(this.equations.length-1);
    }
    this.newEquation = function (equation) {
        // Creates a new EquationEnv and also a new Element in the
        // document. If the argument equation is not given, an empty
        // one gets created.
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
    }
    this.loadURI = function (uri, elementId, xpathString) {
        // Fetches the uri. If elementId and xpathString are empty, it
        // uses the root element as the MathML element. If elementId
        // is given, it uses the element with this id. Else, if
        // xpathString is given (and elementId is null), it evaluates
        // this xpath expression and uses the first result.
        // This is done using an XMLHttpRequest. This also works for
        // local files.
        var request = new XMLHttpRequest();
        request.open("GET", uri, false); 
        request.send(null);
        var doc = request.responseXML;
        
        var mathElements = [];
        if (elementId) {
            mathElements[0] = doc.getElementById(elementId);
        }
        else if (xpathString) {
            var xpathResult = doc.evaluate(xpathString, doc, standardNSResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            var resultNode;
            while (resultNode = xpathResult.iterateNext()) { mathElements.push(resultNode) }
        }
        else {
            mathElements[0] = doc.documentElement;
        }

        for (var i=0; i<mathElements.length; i++) {
            if (mathElements[i].localName != "math" || mathElements[i].namespaceURI != "http://www.w3.org/1998/Math/MathML") {
                throw "The element you load should be a math element in the MathML namespace";
            }

            // Create new environment using a deep copy
            this.newEquation(document.importNode(mathElements[i], true));
        }
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

    // The DOM element that horts all equation Environments is
    // called pool. If it is null, then the user can not
    // create new equations.
    this.pool = null;
}

function standardKeyHandler(event,editor) {
    // This procedure can be used as a method by a mode object. 

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
}


