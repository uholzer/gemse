/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */

/**
 * @fileOverview Global Options. In this file, the global Options are
 * defined. These are the options that do not begin with a Class
 * name. They can be used in all parts of Gemse.
 */

/**
 * @const Global Options. This object defines the options that can be
 * used globally
 */
gemseGlobalOptions = {
    "pragmaticContent": {
        defaultValue: "no",
        validator: OptionsAssistant.validators.truthVal,
        parser: OptionsAssistant.parsers.truthVal,
        setter: function(o,value) {
            o.pragmaticContent = this.parser(value);
        },
        remover: function(o) { delete o.pragmaticContent }
    },
    "selectableInsertModes": {
        defaultValue: "trivial,ucd,content",
        validator: function(value,editor) {
            var list = value.split(",");
            for (var i=0; i<list.length; ++i) {
                if (!(list[i]=="trivial" || list[i]=="ucd" || list[i]=="content")) {
                    return false;
                }
            }
            return true;
        },
        parser: function(value,editor) {
            return value.split(",");
        },
        setter: function(o,value,editor) {
            o.selectableInsertModes = this.parser(value,editor);
        },
        remover: function(o) { delete o.selectableInsertModes }
    },
    "currentInsertMode": {
        defaultValue: "ucd",
        validator: function(value,editor) {
            return (value == "trivial" || value == "ucd" || value == "content");
        },
        parser: function(value,editor) {
            // Returns a class
            if (value == "trivial") {
                return TrivialInsertMode;
            }
            else if (value == "ucd") {
                return UCDInsertMode;
            }
            else if (value == "content") {
                return ContentInsertMode;
            }
            else {
                return null
            }
        },
        setter: function(o,value,editor) {
            o.insertMode = this.parser(value,editor);
        },
        remover: function(o) { delete o.insertMode }
    },
    "detailedErrors": {
        defaultValue: "on",
        validator: OptionsAssistant.validators.truthVal,
        parser: OptionsAssistant.parsers.truthVal,
        setter: function(o,value) {
            o.detailedErrors = this.parser(value);
        },
        remover: function(o) { delete o.detailedErrors }
    },
    "loadAnyAsRoot": {
        defaultValue: "no",
        validator: OptionsAssistant.validators.truthVal,
        parser: OptionsAssistant.parsers.truthVal,
        setter: function(o,value) {
            o.loadAnyAsRoot = this.parser(value);
        },
        remover: function(o) { delete o.loadAnyAsRoot }
    }
}

