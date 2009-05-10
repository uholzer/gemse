
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
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: editModeCommand_set
    },
    ":serialize": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: editModeCommand_serialize
    },
    ":export": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: editModeCommand_export
    },
    ":new": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_newEquation
    },
    ":next": {
        category: "action",
        type: "long",
        argument: "none",
        repeating: "external",
        implementation: editModeCommand_nextEquation
    },
    ":previous": {
        category: "action",
        type: "long",
        argument: "none",
        repeating: "external",
        implementation: editModeCommand_previousEquation
    },
    ":load": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: editModeCommand_load
    },
    ":loadid": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: editModeCommand_loadById
    },
    ":loadxpath": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: editModeCommand_loadByXPath
    },
    ":loadall": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: editModeCommand_loadAll
    },
    ":save": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: editModeCommand_save
    },
    ":write": { // synonym for :save
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: editModeCommand_save
    },
    ":saveall": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_saveAll
    },
    ":writeall": { // synonym for :save
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_saveAll
    },
    ":close": {
        category: "action",
        type: "long",
        repeating: "external",
        argument: "none",
        implementation: editModeCommand_close
    },
    ":help": {
        category: "action",
        type: "long",
        repeating: "prevent",
        argument: "newlineTerminated",
        implementation: editModeCommand_help
    },
};
editModeCommands[KEYMOD_CONTROL] = {
        type: "disamb",
};
editModeCommands[KEYMOD_CONTROL + "i"] = {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_insertIn
};
editModeCommands[KEYMOD_CONTROL + "r"] = {
        category: "action",
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: editModeCommand_redo
};
editModeCommands[KEYMOD_CONTROL + "l"] = {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_redisplay
};
editModeCommands[KEYMOD_CONTROL + "p"] = {
        category: "action",
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: editModeCommand_putIn
};

