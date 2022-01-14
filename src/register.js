import { NS } from "./namespace.js";

/**
 * @class Manages the registers (sort of internal clipboards) for the
 * GemseEditor. 
 * The register * denotes the system clip board. So reading this
 * register actually reads the system clipboard, setting it writes to
 * the system clipboard.
 */
export function RegisterManager() {
    /**
     * Holds the data of internal regisers, that is, all registers
     * except *.
     */
    this.internal = {};
}
RegisterManager.prototype = {
    set: function(name, data) {
        if (name == "*") {
            return this.setSystemClipboard(data);
        }
        else {
            this.internal[name] = data;
            return Promise.resolve();
        }
    },
    get: function(name) {
        if (name == "*") {
            return this.getSystemClipboard();
        }
        else {
            return Promise.resolve(this.internal[name]);
        }
    },
    /**
     * Get data from system clipboard and create a RegisterData object
     * for it.
     * This is implemented according to
     * https://developer.mozilla.org/En/Using_the_Clipboard
     * @private
     */
    getSystemClipboard: function() {
        return navigator.clipboard.readText().then(function (clipboardText) {
            const clipboardDOM = (new DOMParser()).parseFromString(clipboardText, "application/xml");
            if (clipboardDOM.documentElement.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml") {
                throw new Error("An error occured while parsing the clipboard content:\n"
                            + clipboardDOM.documentElement.textContent);
            }
            else if (clipboardDOM.documentElement.localName == "math" && clipboardDOM.documentElement.namespaceURI == NS.MathML) {
                return new RegisterData('*', Array.from(clipboardDOM.documentElement.childNodes));
            }
            else {
                return new RegisterData('*',[clipboardDOM.documentElement]);
            }
        });
    },
    /**
     * Put data on system clipboard from a RegisterData object.
     * This is implemented according to
     * https://developer.mozilla.org/En/Using_the_Clipboard
     * @private
     */
    setSystemClipboard: function(data) {
        if (data.type != "element") { throw new Error("clipboard interaction only supports elements") }

        // Serialize data.content[0]
        var doc = document.implementation.createDocument(null, null, null);
        var rootNode;
        if (data.content.length != 1 || data.content[0].localName != "math" || data.content[0].namespaceURI != NS.MathML) {
            rootNode = doc.createElementNS(NS.MathML, "math");
            data.content.forEach(function(e) {
                rootNode.appendChild(doc.importNode(e, true));
            });
        }
        else {
            rootNode = doc.importNode(data.content[0], true);
        }
        doc.appendChild(rootNode);
        //XXX: mode.equationEnv.cleanSubtreeOfDocument(doc, rootNode);
        var serializer = new XMLSerializer();
        var xmlString = serializer.serializeToString(doc);

        return navigator.clipboard.writeText(xmlString);
    },
}

/**
 * @class Stores data (sequence of DOM nodes). It is used when
 * interacting with the RegisterManager, that is, to fill a
 * register or to read a register.
 * @param name the name the user has to use to access this Register,
 * consisting of one unicode character
 * @param content an array of DOM Nodes of the same type
 * @param [type] overrides the automatically detected type of the content
 */
export function RegisterData(name, content, type) {
    /** 
     * Name of the register consisting of one unicode character 
     * @type String
     */
    this.name = name; // Should be one unicode character
    /**
     * The data the register is holding. This is an array of DOM nodes
     * of the same type. (Text nodes, elements nodes or attribute
     * nodes)
     */
    this.content = content;

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
