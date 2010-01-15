/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */


trivialInsertModeCommandOptions = {
    repeating: true,
}

trivialInsertModeCommands = {
    "i": {
        type: "command",
        repeating: "external",
        argument: "characters",
        argumentCharacterCount: 1,
        implementation: function trivialInsertModeCommand_mi (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mi") }
    },
    "I": {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: function trivialInsertModeCommand_mi (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mi") }
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
        implementation: function trivialInsertModeCommand_mn (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mn") }
    },
    "N": {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: function trivialInsertModeCommand_mn (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mn") }
    },
    "o": {
        type: "command",
        repeating: "external",
        argument: "characters",
        argumentCharacterCount: 1,
        implementation: function trivialInsertModeCommand_mo (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mo") }
    },
    "O": {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: function trivialInsertModeCommand_mo (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mo") }
    },
    "s": {
        type: "command",
        repeating: "external",
        argument: "newlineTerminated",
        implementation: function trivialInsertModeCommand_mtext (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mtext") }
    },
    " ": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_mrow (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mrow") }
    },
    "/": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_mfrac (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mfrac") }
    },
    "e": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_menclose (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"menclose") }
    },
    "r": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_msqrt (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"msqrt") }
    },
    "R": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_mroot (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mroot") }
    },
    "f": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_mfenced (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mfenced") }
    },
    "^": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_msup (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"msup") }
    },
    "_": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_msub (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"msub") }
    },
    "=": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_msubsup (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"msubsup") }
    },
    "u": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_munder (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"munder") }
    },
    "v": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_mover (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mover") }
    },
    "U": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_munderover (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"munderover") }
    },
    "m": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_mmultiscripts (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mmultiscripts") }
    },
    ".": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_none (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"none") }
    },
    "p": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: function trivialInsertModeCommand_mprescripts (mode,instance) { return trivialInsertModeCommand_insertDescribedElement(mode,instance,"mprescripts") }
    },
    "t": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: trivialInsertModeCommand_table // For inserting table, tr or td elements
    },
    "T": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: trivialInsertModeCommand_mlabeledtr // For inserting table, tr or td elements
    },
    "\n": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: trivialInsertModeCommand_cursorJump
    },
    "h": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: trivialInsertModeCommand_oneMoreToSurround
    },
    "l": {
        type: "command",
        repeating: "external",
        argument: "none",
        implementation: trivialInsertModeCommand_oneLessToSurround
    },
}
trivialInsertModeCommands[String.fromCharCode(0x08)] = { // Backspace
    type: "command",
    repeating: "external",
    argument: "none",
    implementation: trivialInsertModeCommand_killPrevious
}
trivialInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    type: "command",
    repeating: "prevent",
    argument: "none",
    implementation: trivialInsertModeCommand_exit
}

