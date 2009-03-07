
ucdInsertModeCommands = {
}
ucdInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    execute: ucdInsertModeCommand_exit
}

