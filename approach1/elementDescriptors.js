
/* Descriptions of Presentation MathML elements */

// Core elements, which are hardcoded


mi: {
    name: "mi",
    namespace: NS_MATHML,
    type: "special"
}

mn: {
    name: "mn",
    namespace: NS_MATHML,
    type: "special"
}

mo: {
    name: "mo",
    namespace: NS_MATHML,
    type: "special"
}

mtext: {
    name: "mtext",
    namespace: NS_MATHML,
    type: "special"
}

mrow: {
    name: "mrow",
    namespace: NS_MATHML,
    type: "special"
}

// General elements

menclose: {
    type: "inferred_mrow"
}

msub: {
    name: "msub",
    namespace: NS_MATHML,
    type: "fixedChildren",
    childCount: 2
}

msup: {
    name: "msup",
    namespace: NS_MATHML,
    type: "fixedChildren",
    childCount: 2
}

msubsup: {
    name: "msubsup",
    namespace: NS_MATHML,
    type: "fixedChildren",
    childCount: 3
}

munder: {
    name: "munder",
    namespace: NS_MATHML,
    type: "fixedChildren",
    childCount: 2
}

mover: {
    name: "mover",
    namespace: NS_MATHML,
    type: "fixedChildren",
    childCount: 2
}

munderover: {
    name: "munderover",
    namespace: NS_MATHML,
    type: "fixedChildren",
    childCount: 3
}

// Crazy elements

mmultiscripts: {
    
}

mprescripts: {

}

none: {

}

mtable: {

}

mtr: {

}

mtd: {

}


