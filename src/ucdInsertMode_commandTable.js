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
    [KeyMod.control]: {
        type: "disamb",
    },
    [KeyMod.alt]: {
        type: "disamb",
    },
    [KeyMod.control + "i"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: function ucdInsertModeCommand_mi (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mi") }
    },
    [KeyMod.control + "o"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: function ucdInsertModeCommand_mo (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mo") }
    },
    [KeyMod.control + "n"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: function ucdInsertModeCommand_mn (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mn") }
    },
    [KeyMod.control + "s"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: function ucdInsertModeCommand_mtext (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mtext") }
    },
    [KeyMod.control + "e"]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_menclose (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"menclose") }
    },
    [KeyMod.control + "r"]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_msqrt (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"msqrt") }
    },
    [KeyMod.control + "R"]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_mroot (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mroot") }
    },
    [KeyMod.control + "f"]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_mfenced (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mfenced") }
    },
    [KeyMod.control + "^"]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_msubsup (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"msubsup") }
    },
    [KeyMod.control + "u"]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_munder (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"munder") }
    },
    [KeyMod.control + "v"]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_mover (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mover") }
    },
    [KeyMod.control + "U"]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_munderover (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"munderover") }
    },
    [KeyMod.control + "V"]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_munderover (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"munderover") }
    },
    [KeyMod.control + "m"]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_mmultiscripts (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mmultiscripts") }
    },
    [KeyMod.control + "."]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_none (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"none") }
    },
    [KeyMod.control + "p"]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_mprescripts (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mprescripts") }
    },
    [KeyMod.control + "P"]: {
        type: "command",
        argument: "none",
        implementation: function ucdInsertModeCommand_mphantom (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mphantom") }
    },
    [KeyMod.control + "t"]: {
        type: "command",
        argument: "none",
        implementation: trivialInsertModeCommand_table // For inserting table, tr or td elements
    },
    [KeyMod.control + "T"]: {
        type: "command",
        argument: "none",
        implementation: trivialInsertModeCommand_mlabeledtr
    },
    [KeyMod.control + "h"]: {
        type: "command",
        argument: "none",
        implementation: trivialInsertModeCommand_oneMoreToSurround
    },
    [KeyMod.alt + "n"]: {
        type: "disamb",
    },
    [KeyMod.alt + "nR"]: {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function ucdInsertModeCommand_notation_rendering (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"rendering") }
    },
    [KeyMod.alt + "nP"]: {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function ucdInsertModeCommand_notation_prototype (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"prototype") }
    },
    [KeyMod.alt + "ni"]: {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: trivialInsertModeCommand_notation_iterate
    },
    [KeyMod.alt + "ns"]: {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function ucdInsertModeCommand_notation_separator (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"separator") }
    },
    [KeyMod.alt + "nr"]: {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: trivialInsertModeCommand_notation_render
    },
    [KeyMod.control + "l"]: {
        type: "command",
        argument: "none",
        implementation: trivialInsertModeCommand_oneLessToSurround
    },
    [KeyMod.control + ","]: {
        type: "command",
        argument: "none",
        implementation: ucdInsertModeCommand_forceNewElement
    },
    [String.fromCharCode(0x08)]: { // Backspace
        type: "command",
        argument: "none",
        implementation: trivialInsertModeCommand_killPrevious
    },
    [String.fromCharCode(0x1b)]: { // Escape
        type: "command",
        argument: "none",
        implementation: ucdInsertModeCommand_exit
    },
}
