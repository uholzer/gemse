
visualSelectionModeCommands = {
    "o": {
        execute: visualSelectionModeCommand_switchMoving
    }
}
visualSelectionModeCommands[String.fromCharCode(0x1b)] = { // Escape
    execute: visualSelectionModeCommand_cancel
}

