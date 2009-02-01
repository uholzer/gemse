const NS_internal = "http://www.andonyar.com/rec/2008-12/gemse/internalns";
const NS_MathML = "http://www.w3.org/1998/Math/MathML";
//const KEYMOD_ALT = String.fromCharCode(KeyEvent.DOM_VK_ALT);
//const KEYMOD_CONTROL = String.fromCharCode(KeyEvent.DOM_VK_CONTROL);
//XXX: Knows the heck why KeyEvent.DOM_VK_* are undefined here ...
const KEYMOD_ALT = String.fromCharCode(18);
const KEYMOD_CONTROL = String.fromCharCode(17);
const KEYMOD_META = KeyEvent.VK_META;

function standardNSResolver(prefix) {
    if (prefix == "internal") { return NS_internal }
    else if (prefix == "m") { return NS_MathML }
    else if (prefix == "math") { return NS_MathML }
    else if (prefix == "mathml") { return NS_MathML }
    else { return null }
}

