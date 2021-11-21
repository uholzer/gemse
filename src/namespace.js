const NS = {
    /** 
     * The namespace used by Gemse for internal purposes 
     * @constant
     */
    internal: "http://www.andonyar.com/rec/2008-12/gemse/internalns",
    /** 
     * The namespace of MathML 
     * @constant
     */
    MathML: "http://www.w3.org/1998/Math/MathML",
    /** 
     * The namespace of OpenMath 
     * @constant
     */
    OpenMath: "http://www.openmath.org/OpenMath",
    /**
     * Namespace of XML
     * @constant
     */
    XML: "http://www.w3.org/XML/1998/namespace",
    /**
     * Namespace of XUL
     * @constant
     */
    XUL: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
    /** 
     * The namespace of HTML 
     * @constant
     */
    HTML: "http://www.w3.org/1999/xhtml",
    /**
     * The namespace of OMDoc
     * @constant
     */
    OMDoc: "http://omdoc.org/ns",
};
/**
 * The default namespace resolver. It is used in various places in the
 * code of Gemse. Thus, already present prefixes should not be
 * removed.
 */
function standardNSResolver(prefix) {
    // The code of Gemse relies on this resolver, so don't remove
    // already defined prefixes!
    if (prefix == "internal") { return NS.internal }
    else if (prefix == "m") { return NS.MathML }
    else if (prefix == "math") { return NS.MathML }
    else if (prefix == "mathml") { return NS.MathML }
    else if (prefix == "om") { return NS.OpenMath }
    else if (prefix == "openmath") { return NS.OpenMath }
    else if (prefix == "xml") { return NS.XML }
    else if (prefix == "o") { return NS.OMDoc }
    else if (prefix == "omdoc") { return NS.OMDoc }
    else { return null }
};
