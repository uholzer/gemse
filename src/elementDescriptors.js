/* Descriptions of Presentation MathML elements */

// This data is from http://www.w3.org/TR/2009/WD-MathML3-20090604/
// It has been extracted by hand, so mistakes are likely

var elementDescriptions = {

mi: {
    name: "mi",
    namespace: NS.MathML,
    type: "token",
    attributes: {
        mathvariant: {
            name: "mathvariant",
        }
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mi",
},

mn: {
    name: "mn",
    namespace: NS.MathML,
    type: "token",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mn",
},

mo: {
    name: "mo",
    namespace: NS.MathML,
    type: "token",
    attributes: {
        // The default attribute values of a given mo element are
        // determined by the operator dictionary. They highly depend
        // on the content of the mo element. If the operator
        // dictionary does not contain an entry for some attributes,
        // or if it doesn't even contain an entry for the element,
        // these default values apply.
        form: {
            name: "form",
            defaultValue: "infix",
            // DefaultValue depends on position in mrow! So, don't use
            // this!
        },
        fence: {
            name: "fence",
            fromDictionary: true,
            defaultValue: "false",
        },
        separator: {
            name: "separator",
            fromDictionary: true,
            defaultValue: "false",
        },
        lspace: {
            name: "lspace",
            fromDictionary: true,
            defaultValue: "thickmathspace",
        },
        rspace: {
            name: "rspace",
            fromDictionary: true,
            defaultValue: "thickmathspace",
        },
        stretchy: {
            name: "stretchy",
            fromDictionary: true,
            defaultValue: "false",
        },
        symmetric: {
            name: "symmetric",
            fromDictionary: true,
            defaultValue: "true",
        },
        maxsize: {
            name: "maxsize",
            fromDictionary: true,
            defaultValue: "infinity",
        },
        minsize: {
            name: "minsize",
            fromDictionary: true,
            defaultValue: "1em",
        },
        largeop: {
            name: "largeop",
            fromDictionary: true,
            defaultValue: "false",
        },
        movablelimits: {
            name: "movablelimits",
            fromDictionary: true,
            defaultValue: "false",
        },
        accent: {
            name: "accent",
            fromDictionary: true,
            defaultValue: "false",
        },
        linebreak: {
            name: "linebreak",
            defaultValue: "auto",
        },
        lineleading: {
            name: "lineleading",
            inherited: true,
            defaultValue: "100%",
        },
        linebreakstyle : {
            name: "linebreakstyle",
            fromDictionary: true,
            defaultValue: "after",
        },
        linebreakmultchar: {
            name: "linebreakmultchar",
            inherited: true,
            defaultValue: "⁢", //invisible times
        },
        indentstyle: {
            name: "indentstyle",
            inherited: true,
            defaultValue: "auto",
        },
        indentoffset: {
            name: "indentoffset",
            inherited: true,
            defaultValue: "0",
        },
        indenttarget: {
            name: "indenttarget",
            inherited: true,
            defaultValue: "",
        },
        indentstylefirst: {
            name: "indentstylefirst",
            inherited: true,
            defaultValue: "indentstyle",
        },
        indentoffsetfirst: {
            name: "indentoffsetfirst",
            inherited: true,
            defaultValue: "indentoffset",
        },
        indentstylelast: {
            name: "indentstylelast",
            inherited: true,
            defaultValue: "indentstyle",
        },
        indentoffsetlast: {
            name: "indentoffsetlast",
            inherited: true,
            defaultValue: "indentoffset",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mo",
},

mtext: {
    name: "mtext",
    namespace: NS.MathML,
    type: "token",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mtext",
},

mspace: {
    name: "mspace",
    namespace: NS.MathML,
    type: "token",
    attributes: {
        width: {
            name: "width",
            defaultValue: "0em",
        },
        height: {
            name: "height",
            defaultValue: "0ex",
        },
        depth: {
            name: "depth",
            defaultValue: "0ex",
        },
        linebreak: {
            name: "linebreak",
            defaultValue: "auto",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mspace",
},

ms: {
    name: "ms",
    namespace: NS.MathML,
    type: "token",
    attributes: {
        lquote: {
            name: "lquote",
            defaultValue: '"',
        },
        rquote: {
            name: "rquote",
            defaultValue: '"',
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.ms",
},

mglyph: {
    name: "mglyph",
    namespace: NS.MathML,
    type: "token",
    attributes: {
        src: {
            name: "src",
        },
        width: {
            name: "width",
        },
        height: {
            name: "height",
        },
        valign: {
            name: "valign",
            defaultValue: "0em",
        },
        alt: {
            name: "alt",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mglyph",
},

mrow: {
    name: "mrow",
    namespace: NS.MathML,
    type: "mrow",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mrow",
},

mfrac: {
    name: "mfrac",
    namespace: NS.MathML,
    type: "fixedChildren",
    childCount: 2,
    attributes: {
        linethickness: {
            name: "linethickness",
            defaultValue: "medium",
        },
        numalign: {
            name: "numalign",
            defaultValue: "center",
        },
        denomalign: {
            name: "denomalign",
            defaultValue: "center",
        },
        bevelled: {
            name: "bevelled",
            defaultValue: "false",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mfrac",
},

msqrt: {
    name: "msqrt",
    namespace: NS.MathML,
    type: "inferred_mrow",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mroot", // also contains documentation for msqrt
},

mroot: {
    name: "mroot",
    namespace: NS.MathML,
    type: "fixedChildren",
    childCount: 2,
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mroot",
},

mstyle: {
    name: "mstyle",
    namespace: NS.MathML,
    type: "inferred_mrow",
    attributes: {
        scriptlevel: {
            name: "scriptlevel",
            inherited: true,
        },
        displaystyle: {
            name: "displaystyle",
            inherited: true,
        },
        scriptsizemultiplier: {
            name: "scriptsizemultiplier",
            defaultValue: "0.71",
        },
        scriptminsize: {
            name: "scriptminsize",
            defaultValue: "8pt",
        },
        mathbackground: {
            name: "mathbackground",
            defaultValue: "transparent",
        },
        infixlinebreakstyle: {
            name: "infixlinebreakstyle",
            defaultValue: "before",
        },
        decimalseparator: {
            name: "decimalseparator",
            defaultValue: ".",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mstyle",
},

merror: {
    name: "merror",
    namespace: NS.MathML,
    type: "inferred_mrow",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.merror",
},

mpadded: {
    name: "mpadded",
    namespace: NS.MathML,
    type: "inferred_mrow",
    attributes: {
        width: {
            name: "width",
        },
        lspace: {
            name: "lspace",
        },
        height: {
            name: "height",
        },
        depth: {
            name: "depth",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mpadded",
},

mphantom: {
    name: "mphantom",
    namespace: NS.MathML,
    type: "inferred_mrow",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mphantom",
},

mfenced: {
    name: "mfenced",
    namespace: NS.MathML,
    type: "childList",
    attributes: {
        open: {
            name: "open",
            defaultValue: "(",
        },
        close:{
            name: "close",
            defaultValue: ")",
        },
        separators:{
            name: "separators",
            defaultValue: ",",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mfenced",
},

menclose: {
    name: "menclose",
    namespace: NS.MathML,
    type: "inferred_mrow",
    attributes: {
        notation: {
            name: "notation",
            defaultValue: "longdiv",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.menclose",
},

msub: {
    name: "msub",
    namespace: NS.MathML,
    type: "fixedChildren",
    childCount: 2,
    attributes: {
        subscriptshift: {
            name: "subscriptshift",
            defaultValue: "automatic",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.msub",
},

msup: {
    name: "msup",
    namespace: NS.MathML,
    type: "fixedChildren",
    childCount: 2,
    attributes: {
        superscriptshift: {
            name: "superscriptshift",
            defaultValue: "automatic",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.msup",
},

msubsup: {
    name: "msubsup",
    namespace: NS.MathML,
    type: "fixedChildren",
    childCount: 3,
    attributes: {
        subscriptshift: {
            name: "subscriptshift",
            defaultValue: "automatic",
        },
        superscriptshift: {
            name: "superscriptshift",
            defaultValue: "automatic",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.msubsup",
},

munder: {
    name: "munder",
    namespace: NS.MathML,
    type: "fixedChildren",
    childCount: 2,
    attributes: {
        accentunder: {
            name: "accentunder",
            defaultValue: "automatic",
        },
        align: {
            name: "align",
            defaultValue: "center",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.munder",
},

mover: {
    name: "mover",
    namespace: NS.MathML,
    type: "fixedChildren",
    childCount: 2,
    attributes: {
        accent: {
            name: "accent",
            defaultValue: "automatic",
        },
        align: {
            name: "align",
            defaultValue: "center",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mover",
},

munderover: {
    name: "munderover",
    namespace: NS.MathML,
    type: "fixedChildren",
    childCount: 3,
    attributes: {
        accentunder: {
            name: "accentunder",
            defaultValue: "automatic",
        },
        accent: {
            name: "accent",
            defaultValue: "automatic",
        },
        align: {
            name: "align",
            defaultValue: "center",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.munderover",
},

mmultiscripts: {
    name: "mmultiscripts",
    namespace: NS.MathML,
    type: "childList",
    attributes: {
        subscriptshift: {
            name: "subscriptshift",
            defaultValue: "automatic",
        },
        superscriptshift: {
            name: "superscriptshift",
            defaultValue: "automatic",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mmultiscripts",
},

mprescripts: {
    name: "mprescripts",
    namespace: NS.MathML,
    type: "empty",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mmultiscripts", // belongs to mmultiscripts
},

none: {
    name: "none", // Indeed, it is called "none", not "mnone".
    namespace: NS.MathML,
    type: "empty",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mmultiscripts", // belongs to mmultiscripts
},

mtable: {
    name: "mtable",
    namespace: NS.MathML,
    type: "childList",
    attributes: {
        align: {
            name: "align",
            defaultValue: "axis",
        },
        rowalign: {
            name: "rowalign",
            defaultValue: "baseline",
        },
        columnalign: {
            name: "columnalign",
            defaultValue: "center",
        },
        groupalign: {
            name: "groupalign",
            defaultValue: "{left}",
        },
        alignmentscope: {
            name: "alignmentscope",
            defaultValue: "true",
        },
        columnwidth: {
            name: "columnwidth",
            defaultValue: "auto",
        },
        width: {
            name: "width",
            defaultValue: "auto",
        },
        rowspacing: {
            name: "rowspacing",
            defaultValue: "1.0ex",
        },
        columnspacing: {
            name: "columnspacing",
            defaultValue: "0.8em",
        },
        rowlines: {
            name: "rowlines",
            defaultValue: "none",
        },
        columnlines: {
            name: "columnlines",
            defaultValue: "none",
        },
        frame: {
            name: "frame",
            defaultValue: "none",
        },
        framespacing: {
            name: "framespacing",
            defaultValue: "0.4em 0.5ex",
        },
        equalrows: {
            name: "equalrows",
            defaultValue: "false",
        },
        equalcolumns: {
            name: "equalcolumns",
            defaultValue: "false",
        },
        displaystyle: {
            name: "displaystyle",
            defaultValue: "false",
        },
        side: {
            name: "side",
            defaultValue: "right",
        },
        minlabelspacing: {
            name: "minlabelspacing",
            defaultValue: "0.8em",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mtable",
},

mtr: {
    name: "mtr",
    namespace: NS.MathML,
    type: "childList",
    attributes: {
        rowalign: {
            name: "rowalign",
            defaultValue: "inherited",
        },
        columnalign: {
            name: "columnalign",
            defaultValue: "inherited",
        },
        groupalign: {
            name: "groupalign",
            defaultValue: "inherited",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mtr",
},

mlabeledtr: {
    name: "mlabeledtr",
    namespace: NS.MathML,
    type: "childList",
    attributes: {
        rowalign: {
            name: "rowalign",
            defaultValue: "inherited",
        },
        columnalign: {
            name: "columnalign",
            defaultValue: "inherited",
        },
        groupalign: {
            name: "groupalign",
            defaultValue: "inherited",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mlabeledtr",
},

mtd: {
    name: "mtd",
    namespace: NS.MathML,
    type: "inferred_mrow",
    attributes: {
        rowspan: {
            name: "rowspan",
            defaultValue: "1",
        },
        columspan: {
            name: "columnspan",
            defaultValue: "1",
        },
        rowalign: {
            name: "rowalign",
            defaultValue: "inherited",
        },
        columnalign: {
            name: "columnalign",
            defaultValue: "inherited",
        },
        groupalign: {
            name: "groupalign",
            defaultValue: "inherited",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mtd",
},

maligngroup: {
    name: "maligngroup",
    namespace: NS.MathML,
    type: "empty",
    attributes: {
        groupalign: {
            name: "groupalign",
            inherited: true,
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.malign",
},

malignmark: {
    name: "malignmark",
    namespace: NS.MathML,
    type: "empty",
    attributes: {
        edge: {
            name: "edge",
            defaultValue: "left",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.malign",
},

mstack: {
    name: "mstack",
    namespace: NS.MathML,
    type: "childList",
    attributes: {
        align: {
            name: "align",
            defaultValue: "baseline",
        },
        stackalign: {
            name: "stackalign",
            defaultValue: "decimalseparator",
        },
        charalign: {
            name: "charalign",
            defaultValue: "right",
        },
        charspacing: {
            name: "charspacing",
            defaultValue: "0.1em",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mstack",
},

mlongdiv: {
    name: "mlongdiv",
    namespace: NS.MathML,
    type: "childList",
    attributes: {
        longdivstyle: {
            name: "longdivstyle",
            defaultValue: "lefttop",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mlongdiv",
},

msgroup: {
    name: "msgroup",
    namespace: NS.MathML,
    type: "childList",
    attributes: {
        position: {
            name: "position",
            defaultValue: "0",
        },
        shift: {
            name: "shift",
            defaultValue: "0",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.msgroup",
},

msrow: {
    name: "msrow",
    namespace: NS.MathML,
    type: "childList",
    attributes: {
        position: {
            name: "position",
            defaultValue: "0",
        },
        shift: {
            name: "shift",
            defaultValue: "0",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.msrow",
},

mscarries: {
    name: "mscarries",
    namespace: NS.MathML,
    type: "childList",
    attributes: {
        position: {
            name: "position",
            defaultValue: "0",
        },
        location: {
            name: "location",
            defaultValue: "n",
        },
        crossout: {
            name: "none",
            defaultValue: "none",
        },
        scriptsizemultiplier: {
            name: "scriptsizemultiplier",
            defaultValue: "0.6",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mscarries",
},

mscarry: {
    name: "mscarry",
    namespace: NS.MathML,
    type: "inferred_mrow",
    attributes: {
        location: {
            name: "location",
            defaultValue: "n",
        },
        crossout: {
            name: "none",
            defaultValue: "none",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mscarry",
},

msline: {
    name: "msline",
    namespace: NS.MathML,
    type: "empty",
    attributes: {
        position: {
            name: "position",
            defaultValue: "0",
        },
        mslinethickness: {
            name: "mslinethickness",
            defaultValue: "medium",
        },
        length: {
            name: "length",
            defaultValue: "0",
        },
        leftoverhang: {
            name: "leftoverhang",
            defaultValue: "0",
        },
        rightoverhang: {
            name: "rightoverhang",
            defaultValue: "0",
        },
        mathcolor: {
            name: "mathcolor",
            inherited: true,
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.msline",
},

maction: {
    name: "maction",
    namespace: NS.MathML,
    type: "childList",
    attributes: {
        actiontype: {
            name: "actiontype",
        },
        crossout: {
            name: "selection",
            defaultValue: "1",
        },
    },
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.maction",
},

/*notations: {
    name: "notations",
    namespace: NS.OMDoc,
    type: "childList",
    attributes: {
        : {
            name: "",
            defaultValue: "",
        },
    },
    help: "",
},

notation: {
    name: "notation",
    namespace: NS.OMDoc,
    type: "childList",
    attributes: {
        : {
            name: "",
            defaultValue: "",
        },
    },
    help: "",
},*/

prototype: {
    name: "prototype",
    namespace: NS.OMDoc,
    type: "childList",
    attributes: {
    },
    help: "",
},

rendering: {
    name: "rendering",
    namespace: NS.OMDoc,
    type: "inferred_mrow",
    attributes: {
    },
    help: "",
},

iterate: {
    name: "iterate",
    namespace: NS.OMDoc,
    type: "childList",
    attributes: {
        name: {
            name: "name",
            defaultValue: "",
        },
    },
    help: "",
},

separator: {
    name: "separator",
    namespace: NS.OMDoc,
    type: "childList",
    attributes: {
    },
    help: "",
},

render: {
    name: "render",
    namespace: NS.OMDoc,
    type: "empty",
    attributes: {
        name: {
            name: "name",
            defaultValue: "",
        },
    },
    help: "",
},

/*exprlist: {
    name: "exprlist",
    namespace: NS.OMDoc,
    type: "childList",
    attributes: {
        : {
            name: "",
            defaultValue: "",
        },
    },
    help: "",
},

expr: {
    name: "expr",
    namespace: NS.OMDoc,
    type: "childList",
    attributes: {
        : {
            name: "",
            defaultValue: "",
        },
    },
    help: "",
},*/


}
