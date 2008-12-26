
function EditMode(editor, equationEnv) {
    this.name = "edit";
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.init = function() {
        this.moveCursor(this.equationEnv.equation); // the element the cursor points to
    }
    this.moveCursor = function(element) {
        this.hideCursor();
        this.cursor = element;
        this.showCursor();
        this.equationEnv.updateViews();
    }
    this.showCursor = function() {
        this.cursor.setAttributeNS(NS_internal, "selected", "editcursor");
        if (this.cursor != this.equationEnv.equation) { this.cursor.parentNode.setAttributeNS(NS_internal, "selected", "parent"); }
    }
    this.hideCursor = function() {
        if (this.cursor) {
            this.cursor.removeAttributeNS(NS_internal, "selected");
            if (this.cursor != this.equationEnv.equation) { this.cursor.parentNode.removeAttributeNS(NS_internal, "selected"); }
        }
    }
    this.cursor = null;
    this.__defineGetter__("contextNode", function() { return this.cursor; }); // Required for every mode
    this.keyHandler = function(event) {
        if (event.keyCode == KeyEvent.DOM_VK_ESCAPE) {
            //event.preventDefault();
            var dest = mml_firstChild(this.cursor);
            editor.inputBuffer = "";
        }
    }
    this.inputHandler = function() {
        // Temporary history managment XXX
        var change = null;
        // Check whether the input buffer contains a complete
        // command.
        var re = /^:/;
        if (re.exec(editor.inputBuffer)) {

        }
        else if (editor.inputBuffer == "j") {
            var dest = mml_firstChild(this.cursor);
            if (dest) { this.moveCursor(dest); }
            editor.inputBuffer = "";
        }
        else if (editor.inputBuffer == "k") {
            var dest = mml_parent(this.cursor);
            if (dest) { this.moveCursor(dest); }
            editor.inputBuffer = "";
        }
        else if (editor.inputBuffer == "h") {
            var dest = mml_previousSibling(this.cursor);
            if (dest) { this.moveCursor(dest); }
            editor.inputBuffer = "";
        }
        else if (editor.inputBuffer == "l") {
            var dest = mml_nextSibling(this.cursor);
            if (dest) { this.moveCursor(dest); }
            editor.inputBuffer = "";
        }
        else if (editor.inputBuffer == "u") {
            // The glorious undo
            if (!this.equationEnv.history.goBack(this.equationEnv)) {
                throw "undo failed";
            }
            editor.inputBuffer = "";
            this.moveCursor(this.cursor); // In order to update all views
        }
        else if (editor.inputBuffer == "r") { // XXX: Change that to Ctrl+r
            // The inverse of the glorious undo
            if (!this.equationEnv.history.goForward(this.equationEnv)) {
                throw "redo failed";
            }
            editor.inputBuffer = "";
            this.moveCursor(this.cursor); // In order to update all views
        }
        else if (editor.inputBuffer == "x") {
            change = this.equationEnv.history.createChange();
            change.recordBefore(this.equationEnv.equation,this.cursor.parentNode);
            var target = this.cursor;
            this.moveCursor(this.cursor.parentNode);
            target.parentNode.removeChild(target);
            editor.inputBuffer = "";
            change.recordAfter(this.equationEnv.equation,this.cursor);
            this.moveCursor(this.cursor); // In order to update all views
        }
        else if (editor.inputBuffer == "@") {
            this.infoAboutCalledMode = {
                change: this.equationEnv.history.createChange(),
                changeElement: this.cursor
            };
            this.infoAboutCalledMode.change.recordBefore(this.equationEnv.equation,this.cursor);
            var newMode = new AttributeMode(this.editor, this.equationEnv, this.cursor);
            newMode.init();
            this.equationEnv.callMode(newMode);
            editor.inputBuffer = "";
        }
        else {
            editor.inputBuffer = "";
        }

        if (change) { this.equationEnv.history.reportChange(change); }
    };
    this.calledModeReturned = function () {
        this.infoAboutCalledMode.change.recordAfter(this.equationEnv.equation,this.infoAboutCalledMode.changeElement);
        this.equationEnv.history.reportChange(this.infoAboutCalledMode.change);
        delete this.infoAboutCalledMode;
        this.moveCursor(this.cursor); // In order to update all views
    }
    this.reInit = function () {
        // Search equation for the cursor
        var nsResolver = function (prefix) { 
            if (prefix == "internal") { return NS_internal }
            else { return null }
        };
        this.cursor = document.evaluate(".//.[@internal:selected='editcursor']", this.equationEnv.equation, nsResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
        if (!this.cursor) { this.cursor = this.equationEnd.equation }
    }
}

/* List of all commands */

editModeCommands = {
    j: {
        type: "movement",
        execute: function () {

        }
    }
};

/* Child, Parent, Forward, Backward movements */

/* They all return null if there is no more node in this direction */

function mml_nextSibling(element) {
    while (element = element.nextSibling) {
        if (element.nodeType == Node.ELEMENT_NODE) {
            return element;
        }
    }
    return null;
}

function mml_previousSibling(element) {
    while (element = element.previousSibling) {
        if (element.nodeType == Node.ELEMENT_NODE) {
            return element;
        }
    }
    return null;
}

function mml_firstChild(element) {
    var candidates = element.childNodes;
    for (var i = 0; i < candidates.length; i++) {
        if (candidates[i].nodeType == Node.ELEMENT_NODE) {
            return candidates[i];
        }
    }
    return null;
}

function mml_lastChild(element) {
    var candidates = element.childNodes;
    for (var i = candidates.length-1; i >= 0; i--) {
        if (candidates[i].nodeType == Node.ELEMENT_NODE) {
            return candidates[i];
        }
    }
    return null;
}

function mml_parent(element) {
    // Important: We must not go above the formula
    if (element.localName != "math") { //XXX: Not perfect
        return element.parentNode;
    }
    return null;
}
