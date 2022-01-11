/* Functions for navigating the DOM, specially tailored to MathML */

import { NS } from "./namespace.js";

/**
 * Returns the next leaf element in document order. A leaf element is
 * an element that has no child elements. Returns null if there is no such
 * element.
 */
export function nextElementLeaf(element) {
    if (element.nextElementSibling) {
        return firstElementLeafDescendantOrSelf(element.nextElementSibling);
    }
    else if (element.parentElement) {
        return nextElementLeaf(element.parentElement);
    }
    else {
        return null;
    }
}

/**
 * Returns the previous leaf element in document order. A leaf element is
 * an element that has no child elements. Returns null if there is no such
 * element.
 */
export function previousElementLeaf(element) {
    if (element.previousElementSibling) {
        return lastElementLeafDescendantOrSelf(element.previousElementSibling);
    }
    else if (element.parentElement) {
        return previousElementLeaf(element.parentElement);
    }
    else {
        return null;
    }
}

function firstElementLeafDescendantOrSelf(element) {
    if (element.firstElementChild) {
        return firstElementLeafDescendantOrSelf(element.firstElementChild);
    }
    else {
        return element;
    }
}

function lastElementLeafDescendantOrSelf(element) {
    if (element.lastElementChild) {
        return lastElementLeafDescendantOrSelf(element.lastElementChild);
    }
    else {
        return element;
    }
}
