import { KeyMod } from "./key.js";
import { commands } from "./trivialInsertMode.js";

export const trivialInsertModeCommandOptions = {
    repeating: true,
}

export const trivialInsertModeCommands = {
    "i": {
        type: "command",
        repeating: "external",
        argument: "characters",
        argumentCharacterCount: 1,
        implementation: function mi (mode,instance) { return commands.insertDescribedElement(mode,instance,"mi") }
    },
    "I": {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: function mi (mode,instance) { return commands.insertDescribedElement(mode,instance,"mi") }
    },
    "n": {
        type: "command",
        repeating: "external",
        argument: "manual",
        extractArgument: function(commandHandler) {
            var s = commandHandler.buffer.slice(commandHandler.pos);
            // The following regex is intentionally made such that it
            // does not much if and only if the argument is not known
            // to be complete.
            var res = /^([+-]?[0-9.]*)[^0-9.]/.exec(s);
            if (res) {
                commandHandler.pos += res[1].length;
                return res[1];
            }
            else { 
                // Command is not complete
                return undefined;
            }
        },
        implementation: function mn (mode,instance) { return commands.insertDescribedElement(mode,instance,"mn") }
    },
    "N": {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: function mn (mode,instance) { return commands.insertDescribedElement(mode,instance,"mn") }
    },
    "o": {
        type: "command",
        repeating: "external",
        argument: "characters",
        argumentCharacterCount: 1,
        implementation: function mo (mode,instance) { return commands.insertDescribedElement(mode,instance,"mo") }
    },
    "O": {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: function mo (mode,instance) { return commands.insertDescribedElement(mode,instance,"mo") }
    },
    "s": {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: function mtext (mode,instance) { return commands.insertDescribedElement(mode,instance,"mtext") }
    },
    " ": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function mrow (mode,instance) { return commands.insertDescribedElement(mode,instance,"mrow") }
    },
    "/": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function mfrac (mode,instance) { return commands.insertDescribedElement(mode,instance,"mfrac") }
    },
    "e": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function menclose (mode,instance) { return commands.insertDescribedElement(mode,instance,"menclose") }
    },
    "r": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function msqrt (mode,instance) { return commands.insertDescribedElement(mode,instance,"msqrt") }
    },
    "R": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function mroot (mode,instance) { return commands.insertDescribedElement(mode,instance,"mroot") }
    },
    "f": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function mfenced (mode,instance) { return commands.insertDescribedElement(mode,instance,"mfenced") }
    },
    "^": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function msup (mode,instance) { return commands.insertDescribedElement(mode,instance,"msup") }
    },
    "_": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function msub (mode,instance) { return commands.insertDescribedElement(mode,instance,"msub") }
    },
    "=": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function msubsup (mode,instance) { return commands.insertDescribedElement(mode,instance,"msubsup") }
    },
    "u": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function munder (mode,instance) { return commands.insertDescribedElement(mode,instance,"munder") }
    },
    "v": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function mover (mode,instance) { return commands.insertDescribedElement(mode,instance,"mover") }
    },
    "U": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function munderover (mode,instance) { return commands.insertDescribedElement(mode,instance,"munderover") }
    },
    "V": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function munderover (mode,instance) { return commands.insertDescribedElement(mode,instance,"munderover") }
    },
    "m": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function mmultiscripts (mode,instance) { return commands.insertDescribedElement(mode,instance,"mmultiscripts") }
    },
    ".": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function none (mode,instance) { return commands.insertDescribedElement(mode,instance,"none") }
    },
    "p": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function mprescripts (mode,instance) { return commands.insertDescribedElement(mode,instance,"mprescripts") }
    },
    "P": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function mphantom (mode,instance) { return commands.insertDescribedElement(mode,instance,"mphantom") }
    },
    "t": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.table // For inserting table, tr or td elements
    },
    "T": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.mlabeledtr // For inserting table, tr or td elements
    },
    "\n": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.cursorJump
    },
    "h": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.oneMoreToSurround
    },
    "l": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.oneLessToSurround
    },
    [KeyMod.alt]: {
        type: "disamb",
    },
    [KeyMod.alt + "n"]: {
        type: "disamb",
    },
    [KeyMod.alt + "nR"]: {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function notation_rendering (mode,instance) { return commands.insertDescribedElement(mode,instance,"rendering") }
    },
    [KeyMod.alt + "nP"]: {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function notation_prototype (mode,instance) { return commands.insertDescribedElement(mode,instance,"prototype") }
    },
    [KeyMod.alt + "ni"]: {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: commands.notation_iterate
    },
    [KeyMod.alt + "ns"]: {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function notation_separator (mode,instance) { return commands.insertDescribedElement(mode,instance,"separator") }
    },
    [KeyMod.alt + "nr"]: {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: commands.notation_render
    },
    [String.fromCharCode(0x08)]: { // Backspace
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: commands.killPrevious
    },
    [String.fromCharCode(0x1b)]: { // Escape
        type: "command",
        repeating: "prevent",
        argument: "none",
        implementation: commands.exit
    },
}
