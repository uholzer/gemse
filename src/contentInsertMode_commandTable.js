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
}
contentInsertModeCommands[KeyMod.control] = {
    type: "disamb",
}
contentInsertModeCommands[KeyMod.alt] = {
    type: "disamb",
}
contentInsertModeCommands[KeyMod.control + "i"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: contentInsertModeCommand_ci
}
contentInsertModeCommands[KeyMod.control + "n"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: contentInsertModeCommand_cn
}
contentInsertModeCommands[KeyMod.control + "b"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_bind
}
contentInsertModeCommands[KeyMod.control + "v"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_bvar
}
contentInsertModeCommands[KeyMod.control + "s"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_semantics
}
contentInsertModeCommands[KeyMod.control + "p"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_omatp
}
contentInsertModeCommands[KeyMod.control + "a"] = {
    type: "disamb",
}
contentInsertModeCommands[KeyMod.control + "ac"] = {
    type: "command",
    argument: "newlineTerminated",
    argumentLineCount: 2,
    implementation: contentInsertModeCommand_annotationxml_cmml
}
contentInsertModeCommands[KeyMod.control + "ap"] = {
    type: "command",
    argument: "newlineTerminated",
    argumentLineCount: 2,
    implementation: contentInsertModeCommand_annotationxml_pmml
}
contentInsertModeCommands[KeyMod.control + "ao"] = {
    type: "command",
    argument: "newlineTerminated",
    argumentLineCount: 2,
    implementation: contentInsertModeCommand_annotationxml_om
}
contentInsertModeCommands[KeyMod.control + "aa"] = {
    type: "command",
    argument: "newlineTerminated",
    argumentLineCount: 3,
    implementation: contentInsertModeCommand_annotation_arbitrary
}
contentInsertModeCommands[KeyMod.control + "ax"] = {
    type: "command",
    argument: "newlineTerminated",
    argumentLineCount: 3,
    implementation: contentInsertModeCommand_annotationxml_arbitrary
}
contentInsertModeCommands[KeyMod.alt + "n"] = {
    type: "disamb",
}
contentInsertModeCommands[KeyMod.alt + "nP"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_notation_prototype
}
contentInsertModeCommands[KeyMod.alt + "nR"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_notation_rendering
}
contentInsertModeCommands[KeyMod.alt + "ne"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: contentInsertModeCommand_notation_expr
}
contentInsertModeCommands[KeyMod.alt + "nl"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: contentInsertModeCommand_notation_exprlist
}
contentInsertModeCommands[KeyMod.control + "h"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_oneMoreToSurround
}
contentInsertModeCommands[KeyMod.control + "l"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_oneLessToSurround
}
contentInsertModeCommands[KeyMod.control + "f"] = {
    type: "disamb",
}
contentInsertModeCommands[KeyMod.control + "fm"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_forceMathMLForNext
}
contentInsertModeCommands[KeyMod.control + "fo"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_forceOpenMathForNext
}
contentInsertModeCommands[KeyMod.control + "fa"] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_forceAutoForNext
}
contentInsertModeCommands[KeyMod.control + ","] = {
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

