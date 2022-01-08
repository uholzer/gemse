/*
    This is an insert mode tailored to Content MathML
*/

import { NS, standardNSResolver } from "./namespace.js";
import { parseCommand } from "./command.js";
import * as DOM from "./dom.js";
import { ucd } from "./ucd.js";

function ContentInsertMode(editor, equationEnv, inElement, beforeElement) {
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
    /** Set to true if the next character must not be added to the
     * content of the preceding element. This is useful if the user
     * wants to insert two mn elements behind each other.
     */
    this.forceNewElement = false;
    /**
     * Options Object
     * @private
     */
    this.o = editor.optionsAssistant.obtainOptionsObject(ContentInsertMode, this);
    /**
     *
     */
    this.langs = {
        AUTO:     0,
        MathML:   1,
        OpenMath: 3
    };
    /**
     *
     */
    this.langForNextElement = this.langs.AUTO;
}
ContentInsertMode.prototype = {
    name: "content",
    init: function() {
        this.showCursor();
    },
    finish: function() {
        // TODO: Clean up attribute mess
        this.hideCursor();
        var newEditCursor;
        if (this.cursor.beforeElement && DOM.mml_previousSibling(this.cursor.beforeElement)) {
            newEditCursor = DOM.mml_previousSibling(this.cursor.beforeElement);
        }
        else if (this.cursor.beforeElement) {
            newEditCursor = this.cursor.beforeElement;
        }
        else if (DOM.mml_lastChild(this.cursor.inElement)) {
            newEditCursor = DOM.mml_lastChild(this.cursor.inElement);
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
            if (DOM.mml_previousSibling(this.cursor.beforeElement)) {
                DOM.mml_previousSibling(this.cursor.beforeElement).removeAttributeNS(NS.internal,"selected");
            }
        }
        else if (DOM.mml_lastChild(this.cursor.inElement)) {
            DOM.mml_lastChild(this.cursor.inElement).removeAttributeNS(NS.internal,"selected");
        }
        // remove selected="userSelection" attributes on preceding siblings
        var sibling;
        if (this.cursor.beforeElement) { 
            sibling = DOM.mml_previousSibling(this.cursor.beforeElement);
        }
        else {
            sibling = DOM.mml_lastChild(this.cursor.inElement);
        }
        while (sibling) {
            sibling.removeAttributeNS(NS.internal,"selected");
            sibling = DOM.mml_previousSibling(sibling);
        }
    },
    showCursor: function() {
        this.cursor.inElement.setAttributeNS(NS.internal,"selected","insertCursorIn");
        if (this.cursor.beforeElement) {
            this.cursor.beforeElement.setAttributeNS(NS.internal,"selected","insertCursorBefore");
            if (DOM.mml_previousSibling(this.cursor.beforeElement)) {
                DOM.mml_previousSibling(this.cursor.beforeElement).setAttributeNS(NS.internal,"selected","insertCursorAfter");
            }
        }
        else if (DOM.mml_lastChild(this.cursor.inElement)) {
            DOM.mml_lastChild(this.cursor.inElement).setAttributeNS(NS.internal,"selected","insertCursorAfter");
        }
        // Put selected="userSelection" for sorrounded elements
        var sibling;
        if (this.cursor.beforeElement) { 
            sibling = DOM.mml_previousSibling(this.cursor.beforeElement);
        }
        else {
            sibling = DOM.mml_lastChild(this.cursor.inElement);
        }
        for (var i=0; i < this.cursor.numberOfElementsToSurround; ++i, sibling=DOM.mml_previousSibling(sibling)) {
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
        if (window.contentInsertModeCommandOptions.backspace == "removeLast") {
            this.editor.applyBackspaceInInput();
        }
        const instance = parseCommand(
            this, window.contentInsertModeCommands, null, window.contentInsertModeCommandOptions.repeating,
            this.editor.inputBuffer
        );
        if (instance.isComplete) { this.editor.eatInput(instance.fullCommand.uLength) };
        if (instance.isReadyToExecute) {
            instance.execute();
            // Do not do
            //   this.forceNewElement = false;
            // here, since otherwise the user can not set it to true
            return true;
        }
        else if (instance.notFound) {
            // The input buffer does not begin with a command, so look
            // into the UCD to decide what to do.

            // Fetch next character, be careful if it is from a higher
            // plane, i.e. if the character is a high surrogate.
            // uCharAt and eatInput handle a surrogate pair as one
            // character.
            var c = this.editor.inputBuffer.uCharAt(0);
            this.editor.eatInput(1);

            // Find out wether we have to treat this character as
            // ci or as cn
            if (ucd.isDigit(c)) {
                // We assume that it does not happen that the user
                // wants to have two consecutive mn elements. This is
                // not good, since for example in a subsup element,
                // both children can be mn.
                var precedingElement = this.cursor.beforeElement ? DOM.mml_previousSibling(this.cursor.beforeElement) : DOM.mml_lastChild(this.cursor.inElement);
                if (this.is_cn_integer(precedingElement) && !this.forceNewElement) {
                    precedingElement.lastChild.nodeValue += c; //XXX: Is that good in case of entities, whitespace or similar?
                }
                else {
                    this.putElement(this.new_cn_integer(c), false);
                }
            }
            else if (ucd.isIdentifier(c)) { // Identifier
                this.putElement(this.new_ci(c), false);
            }
            else {
                throw new Error("I don't know what to do with " + c + ", it seems not to be a digit or an identifier.");
            }

            this.forceNewElement = false;
            return true;
        }
        else {
            return false;
        }
    },
    putElement: function(newElement, recursive, isOperator) {
        // Puts an element where the cursor is located. If an element
        // follows which is marked with the missing attribute, it gets
        // deleted

        this.hideCursor();
 

        if (this.cursor.numberOfElementsToSurround) {
            if (isOperator) { 
                var operator = newElement;
                newElement = this.d.createElementNS(NS.MathML, "apply");
            }
            this.cursor.inElement.insertBefore(newElement, this.cursor.beforeElement);
            for (var i=0; i<this.cursor.numberOfElementsToSurround; ++i) {
                newElement.insertBefore(
                    DOM.mml_previousSibling(newElement),
                    newElement.firstChild
                );
            }
            if (isOperator) { 
                newElement.insertBefore(
                    operator,
                    newElement.firstChild
                );
            }
        }
        else {
            this.cursor.inElement.insertBefore(newElement, this.cursor.beforeElement);
        }

        // Place the cursor
        if (recursive) {
            // Remember old cursor
            this.cursorStack.push({
                beforeElement: this.cursor.beforeElement,
                inElement: this.cursor.inElement,
            });
            // Put the cursor at the end of the newly created element
            this.moveCursor({
                beforeElement: null,
                inElement: newElement,
            });
        }
        else {
            // Put the cursor where it already is
            this.moveCursor({
                beforeElement: this.cursor.beforeElement,
                inElement: this.cursor.inElement
            });
        }
    },
    /**
     * Set the language to be used for the next created element
     */
    forceLang: function(lang) {
        this.langForNextElement = lang;
    },
    currentLang: function() {
        if (this.langForNextElement == this.langs.AUTO) {
            if (this.cursor.inElement.namespaceURI == NS.OpenMath) {
                return this.langs.OpenMath;
            }
            else if (this.cursor.inElement.namespaceURI == NS.MathML) {
                return this.langs.MathML;
            }
        }
        else {
            return this.langForNextElement;
        }
    },
    /**
     * Creates a csymbol or OMS element
     */
    new_csymbol: function(cdbase,cd,name,pragmaticElementName) {
        var element;
        if (this.currentLang() == this.langs.OpenMath) {
            element = this.d.createElementNS(NS.OpenMath, "OMS");
            element.setAttribute("name", name);
            if (cdbase) { element.setAttribute("cdbase", cdbase) }
            element.setAttribute("cd", cd);
        }
        else if (pragmaticElementName && this.o.pragmaticContent) {
            newElement = mode.d.createElementNS(NS.MathML, pragmaticElementName);
        }
        else {
            element = this.d.createElementNS(NS.MathML, "csymbol");
            element.appendChild(this.d.createTextNode(name));
            if (cdbase) { element.setAttribute("cdbase", cdbase) }
            element.setAttribute("cd", cd);
        }
        return element;
    },
    /**
     * Creates a ci or OMV element
     */
    new_ci: function(name) {
        var element;
        if (this.currentLang() == this.langs.OpenMath) {
            element = this.d.createElementNS(NS.OpenMath, "OMV");
            element.setAttribute("name", name);
        }
        else {
            element = this.d.createElementNS(NS.MathML, "ci");
            element.appendChild(this.d.createTextNode(name));
        }
        return element;
    },
    /**
     * Creates an apply or OMA element
     */
    new_apply: function() {
        var element;
        if (this.currentLang() == this.langs.OpenMath) {
            element = this.d.createElementNS(NS.OpenMath, "OMA");
        }
        else {
            element = this.d.createElementNS(NS.MathML, "apply");
        }
        return element;
    },
    /**
     * Create a bind or OMBIND element
     */
    new_bind: function() {
        var element;
        if (this.currentLang() == this.langs.OpenMath) {
            element = this.d.createElementNS(NS.OpenMath, "OMBIND");
        }
        else {
            element = this.d.createElementNS(NS.MathML, "bind");
        }
        return element;
    },
    /**
     * Create a bvar or OMBVAR element.
     * Note that in MathML every bvar contains only one variable and a
     * bind element can have more that one bvar elements. On the other
     * hand, OpenMath allows only one OMBVAR in an OMBIND but an
     * OMBVAR can contain more than one variable.
     */
    new_bvar: function() {
        var element;
        if (this.currentLang() == this.langs.OpenMath) {
            element = this.d.createElementNS(NS.OpenMath, "OMBVAR");
        }
        else {
            element = this.d.createElementNS(NS.MathML, "bvar");
        }
        return element;
    },
    /**
     * Create a cn of type integer or a OMI
     */
    new_cn_integer: function(n) {
        var element;
        if (this.currentLang() == this.langs.OpenMath) {
            element = this.d.createElementNS(NS.OpenMath, "OMI");
        }
        else {
            element = this.d.createElementNS(NS.MathML, "cn");
            element.setAttribute("type", "integer");
        }
        if (n) {
            element.appendChild(this.d.createTextNode(n));
        }
        return element;
    },
    /**
     * Returns a cn of autmatically determined type or an OMI or an OMF
     * TODO: At the moment, this just calls new_cn_integer!
     */
    new_cn: function(n) {
        return this.new_cn_integer(n);
    },
    /**
     * Returns true if the given element is a cn of type integer or an OMI
     */
    is_cn_integer: function(element) {
        return (element.namespaceURI == NS.MathML 
                && element.localName == "cn" 
                && element.getAttribute("type") == "integer")
               ||
               (element.namespaceURI == NS.OpenMath 
                && element.localName == "OMI");
    },
    /**
     * Creates a semantics or OMATTR element
     */
    new_semantics: function() {
        var element;
        if (this.currentLang() == this.langs.OpenMath) {
            element = this.d.createElementNS(NS.OpenMath, "OMATTR");
        }
        else {
            element = this.d.createElementNS(NS.MathML, "semantics");
        }
        return element;
    }
}

export const commands = {
    symbol(mode, instance, cd, name, pragmatic) {
        // If cd is given, don't look for cd argument in the instance, if name is given as well,
        // don't look for name argument either.
        var argumentLines;
        if (instance.argument) {
            argumentLines = instance.argument.split("\n");
        }
        if (!cd) { cd = argumentLines[0] }
        if (!name) { name = argumentLines[1] }

        var newElement = mode.new_csymbol(null, cd, name, pragmatic);
        mode.putElement(newElement, false, true);
        return true;
    },

    ci(mode, instance) {
        mode.putElement(mode.new_ci(instance.argument), false);
        return true;
    },

    cn(mode, instance) {
        mode.putElement(mode.new_cn(instance.argument), false);
        return true;
    },

    apply(mode, instance) {
        mode.putElement(mode.new_apply(), true);
        return true;
    },

    arbitraryOperator(mode, instance) {
        var namespace = (mode.cursor.inElement.namespaceURI == OpenMath) ? NS.OpenMath : NS.MathML;
        var newElement = mode.d.createElementNS(namespace, instance.argument);
        mode.putElement(newElement, false, true);
        return true;
    },

    arbitraryElement(mode, instance) {
        var namespace = (mode.currentLang() == mode.langs.OpenMath) ? NS.OpenMath : NS.MathML;
        var newElement = mode.d.createElementNS(namespace, instance.argument);
        mode.putElement(newElement, false, false);
        return true;
    },

    bind(mode, instance) {
        mode.putElement(mode.new_bind(), true);
        return true;
    },

    bvar(mode, instance) {
        // If OpenMath, place the cursor inside the OMBVAR if one already
        // exists. If MathML, create a new bvar.
        if (mode.currentLang() == mode.langs.OpenMath) {
            if (mode.cursor.inElement.localName == "OMBIND" && mode.cursor.inElement.namespaceURI == NS.OpenMath) {
                // Place cursor inside existing OMBVAR if one is already
                // present
                var xpathResult = mode.d.evaluate(
                    "./openmath:OMBVAR", 
                    mode.cursor.inElement, 
                    standardNSResolver, 
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                );
                if (xpathResult.singleNodeValue) {
                    // Place cursor inside it
                    mode.moveCursor({
                        beforeElement: null,
                        inElement: xpathResult.singleNodeValue,
                    });
                    // XXX: Should we put old position on the cursor stack?
                }
                else {
                    // Create a new one
                    mode.putElement(mode.new_bvar(), true);
                }
            }
            else if (mode.cursor.inElement.localName == "OMBVAR" && mode.cursor.inElement.namespaceURI == NS.OpenMath) {
                // Do nothing
            }
            else {
                mode.putElement(mode.new_bvar(), true);
            }
        }
        else {
            if (mode.cursor.inElement.localName == "bind" && mode.cursor.inElement.namespaceURI == NS.MathML) {
                // Place new bvar
                mode.putElement(mode.new_bvar(), true);
            }
            else if (mode.cursor.inElement.localName == "bvar" && mode.cursor.inElement.namespaceURI == NS.MathML) {
                // Place new bvar behind this one
                mode.moveCursor({
                    beforeElement: DOM.mml_nextSibling(mode.cursor.inElement),
                    inElement: DOM.mml_parent(mode.cursor.inElement),
                });
                mode.putElement(mode.new_bvar(), true);
            }
            else {
                mode.putElement(mode.new_bvar(), true);
            }

        }
        return true;
    },

    semantics(mode, instance) {
        mode.putElement(mode.new_semantics(), true);

        return true;
    },

    omatp(mode, instance) {
        var newElement = mode.d.createElementNS(NS.OpenMath, "OMATP");
        mode.putElement(newElement, true);

        return true;
    },

    annotationxml_cmml(mode, instance) {
        var argumentLines = instance.argument.split("\n");
        var newElement = mode.d.createElementNS(NS.MathML, "annotation-xml");
        newElement.setAttribute("cd", argumentLines[0]);
        newElement.setAttribute("name", argumentLines[1]);
        newElement.setAttribute("encoding", "MathML-Content");
        mode.putElement(newElement, true);

        return true;
    },

    annotationxml_pmml(mode, instance) {
        var argumentLines = instance.argument.split("\n");
        var newElement = mode.d.createElementNS(NS.MathML, "annotation-xml");
        newElement.setAttribute("cd", argumentLines[0]);
        newElement.setAttribute("name", argumentLines[1]);
        newElement.setAttribute("encoding", "MathML-Presentation");
        mode.putElement(newElement, true);

        return true;
    },

    annotationxml_om(mode, instance) {
        var argumentLines = instance.argument.split("\n");
        var newElement = mode.d.createElementNS(NS.MathML, "annotation-xml");
        newElement.setAttribute("cd", argumentLines[0]);
        newElement.setAttribute("name", argumentLines[1]);
        newElement.setAttribute("encoding", "application/openmath+xml");
        mode.putElement(newElement, true);

        // TODO: Should we automatically force the language to OpenMath
        // here?

        return true;
    },

    annotation_arbitrary(mode, instance) {
        var argumentLines = instance.argument.split("\n");
        var newElement = mode.d.createElementNS(NS.MathML, "annotation");
        newElement.setAttribute("cd", argumentLines[0]);
        newElement.setAttribute("name", argumentLines[1]);
        newElement.setAttribute("encoding", argumentLines[2]);
        mode.putElement(newElement, true);

        return true;
    },

    annotationxml_arbitrary(mode, instance) {
        var argumentLines = instance.argument.split("\n");
        var newElement = mode.d.createElementNS(NS.MathML, "annotation-xml");
        newElement.setAttribute("cd", argumentLines[0]);
        newElement.setAttribute("name", argumentLines[1]);
        newElement.setAttribute("encoding", argumentLines[2]);
        mode.putElement(newElement, true);

        return true;
    },

    notation_prototype(mode, instance) {
        var newElement = mode.d.createElementNS(NS.OMDoc, "prototype");
        mode.putElement(newElement, true);

        return true;
    },

    notation_rendering(mode, instance) {
        var newElement = mode.d.createElementNS(NS.OMDoc, "rendering");
        mode.putElement(newElement, true);

        return true;
    },

    notation_expr(mode, instance) {
        var newElement = mode.d.createElementNS(NS.OMDoc, "expr");
        newElement.setAttribute("name", instance.argument);
        mode.putElement(newElement, false);

        return true;
    },

    notation_exprlist(mode, instance) {
        var newElement = mode.d.createElementNS(NS.OMDoc, "exprlist");
        newElement.setAttribute("name", instance.argument);
        mode.putElement(newElement, true);

        return true;
    },

    lambda(mode, instance) {
        // Build our lambda construct
        var lambdaConstruct = mode.new_bind();
        var csymbol = mode.new_csymbol(null, "fns1", "lambda");
        lambdaConstruct.appendChild(csymbol);
        var bvar = mode.new_bvar();
        lambdaConstruct.appendChild(bvar);
        var apply = mode.new_apply();
        lambdaConstruct.appendChild(apply);

        // Insert the construct
        mode.cursor.inElement.insertBefore(lambdaConstruct, mode.cursor.beforeElement);

        // Put the usual cursor after the whole construct on the stack
        mode.cursorStack.push({
            beforeElement: mode.cursor.beforeElement,
            inElement: mode.cursor.inElement
        });

        // We put a cursor placed inside the apply on the stack, so the
        // user can work on there by hitting enter after having finished
        // with the content of the bvar.
        mode.cursorStack.push({
            beforeElement: null,
            inElement: apply
        });

        // The cursor is placed inside the bvar element
        mode.moveCursor({
            beforeElement: null,
            inElement: bvar
        });

        return true;
    },

    mathElement(mode,instance) {
        mode.putElement(mode.d.createElementNS(NS.MathML, "math"), true);
        return true;
    },

    omobjElement(mode,instance) {
        var element = mode.d.createElementNS(NS.OpenMath, "OMOBJ");
        element.setAttribute("version", "2.0");
        mode.putElement(element, true);
        return true;
    },

    forceNewElement(mode) {
        mode.forceNewElement = true;
        return true;
    },

    forceMathMLForNext(mode) {
        mode.forceLang(mode.langs.MathML);
        return true;
    },

    forceOpenMathForNext(mode) {
        mode.forceLang(mode.langs.OpenMath);
        return true;
    },

    forceAutoForNext(mode) {
        mode.forceLang(mode.langs.AUTO);
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

    cursorJump(mode,instance) {
        if (mode.cursorStack.length<1) { 
            // If the stack is empty, the user is done with inserting, so exit
            return exit(mode,instance);
        }
        mode.moveCursor(mode.cursorStack.pop());
        return true;
    },

    killPrevious(mode) {
        var toRemove = [];
        var precedingElement;
        if (mode.cursor.beforeElement) {
            precedingElement = DOM.mml_previousSibling(mode.cursor.beforeElement);
        }
        else {
            precedingElement = DOM.mml_lastChild(mode.cursor.inElement);
        }

        if (precedingElement) {
            if (mode.cursor.numberOfElementsToSurround > 0) {
                // If the user has surrounded any elements, he wants to
                // kill them all
                var pos = precedingElement;
                for (var i=1; i <= mode.cursor.numberOfElementsToSurround; i++) {
                    toRemove.push(pos);
                    pos = DOM.mml_previousSibling(pos); // Exists for shure
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
                beforeElement: DOM.mml_nextSibling(mode.cursor.inElement),
                inElement: DOM.mml_parent(mode.cursor.inElement),
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
