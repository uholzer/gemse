
/* Descriptions of Presentation MathML elements */

// Core elements, which are hardcoded

elementDescriptions = {

mi: {
    name: "mi",
    namespace: NS_MathML,
    type: "special",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mi",
},

mn: {
    name: "mn",
    namespace: NS_MathML,
    type: "special",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mn",
},

mo: {
    name: "mo",
    namespace: NS_MathML,
    type: "special",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mo",
},

mtext: {
    name: "mtext",
    namespace: NS_MathML,
    type: "special",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mtext",
},

mrow: {
    name: "mrow",
    namespace: NS_MathML,
    type: "mrow",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mrow",
},

// General elements

mfrac: {
    name: "mfrac",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 2,
    attributes: {
        linethickness: {
            name: "linethickness",
            defaultValue: "1",
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
    namespace: NS_MathML,
    type: "inferred_mrow",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.msqrt",
},

mroot: {
    name: "mroot",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 2,
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mroot",
},

mfenced: {
    name: "mfenced",
    namespace: NS_MathML,
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
    namespace: NS_MathML,
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
    namespace: NS_MathML,
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
    namespace: NS_MathML,
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
    namespace: NS_MathML,
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
    namespace: NS_MathML,
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
    namespace: NS_MathML,
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
    namespace: NS_MathML,
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

// Crazy elements

mmultiscripts: {
    name: "mmultiscripts",
    namespace: NS_MathML,
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
    namespace: NS_MathML,
    type: "empty",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mprescripts",
},

none: {
    name: "none", // Indeed, it is called "none", not "mnone".
    namespace: NS_MathML,
    type: "empty",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.none",
},

mtable: {
    name: "mtable",
    namespace: NS_MathML,
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
    namespace: NS_MathML,
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
    namespace: NS_MathML,
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

mtd: {
    name: "mtd",
    namespace: NS_MathML,
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
    type: "childList",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mtd",
},

}
