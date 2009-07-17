
contentInsertModeCommandOptions = {
    repeating: false, // Must be false, since digits have to be treated as tokens!
}

contentInsertModeCommands = {
    "+": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_msup (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","plus","plus") }
    },
    "-": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_msup (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","minus","minus") }
    },
    "^": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_msup (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","power","power") }
    },
    "*": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_msup (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","times","times") }
    },
    "/": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_msup (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","divide","divide") }
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
        argument: "none",
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
contentInsertModeCommands[KEYMOD_CONTROL + ","] = {
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_forceNewElement
}
contentInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    type: "command",
    argument: "none",
    implementation: contentInsertModeCommand_exit
}

