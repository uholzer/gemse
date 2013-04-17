
/**
 * @class Links an equation to the document it is saved in.
 */
function StorageLink(storage, node) {
    this.storage = storage;
    this.node = node;
}
StorageLink.prototype = {
};

/*
 * Manages loading and saving of a DOM document
 */
var DocStoragePrototype = {
    /**
     * Read the resource
     * @returns root element of the equation
     */
    read: function() {
        throw new Error("Reading this resource is not implemented");
    },
    /**
     * Write the resource
     * @param root Root element of the equation
     */
    write: function() {
        throw new Error("Writing this resource is not implemented");
    },
    /**
     * Do so as if the provided document has been loaded with read.
     * @param doc The (already loaded) document
     */
    adoptDocument: function(doc) {
        throw new Error("Adopting a document is not implemented for ths resource");
    },
    /**
     * Checks whether the equation has changed since it has been
     * written or read the last time.
     * @returns 1 if it has changed; 0 if it is still the same; -1 if it is
     * not possible to tell
     */
    hasChanged: function() {
        return -1;
    },
    /**
     * Checks whether the user has write access to the resource
     * @returns 1 if it is read only; 0 if it can be written; -1 if it is
     * not possible to tell
     */
    readOnly: function() {
        return -1;
    },
    /**
     * Checks whether the resource already exists
     * @returns 1 if it exists; 0 if it does not exists; -1 if it is
     * not possible to tell
     */
    exists: function() {
        return -1;
    },
    /**
     * Checks whether the give document storage represents the same
     * resource as this one.
     * @param other The other document storage to be compared with
     *              this one
     */
    equals: function(other) {
        // Every storage must set either uri or idObject. If one sets
        // uri and the other idObject, they are considered to be
        // distinct.
        if (this.uri && other.uri) {
            return (this.uri == other.uri);
        }
        else if (this.idObject && other.idObject) {
            return(this.idObject === other.idObject);
        }
        else {
            return false;
        }
    }
};

/**
 * @class Storage for local files
 * @param file an nsIFile
 */
function FileDocStorage(file) {
    this.document = document.implementation.createDocument(null,null,null);
    this.file = file;
    var ios = Components.classes["@mozilla.org/network/io-service;1"].  
                        getService(Components.interfaces.nsIIOService);  
    this.uri = ios.newFileURI(file).spec;  
    this.lastModifiedTimeOfLastSync = null;
}
FileDocStorage.prototype = {
    write: function() {
        var serializer = new XMLSerializer();
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                                 .createInstance(Components.interfaces.nsIFileOutputStream);
        foStream.init(this.file, 0x02 | 0x08 | 0x20, 0664, 0);
        serializer.serializeToStream(this.document, foStream, "");
        this.lastModifiedTimeOfLastSync = this.file.lastModifiedTime;
    },
    read: function() {
        //XXX: Maybe we should not use XMLHttpRequest here?
        var request = new XMLHttpRequest();
        request.open("GET", this.uri, false);
        request.send(null);
        this.document = request.responseXML;
        this.lastModifiedTimeOfLastSync = this.file.lastModifiedTime;
    },
    adoptDocument: function(doc) {
        this.document = doc;
        // Silently assume that doc is the content of the file at the
        // time this.file.lastModifiedTime
        this.lastModifiedTimeOfLastSync = this.file.lastModifiedTime;
    },
    exists: function() {
        return this.file.exists();
    },
    readOnly: function() {
        return (!this.file.isWritable());
    },
    hasChanged: function() {
        return (this.file.lastModifiedTime > this.lastModifiedTimeOfLastSync);
    },
    toString: function() {
        return "File " + this.file.path;
    },
    __proto__: DocStoragePrototype
};

/**
 * @class loads files via a XMLHttpRequest and writes them via a HTTP
 * PUT.
 * @param uri URI of the document to be loaded as string. 
 */
function XMLHttpRequestDocStorage(uri) {
    this.document = document.implementation.createDocument(null,null,null);
    this.uri = uri;
    this.contentTypeHeader = "application/mathml+xml";
}
XMLHttpRequestDocStorage.prototype = {
    read: function() {
        var request = new XMLHttpRequest();
        request.open("GET", this.uri, false);
        request.send(null);
        this.document = request.responseXML;
        this.contentTypeHeader = request.getResponseHeader("Content-type");
    },
    write: function() {
        var serializer = new XMLSerializer();
        var xmlString = serializer.serializeToString(this.document);
        //var xmlString = XML(serializer.serializeToString(mode.equationEnv.equation)).toXMLString();
        var request = new XMLHttpRequest();
        request.open("PUT", this.uri, false);
        request.setRequestHeader("Content-type", this.contentTypeHeader);
        request.send(xmlString);
    },
    adoptDocument: function(doc) {
        this.document = doc;
        this.contentTypeHeader = doc.contentType;
    },
    toString: function() {
        return this.uri;
    },
    __proto__: DocStoragePrototype
};

/**
 * @class loads files via a XMLHttpRequest, but con not save it.
 * @param uri URI of the document to be loaded as string. All schemes supported
 *            by XMLHttpRequest can be used.
 */
function ReadOnlyXMLHttpRequestDocStorage(uri) {
    this.document = document.implementation.createDocument(null,null,null);
    this.uri = uri;
}
ReadOnlyXMLHttpRequestDocStorage.prototype = {
    read: function() {
        var request = new XMLHttpRequest();
        request.open("GET", this.uri, false);
        request.send(null);
        this.document = request.responseXML;
    },
    readOlny: function() {
        return 1;
    },
    toString: function() {
        return this.uri +" (not writeable)";
    },
    adoptDocument: function(doc) {
        this.document = doc;
    },
    __proto__: DocStoragePrototype
};

/**
 * @class Represents a document that is loaded into memory as a DOM
 * document. read and write do nothing at all, i.e. the document is
 * never saved to disk or put to some URI.
 */
function InMemoryDocStorage(document) {
    this.document = document;
    this.idObject = document;
}
InMemoryDocStorage.prototype = {
    read: function() {
        // Is always in sync, so do nothing
    },
    write: function() {
        // Is always in sync, so do nothing
    },
    adoptDocument: function(doc) {
        throw new Error("InMemoryDocStorage does not support adoption of documents");
    },
    toString: function() {
        return "In-memory storage bound to a " + this.document.toString()
               + "(whose URI is or was " + this.document.URL + ")";
    },
    __proto__: DocStoragePrototype
};

