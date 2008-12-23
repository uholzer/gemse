
function AttributeMode(editor, equationEnv, element) {
    // The attribute mode is specially created for one element!
    this.name = "attribute";
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.element = element;
    this.attributes = [];
    this.init = function() {
        // Place attribute information inside an Array
        var attributeNodeMap = this.element.attributes;
        for(var i=0; i<attributeNodeMap.length; i++) {
            this.attributes.push(attributeNodeMap[i]);
        }

        // Sort the array (and filter out internal attributes)
        this.attributes = this.attributes.filter(function (a) { return a.namespaceURI != NS_internal });
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
        this.element.setAttributeNS(NS_internal, "selectedAttributes", "");
        // attributeCursor contains the full name of the attribute the
        // cursor is located on
        this.element.setAttributeNS(NS_internal, "attributeCursor", "");

        if (this.attributes.length > 0) {
            this.moveCursor(0);
        }
        else {
            this.moveCursor(null);
        }
    }
    this.finish = function() {
        // Clean up attribute mess
        this.element.removeAttributeNS(NS_internal, "selectedAttributes");
        this.element.setAttributeNS(NS_internal, "attributeCursor", "");
        this.equationEnv.finishMode();
    }
    this.moveCursor = function(index) {
        this.cursor = index; // index may be undef if there are no attributes present
        this.element.setAttributeNS(NS_internal, "attributeCursor", (index!=null) ? this.attributes[index].nodeName : "");
        this.equationEnv.updateViews();
    }
    this.cursor = null;
    this.__defineGetter__("contextNode", function() { return this.element }); // XXX: good like this?
    this.inputHandler = function(event) {
        if (editor.inputBuffer == "j") {
            if (this.cursor!=null && this.cursor < this.attributes.length-1) {
                this.moveCursor(this.cursor + 1);
            }
            editor.inputBuffer = "";
        }
        else if (editor.inputBuffer == "k") {
            if (this.cursor!=null && this.cursor > 0) {
                this.moveCursor(this.cursor - 1);
            }
            editor.inputBuffer = "";
        }
        else if (editor.inputBuffer == "x") {
            if (this.cursor==null) { return; }
            this.element.removeAttributeNode(this.attributes[this.cursor]);
            this.attributes.splice(this.cursor,1);
            if (this.attributes.length == 0) { this.moveCursor(null) }
            else if (this.cursor >= this.attributes.length) { this.moveCursor(this.cursor-1) }
            else { this.moveCursor(this.cursor) }
            editor.inputBuffer = "";
        }
        else if (editor.inputBuffer == "e") { // XXX: Change this to <ESC>
            editor.inputBuffer = "";
            this.finish();
        }
    };
}

