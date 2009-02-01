
visiualSelectionModeCommands = {
    "o": {
        execute: visualSelectionModeCommand_switchMoving
    }
}
visiualSelectionModeCommands[String.fromCharCode(0x1b)] = { // Escape
    execute: visualSelectionModeCommand_cancel
}

