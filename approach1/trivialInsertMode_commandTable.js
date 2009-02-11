
trivialInsertModeCommands = {
    "i": {
        execute: trivialInsertModeCommand_miSingle
    },
    "I": {
        execute: trivialInsertModeCommand_miLong
    },
    "n": {
        execute: trivialInsertModeCommand_mnNormal
    },
    "N": {
        execute: trivialInsertModeCommand_mnLong
    },
    "o": {
        execute: trivialInsertModeCommand_moNormal
    },
    "O": {
        execute: trivialInsertModeCommand_moLong
    },
    "t": {
        execute: trivialInsertModeCommand_mtext
    },
    " ": {
        execute: function trivialInsertModeCommand_mrow (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mrow") }
    },
    "/": {
        execute: function trivialInsertModeCommand_mfrac (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mfrac") }
    },
    "e": {
        execute: function trivialInsertModeCommand_menclose (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"menclose") }
    },
    "r": {
        execute: function trivialInsertModeCommand_msqrt (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msqrt") }
    },
    "R": {
        execute: function trivialInsertModeCommand_mroot (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mroot") }
    },
    "f": {
        execute: function trivialInsertModeCommand_mfenced (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mfenced") }
    },
    "^": {
        execute: function trivialInsertModeCommand_msup (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msup") }
    },
    "_": {
        execute: function trivialInsertModeCommand_msub (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msub") }
    },
    "=": {
        execute: function trivialInsertModeCommand_msubsup (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"msubsup") }
    },
    "u": {
        execute: function trivialInsertModeCommand_munder (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"munder") }
    },
    "v": {
        execute: function trivialInsertModeCommand_mover (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mover") }
    },
    "U": {
        execute: function trivialInsertModeCommand_munderover (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"munderover") }
    },
    "m": {
        execute: function trivialInsertModeCommand_mmultiscripts (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mmultiscripts") }
    },
    ".": {
        execute: function trivialInsertModeCommand_none (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"none") }
    },
    "p": {
        execute: function trivialInsertModeCommand_mprescripts (mode,command) { return trivialInsertModeCommand_insertDescribedElement(mode,command,"mprescripts") }
    },
    "t": {
        execute: trivialInsertModeCommand_table // For inserting table, tr or td elements
    },
    "T": {
        execute: trivialInsertModeCommand_mlabeledtr // For inserting table, tr or td elements
    },
    "\n": {
        execute: trivialInsertModeCommand_cursorJump
    },
}
trivialInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    execute: trivialInsertModeCommand_exit
}

