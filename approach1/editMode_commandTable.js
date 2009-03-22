
editModeCommands = {
    "j": {
        type: "movement",
        execute: editModeCommand_moveDown
    },
    "J": {
        type: "movement",
        execute: editModeCommand_moveDownLast
    },
    "k": {
        type: "movement",
        execute: editModeCommand_moveUp
    },
    "h": {
        type: "movement",
        execute: editModeCommand_moveLeft
    },
    "l": {
        type: "movement",
        execute: editModeCommand_moveRight
    },
    "0": {
        type: "movement",
        execute: editModeCommand_moveToFirstSibling
    },
    "$": {
        type: "movement",
        execute: editModeCommand_moveToLastSibling
    },
    "gg": {
        type: "movement",
        execute: editModeCommand_moveToRoot
    },
    "L": {
        type: "movement",
        execute: editModeCommand_moveToNextLeaf
    },
    "H": {
        type: "movement",
        execute: editModeCommand_moveToPreviousLeaf
    },
    "x": {
        type: "action",
        execute: editModeCommand_kill
    },
    "d": {
        type: "operator",
        execute: editModeCommand_delete
    },
    "c": {
        type: "operator",
        execute: editModeCommand_change
    },
    "u": {
        type: "action",
        execute: editModeCommand_undo
    },
    "@": {
        type: "action",
        execute: editModeCommand_attributeMode
    },
    "i": {
        type: "action",
        execute: editModeCommand_insertBefore
    },
    "a": {
        type: "action",
        execute: editModeCommand_insertAfter
    },
    "I": {
        type: "action",
        execute: editModeCommand_insertAtBeginning
    },
    "A": {
        type: "action",
        execute: editModeCommand_insertAtEnd
    },
    "v": {
        type: "action",
        execute: editModeCommand_visualMode
    },
    "y": {
        type: "operator",
        execute: editModeCommand_copyToRegister
    },
    "p": {
        type: "action",
        execute: editModeCommand_putAfter
    },
    "P": {
        type: "action",
        execute: editModeCommand_putBefore
    },
    "q": {
        type: "action",
        execute: editModeCommand_startstopUserRecording
    },
    " ": {
        type: "operator",
        execute: editModeCommand_mrowEnvelop
    },
    "\t": {
        type: "action",
        execute: editModeCommand_cycleInsertMode
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
editModeCommands[KEYMOD_CONTROL + "i"] = {
        type: "action",
        execute: editModeCommand_insertIn
};
editModeCommands[KEYMOD_CONTROL + "r"] = {
        type: "action",
        execute: editModeCommand_redo
};
editModeCommands[KEYMOD_CONTROL + "l"] = {
        type: "action",
        execute: editModeCommand_redisplay
};
editModeCommands[KEYMOD_CONTROL + "p"] = {
        type: "action",
        execute: editModeCommand_putIn
};

