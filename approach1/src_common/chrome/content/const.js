/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */


/** 
 * The namespace used by Gemse for internal purposes 
 * @constant
 */
const NS_internal = "http://www.andonyar.com/rec/2008-12/gemse/internalns";
/** 
 * The namespace of MathML 
 * @constant
 */
const NS_MathML = "http://www.w3.org/1998/Math/MathML";
/** 
 * The namespace of OpenMath 
 * @constant
 */
const NS_OpenMath = "http://www.openmath.org/OpenMath";
/**
 * Namespace of XML
 * @constant
 */
const NS_XML = "http://www.w3.org/XML/1998/namespace";
/**
 * Namespace of XUL
 * @constant
 */
const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
/** 
 * The namespace of HTML 
 * @constant
 */
const NS_HTML = "http://www.w3.org/1999/xhtml";
/**
 * The namespace of OMDoc
 * @constant
 */
const NS_OMDoc = "http://omdoc.org/ns";
//const KEYMOD_ALT = String.fromCharCode(KeyEvent.DOM_VK_ALT);
//const KEYMOD_CONTROL = String.fromCharCode(KeyEvent.DOM_VK_CONTROL);
//XXX: Knows the heck why KeyEvent.DOM_VK_* are undefined here ...
/** 
 * The character Gemse uses to represent the ALT key. When the user
 * presses a key while holding ALT, this character followed by the
 * character of the key are added to the input buffer.
 * @constant
 */
const KEYMOD_ALT = String.fromCharCode(18);
/** 
 * The character Gemse uses to represent the CONTROL key. When the user
 * presses a key while holding CONTROL, this character followed by the
 * character of the key are added to the input buffer.
 * @constant
 */
const KEYMOD_CONTROL = String.fromCharCode(17);
/** 
 * The character Gemse uses to represent the META key. When the user
 * presses a key while holding META, this character followed by the
 * character of the key are added to the input buffer.
 * @constant
 */
const KEYMOD_META = KeyEvent.VK_META;

/**
 * The default namespace resolver. It is used in various places in the
 * code of Gemse. Thus, already present prefixes should not be
 * removed.
 */
function standardNSResolver(prefix) {
    // The code of Gemse relies on this resolver, so don't remove
    // already defined prefixes!
    if (prefix == "internal") { return NS_internal }
    else if (prefix == "m") { return NS_MathML }
    else if (prefix == "math") { return NS_MathML }
    else if (prefix == "mathml") { return NS_MathML }
    else if (prefix == "om") { return NS_OpenMath }
    else if (prefix == "openmath") { return NS_OpenMath }
    else if (prefix == "xml") { return NS_XML }
    else if (prefix == "o") { return NS_OMDoc }
    else if (prefix == "omdoc") { return NS_OMDoc }
    else { return null }
}

