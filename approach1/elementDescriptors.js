
/* Descriptions of Presentation MathML elements */

// Core elements, which are hardcoded

elementDescriptions = {

mi: {
    name: "mi",
    namespace: NS_MathML,
    type: "special"
},

mn: {
    name: "mn",
    namespace: NS_MathML,
    type: "special"
},

mo: {
    name: "mo",
    namespace: NS_MathML,
    type: "special"
},

mtext: {
    name: "mtext",
    namespace: NS_MathML,
    type: "special"
},

mrow: {
    name: "mrow",
    namespace: NS_MathML,
    type: "special"
},

// General elements

mfrac: {
    name: "mfrac",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 2
},

menclose: {
    name: "menclose",
    namespace: NS_MathML,
    type: "inferred_mrow"
},

msub: {
    name: "msub",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 2
},

msup: {
    name: "msup",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 2
},

msubsup: {
    name: "msubsup",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 3
},

munder: {
    name: "munder",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 2
},

mover: {
    name: "mover",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 2
},

munderover: {
    name: "munderover",
    namespace: NS_MathML,
    type: "fixedChildren",
    childCount: 3
},

// Crazy elements

mmultiscripts: {
    
},

mprescripts: {

},

none: {

},

mtable: {

},

mtr: {

},

mtd: {

},

}
