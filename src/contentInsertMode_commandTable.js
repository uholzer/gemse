var contentInsertModeCommandOptions = {
    repeating: false, // Must be false, since digits have to be treated as tokens!
}

var contentInsertModeCommands = {
    "+": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_plus (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","plus","plus") }
    },
    "-": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_minus (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","minus","minus") }
    },
    "^": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_power (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","power","power") }
    },
    "*": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_times (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","times","times") }
    },
    "/": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_divide (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","divide","divide") }
    },
    "(": {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_lambda
    },
    "$": { // Inserts an arbitrary csymbol
        type: "command",
        argument: "newlineTerminated",
        argumentLineCount: 2,
        implementation: contentInsertModeCommand_symbol
    },
    " ": {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_apply
    },
    "<": {
        type: "command",
        argument: "newlineTerminated",
        implementation: contentInsertModeCommand_arbitraryElement
    },
    "#": {
        type: "command",
        argument: "newlineTerminated",
        implementation: contentInsertModeCommand_arbitraryOperator
    },
    "\n": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: contentInsertModeCommand_cursorJump
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
        implementation: contentInsertModeCommand_ci
    },
    [KeyMod.control + "n"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: contentInsertModeCommand_cn
    },
    [KeyMod.control + "b"]: {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_bind
    },
    [KeyMod.control + "v"]: {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_bvar
    },
    [KeyMod.control + "s"]: {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_semantics
    },
    [KeyMod.control + "p"]: {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_omatp
    },
    [KeyMod.control + "a"]: {
        type: "disamb",
    },
    [KeyMod.control + "ac"]: {
        type: "command",
        argument: "newlineTerminated",
        argumentLineCount: 2,
        implementation: contentInsertModeCommand_annotationxml_cmml
    },
    [KeyMod.control + "ap"]: {
        type: "command",
        argument: "newlineTerminated",
        argumentLineCount: 2,
        implementation: contentInsertModeCommand_annotationxml_pmml
    },
    [KeyMod.control + "ao"]: {
        type: "command",
        argument: "newlineTerminated",
        argumentLineCount: 2,
        implementation: contentInsertModeCommand_annotationxml_om
    },
    [KeyMod.control + "aa"]: {
        type: "command",
        argument: "newlineTerminated",
        argumentLineCount: 3,
        implementation: contentInsertModeCommand_annotation_arbitrary
    },
    [KeyMod.control + "ax"]: {
        type: "command",
        argument: "newlineTerminated",
        argumentLineCount: 3,
        implementation: contentInsertModeCommand_annotationxml_arbitrary
    },
    [KeyMod.alt + "n"]: {
        type: "disamb",
    },
    [KeyMod.alt + "nP"]: {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_notation_prototype
    },
    [KeyMod.alt + "nR"]: {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_notation_rendering
    },
    [KeyMod.alt + "ne"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: contentInsertModeCommand_notation_expr
    },
    [KeyMod.alt + "nl"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: contentInsertModeCommand_notation_exprlist
    },
    [KeyMod.control + "h"]: {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_oneMoreToSurround
    },
    [KeyMod.control + "l"]: {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_oneLessToSurround
    },
    [KeyMod.control + "f"]: {
        type: "disamb",
    },
    [KeyMod.control + "fm"]: {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_forceMathMLForNext
    },
    [KeyMod.control + "fo"]: {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_forceOpenMathForNext
    },
    [KeyMod.control + "fa"]: {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_forceAutoForNext
    },
    [KeyMod.control + ","]: {
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_forceNewElement
    },
    [String.fromCharCode(0x08)]: { // Backspace
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_killPrevious
    },
    [String.fromCharCode(0x1b)]: { // Escape
        type: "command",
        argument: "none",
        implementation: contentInsertModeCommand_exit
    },
}
