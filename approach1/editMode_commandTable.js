
editModeCommandOptions = {
    repeating: true,
}
editModeCommands = {
    '"': {
        type: "singleCharacterPreArgumentPrefix",
    },
    "g": {
        type: "disamb",
    },
    "j": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: editModeCommand_moveDown,
    },
    "J": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: editModeCommand_moveDownLast
    },
    "k": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: editModeCommand_moveUp
    },
    "h": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: editModeCommand_moveLeft
    },
    "l": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: editModeCommand_moveRight
    },
    "0": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: editModeCommand_moveToFirstSibling
    },
    "$": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: editModeCommand_moveToLastSibling
    },
    "gg": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: editModeCommand_moveToRoot
    },
    "L": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: editModeCommand_moveToNextLeaf
    },
    "H": {
        category: "movement",
        type: "command",
        repeating: "external",
        argument: "none",
        executionHandler: editModeExecutionHandler_movement,
        implementation: editModeCommand_moveToPreviousLeaf
    },
    "x": {
        category: "action",
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: editModeCommand_kill,
    },
    "d": {
        category: "operator",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_delete
    },
    "c": {
        category: "operator",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_change
    },
    "u": {
        category: "action",
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: editModeCommand_undo
    },
    "@": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_attributeMode
    },
    "i": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_insertBefore
    },
    "a": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_insertAfter
    },
    "I": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_insertAtBeginning
    },
    "A": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_insertAtEnd
    },
    "v": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_visualMode
    },
    "y": {
        category: "operator",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_copyToRegister
    },
    "p": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_putAfter
    },
    "P": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_putBefore
    },
    "q": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_startstopUserRecording
    },
    " ": {
        category: "operator",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_mrowEnvelop
    },
    "\t": {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_cycleInsertMode
    },
    ":": {
        type: "longPrefix",
    },
    ":set": {
        type: "long",
        execute: editModeCommand_set
    },
    ":serialize": {
        type: "long",
        execute: editModeCommand_serialize
    },
    ":export": {
        type: "long",
        execute: editModeCommand_export
    },
    ":new": {
        type: "long",
        execute: editModeCommand_newEquation
    },
    ":next": {
        type: "long",
        execute: editModeCommand_nextEquation
    },
    ":previous": {
        type: "long",
        execute: editModeCommand_previousEquation
    },
    ":load": {
        type: "long",
        execute: editModeCommand_load
    },
    ":loadid": {
        type: "long",
        execute: editModeCommand_loadById
    },
    ":loadxpath": {
        type: "long",
        execute: editModeCommand_loadByXPath
    },
    ":loadall": {
        type: "long",
        execute: editModeCommand_loadAll
    },
    ":save": {
        type: "long",
        execute: editModeCommand_save
    },
    ":write": { // synonym for :save
        type: "long",
        execute: editModeCommand_save
    },
    ":saveall": {
        type: "long",
        execute: editModeCommand_saveAll
    },
    ":writeall": { // synonym for :save
        type: "long",
        execute: editModeCommand_saveAll
    },
    ":close": {
        type: "long",
        execute: editModeCommand_close
    },
    ":help": {
        type: "long",
        execute: editModeCommand_help
    },
};
editModeCommands[KEYMOD_CONTROL] = {
        type: "disamb",
};
editModeCommands[KEYMOD_CONTROL + "i"] = {
        type: "action",
        execute: editModeCommand_insertIn
};
editModeCommands[KEYMOD_CONTROL + "r"] = {
        category: "action",
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: editModeCommand_redo
};
editModeCommands[KEYMOD_CONTROL + "l"] = {
        type: "action",
        execute: editModeCommand_redisplay
};
editModeCommands[KEYMOD_CONTROL + "p"] = {
        type: "action",
        execute: editModeCommand_putIn
};

