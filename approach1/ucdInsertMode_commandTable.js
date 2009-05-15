
// Are we allowed to steal instances from trivial insert mode? Hmm,
// we do without asking. However, this asks for problems, but it
// should work as long as our putElement is compatible with the
// one from trivial mode.

ucdInsertModeCommandOptions = {
    repeating: false, // Must be false, since digits have to be treated as tokens!
}

ucdInsertModeCommands = {
    "^": {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_msup (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"msup") }
    },
    "_": {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_msub (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"msub") }
    },
    " ": {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_mrow (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mrow") }
    },
    "/": {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_mfrac (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mfrac") }
    },
    "\n": {
        type: "command",
        argument: "none",
        implementation: trivialInsertModeCommand_cursorJump
    },
}
ucdInsertModeCommands[KEYMOD_CONTROL] = {
    type: "disamb",
}
ucdInsertModeCommands[KEYMOD_CONTROL + "t"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mtext (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mtext") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "e"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_menclose (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"menclose") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "r"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_msqrt (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"msqrt") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "R"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mroot (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mroot") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "f"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mfenced (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mfenced") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "u"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_munder (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"munder") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "v"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mover (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mover") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "U"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_munderover (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"munderover") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "m"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mmultiscripts (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mmultiscripts") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "p"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mprescripts (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mprescripts") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "t"] = {
    type: "command",
    argument: "none",
    implementation: trivialInsertModeCommand_table // For inserting table, tr or td elements
}
ucdInsertModeCommands[KEYMOD_CONTROL + "T"] = {
    type: "command",
    argument: "none",
    implementation: trivialInsertModeCommand_mlabeledtr
}
ucdInsertModeCommands[KEYMOD_CONTROL + "h"] = {
    type: "command",
    argument: "none",
    implementation: trivialInsertModeCommand_oneMoreToSurround
}
ucdInsertModeCommands[KEYMOD_CONTROL + "l"] = {
    type: "command",
    argument: "none",
    implementation: trivialInsertModeCommand_oneLessToSurround
}
ucdInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    type: "command",
    argument: "none",
    implementation: ucdInsertModeCommand_exit
}

