/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */

/* Command line handler for Gemse */

// the chrome URI of Gemse
const GEMSEEDITOR_URI = "chrome://gemse/content/editor.xul";

/**
 * Calls Gemse. If there is already a window of Gemse, the
 * corresponding instance of Gemse will be called. If not, Gemse will
 * be started.
 * @param callback A function which takes an instance of GemsePEditor
 *                 as only argument and which contains the
 *                 instructions to be run.
 */
function callGemse(callback)
{
    var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].
             getService(Components.interfaces.nsIWindowWatcher);

    // Locate the Gemse window
    var gemseWindow = ww.getWindowByName("globalGemseInstance",null);
    if (gemseWindow && gemseWindow.location != "chrome://gemse/content/editor.xul") { gemseWindow = null }

    if (gemseWindow) {
        callback(gemseWindow.editor);
    }
    else {
        // Use the wrappedJSObject trick as described in
        // https://developer.mozilla.org/en/Working_with_windows_in_chrome_code
        // in order to be able to pass arbitrary JavaScript objects.
        var arg = { onready: callback };
        arg.wrappedJSObject = arg;
        ww.openWindow(null, GEMSEEDITOR_URI, "_blank",
                      "chrome,menubar,toolbar,status,resizable,dialog=no",
                      arg);
    }

}

/* 
 * See 
 * https://developer.mozilla.org/en/XPCOMUtils.jsm
 * https://developer.mozilla.org/en/XPCOM/XPCOM_changes_in_Gecko_2.0
 */

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function GemseCommandLineHandler() {  
    // initialize the component here  
}  
GemseCommandLineHandler.prototype = {  
    // properties required for XPCOM registration:  
    classDescription: "Gemse command line handler",  
    classID:          Components.ID("{4b3a7bd9-7796-4445-a9d5-edf85da6f9ff}"),  
    contractID:       "@mozilla.org/commandlinehandler/general-startup;1?type=gemse",  

    // [optional] an array of categories to register this component in.  
    // category names are sorted alphabetically. Typical command-line handlers use a
    // category that begins with the letter "m".
    _xpcom_categories: [{  
        category: "command-line-handler",
        entry: "m-gemse",  
        value: "@mozilla.org/commandlinehandler/general-startup;1?type=gemse"
    }],  

    // QueryInterface implementation, e.g. using the generateQI helper  
    QueryInterface: XPCOMUtils.generateQI(  
        [Components.interfaces.nsICommandLineHandler,  
         Components.interfaces.nsISupports]
    ),  

    // ...component implementation...  
    /* nsICommandLineHandler */
    handle : function clh_handle(cmdLine) {
        var uristr = cmdLine.handleFlagWithParam("gemse-load", false);
        if (uristr) {
            uristr = cmdLine.resolveURI(uristr).spec;
        }
        var command = cmdLine.handleFlagWithParam("gemse-do", false);

        if (uristr || command) {
           callGemse(function(editor) {
                if (uristr) {
                    editor.loadURI(uristr);
                }
                if (command) {
                    editor.inputBuffer += command;
                }
            });
            cmdLine.preventDefault = true;
        }
        else if (cmdLine.handleFlag("gemse", false)) {
            callGemse(null);
            cmdLine.preventDefault = true;
        }
    },

    // the help info
    // follows the guidelines in nsICommandLineHandler.idl,
    // specifically, flag descriptions should start at
    // character 24, and lines should be wrapped at
    // 72 characters with embedded newlines,
    // and finally, the string should end with a newline
    helpInfo: "  -gemse               Open Gemse with a new equation\n" +
              "  -gemse-load <uri>    Load URI in gemse (equals :loadall <uri>)\n" +
              "  -gemse-do   <String> Run command in Gemse\n",
};

/*
 * XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
 * XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 (Firefox 3.6).
 */
if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([GemseCommandLineHandler]);
else if (XPCOMUtils.generateNSGetFactory)
    var NSGetModule = XPCOMUtils.generateNSGetModule([GemseCommandLineHandler]);
else
    var NSGetModule = function(compMgr, fileSpec) {
        return XPCOMUtils.generateModule([GemseCommandLineHandler]);
    };


