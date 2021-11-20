import { commands } from "./contentInsertMode.js";
import { KeyMod } from "./key.js";

export const contentInsertModeCommandOptions = {
    repeating: false, // Must be false, since digits have to be treated as tokens!
}

export const contentInsertModeCommands = {
    "+": {
        type: "command",
        argument: "none",
        implementation: function plus (mode,instance) { return commands.symbol(mode,instance,"arith1","plus","plus") }
    },
    "-": {
        type: "command",
        argument: "none",
        implementation: function minus (mode,instance) { return commands.symbol(mode,instance,"arith1","minus","minus") }
    },
    "^": {
        type: "command",
        argument: "none",
        implementation: function power (mode,instance) { return commands.symbol(mode,instance,"arith1","power","power") }
    },
    "*": {
        type: "command",
        argument: "none",
        implementation: function times (mode,instance) { return commands.symbol(mode,instance,"arith1","times","times") }
    },
    "/": {
        type: "command",
        argument: "none",
        implementation: function divide (mode,instance) { return commands.symbol(mode,instance,"arith1","divide","divide") }
    },
    "(": {
        type: "command",
        argument: "none",
        implementation: commands.lambda
    },
    "$": { // Inserts an arbitrary csymbol
        type: "command",
        argument: "newlineTerminated",
        argumentLineCount: 2,
        implementation: commands.symbol
    },
    " ": {
        type: "command",
        argument: "none",
        implementation: commands.apply
    },
    "<": {
        type: "command",
        argument: "newlineTerminated",
        implementation: commands.arbitraryElement
    },
    "#": {
        type: "command",
        argument: "newlineTerminated",
        implementation: commands.arbitraryOperator
    },
    "\n": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.cursorJump
    },
    [KeyMod.control]: {
        type: "disamb",
    },
    [KeyMod.alt]: {
        type: "disamb",
    },
    [KeyMod.control + "i"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: commands.ci
    },
    [KeyMod.control + "n"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: commands.cn
    },
    [KeyMod.control + "b"]: {
        type: "command",
        argument: "none",
        implementation: commands.bind
    },
    [KeyMod.control + "v"]: {
        type: "command",
        argument: "none",
        implementation: commands.bvar
    },
    [KeyMod.control + "s"]: {
        type: "command",
        argument: "none",
        implementation: commands.semantics
    },
    [KeyMod.control + "p"]: {
        type: "command",
        argument: "none",
        implementation: commands.omatp
    },
    [KeyMod.control + "a"]: {
        type: "disamb",
    },
    [KeyMod.control + "ac"]: {
        type: "command",
        argument: "newlineTerminated",
        argumentLineCount: 2,
        implementation: commands.annotationxml_cmml
    },
    [KeyMod.control + "ap"]: {
        type: "command",
        argument: "newlineTerminated",
        argumentLineCount: 2,
        implementation: commands.annotationxml_pmml
    },
    [KeyMod.control + "ao"]: {
        type: "command",
        argument: "newlineTerminated",
        argumentLineCount: 2,
        implementation: commands.annotationxml_om
    },
    [KeyMod.control + "aa"]: {
        type: "command",
        argument: "newlineTerminated",
        argumentLineCount: 3,
        implementation: commands.annotation_arbitrary
    },
    [KeyMod.control + "ax"]: {
        type: "command",
        argument: "newlineTerminated",
        argumentLineCount: 3,
        implementation: commands.annotationxml_arbitrary
    },
    [KeyMod.alt + "n"]: {
        type: "disamb",
    },
    [KeyMod.alt + "nP"]: {
        type: "command",
        argument: "none",
        implementation: commands.notation_prototype
    },
    [KeyMod.alt + "nR"]: {
        type: "command",
        argument: "none",
        implementation: commands.notation_rendering
    },
    [KeyMod.alt + "ne"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: commands.notation_expr
    },
    [KeyMod.alt + "nl"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: commands.notation_exprlist
    },
    [KeyMod.control + "h"]: {
        type: "command",
        argument: "none",
        implementation: commands.oneMoreToSurround
    },
    [KeyMod.control + "l"]: {
        type: "command",
        argument: "none",
        implementation: commands.oneLessToSurround
    },
    [KeyMod.control + "f"]: {
        type: "disamb",
    },
    [KeyMod.control + "fm"]: {
        type: "command",
        argument: "none",
        implementation: commands.forceMathMLForNext
    },
    [KeyMod.control + "fo"]: {
        type: "command",
        argument: "none",
        implementation: commands.forceOpenMathForNext
    },
    [KeyMod.control + "fa"]: {
        type: "command",
        argument: "none",
        implementation: commands.forceAutoForNext
    },
    [KeyMod.control + ","]: {
        type: "command",
        argument: "none",
        implementation: commands.forceNewElement
    },
    [String.fromCharCode(0x08)]: { // Backspace
        type: "command",
        argument: "none",
        implementation: commands.killPrevious
    },
    [String.fromCharCode(0x1b)]: { // Escape
        type: "command",
        argument: "none",
        implementation: commands.exit
    },
}
