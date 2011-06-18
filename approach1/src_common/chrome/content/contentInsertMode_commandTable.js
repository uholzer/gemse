/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */


contentInsertModeCommandOptions = {
    repeating: false, // Must be false, since digits have to be treated as tokens!
}

contentInsertModeCommands = {
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
}
contentInsertModeCommands[KEYMOD_CONTROL] = {
    type: "disamb",
}
contentInsertModeCommands[KEYMOD_ALT] = {
    type: "disamb",
}
contentInsertModeCommands[KEYMOD_CONTROL + "i"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: contentInsertModeCommand_ci
}
contentInsertModeCommands[KEYMOD_CONTROL + "n"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: contentInsertModeCommand_cn
}
contentInsertModeCommands[KEYMOD_CONTROL + "b"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_bind
}
contentInsertModeCommands[KEYMOD_CONTROL + "v"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_bvar
}
contentInsertModeCommands[KEYMOD_CONTROL + "s"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_semantics
}
contentInsertModeCommands[KEYMOD_CONTROL + "p"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_omatp
}
contentInsertModeCommands[KEYMOD_CONTROL + "a"] = {
    type: "disamb",
}
contentInsertModeCommands[KEYMOD_CONTROL + "ac"] = {
    type: "command",
    argument: "newlineTerminated",
    argumentLineCount: 2,
    implementation: contentInsertModeCommand_annotationxml_cmml
}
contentInsertModeCommands[KEYMOD_CONTROL + "ap"] = {
    type: "command",
    argument: "newlineTerminated",
    argumentLineCount: 2,
    implementation: contentInsertModeCommand_annotationxml_pmml
}
contentInsertModeCommands[KEYMOD_CONTROL + "ao"] = {
    type: "command",
    argument: "newlineTerminated",
    argumentLineCount: 2,
    implementation: contentInsertModeCommand_annotationxml_om
}
contentInsertModeCommands[KEYMOD_CONTROL + "aa"] = {
    type: "command",
    argument: "newlineTerminated",
    argumentLineCount: 3,
    implementation: contentInsertModeCommand_annotation_arbitrary
}
contentInsertModeCommands[KEYMOD_CONTROL + "ax"] = {
    type: "command",
    argument: "newlineTerminated",
    argumentLineCount: 3,
    implementation: contentInsertModeCommand_annotationxml_arbitrary
}
contentInsertModeCommands[KEYMOD_ALT + "n"] = {
    type: "disamb",
}
contentInsertModeCommands[KEYMOD_ALT + "nP"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_notation_prototype
}
contentInsertModeCommands[KEYMOD_ALT + "nR"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_notation_rendering
}
contentInsertModeCommands[KEYMOD_ALT + "ne"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: contentInsertModeCommand_notation_expr
}
contentInsertModeCommands[KEYMOD_ALT + "nl"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: contentInsertModeCommand_notation_exprlist
}
contentInsertModeCommands[KEYMOD_CONTROL + "h"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_oneMoreToSurround
}
contentInsertModeCommands[KEYMOD_CONTROL + "l"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_oneLessToSurround
}
contentInsertModeCommands[KEYMOD_CONTROL + "f"] = {
    type: "disamb",
}
contentInsertModeCommands[KEYMOD_CONTROL + "fm"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_forceMathMLForNext
}
contentInsertModeCommands[KEYMOD_CONTROL + "fo"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_forceOpenMathForNext
}
contentInsertModeCommands[KEYMOD_CONTROL + "fa"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_forceAutoForNext
}
contentInsertModeCommands[KEYMOD_CONTROL + ","] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_forceNewElement
}
contentInsertModeCommands[String.fromCharCode(0x08)] = { // Backspace
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_killPrevious
}
contentInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_exit
}

