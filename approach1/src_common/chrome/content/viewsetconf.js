/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */

configurator = {
    editor: null,
    editorWindow: null,
    viewsetManager: null,
    schematicsContainer: null,
    attributesTree: null,
    attributesTreeView: null,
    viewsetNumber: 0,
    viewset: null,
    selected: null,

    /* Called by elements of the window */
    start: function() {
        this.editor = window.arguments[0].editor,
        this.editorWindow = window.arguments[0].editorWindow,
        this.viewsetManager = window.arguments[0].viewsetManager,
        this.schematicsContainer = document.getElementById("schematicsContainer"),
        this.attributesTree = document.getElementById("attributesTree"),
        this.unload = window.arguments[0].onunload;

        // Add views
        var viewsMenupopup = document.getElementById("viewsMenupopup");
        for (var v in this.viewsetManager.viewClasses) {
            var menuitem = document.createElement("menuitem");
            menuitem.setAttribute("label", v);
            menuitem.onclick = this.createViewsMenupopupEventHandler(this.viewsetManager.viewClasses[v]);
            viewsMenupopup.appendChild(menuitem);
        }

        this.restart();
    },
    restart: function() {
        this.viewsetNumber = this.viewsetManager.globalViewsetNumber;
        this.viewset = this.viewsetManager.viewsets[this.viewsetNumber];
        this.select(this.editorWindow.mml_firstChild(this.viewset));

        document.getElementById("viewsetName").value        = this.viewset.getAttribute("name");
        document.getElementById("viewsetDescription").value = this.viewset.getAttribute("description");
    },

    select: function(element) {
        // element must be part of the viewset, can be a view
        this.attributesTree.view = null;
        this.selected = element;
        this.buildSchematics();
        this.attributesTreeView = new AttributesTreeView(this.selected);
        this.attributesTree.view = this.attributesTreeView;
    },

    changeMetaInfo: function() {
        this.viewset.setAttribute("name", document.getElementById("viewsetName").value);
        this.viewset.setAttribute("description", document.getElementById("viewsetDescription").value);
    },

    insertBox: function() {
        var newel = document.createElement("box");
        var insertPos = document.getElementById("insertPosRadiogroup").selectedItem.id;
        var parentNode = this.selected.parentNode;
        if (parentNode.localName=="viewset" && parentNode.namespaceURI==NS_internal) {
            return;
        }
        if (insertPos=="insertBefore") {
            parentNode.insertBefore(newel, this.selected);
        }
        else if (insertPos=="insertAfter") {
            parentNode.insertBefore(newel, this.selected.nextSibling);
        }
        else {
            this.selected.appendChild(newel);
        }
        this.select(this.selected);
    },

    insertView: function(viewClass) {
        var newel = viewClass.createViewport(document);
        var insertPos = document.getElementById("insertPosRadiogroup").selectedItem.id;
        var parentNode = this.selected.parentNode;
        if (parentNode.localName=="viewset" && parentNode.namespaceURI==NS_internal) {
            return;
        }
        if (insertPos=="insertBefore") {
            parentNode.insertBefore(newel, this.selected);
        }
        else if (insertPos=="insertAfter") {
            parentNode.insertBefore(newel, this.selected.nextSibling);
        }
        else {
            this.selected.appendChild(newel);
        }
    },

    remove: function() {
        var parentNode = this.selected.parentNode;
        if (parentNode.localName=="viewset" && parentNode.namespaceURI==NS_internal) {
            return;
        }
        parentNode.removeChild(this.selected);
        this.select(parentNode);
    },

    attributeAdd: function(ns, name, value) {
        this.attributesTreeView.attributeAdd(ns, name, value);
    },

    optionAdd: function(name, value) {
        this.attributesTreeView.optionAdd(name, value);
    },

    attroptDelete: function() {
        this.attributesTreeView.attroptDelete();
    },

    saveViewsetAs: function() {
        // Ask for new name
        var newName = window.prompt("Name of new viewset?");
        // Make a copy of current viewset
        var viewsetsContainer = this.editorWindow.document.createElementNS(NS_internal, "viewsets");
        var viewsetClone = this.viewset.cloneNode(true);
        viewsetClone.setAttribute("name", newName);
        viewsetsContainer.appendChild(viewsetClone);
        this.viewsetManager.loadViewsets(viewsetsContainer);
        // Change viewset on current equation
        this.viewsetManager.chooseViewset(this.viewsetManager.viewsets.length-1);
        this.restart();
    },

    fillViewsetsMenupopup: function() {
        var menu = document.getElementById("viewsetsMenupopup");
        this.editorWindow.xml_flushElement(menu);
        this.viewsetManager.viewsets.forEach(function (v, index) {
            var menuitem = document.createElement("menuitem");
            menuitem.setAttribute("label", v.getAttribute("name"));
            menuitem.onclick = this.createViewsetsMenupopupEventHandler(index);
            menu.appendChild(menuitem);
        }, this);
    },

    useCurrentViewsetEqindep: function() {
        this.viewsetManager.chooseViewset(this.viewsetNumber, "eqindep");
        this.restart();
    },

    /* Internal stuff */
    createViewsMenupopupEventHandler: function(viewClass) {
        return function () { configurator.insertView(viewClass) }
    },
    createViewsetsMenupopupEventHandler: function(viewsetIndex) {
        return function () {
            configurator.viewsetManager.chooseViewset(viewsetIndex);
            configurator.restart();
        }
    },
    commitChange: function() {
        this.buildSchematics();
        this.viewsetManager.chooseViewset(this.viewsetNumber);
    },
    buildSchematics: function() {
        this.editorWindow.xml_flushElement(this.schematicsContainer);
        var e = this.viewset;
        
        var child = e.firstChild;
        while (child) {
            if (child.nodeType==Node.ELEMENT_NODE) { this.buildSchematicsFor(child, this.schematicsContainer) }
            child = child.nextSibling;
        }
    },
    buildSchematicsFor: function(e, destination) {
        var box = document.createElement("box");
        destination.appendChild(box);

        box.setAttribute("flex", e.getAttribute("flex"));
        box.setAttributeNS(NS_internal, "function", e.getAttributeNS(NS_internal,"function"));

        if (e.localName=="hbox" && e.namespaceURI==NS_XUL) {
            box.setAttribute("orient", "horizontal");
        }
        else if (e.localName=="vbox" && e.namespaceURI==NS_XUL) {
            box.setAttribute("orient", "vertical");
        }
        else {
            box.setAttribute("orient", e.getAttribute("orient"));
        }

        if (e === this.selected) {
            box.setAttribute("class", "selected");
        }

        if (e.getAttributeNS(NS_internal, "function") == "viewport") {
            var desc = document.createElement("description");
            desc.appendChild(document.createTextNode(e.getAttributeNS(NS_internal, "viewClass")));
            box.appendChild(desc);
        }

        var configurator = this;
        box.addEventListener("click", function () { configurator.select(e) }, true);
        
        var child = e.firstChild;
        while (child) {
            if (child.nodeType==Node.ELEMENT_NODE) { this.buildSchematicsFor(child, box) }
            child = child.nextSibling;
        }
    }
}

function AttributesTreeView(element) {
    this.rowCount = 0;
    this.selection = null;
    this.sorted = []; // Sorted list of attribute DOM nodes and optionally a header followed by options
    this.treebox = null;

    if (!element || element.nodeType!=Node.ELEMENT_NODE) { throw "Element must be a DOM element." }
    this.element = element;
    this.attributes = element.attributes;
    this.updateSorted();
};
AttributesTreeView.prototype = {
    ATTRIBUTE: 0,
    OPTION: 1,
    HEADER: 2,
    updateSorted: function() {
        this.sorted = [];
        for (var i=0; i<this.attributes.length; ++i) {
            this.sorted.push([this.ATTRIBUTE, this.attributes.item(i)]);
        }
        this.sorted = this.sorted.sort(
            function (a, b) { 
                if (a.namespaceURI < b.namespaceURI) return -1
                else if (a.namespaceURI > b.namespaceURI) return 1
                else if (a.localName < b.localName) return -1
                else if (a.localName > b.localName) return 1
                else return 0;
            }
        );
        var optionsAttribute = this.attributes.getNamedItemNS(NS_internal, "options");
        if (this.attributes.getNamedItemNS(NS_internal, "function") && optionsAttribute) {
            var options = configurator.viewsetManager.parseOptionsString(optionsAttribute.nodeValue);
            //var options = options.sort();
            options.forEach(function (o) { o.unshift(this.OPTION) }, this);
            this.includesOptions = true;
            this.optionsParent = this.sorted.length;
            this.optionsStart = this.sorted.length + 1;
            this.optionsCount = options.length;
            this.sorted = this.sorted.concat([[this.HEADER]], options);
        }
        else {
            this.includesOptions = false;
            this.optionsParent = Infinity;
            this.optionsStart = Infinity;
            this.optionsCount = -1;
        }
        var oldRowCount = this.rowCount;
        this.rowCount = this.sorted.length;
        if (this.treebox) { 
            this.treebox.rowCountChanged(0, this.sorted.length-oldRowCount);
            this.treebox.invalidate();
        }
    },

    attributeAdd: function(ns, name, value) {
        if (!name) {
            var i = 0;
            name = "newAttribute" + i;
            while (this.attributes.getNamedItemNS(ns, name)) {
                ++i;
                name = "newAttribute" + i;
            }
        }
        var newatt = configurator.editorWindow.document.createAttributeNS(
            ns, name
        );
        newatt.nodeValue = value;
        this.attributes.setNamedItemNS(newatt);
        this.updateSorted();
        configurator.commitChange();
    },

    optionAdd: function(name, value) {
        // options are safe to have empty name or empty value thanks
        // to the robustness of the OptionsAssistant

        // Reencode options
        var optionsatt = this.attributes.getNamedItemNS(NS_internal, "options");
        if (optionsatt) { this.attributes.removeNamedItemNS(NS_internal, "options"); }
        if (!optionsatt) { 
            optionsatt = configurator.editorWindow.document.createAttributeNS(NS_internal, "options");
        }
        if (this.includesOptions) {
            optionsatt.nodeValue = configurator.viewsetManager.encodeOptionsString(
                this.sorted.slice(this.optionsStart).concat([[(name || ""), (value || "")]])
            );
        }
        else {
            optionsatt.nodeValue = configurator.viewsetManager.encodeOptionsString(
                [[(name || ""), (value || "")]]
            );
        }
        this.attributes.setNamedItemNS(optionsatt);
        this.updateSorted();
        configurator.commitChange();
    },

    attroptDelete: function() {
        var count = this.selection.getRangeCount();
        for (var i=0; i<count; ++i) {
            var rangeStart = {};
            var rangeEnd = {};
            this.selection.getRangeAt(i, rangeStart, rangeEnd);
            for (var row = rangeStart.value; row <= rangeEnd.value; ++row) {
                if (row < this.optionsParent) {
                    // The row is an attribute
                    var att = this.sorted[row][1];
                    this.attributes.removeNamedItemNS(att.namespaceURI, att.localName);
                }
                else if (row >= this.optionsStart) {
                    // The row is an option
                    this.sorted[row] = null;
                }
            }
        }
        // Regenerate options attribute in case we deleted any options
        if (this.includesOptions) {
            var optionsatt = this.attributes.getNamedItemNS(NS_internal, "options");
            optionsatt.nodeValue = configurator.viewsetManager.encodeOptionsString(
                this.sorted.slice(this.optionsStart).
                            filter(function(e) { return e }).
                            map(function (e) { return [e[1],e[2]] })
            );
        }
        // Note that this.sorted is in a bad state here, since it
        // contains null-entries.
        this.updateSorted();
        configurator.commitChange();
    },
    
    /* interface nsITreeView */
    getRowProperties: function(index, properties) {

    },
    getCellProperties: function(row, col, properties) {},
    getColumnProperties: function(col, properties) {},
    isContainer: function(index) { 
        return index==this.optionsParent;
    },
    isContainerOpen: function(index) { return true },
    isContainerEmpty: function(index) { return this.optionsCount==0 },
    isSeparator: function(index) { 
        return false;
    },
    isSorted: function() { return false },
    canDrop: function(index, orientation, dataTransfer) { return false },
    drop: function(row, orientation, dataTransfer) { },
    getParentIndex: function(rowIndex) {
        return (rowIndex >= this.optionsStart) ? this.optionsParent : -1;
    },
    hasNextSibling: function(rowIndex, afterIndex) {
        return (rowIndex < this.optionsParent) || 
               (rowIndex >= this.optionsStart && rowIndex < this.rowCount-1);
    },
    getLevel: function(index) {
        return (index >= this.optionsStart) ? 1 : 0;
    },
    getImageSrc: function(row, col) { return null },
    //function getProgressMode
    //function getCellValue
    getCellText: function(row, col) {
        if (this.sorted[row][0]==this.ATTRIBUTE) {
            if (col.id=="nameCol") {
                return this.sorted[row][1].localName;
            }
            else if (col.id=="namespaceCol") {
                return this.sorted[row][1].namespaceURI;
            }
            else if (col.id=="valueCol") {
                return this.sorted[row][1].nodeValue;
            }
        }
        else if (this.sorted[row][0]==this.HEADER) {
            if (col.id=="nameCol") {
                return "Options";
            }
        }
        else {
            if (col.id=="nameCol") {
                return this.sorted[row][1];
            }
            else if (col.id=="valueCol") {
                return this.sorted[row][2];
            }
        }
        return "";
    },
    setTree: function(treebox) { this.treebox = treebox },
    toggleOpenState: function() { /* let open ;- */ },
    //function cycleHeader
    //function selectionChagned
    //function cycleCell
    isEditable: function(row, col) {
        return row!=this.optionsParent;
    },
    isSelectable: function(row, col) { 
        return row!=this.optionsParent;
    },
    //function setCellValue
    setCellText: function(row, col, value) {
        if (row < this.optionsParent) {
            var oldatt = this.sorted[row][1];
            this.attributes.removeNamedItemNS(oldatt.namespaceURI, oldatt.localName);
            var newatt = configurator.editorWindow.document.createAttributeNS(
                col.id=="namespaceCol" ? value : oldatt.namespaceURI,
                col.id=="nameCol"      ? value : oldatt.localName
            );
            newatt.nodeValue = col.id=="valueCol" ? value : oldatt.nodeValue;
            this.attributes.setNamedItemNS(newatt);
        }
        else if (row >= this.optionsStart && (col.id=="nameCol" || col.id=="valueCol")) {
            // Reencode options
            this.sorted[row][col.id=="nameCol" ? 1 : 2] = value;
            var optionsatt = this.attributes.getNamedItemNS(NS_internal, "options");
            if (!optionsatt) { 
                optionsatt = configurator.editorWindow.document.createAttributeNS(NS_internal, "options");
                this.attributes.setNamedItemNS(optionsatt);
            }
            optionsatt.nodeValue = configurator.viewsetManager.encodeOptionsString(this.sorted.slice(this.optionsStart).map(function (e) { return [e[1],e[2]] }));
        }
        this.updateSorted();
        configurator.commitChange();
    },
    /*performAction: function(action) {

    },
    performActionOnRow: function(action, row) {

    },
    performActionOnCell: function(action, row, col) { }*/
}

