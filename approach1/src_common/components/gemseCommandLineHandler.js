/* Command line handler for Gemse */

const nsIAppShellService    = Components.interfaces.nsIAppShellService;
const nsISupports           = Components.interfaces.nsISupports;
const nsICategoryManager    = Components.interfaces.nsICategoryManager;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsICommandLine        = Components.interfaces.nsICommandLine;
const nsICommandLineHandler = Components.interfaces.nsICommandLineHandler;
const nsIFactory            = Components.interfaces.nsIFactory;
const nsIModule             = Components.interfaces.nsIModule;
const nsIWindowWatcher      = Components.interfaces.nsIWindowWatcher;

// the chrome URI of Gemse
const GEMSEEDITOR_URI = "chrome://gemse/content/editor.xul";

// id, CID, and category to be unique to Gemse
const clh_contractID = "@mozilla.org/commandlinehandler/general-startup;1?type=gemse";

// unique ID generated with uuidgen
const clh_CID = Components.ID("{4b3a7bd9-7796-4445-a9d5-edf85da6f9ff}");

// category names are sorted alphabetically. Typical command-line handlers use a
// category that begins with the letter "m".
const clh_category = "m-gemse";

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
 * The XPCOM component that implements nsICommandLineHandler.
 * It also implements nsIFactory to serve as its own singleton factory.
 */
const gemseCommandLineHandler = {
    /* nsISupports */
    QueryInterface: function clh_QI(iid) {
        if (iid.equals(nsICommandLineHandler) ||
            iid.equals(nsIFactory) ||
            iid.equals(nsISupports))
          return this;
        throw Components.results.NS_ERROR_NO_INTERFACE;
    },

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
              "  -gemseload <uri>     Load URI in gemse (equals :loadall <uri>)\n" +
              "  -gemsedo   <String>  Run command in Gemse\n",

    /* nsIFactory */

    createInstance: function clh_CI(outer, iid) {
        if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;

        return this.QueryInterface(iid);
    },

    lockFactory: function clh_lock(lock) {
        /* no-op */
    }
};

/**
 * The XPCOM glue that implements nsIModule
 */
const gemseCommandLineHandlerModule = {
    /* nsISupports */
    QueryInterface: function mod_QI(iid) {
        if (iid.equals(nsIModule) ||
            iid.equals(nsISupports))
          return this;

        throw Components.results.NS_ERROR_NO_INTERFACE;
    },

    /* nsIModule */
    getClassObject: function mod_gch(compMgr, cid, iid) {
        if (cid.equals(clh_CID)) return gemseCommandLineHandler.QueryInterface(iid);

        throw Components.results.NS_ERROR_NOT_REGISTERED;
    },

    registerSelf: function mod_regself(compMgr, fileSpec, location, type) {
        compMgr.QueryInterface(nsIComponentRegistrar);

        compMgr.registerFactoryLocation(clh_CID,
                                        "gemseCommandLineHandler",
                                        clh_contractID,
                                        fileSpec,
                                        location,
                                        type);

        var catMan = Components.classes["@mozilla.org/categorymanager;1"].
                     getService(nsICategoryManager);
        catMan.addCategoryEntry("command-line-handler",
                                clh_category,
                                clh_contractID, true, true);
    },

    unregisterSelf: function mod_unreg(compMgr, location, type) {
        compMgr.QueryInterface(nsIComponentRegistrar);
        compMgr.unregisterFactoryLocation(clh_CID, location);

        var catMan = Components.classes["@mozilla.org/categorymanager;1"].
          getService(nsICategoryManager);
        catMan.deleteCategoryEntry("command-line-handler", clh_category);
    },

    canUnload: function (compMgr) {
        return true;
    }
};

/* The NSGetModule function is the magic entry point that XPCOM uses to find what XPCOM objects
 * this component provides
 */
function NSGetModule(comMgr, fileSpec) {
    return gemseCommandLineHandlerModule;
}

