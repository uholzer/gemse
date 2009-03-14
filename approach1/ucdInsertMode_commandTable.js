
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
ucdInsertModeCommands[KEYMOD_CONTROL + "t"] = {
    execute: trivialInsertModeCommand_mtext
}
ucdInsertModeCommands[KEYMOD_CONTROL + "e"] = {
    execute: function ucdInsertModeCommand_menclose (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"menclose") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "r"] = {
    execute: function ucdInsertModeCommand_msqrt (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msqrt") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "R"] = {
    execute: function ucdInsertModeCommand_mroot (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mroot") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "f"] = {
    execute: function ucdInsertModeCommand_mfenced (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mfenced") }
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
ucdInsertModeCommands[KEYMOD_CONTROL + "m"] = {
    execute: function ucdInsertModeCommand_mmultiscripts (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mmultiscripts") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "p"] = {
    execute: function ucdInsertModeCommand_mprescripts (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mprescripts") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "t"] = {
    execute: trivialInsertModeCommand_table // For inserting table, tr or td elements
}
ucdInsertModeCommands[KEYMOD_CONTROL + "T"] = {
    execute: trivialInsertModeCommand_mlabeledtr
}
ucdInsertModeCommands[KEYMOD_CONTROL + "h"] = {
    execute: trivialInsertModeCommand_oneMoreToSurround
}
ucdInsertModeCommands[KEYMOD_CONTROL + "l"] = {
    execute: trivialInsertModeCommand_oneLessToSurround
}
ucdInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    execute: ucdInsertModeCommand_exit
}

