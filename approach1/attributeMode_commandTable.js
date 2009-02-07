
attributeModeCommands = {
    "j": {
        type: "movement",
        execute: attributeModeCommand_down
    },
    "k": {
        type: "movement",
        execute: attributeModeCommand_up
    },
    "x": {
        type: "action",
        execute: attributeModeCommand_kill
    },
    "c": {
        type: "action",
        execute: attributeModeCommand_changeValue
    },
    "C": {
        type: "action",
        execute: attributeModeCommand_changeName
    },
    "n": {
        type: "action",
        execute: attributeModeCommand_changeNS
    },
    "i": {
        type: "action",
        execute: attributeModeCommand_insertDefault
    },
    "I": {
        type: "action",
        execute: attributeModeCommand_insertForeign
    }
}
attributeModeCommands[String.fromCharCode(0x1b)] = { // Escape
    type: "action",
    execute: attributeModeCommand_exit
}

