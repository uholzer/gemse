
ucdInsertModeCommands = {
    // Are we allowed to steal commands from trivial insert mode? Hmm,
    // we do without asking. However, this asks for problems, but it
    // should work as long as our putElement is compatible with the
    // one from trivial mode.
    "^": {
        execute: function ucdInsertModeCommand_msup (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msup") }
    },
    "_": {
        execute: function ucdInsertModeCommand_msub (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msub") }
    },
    "\n": {
        execute: trivialInsertModeCommand_cursorJump
    },
}
ucdInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    execute: ucdInsertModeCommand_exit
}

