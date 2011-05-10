/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */


// Are we allowed to steal methods from trivial insert mode? Hmm,
// we do without asking. However, this asks for problems, but it
// should work as long as our putElement and cursor/moveCursor are 
// compatible with the ones from trivial mode.

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
ucdInsertModeCommands[KEYMOD_ALT] = {
    type: "disamb",
}
ucdInsertModeCommands[KEYMOD_CONTROL + "i"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: function ucdInsertModeCommand_mi (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mi") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "o"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: function ucdInsertModeCommand_mo (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mo") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "n"] = {
    type: "command",
    argument: "newlineTerminated",
    implementation: function ucdInsertModeCommand_mn (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mn") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "s"] = {
    type: "command",
    argument: "newlineTerminated",
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
ucdInsertModeCommands[KEYMOD_CONTROL + "^"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_msubsup (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"msubsup") }
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
ucdInsertModeCommands[KEYMOD_CONTROL + "V"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_munderover (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"munderover") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "m"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mmultiscripts (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mmultiscripts") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "."] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_none (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"none") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "p"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mprescripts (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mprescripts") }
}
ucdInsertModeCommands[KEYMOD_CONTROL + "P"] = {
    type: "command",
    argument: "none",
    implementation: function ucdInsertModeCommand_mphantom (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mphantom") }
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
ucdInsertModeCommands[KEYMOD_ALT + "n"] = {
    type: "disamb",
}
ucdInsertModeCommands[KEYMOD_ALT + "ni"] = {
    type: "command",
    repeating: "external",
    argument: "newlineTerminated",
    implementation: trivialInsertModeCommand_notation_iterate
}
ucdInsertModeCommands[KEYMOD_ALT + "ns"] = {
    type: "command",
    repeating: "external",
    argument: "none",
    implementation: function ucdInsertModeCommand_notation_separator (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"separator") }
}
ucdInsertModeCommands[KEYMOD_ALT + "nr"] = {
    type: "command",
    repeating: "external",
    argument: "newlineTerminated",
    implementation: trivialInsertModeCommand_notation_render
}
ucdInsertModeCommands[KEYMOD_CONTROL + "l"] = {
    type: "command",
    argument: "none",
    implementation: trivialInsertModeCommand_oneLessToSurround
}
ucdInsertModeCommands[KEYMOD_CONTROL + ","] = {
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

