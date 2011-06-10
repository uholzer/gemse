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
        }
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
        }
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
        }
    },
    "detailedErrors": {
        defaultValue: "on",
        validator: OptionsAssistant.validators.truthVal,
        parser: OptionsAssistant.parsers.truthVal,
        setter: function(o,value) {
            o.detailedErrors = this.parser(value);
        }
    },
    "loadAnyAsRoot": {
        defaultValue: "no",
        validator: OptionsAssistant.validators.truthVal,
        parser: OptionsAssistant.parsers.truthVal,
        setter: function(o,value) {
            o.loadAnyAsRoot = this.parser(value);
        }
    },
    "viewset": {
        defaultValue: "auto",
        validator: function(value) { return true },
        parser: function(value) { return value },
        setter: function(o,value) {
            o.viewsetName = this.parser(value);
        }
    },
    "defaultViewset": {
        defaultValue: "xpath1(self::om:OMOBJ) content, presentation",
        validator: function(value) { return true },
        parser: function(value) { 
            var rules = value.split(/,\s*/);
            var ruleRegexXPath = /^(xpath1\((.*)\)\s+)?(\w+)$/;
            return rules.map(function (r) { 
                var testFunction;
                var match = ruleRegexXPath.exec(r);
                if (match && match[1]) {
                    testFunction = this.testFunctionFactoryXPath(match[2]);
                }
                else if (match) {
                    testFunction = this.testFunctionFactoryFinal();
                }
                else {
                    // Wrong value. XXX: validator should catch this!
                    return null;
                }
                return [testFunction,match[3]];
            },
            this);
        },
        testFunctionFactoryXPath: function(xpathexpr) {
            return function(equationEnv) {
                //var res = equationEnv.document.evaluate(xpathexpr, equationEnv.equation, standardNSResolver, XPathResult.BOOLEAN_TYPE, null);
                //return res.booleanValue;
                var res = equationEnv.document.evaluate(xpathexpr, equationEnv.equation, standardNSResolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null);
                if (window.editor) {
                window.editor.showMessage("Test function got XPath result " + res.singleNodeValue);
                }
                return res.singleNodeValue ? true : false;
            }
        },
        testFunctionFactoryFinal: function() { return function() { return true } },
        setter: function(o,value) {
            o.defaultViewsetRules = this.parser(value);
            if (window.editor) {
            window.editor.showMessage(o.defaultViewsetRules.toSource());
            }
        }
    },
}

