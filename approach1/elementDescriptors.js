
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
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mfenced",
},

menclose: {
    name: "menclose",
    namespace: NS_MathML,
    type: "inferred_mrow",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.menclose",
},

msub: {
    name: "msub",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 2,
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.msub",
},

msup: {
    name: "msup",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 2,
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.msup",
},

msubsup: {
    name: "msubsup",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 3,
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.msubsup",
},

munder: {
    name: "munder",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 2,
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.munder",
},

mover: {
    name: "mover",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 2,
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mover",
},

munderover: {
    name: "munderover",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 3,
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.munderover",
},

// Crazy elements

mmultiscripts: {
    name: "mmultiscripts",
    namespace: NS_MathML,
    type: "childList",
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
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mtable",
},

mtr: {
    name: "mtr",
    namespace: NS_MathML,
    type: "childList",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mtr",
},

mtd: {
    name: "mtd",
    namespace: NS_MathML,
    type: "childList",
    help: "http://www.w3.org/TR/MathML3/chapter3.html#presm.mtd",
},

}
