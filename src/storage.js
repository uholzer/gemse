/**
 * @class Links an equation to the document it is saved in.
 */
export function StorageLink(storage, node) {
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
     * @returns {Promise} A Promise going to be resolved when loading has
     *                    completed.
     */
    read: function() {
        throw new Error("Reading this resource is not implemented");
    },
    /**
     * Write the resource
     * @param root Root element of the equation
     * @returns {Promise} A Promise going to be resolved on completion.
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
 * @class Storage for local files, using HTML input elements. This is a
 * temporary solution until the file system API gets implemented in Firefox.
 * See https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 * @param file an input HTML element
 */
export function FileDocStorage(fileInputElement) {
    this.document = document.implementation.createDocument(null,null,null);
    this.fileInputElement = fileInputElement;
}
FileDocStorage.prototype = {
    write: function() {
        var serializer = new XMLSerializer();
        var serialized = serializer.serializeToString(this.document);
        var blob = new Blob([serialized], {type: "application/octet-stream"});
        var url = URL.createObjectURL(blob);
        window.setTimeout(function () { URL.revokeObjectURL(url) }, 600000);
        window.location = url;
    },
    read: function() {
        this.fileInputElement.click();

        return (new Promise(resolve => {
            // TODO: This promise does never get resolved if the user cancels
            // the dialog.
            this.fileInputElement.addEventListener(
                "change",
                () => { resolve(this.fileInputElement.files[0]); },
                {once: true}
            );
        })).then(
            file => file.text()
        ).then(
            (s) => {
                this.document = new DOMParser().parseFromString(s, "application/xml");
            }
        );
    },
    adoptDocument: function(doc) {
        this.document = doc;
    },
    toString: function() {
        return "File (path unknown)";
    },
    __proto__: DocStoragePrototype
};

/**
 * @class loads files via Fetch API and writes them via a HTTP
 * PUT.
 * @param uri URI of the document to be loaded as string. 
 */
export function XMLHttpRequestDocStorage(uri) {
    this.document = document.implementation.createDocument(null,null,null);
    this.uri = uri;
    this.contentTypeHeader = "application/mathml+xml";
}
XMLHttpRequestDocStorage.prototype = {
    read: function() {
        return window.fetch(this.uri).then(
            response => response.ok
                ? Promise.resolve(response)
                : Promise.reject(new Error(`Got ${response.status} response for GET ${this.uri}`))
        ).then(
            response => Promise.all([response, response.text()])
        ).then(
            ([response, responseText]) => {
                const parser = new DOMParser();
                const contentType = response.headers.get("Content-type");
                this.document = parser.parseFromString(responseText, contentType);
                this.contentTypeHeader = contentType;
            }
        );
    },
    write: function() {
        var serializer = new XMLSerializer();
        var xmlString = serializer.serializeToString(this.document);
        return window.fetch(this.uri, {
            method: "PUT",
            headers: {"Content-type": this.contentTypeHeader},
            body: xmlString
        })
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
 * @class loads files via a Fetch API, but cannot save it.
 * @param uri URI of the document to be loaded as string. All schemes supported
 *            by XMLHttpRequest can be used.
 */
export function ReadOnlyXMLHttpRequestDocStorage(uri) {
    this.document = document.implementation.createDocument(null,null,null);
    this.uri = uri;
}
ReadOnlyXMLHttpRequestDocStorage.prototype = {
    read: function() {
        return window.fetch(this.uri).then(
            response => response.ok
                ? Promise.resolve(response)
                : Promise.reject(new Error(`Got ${response.status} response for GET ${this.uri}`))
        ).then(
            response => Promise.all([response, response.text()])
        ).then(
            ([response, responseText]) => {
                const parser = new DOMParser();
                const contentType = response.headers.get("Content-type");
                this.document = parser.parseFromString(responseText, contentType);
            }
        );
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
export function InMemoryDocStorage(document) {
    this.document = document;
    this.idObject = document;
}
InMemoryDocStorage.prototype = {
    read: function() {
        // Is always in sync, so do nothing
        return Promise.resolve();
    },
    write: function() {
        // Is always in sync, so do nothing
        return Promise.resolve();
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
