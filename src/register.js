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
            this.setSystemClipboard(data);
        }
        else {
            this.internal[name] = data;
        }
    },
    get: function(name) {
        if (name == "*") {
            return this.getSystemClipboard();
        }
        else {
            return this.internal[name];
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
        var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
        if (!clip) throw new Error("Error while obtaining clipboard component");
        var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
        if (!trans) throw new Error("Error while obtaining transferable component");
        trans.addDataFlavor("text/unicode"); //XXX: Should be application/mathml+xml

        clip.getData(trans, clip.kGlobalClipboard);
        var str       = new Object();
        var strLength = new Object();
        trans.getTransferData("text/unicode", str, strLength);
        str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
        var dataString = str.data.substring(0, strLength.value / 2);

        var parser = new DOMParser();
        var clipboardDOM = parser.parseFromString(dataString, "text/xml");

        var registerData;
        if (clipboardDOM.documentElement.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml") {
            throw new Error("An error occured while parsing the clipboard content:\n"
                        + clipboardDOM.documentElement.textContent);
        }
        else if (clipboardDOM.documentElement.localName == "math" && clipboardDOM.documentElement.namespaceURI == NS.MathML) {
            // Put the child elements into an array
            var arrayOfElements = [];
            for (var i=0; i < clipboardDOM.documentElement.childNodes.length; ++i) {
                arrayOfElements.push(clipboardDOM.documentElement.childNodes[i]);
            }
            registerData = new RegisterData('*',arrayOfElements);
        }
        else {
            registerData = new RegisterData('*',[clipboardDOM.documentElement]);
        }

        return registerData;
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

        var str = Components.classes["@mozilla.org/supports-string;1"].  
        createInstance(Components.interfaces.nsISupportsString);  
        if (!str) throw new Error("Error while obtaining String component");
          
        str.data = xmlString;  
          
        var trans = Components.classes["@mozilla.org/widget/transferable;1"].  
        createInstance(Components.interfaces.nsITransferable);  
        if (!trans) throw new Error("Error while obtaining transferable component");
          
        trans.addDataFlavor("application/mathml+xml");  
        trans.setTransferData("application/mathml+xml", str, xmlString.length * 2);  
        trans.addDataFlavor("text/unicode");  
        trans.setTransferData("text/unicode", str, xmlString.length * 2);  
          
        var clipid = Components.interfaces.nsIClipboard;  
        var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);  
        if (!clip) throw new Error("Error while obtaining clipboard component");
          
        clip.setData(trans, null, clipid.kGlobalClipboard);  
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
