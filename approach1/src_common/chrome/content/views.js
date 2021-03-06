/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */

function createDefaultViewport(className, elementNS, elementName) {
    var viewport = document.createElementNS(elementNS, elementName);
    viewport.setAttributeNS(NS_internal, "function", "viewport");
    viewport.setAttributeNS(NS_internal, "viewClass", className);
    return viewport;
}

/**
 * @class direct view of the equation by directly putting the math
 * element into the document.
 * There must not be more than one instance of this view, since if
 * there are, the same DOM element (i.e. the math element) is put at
 * different places in the document, which is not possible.
 */
function DirectView(editor,equationEnv,viewport) {
    this.editor = editor;
    this.equationEnv = equationEnv;
    /**
     * The element containing the view. (Can be any element.)
     */
    this.viewport = viewport;
}
DirectView.prototype = {
    /** 
     * Builds the direct view. 
     */
    build: function() {
        xml_flushElement(this.viewport);
        this.viewport.appendChild(document.importNode(this.equationEnv.equation, true));
    }
}
DirectView.createViewport = function(d) { return createDefaultViewport("DirectView", NS_HTML, "div"); };
ViewsetManager.viewClasses["DirectView"] = DirectView;

/**
 * @class This view shows the last message to the user.
 * There must not be more than one instance of this view, since the
 * DOM node editor.lastMessage is put directly into the view element.
 */
function MessageView(editor,equationEnv,viewport) {
    this.editor = editor;
    this.equationEnv = equationEnv;
    /**
     * The element containing the view. (Can be any element.)
     */
    this.viewport = viewport;
}
MessageView.prototype = {
    /** 
     * Builds the view.
     */
    build: function() {
        // Put the editor.lastMessage as only child into the viewport.
        xml_flushElement(this.viewport);
        this.editor.messages.forEach(function(m) {
            this.viewport.appendChild(m);
        }, this);
    }
}
MessageView.createViewport = function(d) { var viewport = createDefaultViewport("MessageView", NS_XUL, "vbox"); };
ViewsetManager.viewClasses["MessageView"] = MessageView;


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
        var root = document.createElementNS(NS_HTML,"div");
        this.viewport.appendChild(root);
        var pos = root;
        var reachedEnd = false;
        while (!reachedEnd) {
            // Create node
            var node = document.createElementNS(NS_HTML,"div");
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
TreeView.createViewport = function(d) { return createDefaultViewport("TreeView", NS_HTML, "div"); };
ViewsetManager.viewClasses["TreeView"] = TreeView;

/**
 * @class source view
 */
function SourceView(editor,equationEnv,viewport) {
    this.editor = editor;
    this.equationEnv = equationEnv;
    /**
     * The element containing the view. (Can be any element.)
     */
    this.viewport = viewport;
    /**
     * Option object
     */
    this.o = editor.optionsAssistant.obtainOptionsObject(SourceView,this);
    this.editor.viewsetManager.readOptionsFromViewport(this, this.viewport);
}
SourceView.prototype = {    
    /** 
     * Builds the source view.
     * It does not show real serielized source, but it does emulate it
     * in some way.
     */
    build: function() {
        xml_flushElement(this.viewport);
        var pre = document.createElementNS(NS_HTML,"pre");
        this.viewport.appendChild(pre);
        var root = this.equationEnv.equation;
        var startIndentation = "";
        if (this.o.foldingStart < 1 && this.equationEnv.mode.contextNode) {
            var root = this.equationEnv.mode.contextNode;
            // Find the node that will become the root node in our view
            for (var i=0; i>this.o.foldingStart && root!=this.equationEnv.equation; --i) {
                root = root.parentNode;
            }
            // If we preserver indentation, find out how much the root
            // has to be indented.
            if (this.o.foldingKeepIndentation) {
                for (var e=root; e!=this.equationEnv.equation; e=e.parentNode) {
                     startIndentation += this.o.indentation
                }
            }
        }
        this.writeSourceOfElement(root,pre,startIndentation,this.o.foldingDepth);
    },
    /**
     * Writes the source for of an element to the document.
     * @private
     * @param src    The element the source should be generated for
     * @param dest   The source gets appended to this element
     * @param indentString Whitespaces for indentation
     * @param inline True if the code for this element should be put
     *               on the same line, false if it has its own lines.
     */
    writeSourceOfElement: function(src,dest,indentString,foldingLevel) {
        // Collect options
        var indentMoreString = indentString + this.o.indentation;
        var highlight = this.o.syntaxHighlighting;
        var showAttributes = this.o.showAttributes;
        const TAGTYPE_BOTH  = 0;
        const TAGTYPE_START = 1;
        const TAGTYPE_END   = 2;

        // Take a new span for this element
        var elementSpan = document.createElementNS(NS_HTML,"span");
        elementSpan.setAttribute("class","element");
        // Put internal:selected attribute if present
        if (src.getAttributeNS(NS_internal, "selected")) {
            elementSpan.setAttributeNS(NS_internal, "selected", src.getAttributeNS(NS_internal, "selected"));
        }
        // Add it to dest
        dest.appendChild(elementSpan);

        // Now fill in the contents of elementSpan:

        if (!mml_firstChild(src) && !src.firstChild) {
            // src is empty
            elementSpan.appendChild(document.createTextNode(indentString));
            elementSpan.appendChild(tag(TAGTYPE_BOTH,src));
            elementSpan.appendChild(document.createTextNode("\n"));
        }
        else if (!mml_firstChild(src)) {
            // src contains text but no elements
            elementSpan.appendChild(document.createTextNode(indentString));
            elementSpan.appendChild(tag(TAGTYPE_START,src));
            elementSpan.appendChild(contentText(src));
            elementSpan.appendChild(tag(TAGTYPE_END,src));
            elementSpan.appendChild(document.createTextNode("\n"));
        }
        else {
            // Element contains children
            elementSpan.appendChild(document.createTextNode(indentString));
            elementSpan.appendChild(tag(TAGTYPE_START,src));
            var child = mml_firstChild(src);
            if (foldingLevel != 0) {
                elementSpan.appendChild(document.createTextNode("\n"));
                while (child) {
                    this.writeSourceOfElement(child,elementSpan,indentMoreString,foldingLevel-1);
                    child = mml_nextSibling(child);
                }
                elementSpan.appendChild(document.createTextNode(indentString));
            }
            else {
                elementSpan.appendChild(contentPlaceholder(src));
            }
            elementSpan.appendChild(tag(TAGTYPE_END,src));
            elementSpan.appendChild(document.createTextNode("\n"));
        }

        function contentText(element) {
            if (highlight) {
                var span = document.createElementNS(NS_HTML,"span");
                span.setAttribute("class","contentText");
                span.appendChild(document.createTextNode(element.textContent));
                return span;
            }
            else {
                return document.createTextNode(element.textContent);
            }
        }
        function contentPlaceholder(element) {
            if (highlight) {
                var placeholder = document.createElementNS(NS_HTML,"span");
                placeholder.setAttribute("class","contentPlaceholder");
                placeholder.appendChild(document.createTextNode("..."));
                return placeholder;
            }
            else {
                return document.createTextNode("...");
            }
        }
        function tag(type,element) {
            if (highlight) {
                var span = document.createElementNS(NS_HTML,"span");
                span.setAttribute("class","tag");
                span.appendChild(syntax("<"));
                if (type==TAGTYPE_END) {
                    span.appendChild(syntax("/"));
                }
                var tagName = document.createElementNS(NS_HTML,"span");
                tagName.setAttribute("class","tagName");
                tagName.appendChild(document.createTextNode(element.tagName));
                span.appendChild(tagName);
                if (showAttributes && !(type==TAGTYPE_END)) {
                    for each (var attr in attributeslist(element)) {
                        span.appendChild(attribute(attr));
                    }
                }
                span.appendChild(syntax(">"));
                return span;
            }
            else {
                if (!(type==TAGTYPE_END) && showAttributes) {
                    var span = document.createElementNS(NS_HTML,"span");
                    span.appendChild(document.createTextNode("<" + element.tagName));
                    for each (var attr in attributeslist(element)) {
                        span.appendChild(attribute(attr));
                    }
                    span.appendChild(document.createTextNode(type==TAGTYPE_BOTH ? "/>" : ">"));
                    return span;
                }
                else if (type==TAGTYPE_START) {
                    return document.createTextNode("<" + element.tagName + ">");
                }
                else if (type==TAGTYPE_BOTH) {
                    return document.createTextNode("<" + element.tagName + "/>");
                }
                else {
                    return document.createTextNode("</" + element.tagName + ">");
                }
            }
        }
        function attributeslist(element) {
            var attrs = element.attributes;
            var attrs_array = [];
            for (var i=attrs.length-1; i>=0; i--) {
                // Do not show attributes whose names begin with a dash
                // (Firefox shows them in the DOM although it should not.)
                // Also, do not show attributes in the internal namespace.
                if (attrs[i].namespaceURI != NS_internal && attrs[i].name[0]!='-') {
                    attrs_array.push(attrs[i]);
                }
            }
            return attrs_array.sort(function (a,b) { 
                return (a.name < b.name ? -1 : 1);
            });
        }
        function attribute(attr) {
            if (highlight) {
                var span = document.createElementNS(NS_HTML,"span");
                span.appendChild(document.createTextNode(" "));
                var name = document.createElementNS(NS_HTML,"span");
                name.setAttribute("class","attributeName");
                name.appendChild(document.createTextNode(attr.localName));
                span.appendChild(name);
                span.appendChild(syntax("="));
                span.appendChild(syntax("\""));
                var value = document.createElementNS(NS_HTML,"span");
                value.setAttribute("class","attributeValue");
                value.appendChild(document.createTextNode(attr.nodeValue));
                span.appendChild(value);
                span.appendChild(syntax("\""));
                return span;
            }
            else {
                return document.createTextNode(" " + attr.localName + "=\"" + attr.nodeValue + "\"");
            }
        }
        function syntax(s) {
            if (highlight) {
                var span = document.createElementNS(NS_HTML,"span");
                span.appendChild(document.createTextNode(s));
                span.setAttribute("class","syntax");
                return span;
            }
            else {
                return document.createTextNode(s);
            }
        }
    },
}
SourceView.gemseOptions = {
    "SourceView.syntaxHighlighting": {
        localToClass: SourceView,
        defaultValue: "off",
        validator: OptionsAssistant.validators.truthVal,
        parser: OptionsAssistant.parsers.truthVal,
        setter: function(o,value) {
            o.syntaxHighlighting = this.parser(value);
        },
        remover: function(o) { delete o.syntaxHighlighting }
    },
    "SourceView.showAttributes": {
        localToClass: SourceView,
        defaultValue: "on",
        validator: OptionsAssistant.validators.truthVal,
        parser: OptionsAssistant.parsers.truthVal,
        setter: function(o,value) {
            o.showAttributes = this.parser(value);
        },
        remover: function(o) { delete o.showAttributes }
    },
    "SourceView.foldingDepth": {
        localToClass: SourceView,
        defaultValue: "-1",
        validator: OptionsAssistant.validators.number_integer,
        parser: OptionsAssistant.parsers.number_integer,
        setter: function(o,value) {
            o.foldingDepth = this.parser(value);
        },
        remover: function(o) { delete o.foldingDepth }
    },
    "SourceView.foldingStart": {
        localToClass: SourceView,
        defaultValue: "1",
        validator: OptionsAssistant.validators.number_integer,
        parser: OptionsAssistant.parsers.number_integer,
        setter: function(o,value) {
            o.foldingStart = this.parser(value);
        },
        remover: function(o) { delete o.foldingStart }
    },
    "SourceView.indentation": {
        localToClass: SourceView,
        defaultValue: "    ",
        validator: function(value) { return true },
        parser: function(value) { return value },
        setter: function(o,value) {
            o.indentation = this.parser(value);
        },
        remover: function(o) { delete o.indentation }
    },
    "SourceView.foldingKeepIndentation": {
        localToClass: SourceView,
        defaultValue: "yes",
        validator: OptionsAssistant.validators.truthVal,
        parser: OptionsAssistant.parsers.truthVal,
        setter: function(o,value) {
            o.foldingKeepIndentation = this.parser(value);
        },
        remover: function(o) { delete o.foldingKeepIndentation }
    },
}
SourceView.createViewport = function(d) { return createDefaultViewport("SourceView", NS_HTML, "div"); };
ViewsetManager.viewClasses["SourceView"] = SourceView;
GemsePEditor.knownClasses.push(SourceView);

/**
 * @class More advanced view of rendered equation
 */
function EquationView(editor,equationEnv,viewport) {
    this.editor = editor;
    this.equationEnv = equationEnv;
    /**
     * The element containing the view. (Can be any element.)
     */
    this.viewport = viewport;
}
EquationView.prototype = {    
    /** 
     * Builds the view.
     */
    build: function() {
        xml_flushElement(this.viewport);

        var context = this.equationEnv.mode.contextNode;
        var context_xref;
        var context_id;
        if (context) {
            context_xref = context.getAttribute("xref");
            context_id = context.getAttribute("id") || context.getAttributeNS(NS_XML, "id");
        }

        var copy = this.equationEnv.equation.cloneNode(true);
        this.viewport.appendChild(copy);

        var treeWalker = document.createTreeWalker(
            copy,
            NodeFilter.SHOW_ELEMENT,
            null,
            false
        );
        var contentElements = [];
        while (treeWalker.nextNode()) {
            var node = treeWalker.currentNode;
            if (context_xref && (node.getAttribute("id") == context_xref || node.getAttributeNS(NS_XML, "id") == context_xref)) {
                if (!node.getAttribute("selected")) {
                    node.setAttributeNS(NS_internal, "selected", "referenced");
                }
            }
            else if (context_id && node.getAttribute("xref")==context_id) {
                if (!node.getAttribute("selected")) {
                    node.setAttributeNS(NS_internal, "selected", "referenced");
                }
            }
            if (!elementDescriptions[node.localName]) { //XXX: Will break in the future
                contentElements.push(node);
            }
        }
        // TODO: Go through all contentElements and replace them with
        // presentation markup
        // (Handle semtics elements in a special way.)
        contentElements.forEach(function(node) {
            var replacement;
            if (node.localName=="csymbol" && node.namespaceURI==NS_MathML) {
                replacement = document.createElementNS(NS_MathML, "mi");
                replacement.appendChild(document.createTextNode(
                    node.getAttribute("cd") + "#" + node.textContent
                ));
            }
            else if (node.localName=="semantics" && node.namespaceURI==NS_MathML) {
                replacement = document.createElementNS(NS_MathML, "mtable");
                while (node.hasChildNodes()) {
                    // Move first child to mfenced element
                    var row = document.createElementNS(NS_MathML, "mtr");
                    replacement.appendChild(row);
                    var cell = document.createElementNS(NS_MathML, "mtd");
                    row.appendChild(cell);
                    cell.appendChild(node.firstChild);
                }
            }
            else if (node.hasChildNodes()) {
                replacement = document.createElementNS(NS_MathML, "mrow");
                var prefix = document.createElementNS(NS_MathML, "mi");
                prefix.appendChild(document.createTextNode(node.localName));
                replacement.appendChild(prefix);
                var fence = document.createElementNS(NS_MathML, "mfenced");
                while (node.hasChildNodes()) {
                    // Move first child to mfenced element
                    fence.appendChild(node.firstChild);
                }
                replacement.appendChild(fence);
            }
            else { // node is empty
                replacement = document.createElementNS(NS_MathML, "mi");
                replacement.appendChild(document.createTextNode(node.localName));
            }
            // Copy internal:selected attribute
            var attributeSelected = node.getAttributeNS(NS_internal,"selected");
            if (attributeSelected) {
                replacement.setAttributeNS(NS_internal,"selected",attributeSelected);
            }
            node.parentNode.replaceChild(replacement, node);
        });
    },
}
EquationView.createViewport = function(d) { return createDefaultViewport("EquationView", NS_HTML, "div"); };
ViewsetManager.viewClasses["EquationView"] = EquationView;

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
        if (!forElement) { return }

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
            var t_ns = document.createElementNS(NS_HTML,"td");
            t_ns.appendChild(document.createTextNode(ns));
            var t_name = document.createElementNS(NS_HTML,"td");
            t_name.appendChild(document.createTextNode(name));
            var t_value = document.createElementNS(NS_HTML,"td");
            t_value.appendChild(document.createTextNode(value));
            var row = document.createElementNS(NS_HTML,"tr");
            if (cursor) { row.setAttributeNS(NS_internal, "selected", "attributeCursor") }
            if (selected) { row.setAttributeNS(NS_internal, "selected", "selection") }
            if (selected && cursor) { row.setAttributeNS(NS_internal, "selected", "attributeCursor selection") }
            row.appendChild(t_ns);
            row.appendChild(t_name);
            row.appendChild(t_value);
            return row;
        }

        // Generate table
        var table = document.createElementNS(NS_HTML,"table");
        var caption = document.createElementNS(NS_HTML,"caption");
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
            table = document.createElementNS(NS_HTML,"table");
            table.setAttribute("class", "defaultAttribute");
            var caption = document.createElementNS(NS_HTML,"caption");
            caption.appendChild(document.createTextNode("default attributes"));
            table.appendChild(caption);
            var defaultAttributesHash = elementDescriptions[forElement.localName].attributes;
            var defaultAttributes = [];
            for (var a in defaultAttributesHash) {
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
AttributeView.createViewport = function(d) { return createDefaultViewport("AttributeView", NS_HTML, "div"); };
ViewsetManager.viewClasses["AttributeView"] = AttributeView;

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
        if (!forElement) { return }

        // Return immediately if we are not on an mo element
        if (! (forElement.namespaceURI==NS_MathML && forElement.localName=="mo")) { return }

        var table = document.createElementNS(NS_HTML,"table");
        var caption = document.createElementNS(NS_HTML,"caption");
        caption.appendChild(document.createTextNode("dictionary entries"));
        table.appendChild(caption);
        var titleRow = document.createElementNS(NS_HTML,"tr");
        var th = document.createElementNS(NS_HTML,"th");
        th.appendChild(document.createTextNode("name"));
        th.setAttribute("colspan", "3");
        titleRow.appendChild(th);
        var th = document.createElementNS(NS_HTML,"th");
        th.appendChild(document.createTextNode("comments"));
        th.setAttribute("colspan", "3");
        titleRow.appendChild(th);
        var th = document.createElementNS(NS_HTML,"th");
        th.appendChild(document.createTextNode("attributes"));
        titleRow.appendChild(th);
        var th = document.createElementNS(NS_HTML,"th");
        th.appendChild(document.createTextNode("other"));
        th.setAttribute("colspan", "2");
        titleRow.appendChild(th);
        table.appendChild(titleRow);

        // XXX: Do we need to remove whitespacve at beginning and end?
        var entries = operatorDictionary.entriesByContent(forElement.textContent);
        entries.forEach(function (entry) {
            var tr = document.createElementNS(NS_HTML,"tr");
            
            var td = document.createElementNS(NS_HTML,"td");
            td.appendChild(document.createTextNode(entry.content));
            tr.appendChild(td);
            var td = document.createElementNS(NS_HTML,"td");
            td.appendChild(document.createTextNode(entry.form));
            tr.appendChild(td);
            var td = document.createElementNS(NS_HTML,"td");
            td.appendChild(document.createTextNode(entry.disamb));
            tr.appendChild(td);
            var td = document.createElementNS(NS_HTML,"td");
            td.appendChild(document.createTextNode(entry.contentComment));
            tr.appendChild(td);
            var td = document.createElementNS(NS_HTML,"td");
            td.appendChild(document.createTextNode(entry.comment));
            tr.appendChild(td);
            var td = document.createElementNS(NS_HTML,"td");
            td.appendChild(document.createTextNode(entry.description));
            tr.appendChild(td);
            
            var td = document.createElementNS(NS_HTML,"td");
            for (var a in entry.attributes) {
                var text = document.createTextNode(
                    a + " = " + entry.attributes[a]
                );
                td.appendChild(text);
                td.appendChild(document.createElementNS(NS_HTML,"br"));
            }
            tr.appendChild(td);

            var td = document.createElementNS(NS_HTML,"td");
            td.appendChild(document.createTextNode(entry.groupingPrecedence));
            tr.appendChild(td);
            var td = document.createElementNS(NS_HTML,"td");
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
DictionaryView.createViewport = function(d) { return createDefaultViewport("DictionaryView", NS_XUL, "box"); };
ViewsetManager.viewClasses["DictionaryView"] = DictionaryView;

/**
 * @class Others view, shows the other open equations.
 *        XXX: I fear that this implementation is slow when there are
 *        many open equations.
 */
function OthersView(editor,equationEnv,viewport) {
    this.editor = editor;
    this.equationEnv = equationEnv;
    /**
     * The element containing the view. (Can be any element.)
     */
    this.viewport = viewport;

    // This view is generated when it is created, that is, here:
    // XXX: Is this save?
    for (var i=0;i<editor.equations.length;++i) {
        var copy = editor.equations[i].equation.cloneNode(true);
        var containment = document.createElementNS(NS_HTML,"div");
        containment.appendChild(document.createTextNode(i + ": "));
        containment.appendChild(copy);
        this.viewport.appendChild(containment);
        copy.removeAttribute("display");
        this.equationEnv.cleanSubtreeOfDocument(document,copy);
        if (this.equationEnv == editor.equations[i]) {
            containment.setAttributeNS(NS_internal,"selected","editcursor"); //XXX: Good?
        }
        // Event handling
        // We are careful not to create cyclic references (DOM Node -> Listener -> DOM Node) 
        // since this could cause a memory leak, depending on how
        // intelligent the garbage collector is. That's why we use the
        // createEventHandler method. We must not use an anonymous
        // function directly, since it has this.viewport in its environment,
        // wich in turn has containment as DOM node, which finally has
        // the anonymous function as event listener. The function
        // returned by createEventHandler however has only the
        // variables of createEventHandler in its envireonment.
        containment.addEventListener("click",this.createEventHandler(editor,i),true);
    }
}
OthersView.prototype = {    
    /**
     * Builds the view
     */
    build: function () {
        // This view does only change when created, so do nothing!
    },
    createEventHandler: function(editor, index) {
        return function() {
            // Only do something if the current mode is the editMode and
            // the input buffer is empty!
            if (editor.equations[editor.focus].mode instanceof EditMode && editor.inputBuffer.length == 0) {
                editor.moveFocusTo(index);
            }
            else {
                editor.showMessage("Switching to another equation by " +
                                   "clicking is only possible when you are " + 
                                   "in the editMode and the input " +
                                   "buffer is empty!");
                // Rebuild views, they may have changed.
                editor.viewsetManager.build(); //XXX: Is that OK?
            }
        };
    },
};
OthersView.createViewport = function(d) { return createDefaultViewport("OthersView", NS_XUL, "box"); };
ViewsetManager.viewClasses["OthersView"] = OthersView;

/**
 * @class Statusbar view, shows various information
 */
function StatusbarView(editor,equationEnv,viewport) {
    this.editor = editor;
    this.equationEnv = equationEnv;
    /**
     * The element containing the view. (Can be any element.)
     */
    this.viewport = viewport;
}
StatusbarView.prototype = {    
    /**
     * Builds the view
     */
    build: function () {
        xml_flushElement(this.viewport);
        modeNameLabel = document.createElementNS(NS_HTML,"div");
        modeNameLabel.appendChild(document.createTextNode(this.equationEnv.mode.name));
        this.viewport.appendChild(modeNameLabel);
    },
}
StatusbarView.createViewport = function(d) { return createDefaultViewport("StatusbarView", NS_XUL, "box"); };
ViewsetManager.viewClasses["StatusbarView"] = StatusbarView;

/**
 * @class Transforms content MathML to presentation MathML using
 * JOMDoc's notation renderer.
 */
function NTNView(editor,equationEnv,viewport) {
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.viewport = viewport;

    this.o = editor.optionsAssistant.obtainOptionsObject(NTNView,this);
    this.editor.viewsetManager.readOptionsFromViewport(this, this.viewport);

    this.ready = false;

    try {
        NTNView.prepareNTN(this.editor);

        /*
        // setup Logging
        NTNView.javaClasses.JOMDocEnvironment.getMethod("configureLogger", []).invoke(null, []);
        var logger = NTNView.javaClasses.Logger.getMethod("getRootLogger", []).invoke(null, []);
        var appenders = logger.getAllAppenders();
        var appender = appenders.nextElement();
        var ConsoleAppender = JavaLink.getClass('org.apache.log4j.ConsoleAppender');
        var FileAppender = JavaLink.getClass('org.apache.log4j.FileAppender');
        var FileAppenderConstructor = FileAppender.getConstructor([
            JavaLink.getClass('org.apache.log4j.Layout'),
            NTNView.javaClasses.String
        ]);
        appender.setTarget(ConsoleAppender.getField("SYSTEM_ERR").get(null));
        appender.activateOptions();
        var appender = FileAppenderConstructor.newInstance([appender.getLayout(), "/home/urs/GEMSELOG"]);
        logger.addAppender(appender);
        logger.fatal("heeeeeeeeeeeeeeeeeeeeeeeee!");
        */

        // create collectors
        this.ntnCollector = NTNView.javaClasses.NotationCollector.newInstance();

        //The class RendererFactory defines a method "newInstance" which
        //we want to use instead of calling the default constructor. This
        //means that we first have to get the method, since
        //RendererFactory.newInstance() calls the default constructor.
        var factory = NTNView.javaClasses.RendererFactory.getMethod("newInstance", []).invoke(null,[]);
        factory.setNotationCollector(this.ntnCollector);
        factory.setParallel(true);
        factory.setContentLinks(true);
        //factory.setDynamic(NTNView.javaClasses.OptionValueDynamic.getField("SHOW_ALL").get(null));
        this.renderer = factory.newRenderer();

        this.setupNotations();

        this.ready = NTNView.ready;
    }
    catch (e) {
        this.showError(e);
        return;
    }
}
/**
 * Prepares stuff needed for rendering which is shared among all
 * instances of this class: URIs for the java files, a class loader,
 * notations, ntn renderer, some XOM stuff
 */
NTNView.prepareNTN = function(editor) {
    if (NTNView.broken || NTNView.ready) {
        return;
    }

    // Be pesimistic. Will be set to false later on.
    NTNView.broken = true;

    // Make shure JavaLink is initialized
    JavaLink.init();

    // Get classes and constructors
    NTNView.javaClasses.Class     = java.lang.Class.forName('java.lang.Class');
    NTNView.javaClasses.Object    = java.lang.Class.forName('java.lang.Object');
    NTNView.javaClasses.Integer   = java.lang.Class.forName('java.lang.Integer');
    NTNView.javaClasses.int       = NTNView.javaClasses.Integer.getField("TYPE").get(null);
    NTNView.javaClasses.String    = java.lang.Class.forName('java.lang.String');
    NTNView.javaClasses.Array     = java.lang.Class.forName('java.lang.reflect.Array');
    NTNView.javaClasses.ArrayList = java.lang.Class.forName('java.util.ArrayList');
    NTNView.javaClasses.ioFile    = java.lang.Class.forName('java.io.File');
    NTNView.javaClasses.Element   = JavaLink.getClass('nu.xom.Element');
    NTNView.javaClasses.Attribute = JavaLink.getClass('nu.xom.Attribute');
    NTNView.javaClasses.Text      = JavaLink.getClass('nu.xom.Text');
    NTNView.javaClasses.XOMDocument         = JavaLink.getClass('nu.xom.Document');
    NTNView.javaClasses.RendererFactory     = JavaLink.getClass('org.omdoc.jomdoc.ntn.rnd.RendererFactory');
    NTNView.javaClasses.NotationCollector   = JavaLink.getClass('org.omdoc.jomdoc.coll.ntn.NotationCollector');
    NTNView.javaClasses.NotationSource      = JavaLink.getClass('org.omdoc.jomdoc.coll.ntn.NotationSource');
    NTNView.javaClasses.BundledFiles        = JavaLink.getClass('org.omdoc.jomdoc.coll.ntn.BundledFiles');
    NTNView.javaClasses.NotationDocument    = JavaLink.getClass('org.omdoc.jomdoc.coll.ntn.NotationDocument');
    NTNView.javaClasses.InputDocument       = JavaLink.getClass('org.omdoc.jomdoc.coll.ntn.InputDocument');
    NTNView.javaClasses.NotationFile        = JavaLink.getClass('org.omdoc.jomdoc.coll.ntn.NotationFile');
    NTNView.javaClasses.ContentDictionary   = JavaLink.getClass('org.omdoc.jomdoc.coll.ntn.ContentDictionary');
    NTNView.javaClasses.DetachedElement     = JavaLink.getClass('org.omdoc.jomdoc.coll.ntn.DetachedElement');
    NTNView.javaClasses.IOUtil              = JavaLink.getClass('org.omdoc.jomdoc.util.etc.IOUtil');
    NTNView.javaClasses.XMLUtil             = JavaLink.getClass('org.omdoc.jomdoc.util.xml.XMLUtil');
    NTNView.javaClasses.OptionValueDynamic  = JavaLink.getClass('org.omdoc.jomdoc.cli.JOMDocOptionValue$Dynamic');
    NTNView.javaClasses.JOMDocEnvironment   = JavaLink.getClass('org.omdoc.jomdoc.util.etc.JOMDocEnvironment');
    NTNView.javaClasses.Logger              = JavaLink.getClass('org.apache.log4j.Logger');

    NTNView.javaConstructors.Integer = NTNView.javaClasses.Integer.getConstructor(
        [NTNView.javaClasses.int]
    );
    NTNView.javaConstructors.ArrayListCap = NTNView.javaClasses.ArrayList.getConstructor(
        [NTNView.javaClasses.int]
    );
    NTNView.javaConstructors.Element = NTNView.javaClasses.Element.getConstructor(
        [NTNView.javaClasses.String,NTNView.javaClasses.String]
    );
    NTNView.javaConstructors.Attribute = NTNView.javaClasses.Attribute.getConstructor(
        [NTNView.javaClasses.String,NTNView.javaClasses.String,NTNView.javaClasses.String]
    );
    NTNView.javaConstructors.BundledFiles = NTNView.javaClasses.BundledFiles.getConstructor(
        [NTNView.javaClasses.String]
    );
    NTNView.javaConstructors.NotationFileFromFile = NTNView.javaClasses.NotationFile.getConstructor(
        [NTNView.javaClasses.ioFile]
    );
    NTNView.javaConstructors.NotationFileEmpty = NTNView.javaClasses.NotationFile.getConstructor(
        []
    );
    NTNView.javaConstructors.NotationDocument = NTNView.javaClasses.NotationDocument.getConstructor(
        [NTNView.javaClasses.XOMDocument]
    );
    NTNView.javaConstructors.ioFileFromString = NTNView.javaClasses.ioFile.getConstructor(
        [NTNView.javaClasses.String]
    );
    NTNView.javaConstructors.DetachedElement = NTNView.javaClasses.DetachedElement.getConstructor(
        [NTNView.javaClasses.Element]
    );

    NTNView.javaObjects.arrayCreator = NTNView.javaClasses.Array.getMethod(
        "newInstance", 
        [NTNView.javaClasses.Class, NTNView.javaClasses.int]
    );

    // Remember that we are ready
    NTNView.ready = true;
    NTNView.broken = false;
};
/**
 * True as soon as the class is prepared
 */
NTNView.ready = false;
/**
 * True if preperation failed
 */
NTNView.broken = false;
/**
 * Objects for the java classes we need.
 */
NTNView.javaClasses = {};
/**
 * Objects for the java objects needed by all instances of this class
 */
NTNView.javaObjects = {};
/**
 * Objects for the java constructors we need
 */
NTNView.javaConstructors = {};
NTNView.prototype = {    
    setupNotations: function() {
        // Collectors must already exist at this point
        // Clear collectors

        /* Fill collectors */

        for each (var nsource in this.o.notations) {
            try {
                var nsource_decoded;
                if (nsource[0] == "B") {
                    // The MathML notations which are bundled with JOMDoc, but not loaded by default:
                    var coll = NTNView.javaConstructors.BundledFiles.newInstance([NTNView.javaClasses.BundledFiles.getField("MATHML_NTN_DIR").get(null)]);
                    this.ntnCollector.add(coll);
                }
                else if ((nsource[0] == "F") && (nsource_decoded = /^file:\/\/(.*)$/.exec(nsource[1]))) {
                    var javaFile = NTNView.javaConstructors.ioFileFromString.newInstance([nsource_decoded[1]]);
                    var coll = NTNView.javaConstructors.NotationFileFromFile.newInstance([javaFile]);
                    this.ntnCollector.add(coll);
                }
                else if ((nsource[0] == "D") && (nsource_decoded = /^file:\/\/(.*)$/.exec(nsource[1]))) {
                    var javaFile = NTNView.javaConstructors.ioFileFromString.newInstance([nsource_decoded[1]]);
                    var doc = NTNView.javaClasses.XMLUtil.
                              getMethod("buildDocument", [NTNView.javaClasses.ioFile]).
                              invoke(null, [javaFile]);
                    this.editor.showMessage("Base URI of D file: " + doc.getBaseURI());
                    var coll = NTNView.javaConstructors.NotationDocument.newInstance([doc]);
                    this.ntnCollector.add(coll);
                }
                else if ((nsource[0] == "D") && (nsource[1]=="") && (nsource_decoded = /^file:(\/\/)?(.*)$/.exec(this.o.documentURI))) {
                    var javaFile = NTNView.javaConstructors.ioFileFromString.newInstance([nsource_decoded[2]]);
                    var doc = NTNView.javaClasses.XMLUtil.
                              getMethod("buildDocument", [NTNView.javaClasses.ioFile]).
                              invoke(null, [javaFile]);
                    this.editor.showMessage("Base URI of D file: " + doc.getBaseURI());
                    var coll = NTNView.javaConstructors.NotationDocument.newInstance([doc]);
                    this.ntnCollector.add(coll);
                    this.editor.showMessage("Added notations source D " + nsource_decoded[2]);
                }
                else if (nsource[0] == "I") {
                    // Load the document the equation originates from
                    // as for nsource=="D". It must have an URI and
                    // this URI must be a file-URI.
                    var uri = this.equationEnv.origin ?  this.equationEnv.origin.storage.uri : null;

                    // This we do in order to allow one to load
                    // the examples from chrome.
                    // XXX: This shall be gone!
                    var nsiuri = stringTonsIURI(uri);
                    if (nsiuri.scheme == "chrome") { uri = chromeURLtoFileURLnsIURI(nsiuri).spec }

                    var nsource_decoded = /^file:(\/\/)?(.*)$/.exec(uri);
                    if (!nsource_decoded) {
                        throw new Error("Failed to add notation source I because of missing/unsupported URI: " + uri);
                    }
            
                    var javaFile = NTNView.javaConstructors.ioFileFromString.newInstance([nsource_decoded[2]]);
                    var doc = NTNView.javaClasses.XMLUtil.
                              getMethod("buildDocument", [NTNView.javaClasses.ioFile]).
                              invoke(null, [javaFile]);
                    this.editor.showMessage("Base URI of I file: " + doc.getBaseURI());
                    var coll = NTNView.javaConstructors.NotationDocument.newInstance([doc]);
                    this.ntnCollector.add(coll);
                    this.editor.showMessage("Added notations source I " + nsource_decoded[2]);

                    // TODO: Find better solution for the following
                    // Set options documentURI and theoryName if not already set
                    // (XXX:Maybe we should set it through the OptionsAssistant?)
                    if (!this.o.theoryName) { 
                        // Walk up the tree in the DOM document until
                        // we hit a theory element. Use its id.
                        var e = this.equationEnv.origin.node;
                        while (e = e.parentNode) {
                            if (e.localName=="theory") {
                                this.o.theoryName = e.getAttributeNS(NS_XML, "id");
                                break;
                            }
                        }
                    }
                    if (!this.o.documentURI) { this.o.documentURI = doc.getBaseURI() }
                }
                else if (nsource[0] == "C") {
                    var coll = NTNView.javaClasses.ContentDictionary.newInstance();
                    this.ntnCollector.add(coll);
                }
                else if (nsource[0] == "E") {
                    this.editor.showMessage("E: " + nsource[1]);

                    if (nsource[1]) {
                        var xomRoot = this.dom2xom(this.editor.equations[nsource[1]].equation);
                    }
                    else {
                        var xomRoot = this.dom2xom(this.equationEnv.equation);
                    }

                    // NotationFile can be used to add single notation
                    // elements.
                    var coll = NTNView.javaConstructors.NotationFileEmpty.newInstance([]);
                    coll.add(xomRoot);
                    this.ntnCollector.add(coll);
                    this.editor.showMessage("Added notations source E" + nsource[1]);
                }
                else {
                    this.showError('Problem loading notation source ' + nsource);
                }
            }
            catch (e) {
                this.showError(e);
            }
        }

    },
    /** 
     * Builds the view.
     */
    build: function() {

        if (!this.ready) {
            if (NTNView.ready) {
                this.viewport.appendChild(document.createTextNode(
                    "This NTNView instance failed to initialize."
                ));
            }
            else {
                this.viewport.appendChild(document.createTextNode(
                    "NTNView globally failed to initialize."
                ));
            }
            return;
        }

        try {
            // Check if we need to rerender or if changing internal
            // attributes is enough.
            var rerenderRequired = true;
            if (this.o.shortcut && !this.o.equation) {
                rerenderRequired = !this.updateInternals(this.viewport.firstChild, this.equationEnv.equation);
            }
            else if (this.o.shortcut && this.o.equation && this.viewport.firstChild) {
                // TODO: Since using notations is too slow, we do
                // never rerender 
                rerenderRequired = false;
            }
            
            var domRoot;
            if (rerenderRequired) {
                xml_flushElement(this.viewport);

                // Build representation of the equation using XOM
                var xomRoot = this.dom2xom(this.o.equation ? this.editor.equations[this.o.equation].equation : this.equationEnv.equation);
                // Make a detached element out of it
                var xomRoot = NTNView.javaConstructors.DetachedElement.newInstance([xomRoot]);
                if (this.o.theoryName) { xomRoot.setTheoryName(this.o.theoryName) }
                if (this.o.documentURI) { xomRoot.setDocumentURI(this.o.documentURI) }
                this.editor.showMessage("Using URI " + xomRoot.getDocumentURI() + " and theory " + xomRoot.getTheoryName());
                this.editor.showMessage("And XUtils says that the URI is " +
                    NTNView.javaClasses.XMLUtil.
                              getMethod("getTheoryURI", [NTNView.javaClasses.Element]).
                              invoke(null, [xomRoot]));
                this.editor.showMessage("same for first child " +
                    NTNView.javaClasses.XMLUtil.
                              getMethod("getTheoryURI", [NTNView.javaClasses.Element]).
                              invoke(null, [xomRoot.getChildElements().get(0)]));
                
                // Invoke the renderer
                xomRoot = this.renderer.renderElement(xomRoot);

                // Build DOM structure according to the result
                domRoot = this.xom2dom(xomRoot); 
                this.viewport.appendChild(domRoot);
            }
            else {
                domRoot = this.viewport.firstChild;
            }

            // Try to map internal attributes from the content to the
            // presentation
            // XXX: Is there a way to preparse the XPath expression so
            // it does not have to be reparsed here every time?
            var xpathResult = document.evaluate(
                ".//*[@internal:selected]", 
                domRoot, 
                standardNSResolver, 
                XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            for (var i = 0; i<xpathResult.snapshotLength; ++i) { 
                var selectedNode = xpathResult.snapshotItem(i);
                var xref = selectedNode.getAttribute("xref") || selectedNode.getAttribute("href");
                if (xref && xref.charAt(0) == "#") {
                    var target = document.getElementById(xref.substring(1));
                    if (target) {
                        target.setAttributeNS(NS_internal, "selected", selectedNode.getAttributeNS(NS_internal, "selected"));
                    }
                }
            }
                
        }
        catch(e) {
            this.showError(e);
        }
    },
    /**
     * Transforms a javascript DOM element into a Java instance 
     * of nu.xom.Element. The caller has to make shure that the
     * provided node is really an element.
     */
    dom2xom: function(domElement) {
        var xomElement = NTNView.javaConstructors.Element.newInstance([
            domElement.localName,
            domElement.namespaceURI || ""
        ]);
        var attributes = domElement.attributes;
        for (var i=0; i<attributes.length; ++i) {
            var domAttribute = attributes.item(i);
            // Since XOM wants to have a prefix when the namespace is
            // not empty, we have to do some work first. Note that
            // attribute.prefix is not set for attributes that have
            // been created via the DOM, even if they are in some
            // namespace.
            var namespaceURI = domAttribute.namespaceURI || "";
            var value = domAttribute.nodeValue;
            var name;
            if (namespaceURI) {
                if (domAttribute.prefix) {
                    name = domAttribute.prefix + ":" + domAttribute.localName;
                }
                else {
                    name = "int" + i + ":" + domAttribute.localName;
                }
            }
            else {
                name = domAttribute.localName;
            }
            // Create and insert the attribute
            try {
                //XXX: The DOM includes namespace declarations as
                //attributes. xom doesn't like them, so we catch the
                //error it throws.
                var xomAttribute = NTNView.javaConstructors.Attribute.newInstance([
                    name,
                    namespaceURI,
                    value
                ]);
                xomElement.addAttribute(xomAttribute);
            }
            catch(e) { }
        }
        for (var child = domElement.firstChild; child; child=child.nextSibling) {
            if (child.nodeType==1) {
                // child is an element, add it recursively
                xomElement.appendChild(this.dom2xom(child));
            }
            else {
                // Assume child is a text node, add it as such
                xomElement.appendChild(child.textContent);
            }
        }
        return xomElement;
    },
    /**
     * Transforms a Java instance of nu.xom.Element into a javascript
     * DOM element.
     */
    xom2dom: function(xomElement) {
        var domElement = document.createElementNS(
            xomElement.getNamespaceURI(),
            xomElement.getLocalName()
        );
        var attributeCount = xomElement.getAttributeCount();
        for (var i=0; i<attributeCount; ++i) {
            var xomAttribute = xomElement.getAttribute(i);
            domElement.setAttributeNS(
                xomAttribute.getNamespaceURI(),
                xomAttribute.getLocalName(),
                xomAttribute.getValue()
            );
        }
        var childCount = xomElement.getChildCount();
        for (var i=0; i<childCount; ++i) {
            var child = xomElement.getChild(i);
            if (NTNView.javaClasses.Element.isInstance(child)) {
                // child is an Element
                domElement.appendChild(this.xom2dom(child));
            }
            else if (NTNView.javaClasses.Text.isInstance(child)) {
                // child is a Text node
                domElement.appendChild(document.createTextNode(child.getValue()));
            }
        }
        return domElement;
    },
    showError: function(e) {
        /*if (java.lang.class.forName("java.lang.reflect.InvocationTargetException").isInstance(e)) {
            this.editor.showMessage(e.getCause().toString());
        }
        else {*/
            this.editor.showMessage(e);
            this.editor.showMessage(new Error("dummy"));
        /*}*/
    },
    /**
     * Updates the internal attributes of a result from a past
     * rendering by comparing it with the new equation. If this is not
     * possible, that is, if a new rendering is necessary, false is
     * returned, otherwise true.
     * @private
     * @param oldResult   Root node of the subtree that has to be
     *                    updated. It is the result from the last build.
     * @param newEquation The new equation that contains the root
     * @returns {Boolean} true on success, false if the update is not
     *                    possible
     */
    updateInternals: function(oldResult, newEquation) {
        if (!oldResult) { return false; }
        var semanticsEl = mml_firstChild(oldResult);
        if (!semanticsEl) { return false; }
        var annotationxmlEl = mml_lastChild(semanticsEl);
        if (!annotationxmlEl) { return false; }
        
        // We do not compare the math element and the annotationxmlEl
        // element, nor do we compare their attributes. We only look
        // at the children
        
        // Compare children using updateInternalsOfElement
        // (We only look at elements, not at text nodes)
        var oldChild = mml_firstChild(annotationxmlEl);
        var newChild = mml_firstChild(newEquation);
        while (oldChild || newChild) {
            if (!this.updateInternalsOfElement(oldChild, newChild)) {
                return false;
            }
            oldChild = mml_nextSibling(oldChild);
            newChild = mml_nextSibling(newChild);
        }
        
        return true;
    },
    /**
     * Recursively updates the internal attributes comparing the
     * subtrees at the given roots. The given roots may be any nodes,
     * not necessairily elements.
     * @private
     * @param oldEl root of old subtree
     * @param newEl root of new subtree
     * @returns {Boolean} true on success, false if the update is not
     *                    possible
     */
    updateInternalsOfElement: function(oldEl, newEl) {
        if (!oldEl || !newEl) { return false }

        // Compare nodes
        if (!this.compareNodes(oldEl, newEl)) { return false }

        // Return if they are not elements
        if (oldEl.nodeType != Node.ELEMENT_NODE) { return true }

        // Compare and set attributes
        if (!this.updateAttributes(oldEl, newEl)) { return false }
        
        // Recursively compare children
        // (including text nodes)
        var oldChild = oldEl.firstChild;
        var newChild = newEl.firstChild;
        while (oldChild || newChild) {
            if (!this.updateInternalsOfElement(oldChild, newChild)) {
                return false;
            }
            oldChild = oldChild.nextSibling;
            newChild = newChild.nextSibling;
        }
        
        return true;
    },
    /**
     * Compares the attributes of oldEl with the ones of newEl and
     * makes changes to those of oldEl as required by
     * updateInternalsOfElement
     * @private
     * @returns {Boolean}
     */
    updateAttributes: function(oldEl, newEl) {
        // Is not really correct since namespaces are ignored at some
        // points. This hopefully causes no big truble.
        var fixed = {};
        fixed["xref"] = true; // We ignore xref attributes
        // First go through all attributes of newEl, keeping track in
        // fixed which attributes we process.
        var newAtts = newEl.attributes;
        for (var i=0; i<newAtts.length; i++) {
            var newAtt = newAtts[i];
            if (newAtt.namespaceURI == NS_internal) {
                oldEl.setAttributeNodeNS(newAtt.cloneNode(true));
            }
            else if (newAtt.nodeValue !== oldEl.getAttributeNS(newAtt.namespaceURI, newAtt.localName)) {
                return false;
            }
            fixed[newAtt.localName] = true;
        }
        // Go through all attributes of oldEl which we have not yet
        // processed (according to fixed). The attributes we have to
        // delete will be removed later on, since we must not modify
        // the live oldAtts while we loop over it
        var oldAtts = oldEl.attributes;
        var toDelete = [];
        for (var i=0; i<oldAtts.length; i++) {
            var oldAtt = oldAtts[i];
            if (!fixed[oldAtt.localName]) {
                if (oldAtt.namespaceURI == NS_internal) {
                    toDelete.push(oldAtt);
                }
                else {
                    return false;
                }
            }
        }
        // Now delete
        toDelete.forEach(function(att) { 
            // We do not really delete but set to an empty string.
            // This is good enough for now and is necessairy, since
            // the code that sets the attributes on the presentation
            // part of the rendered formula does only set attributes,
            // not delete them.
            oldEl.setAttributeNS(att.namespaceURI, att.localName, "") 
        });
        return true;
    },
    /**
     * Compares two nodes (element, attribute, text node, ...), not looking 
     * at their attributes nor at their children.
     */
    compareNodes: function(n1, n2) {
        return (n1.nodeName     === n2.nodeName &&
                n1.localName    === n2.localName &&
                n1.namespaceURI === n2.namespaceURI &&
                n1.prefix       === n2.prefix &&
                n1.nodeValue    === n2.nodeValue);
    },
}
NTNView.gemseOptions = {
    "NTNView.shortcut": {
        localToClass: NTNView,
        defaultValue: "on",
        validator: OptionsAssistant.validators.truthVal,
        parser: OptionsAssistant.parsers.truthVal,
        setter: function(o,value) {
            o.shortcut = this.parser(value);
        },
        remover: function(o) { delete o.shortcut }
    },
    "NTNView.notations": {
        localToClass: NTNView,
        defaultValue: "B",
        validator: function (value) {
            // Maybe we should test here whether all entries are valid
            // URIs?
            return true;
        },
        parser: function (value) {
            var notationuris = value.split(' ');
            if (notationuris.length==1 && notationuris[0]=="") {
                notationuris = [];
            }
            var parsed = [];
            notationuris.forEach(function(uri) {
                parsed.push([uri[0],uri.substring(1)]);
            });
            return parsed;
        },
        setter: function (o,value) {
            o.notations = this.parser(value);
        },
        remover: function(o) { delete o.notations }
    },
    "NTNView.documentURI": {
        localToClass: NTNView,
        defaultValue: null,
        validator: function (value) {
            // Maybe we should test here whether all entries are valid
            // URIs?
            return true;
        },
        parser: function (value) {
            if (value == "") { return null; }
            return value;
        },
        setter: function (o,value) {
            o.documentURI = this.parser(value);
        },
        remover: function(o) { delete o.documentURI }
    },
    "NTNView.theoryName": {
        localToClass: NTNView,
        defaultValue: null,
        validator: function (value) {
            return true;
        },
        parser: function (value) {
            if (value == "") { return null; }
            return value;
        },
        setter: function (o,value) {
            o.theoryName = this.parser(value);
        },
        remover: function(o) { delete o.theoryName }
    },
    "NTNView.equation": {
        localToClass: NTNView,
        defaultValue: "",
        validator: function(value) {
            return /^\d*$/.test(value);
        },
        parser: function(value) {
            if (value == "") { return null; }
            return value;
        },
        setter: function(o, value) {
            o.equation = this.parser(value);
        },
    },
}
NTNView.createViewport = function(d) { return createDefaultViewport("NTNView", NS_HTML, "div"); };
ViewsetManager.viewClasses["NTNView"] = NTNView;
GemsePEditor.knownClasses.push(NTNView);
