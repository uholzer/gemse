// Are we allowed to steal methods from trivial insert mode? Hmm,
// we do without asking. However, this asks for problems, but it
// should work as long as our putElement and cursor/moveCursor are 
// compatible with the ones from trivial mode.
import { KeyMod } from "./key.js";
import { commands as trivialInsertModeCommands } from "./trivialInsertMode.js";
import { commands } from "./ucdInsertMode.js";

export const ucdInsertModeCommandOptions = {
    repeating: false, // Must be false, since digits have to be treated as tokens!
}

export const ucdInsertModeCommands = {
    "^": {
        type: "command",
        argument: "none",
        implementation: function msup (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"msup") }
    },
    "_": {
        type: "command",
        argument: "none",
        implementation: function msub (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"msub") }
    },
    " ": {
        type: "command",
        argument: "none",
        implementation: function mrow (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"mrow") }
    },
    "/": {
        type: "command",
        argument: "none",
        implementation: function mfrac (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"mfrac") }
    },
    "\n": {
        type: "command",
        argument: "none",
        implementation: trivialInsertModeCommands.cursorJump
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
        implementation: function mi (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"mi") }
    },
    [KeyMod.control + "o"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: function mo (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"mo") }
    },
    [KeyMod.control + "n"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: function mn (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"mn") }
    },
    [KeyMod.control + "s"]: {
        type: "command",
        argument: "newlineTerminated",
        implementation: function mtext (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"mtext") }
    },
    [KeyMod.control + "e"]: {
        type: "command",
        argument: "none",
        implementation: function menclose (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"menclose") }
    },
    [KeyMod.control + "r"]: {
        type: "command",
        argument: "none",
        implementation: function msqrt (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"msqrt") }
    },
    [KeyMod.control + "R"]: {
        type: "command",
        argument: "none",
        implementation: function mroot (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"mroot") }
    },
    [KeyMod.control + "f"]: {
        type: "command",
        argument: "none",
        implementation: function mfenced (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"mfenced") }
    },
    [KeyMod.control + "^"]: {
        type: "command",
        argument: "none",
        implementation: function msubsup (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"msubsup") }
    },
    [KeyMod.control + "u"]: {
        type: "command",
        argument: "none",
        implementation: function munder (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"munder") }
    },
    [KeyMod.control + "v"]: {
        type: "command",
        argument: "none",
        implementation: function mover (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"mover") }
    },
    [KeyMod.control + "U"]: {
        type: "command",
        argument: "none",
        implementation: function munderover (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"munderover") }
    },
    [KeyMod.control + "V"]: {
        type: "command",
        argument: "none",
        implementation: function munderover (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"munderover") }
    },
    [KeyMod.control + "m"]: {
        type: "command",
        argument: "none",
        implementation: function mmultiscripts (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"mmultiscripts") }
    },
    [KeyMod.control + "."]: {
        type: "command",
        argument: "none",
        implementation: function none (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"none") }
    },
    [KeyMod.control + "p"]: {
        type: "command",
        argument: "none",
        implementation: function mprescripts (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"mprescripts") }
    },
    [KeyMod.control + "P"]: {
        type: "command",
        argument: "none",
        implementation: function mphantom (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"mphantom") }
    },
    [KeyMod.control + "t"]: {
        type: "command",
        argument: "none",
        implementation: trivialInsertModeCommands.table // For inserting table, tr or td elements
    },
    [KeyMod.control + "T"]: {
        type: "command",
        argument: "none",
        implementation: trivialInsertModeCommands.mlabeledtr
    },
    [KeyMod.control + "h"]: {
        type: "command",
        argument: "none",
        implementation: trivialInsertModeCommands.oneMoreToSurround
    },
    [KeyMod.alt + "n"]: {
        type: "disamb",
    },
    [KeyMod.alt + "nR"]: {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function notation_rendering (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"rendering") }
    },
    [KeyMod.alt + "nP"]: {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function notation_prototype (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"prototype") }
    },
    [KeyMod.alt + "ni"]: {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: trivialInsertModeCommands.notation_iterate
    },
    [KeyMod.alt + "ns"]: {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function notation_separator (mode,instance) { return trivialInsertModeCommands.insertDescribedElement(mode,instance,"separator") }
    },
    [KeyMod.alt + "nr"]: {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: trivialInsertModeCommands.notation_render
    },
    [KeyMod.control + "l"]: {
        type: "command",
        argument: "none",
        implementation: trivialInsertModeCommands.oneLessToSurround
    },
    [KeyMod.control + ","]: {
        type: "command",
        argument: "none",
        implementation: commands.forceNewElement
    },
    [String.fromCharCode(0x08)]: { // Backspace
        type: "command",
        argument: "none",
        implementation: trivialInsertModeCommands.killPrevious
    },
    [String.fromCharCode(0x1b)]: { // Escape
        type: "command",
        argument: "none",
        implementation: commands.exit
    },
}
