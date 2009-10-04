
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
        // Put the equation as child into the viewport, but only if it
        // is not yet there. We must be careful, since sometimes
        // this.equationEnv.equation itself changes.
        if (mml_firstChild(this.viewport)!=this.equationEnv.equation) {
            xml_flushElement(this.viewport);
            this.viewport.appendChild(this.equationEnv.equation);
        }
    }
}
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
        if (mml_firstChild(this.viewport)!=this.editor.lastMessage) {
            xml_flushElement(this.viewport);
            if (this.editor.lastMessage) {
                this.viewport.appendChild(this.editor.lastMessage);
            }
        }
    }
}
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
                if (attrs[i].namespaceURI != NS_internal) {
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
        }
    },
    "SourceView.showAttributes": {
        localToClass: SourceView,
        defaultValue: "off",
        validator: OptionsAssistant.validators.truthVal,
        parser: OptionsAssistant.parsers.truthVal,
        setter: function(o,value) {
            o.showAttributes = this.parser(value);
        }
    },
    "SourceView.foldingDepth": {
        localToClass: SourceView,
        defaultValue: "-1",
        validator: OptionsAssistant.validators.number_integer,
        parser: OptionsAssistant.parsers.number_integer,
        setter: function(o,value) {
            o.foldingDepth = this.parser(value);
        }
    },
    "SourceView.foldingStart": {
        localToClass: SourceView,
        defaultValue: "1",
        validator: OptionsAssistant.validators.number_integer,
        parser: OptionsAssistant.parsers.number_integer,
        setter: function(o,value) {
            o.foldingStart = this.parser(value);
        }
    },
    "SourceView.indentation": {
        localToClass: SourceView,
        defaultValue: "    ",
        validator: function(value) { return true },
        parser: function(value) { return value },
        setter: function(o,value) {
            o.indentation = this.parser(value);
        }
    },
    "SourceView.foldingKeepIndentation": {
        localToClass: SourceView,
        defaultValue: "yes",
        validator: OptionsAssistant.validators.truthVal,
        parser: OptionsAssistant.parsers.truthVal,
        setter: function(o,value) {
            o.foldingKeepIndentation = this.parser(value);
        }
    },
}
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
            for (a in entry.attributes) {
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
        var containment = document.createElementNS(NS_HTML,"div")
        containment.appendChild(copy);
        this.viewport.appendChild(containment);
        this.equationEnv.cleanSubtreeOfDocument(document,copy);
        if (this.equationEnv == editor.equations[i]) {
            containment.setAttributeNS(NS_internal,"selected","editcursor"); //XXX: Good?
        }
    }
}
OthersView.prototype = {    
    /**
     * Builds the view
     */
    build: function () {
        // This view does only change when created, so do nothing!
    },
}
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
ViewsetManager.viewClasses["StatusbarView"] = StatusbarView;

