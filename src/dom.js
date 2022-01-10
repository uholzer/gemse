/* Functions for navigating the DOM, specially tailored to MathML */

import { NS } from "./namespace.js";

/**
 * Returns the next leaf element in document order. A leaf element is
 * an element that has no child elements.
 */
export function mml_nextLeaf(element) {
    var nextLeaf = null;
    var nextSibling = element.nextElementSibling;
    if (!nextSibling) {
        // No next sibling, so we have to go up
        while (!nextSibling) {
            element = element.parentNode;
            nextSibling = element.nextElementSibling;
            if (element.localName=="math" && element.namespaceURI == NS.MathML) { return null }
        }
        // Here we reached a point where nextSibling is defined.
        // It may be however, that it is not a leaf but an
        // ancestor of a leaf. So it may be that we have to
        // go down later.
    }
    if (nextSibling.firstElementChild) {
        // Next sibling is not a leaf but contains children.
        // So we have to go down.
        nextLeaf = nextSibling;
        var next;
        while (next = nextLeaf.firstElementChild) {
            nextLeaf = next;
        }
    }
    else if (nextSibling) {
        // Next sibling exists and is a leaf
        nextLeaf = nextSibling;
    }
    return nextLeaf;
}

/**
 * Returns the previous leaf element in document order. A leaf element is
 * an element that has no child elements.
 */
export function mml_previousLeaf(element) {
    var previousLeaf = null;
    var previousSibling = element.previousElementSibling;
    if (!previousSibling) {
        // No next sibling, so we have to go up
        while (!previousSibling) {
            element = element.parentNode;
            previousSibling = element.previousElementSibling;
            if (element.localName=="math" && element.namespaceURI == NS.MathML) { return null }
        }
        // Here we reached a point where nextSibling is defined.
        // It may be however, that it is not a leaf but an
        // ancestor of a leaf. So it may be that we have to
        // go down later.
    }
    if (previousSibling.lastElementChild) {
        // Next sibling is not a leaf but contains children.
        // So we have to go down.
        previousLeaf = previousSibling;
        var next;
        while (next = previousLeaf.lastElementChild) {
            previousLeaf = next;
        }
    }
    else if (previousSibling) {
        // Next sibling exists and is a leaf
        previousLeaf = previousSibling;
    }
    return previousLeaf;
}
