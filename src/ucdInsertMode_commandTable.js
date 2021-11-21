// Are we allowed to steal methods from trivial insert mode? Hmm,
// we do without asking. However, this asks for problems, but it
// should work as long as our putElement and cursor/moveCursor are 
// compatible with the ones from trivial mode.

var ucdInsertModeCommandOptions = {
    repeating: false, // Must be false, since digits have to be treated as tokens!
}

var ucdInsertModeCommands = {
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
ucdInsertModeCommands[KeyMod.control] = {
    type: "disamb",
}
ucdInsertModeCommands[KeyMod.alt] = {
    type: "disamb",
}
ucdInsertModeCommands[KeyMod.control + "i"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: function ucdInsertModeCommand_mi (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mi") }
}
ucdInsertModeCommands[KeyMod.control + "o"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: function ucdInsertModeCommand_mo (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mo") }
}
ucdInsertModeCommands[KeyMod.control + "n"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: function ucdInsertModeCommand_mn (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mn") }
}
ucdInsertModeCommands[KeyMod.control + "s"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: function ucdInsertModeCommand_mtext (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mtext") }
}
ucdInsertModeCommands[KeyMod.control + "e"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_menclose (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"menclose") }
}
ucdInsertModeCommands[KeyMod.control + "r"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_msqrt (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"msqrt") }
}
ucdInsertModeCommands[KeyMod.control + "R"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mroot (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mroot") }
}
ucdInsertModeCommands[KeyMod.control + "f"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mfenced (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mfenced") }
}
ucdInsertModeCommands[KeyMod.control + "^"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_msubsup (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"msubsup") }
}
ucdInsertModeCommands[KeyMod.control + "u"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_munder (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"munder") }
}
ucdInsertModeCommands[KeyMod.control + "v"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mover (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mover") }
}
ucdInsertModeCommands[KeyMod.control + "U"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_munderover (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"munderover") }
}
ucdInsertModeCommands[KeyMod.control + "V"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_munderover (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"munderover") }
}
ucdInsertModeCommands[KeyMod.control + "m"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mmultiscripts (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mmultiscripts") }
}
ucdInsertModeCommands[KeyMod.control + "."] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_none (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"none") }
}
ucdInsertModeCommands[KeyMod.control + "p"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mprescripts (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mprescripts") }
}
ucdInsertModeCommands[KeyMod.control + "P"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mphantom (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mphantom") }
}
ucdInsertModeCommands[KeyMod.control + "t"] = {
    type: "command",
    argument: "none",
    implementation: trivialInsertModeCommand_table // For inserting table, tr or td elements
}
ucdInsertModeCommands[KeyMod.control + "T"] = {
    type: "command",
    argument: "none",
    implementation: trivialInsertModeCommand_mlabeledtr
}
ucdInsertModeCommands[KeyMod.control + "h"] = {
    type: "command",
    argument: "none",
    implementation: trivialInsertModeCommand_oneMoreToSurround
}
ucdInsertModeCommands[KeyMod.alt + "n"] = {
    type: "disamb",
}
ucdInsertModeCommands[KeyMod.alt + "nR"] = {
    type: "command",
    repeating: "external",
    argument: "none",
    implementation: function ucdInsertModeCommand_notation_rendering (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"rendering") }
}
ucdInsertModeCommands[KeyMod.alt + "nP"] = {
    type: "command",
    repeating: "external",
    argument: "none",
    implementation: function ucdInsertModeCommand_notation_prototype (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"prototype") }
}
ucdInsertModeCommands[KeyMod.alt + "ni"] = {
    type: "command",
    repeating: "external",
    argument: "newlineTerminated",
    implementation: trivialInsertModeCommand_notation_iterate
}
ucdInsertModeCommands[KeyMod.alt + "ns"] = {
    type: "command",
    repeating: "external",
    argument: "none",
    implementation: function ucdInsertModeCommand_notation_separator (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"separator") }
}
ucdInsertModeCommands[KeyMod.alt + "nr"] = {
    type: "command",
    repeating: "external",
    argument: "newlineTerminated",
    implementation: trivialInsertModeCommand_notation_render
}
ucdInsertModeCommands[KeyMod.control + "l"] = {
    type: "command",
    argument: "none",
    implementation: trivialInsertModeCommand_oneLessToSurround
}
ucdInsertModeCommands[KeyMod.control + ","] = {
    type: "command",
    argument: "none",
    implementation: ucdInsertModeCommand_forceNewElement
}
ucdInsertModeCommands[String.fromCharCode(0x08)] = { // Backspace
    type: "command",
    argument: "none",
    implementation: trivialInsertModeCommand_killPrevious
}
ucdInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    type: "command",
    argument: "none",
    implementation: ucdInsertModeCommand_exit
}

