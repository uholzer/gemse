import { NS } from "./namespace.js";
import { parseCommand } from "./command.js";
import { elementDescriptions } from "./elementDescriptors.js";

function TrivialInsertMode(editor, equationEnv, inElement, beforeElement) {
    // This insert mode inserts children into inElement, before the
    // silbing beforeElement. If beforeElement is null, it adds
    // children to the end of the inElement.
    this.editor = editor;
    this.equationEnv = equationEnv;
    this.d = this.equationEnv.document;
    this.cursor = {
        inElement: inElement,
        beforeElement: beforeElement,
        numberOfElementsToSurround: 0
    };
    this.cursorStack = [];
}
TrivialInsertMode.prototype = {
    name: "insert (trivial)",
    init: function() {
        this.showCursor();
    },
    finish: function() {
        // TODO: Clean up attribute mess
        this.hideCursor();
        var newEditCursor;
        if (this.cursor.beforeElement && this.cursor.beforeElement.previousElementSibling) {
            newEditCursor = this.cursor.beforeElement.previousElementSibling;
        }
        else if (this.cursor.beforeElement) {
            newEditCursor = this.cursor.beforeElement;
        }
        else if (this.cursor.inElement.lastElementChild) {
            newEditCursor = this.cursor.inElement.lastElementChild;
        }
        else {
            newEditCursor = this.cursor.inElement;
        }
        this.equationEnv.finishMode({ 
            newCursor: newEditCursor
        });
    },
    hideCursor: function() {
        this.cursor.inElement.removeAttributeNS(NS.internal,"selected");
        if (this.cursor.beforeElement) {
            this.cursor.beforeElement.removeAttributeNS(NS.internal,"selected");
            if (this.cursor.beforeElement.previousElementSibling) {
                this.cursor.beforeElement.previousElementSibling.removeAttributeNS(NS.internal,"selected");
            }
        }
        else if (this.cursor.inElement.lastElementChild) {
            this.cursor.inElement.lastElementChild.removeAttributeNS(NS.internal,"selected");
        }
        // remove selected="userSelection" attributes on preceding siblings
        var sibling;
        if (this.cursor.beforeElement) { 
            sibling = this.cursor.beforeElement.previousElementSibling;
        }
        else {
            sibling = this.cursor.inElement.lastElementChild;
        }
        while (sibling) {
            sibling.removeAttributeNS(NS.internal,"selected");
            sibling = sibling.previousElementSibling;
        }
    },
    showCursor: function() {
        this.cursor.inElement.setAttributeNS(NS.internal,"selected","insertCursorIn");
        if (this.cursor.beforeElement) {
            this.cursor.beforeElement.setAttributeNS(NS.internal,"selected","insertCursorBefore");
            if (this.cursor.beforeElement.previousElementSibling) {
                this.cursor.beforeElement.previousElementSibling.setAttributeNS(NS.internal,"selected","insertCursorAfter");
            }
        }
        else if (this.cursor.inElement.lastElementChild) {
            this.cursor.inElement.lastElementChild.setAttributeNS(NS.internal,"selected","insertCursorAfter");
        }
        // Put selected="userSelection" for sorrounded elements
        var sibling;
        if (this.cursor.beforeElement) { 
            sibling = this.cursor.beforeElement.previousElementSibling;
        }
        else {
            sibling = this.cursor.inElement.lastElementChild;
        }
        for (var i=0; i < this.cursor.numberOfElementsToSurround; ++i, sibling=sibling.previousElementSibling) {
            sibling.setAttributeNS(NS.internal,"selected","userSelection");
        }
    },
    moveCursor: function(newCursor) {
        this.hideCursor();
        this.cursor = newCursor;
        this.showCursor()
    },
    get contextNode() { return null }, // TODO
    inputHandler: function() {
        if (window.trivialInsertModeCommandOptions.backspace == "removeLast") {
            this.editor.applyBackspaceInInput();
        }
        const instance = parseCommand(
            this, window.trivialInsertModeCommands, null, window.trivialInsertModeCommandOptions.repeating,
            this.editor.inputBuffer
        );
        if (instance.isComplete) { this.editor.eatInput(instance.fullCommand.uLength) };
        if (!instance.isReadyToExecute) { return false }
        instance.execute();
        return true;
    },
    getNewPlaceholderElement: function() {
        var placeholder = this.d.createElementNS(NS.MathML, "mi");
        placeholder.setAttributeNS(NS.internal, "missing", "1")
        placeholder.appendChild(this.d.createTextNode("□"));
        return placeholder;
    },
    putElement: function() {
        // Puts an element where the cursor is located. If an element
        // follows which is marked with the missing attribute, it gets
        // deleted

        // First delete a possibly present element with attribute
        // missing
        if (this.cursor.beforeElement && this.cursor.beforeElement.getAttributeNS(NS.internal, "missing")) {
            var elementToBeDeleted = this.cursor.beforeElement;
            this.moveCursor({ 
                beforeElement: elementToBeDeleted.nextElementSibling,
                inElement: this.cursor.inElement 
            });
            elementToBeDeleted.parentNode.removeChild(elementToBeDeleted);
        }
 
        // Add new element
        var newElement;
        if (arguments.length > 1) {
            var ns = arguments[0];
            var name = arguments[1];
            if (ns==null) { ns = NS.MathML }
            // Hide cursor
            this.hideCursor();
            // Create the new element
            newElement = this.d.createElementNS(ns, name);
            for (var i = 2; i < arguments.length; ++i) {
                newElement.appendChild(arguments[i]);
            }
        }
        else {
            var newElement = arguments[0];
            this.hideCursor();
        }
        // Put element into the equation
        this.cursor.inElement.insertBefore(newElement, this.cursor.beforeElement);
        // Handle surrounding
        if (this.cursor.numberOfElementsToSurround) {
            var description = elementDescriptions[newElement.localName];
            if (description.type=="mrow" || description.type=="inferred_mrow" || this.cursor.numberOfElementsToSurround==1) {
                // clean out children of the new element that are marked as missing.
                // But clean at most as many elements as are selected
                for (var i=0; 
                    i<this.cursor.numberOfElementsToSurround 
                    && newElement.firstElementChild
                    && newElement.firstElementChild.getAttributeNS(NS.internal, "missing");
                    ++i) {
                    newElement.removeChild(newElement.firstElementChild)
                }
                // Put selected elements into the new one
                for (var i=0; i<this.cursor.numberOfElementsToSurround; ++i) {
                    newElement.insertBefore(
                        newElement.previousElementSibling,
                        newElement.firstChild
                    );
                }
            }
            else if (description.type=="fixedChildren" || description.type=="childList") {
                var surroundingMrow = this.d.createElementNS(NS.MathML,"mrow");
                for (var i=0; i<this.cursor.numberOfElementsToSurround; ++i) {
                    surroundingMrow.insertBefore(
                        newElement.previousElementSibling,
                        surroundingMrow.firstChild
                    );
                }
                newElement.removeChild(newElement.firstElementChild);
                newElement.insertBefore(surroundingMrow,newElement.firstChild);
            }
            else {
                // Do not handle surrounding for this element
            }
        }
        // Position the cursor
        var firstMissing = newElement.firstElementChild;
        while (firstMissing && !firstMissing.getAttributeNS(NS.internal, "missing")) {
            firstMissing = firstMissing.nextElementSibling;
        }
        if (firstMissing) {
            // If the element contains a "missing element" marker, put the 
            // cursor before it. But we must put a cursor behind the new
            // element on the stack.
            // XXX: Instead of looking for "missing element" marker elements,
            // we perhaps should look at the element description?
            this.cursorStack.push({
                beforeElement: this.cursor.beforeElement,
                inElement: this.cursor.inElement
            })
            this.moveCursor({
                beforeElement: firstMissing,
                inElement: newElement
            });
        }
        else {
            // Otherwise put it behind it (that's where it is already)
            this.moveCursor({
                beforeElement: this.cursor.beforeElement,
                inElement: this.cursor.inElement
            });
        }
    },
}

export const commands = {
    table(mode) {
        // Inserts an mtr element if the parent is an mtable element, an
        // mtd element if the parent is an mtr element and otherwise an
        // mtable element.
        if (mode.cursor.inElement.localName=="mtable") {
            //insert an mtr
            mode.putElement(null, "mtr", mode.getNewPlaceholderElement());
        }
        else if (mode.cursor.inElement.localName=="mtr"||mode.cursor.inElement.localName=="mlabeledtr") {
            //insert an mtd
            mode.putElement(null, "mtd", mode.getNewPlaceholderElement());
        }
        else {
            //insert an mtable
            mode.putElement(null, "mtable", mode.getNewPlaceholderElement());
        }
        return true;
    },

    mlabeledtr(mode) {
        mode.putElement(null, "mlabeledtr", mode.getNewPlaceholderElement());
        return true;
    },

    insertDescribedElement(mode, instance, elementName) {
        // Inserts an mtext element
        var description = elementDescriptions[elementName];
        var placeholder = mode.getNewPlaceholderElement();
        var newElement = mode.d.createElementNS(description.namespace, description.name);
        if (description.type == "fixedChildren") {
            for (var i=0; i<description.childCount; ++i) {
                newElement.appendChild(placeholder.cloneNode(true));
            }
        }
        else if (description.type == "inferred_mrow") {
            newElement.appendChild(placeholder.cloneNode(true));
        }
        else if (description.type == "childList") {
            newElement.appendChild(placeholder.cloneNode(true));
        }
        else if (description.type == "empty") {
            // Let it empty. This also causes mode.putElement to position
            // the cursor behind the new element
        }
        else if (description.type == "mrow") {
            newElement.appendChild(placeholder.cloneNode(true));
        }
        else if (description.type == "token") {
            // The argument of the instance gives us the content for the
            // token elment
            newElement.appendChild(mode.d.createTextNode(instance.argument));
        }
        else {
            throw new Error(description.type + " not yet supported by insertDescribedElement");
        }
        mode.putElement(newElement);
        return true;
    },

    notation_iterate(mode, instance) {
        var newElement = mode.d.createElementNS(NS.OMDoc, "iterate");
        newElement.setAttribute("name", instance.argument);
        newElement.appendChild(mode.getNewPlaceholderElement());
        mode.putElement(newElement);
        return true;
    },

    notation_render(mode, instance) {
        var newElement = mode.d.createElementNS(NS.OMDoc, "render");
        newElement.setAttribute("name", instance.argument);
        mode.putElement(newElement);
        return true;
    },

    cursorJump(mode,instance) {
        if (mode.cursorStack.length<1) { 
            // If the stack is empty, the user is done with inserting, so exit
            return exit(mode,instance);
        }
        mode.moveCursor(mode.cursorStack.pop());
        return true;
    },

    oneMoreToSurround(mode) {
        // TODO: Count preceding siblings and prevent to select too many
            mode.moveCursor({ 
                beforeElement: mode.cursor.beforeElement,
                inElement: mode.cursor.inElement,
                numberOfElementsToSurround: (mode.cursor.numberOfElementsToSurround||0) + 1
            });
        return true;
    },

    oneLessToSurround(mode) {
        if (mode.cursor.numberOfElementsToSurround > 0) {
            mode.moveCursor({ 
                beforeElement: mode.cursor.beforeElement,
                inElement: mode.cursor.inElement,
                numberOfElementsToSurround: (mode.cursor.numberOfElementsToSurround||0) - 1
            });
        }
        return true;
    },

    killPrevious(mode) {
        var toRemove = [];
        var precedingElement;
        if (mode.cursor.beforeElement) {
            precedingElement = mode.cursor.beforeElement.previousElementSibling;
        }
        else {
            precedingElement = mode.cursor.inElement.lastElementChild;
        }

        if (precedingElement) {
            if (mode.cursor.numberOfElementsToSurround > 0) {
                // If the user has surrounded any elements, he wants to
                // kill them all
                var pos = precedingElement;
                for (var i=1; i <= mode.cursor.numberOfElementsToSurround; i++) {
                    toRemove.push(pos);
                    pos = pos.previousElementSibling; // Exists for shure
                }
            }
            else {
                toRemove.push(precedingElement);
            }
            mode.moveCursor({
                beforeElement: mode.cursor.beforeElement,
                inElement: mode.cursor.inElement,
                numberOfElementsToSurround: 0
            });
        }
        else {
            toRemove.push(mode.cursor.inElement);
            mode.moveCursor({
                beforeElement: mode.cursor.inElement.nextElementSibling,
                inElement: mode.cursor.inElement.parentElement,
                numberOfElementsToSurround: 0
            });
        }
        toRemove.forEach(function (e) { e.parentNode.removeChild(e) });
        return true;
    },

    exit(mode) {
        mode.finish();
        return true;
    },
};
