
contentInsertModeCommandOptions = {
    repeating: false, // Must be false, since digits have to be treated as tokens!
}

contentInsertModeCommands = {
    "+": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_msup (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","plus") }
    },
    "-": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_msup (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","minus") }
    },
    "^": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_msup (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","power") }
    },
    "*": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_msup (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","times") }
    },
    "/": {
        type: "command",
        argument: "none",
        implementation: function contentInsertModeCommand_msup (mode,instance) { return contentInsertModeCommand_symbol(mode,instance,"arith1","divide") }
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
        implementation: function contentInsertModeCommand_apply
    }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "i"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: ucdInsertModeCommand_ci
}
ucdInsertModeCommands[KEYMOD_CONTROL + "n"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: ucdInsertModeCommand_cn
}

