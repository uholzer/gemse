import { NS } from "./namespace.js";
import { parseCommand } from "./command.js";
import { elementDescriptions } from "./elementDescriptors.js";

export function AttributeMode(editor, equationEnv, element) {
    // The attribute mode is specially created for one element!
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.d = this.equationEnv.document;
    this.element = element;
    this.attributes = [];
    this.cursor = null;
}
AttributeMode.prototype = {
    name: "attribute",
    init: function() {
        // Place attribute information inside an Array
        this.cursor = null;
        this.attributes = [];
        var attributeNodeMap = this.element.attributes;
        for(var i=0; i<attributeNodeMap.length; i++) {
            this.attributes.push(attributeNodeMap[i]);
        }

        // Sort the array (and filter out internal attributes)
        this.attributes = this.attributes.filter(function (a) { return a.namespaceURI != NS.internal });
        this.attributes = this.attributes.sort(
            function (a, b) { 
                if (a.namespaceURI < b.namespaceURI) return -1
                else if (a.namespaceURI > b.namespaceURI) return 1
                else if (a.localName < b.localName) return -1
                else if (a.localName > b.localName) return 1
                else return 0;
            }
        );

        // The attribute selectedAttributes stores the list of the
        // full names of the selected attributes
        this.element.setAttributeNS(NS.internal, "selectedAttributes", "");
        // attributeCursor contains the full name of the attribute the
        // cursor is located on
        this.element.setAttributeNS(NS.internal, "attributeCursor", "");

        if (this.attributes.length > 0) {
            this.moveCursor(0);
        }
        else {
            this.moveCursor(null);
        }
    },
    reInit: function() { this.init() },
    finish: function() {
        // Clean up attribute mess
        this.element.removeAttributeNS(NS.internal, "selectedAttributes");
        this.element.setAttributeNS(NS.internal, "attributeCursor", "");
        this.equationEnv.finishMode();
    },
    moveCursor: function(index) {
        this.cursor = index; // index may be undef if there are no attributes present
        this.element.setAttributeNS(NS.internal, "attributeCursor", (index!=null) ? this.attributes[index].nodeName : "");
    },
    get contextNode() { return this.element }, // XXX: good like this?
    inputHandler: function() {
        if (window.attributeModeCommandOptions.backspace == "removeLast") {
            this.editor.applyBackspaceInInput();
        }
        const instance = parseCommand(
            this, window.attributeModeCommands, null, window.attributeModeCommandOptions.repeating,
            this.editor.inputBuffer
        );
        if (instance.isComplete) { this.editor.eatInput(instance.fullCommand.uLength) };
        if (!instance.isReadyToExecute) { return false }
        instance.execute();
        return true;
    },
}


export const commands = {
    exit(mode) {
        mode.finish();
        return true;
    },

    up(mode) {
        var oldCursor = mode.cursor;
        if (oldCursor!=null && oldCursor > 0) {
            mode.moveCursor(oldCursor - 1);
        }
        return true;
    },

    down(mode) {
        var oldCursor = mode.cursor;
        if (oldCursor!=null && oldCursor < mode.attributes.length-1) {
            mode.moveCursor(oldCursor + 1);
        }
        return true;
    },

    kill(mode) {
        if (mode.cursor==null) { return true; }
        mode.element.removeAttributeNode(mode.attributes[mode.cursor]);
        mode.attributes.splice(mode.cursor,1);
        if (mode.attributes.length == 0) { mode.moveCursor(null) }
        else if (mode.cursor >= mode.attributes.length) { mode.moveCursor(mode.cursor-1) }
        else { mode.moveCursor(mode.cursor) }
        return true;
    },

    changeValue(mode,instance) {
        if (mode.cursor==null) { return true; }
        mode.attributes[mode.cursor].nodeValue = instance.argument;
        return true;
    },

    changeName(mode) {
        if (mode.cursor==null) { return true; }
        throw new Error("todo!");
    },

    changeNS(mode) {
        if (mode.cursor==null) { return true; }
        throw new Error("todo!");
    },

    insertDefault(mode,instance) {
        var r = /^([^\n]*)\n([^\n]*)$/m;
        var info = r.exec(instance.argument);
        if (info) {
            mode.element.setAttribute(info[1], info[2]);
            mode.reInit();
            return true;
        }
        else {
            return false;
        }
    },

    insertForeign(mode,instance) {
        var r = /^([^\n]*)\n([^\n]*)\n([^\n]*)$/;
        var info = r.exec(instance.argument);
        if (info) {
            mode.element.setAttributeNS(info[1], info[2], info[3]);
            mode.reInit();
            return true;
        }
        else {
            return false;
        }
    },


    setDefaultForMissing(mode) {
        // Sets default value for attributes not already present
        var elementDesc = elementDescriptions[mode.element.localName];
        for (var attributeDesc of elementDesc.attributes) {
            if (!mode.element.hasAttributeNS(attributeDesc.namespace||"",attributeDesc.name)) {
                mode.element.setAttributeNS(attributeDesc.namespace||"",attributeDesc.name,attributeDesc.defaultValue);
            }
        }
        mode.reInit();
        return true;
    },

    clearAll(mode) {
        // I delete all attributes using the folowing rather crazy way. I
        // do not know better. The problem is that, so it seems, if one
        // retrieves element.attributes and deletes some attributes via
        // element.removeAttributeNode, the retrieved attributes list
        // changes. The solution I use is to retrieve a new attributes
        // list with element.attributes after every removal.

        // Attributes with localName that begins with "-" are kept.

        var getaSignificantAttribute = function(e) {
            var attributes = e.attributes;
            for (var i=0; i<attributes.length; ++i) {
                var candidate = attributes.item(i);
                if (candidate.localName[0]!="-") { return candidate }
            }
            return null;
        }

        var anAtribute;
        while (anAttribute = getaSignificantAttribute(mode.element)) {
            mode.element.removeAttributeNode(anAttribute);
        }

        mode.reInit();
        return true;
    },

    setFromDictionary(mode,instance) {
        // Looks up the entries for this element in the dictionary and sets
        // the attributes accordingly. Up to now, this only works for mo
        // elements.
        if (! (mode.element.namespaceURI==NS.MathML && mode.element.localName=="mo")) { return false }

        var applyEntry = function(entry,element) {
            for (var name in entry.attributes) {
                element.setAttribute(name, entry.attributes[name]);
            }
        }

        var value = instance.argument;

        var entries = operatorDictionary.entriesByContent(mode.element.textContent);
        // If the user has given a string for disambiguation, filter for it
        if (value) {
            entries = entries.filter(function (e) {
                return (e.disamb==value);
            });
        }
        if (entries.length==1) { 
            // Only one left, apply it blindly
            applyEntry(entries[0],mode.element);
        }
        else if (entries.length>1) {
            // Find out the form of this element
            var form = mode.element.getAttribute("form") || operatorDictionary.formByPosition(mode.element);
            // Filter for the form
            entries = entries.filter(function (e) {
                return (e.form==form);
            });
            // Apply, if present, first (and hopefully only) matching entry
            if (entries.length>0) { applyEntry(entries[0],mode.element) }
        }
        // At this pint the attributes have been set or
        // there has been no matching entry or there
        // have been more than one matching entries.

        mode.reInit();
        return true;
    },
};
