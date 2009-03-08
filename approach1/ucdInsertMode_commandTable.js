
// Are we allowed to steal commands from trivial insert mode? Hmm,
// we do without asking. However, this asks for problems, but it
// should work as long as our putElement is compatible with the
// one from trivial mode.

ucdInsertModeCommands = {
    "^": {
        execute: function ucdInsertModeCommand_msup (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msup") }
    },
    "_": {
        execute: function ucdInsertModeCommand_msub (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msub") }
    },
    " ": {
        execute: function trivialInsertModeCommand_mrow (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mrow") }
    },
    "/": {
        execute: function trivialInsertModeCommand_mfrac (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mfrac") }
    },
    "\n": {
        execute: trivialInsertModeCommand_cursorJump
    },
}
ucdInsertModeCommands[KEYMOD_CONTROL + "u"] = {
    execute: function ucdInsertModeCommand_munder (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"munder") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "v"] = {
    execute: function ucdInsertModeCommand_mover (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mover") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "U"] = {
    execute: function ucdInsertModeCommand_munderover (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"munderover") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "h"] = {
    execute: trivialInsertModeCommand_oneMoreToSurround
}
ucdInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    execute: ucdInsertModeCommand_exit
}

