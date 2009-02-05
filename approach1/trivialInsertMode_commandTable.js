
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
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"mrow") }
    },
    "/": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"mfrac") }
    },
    "e": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"menclose") }
    },
    "r": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"msqrt") }
    },
    "R": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"mroot") }
    },
    "f": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"mfenced") }
    },
    "^": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"msup") }
    },
    "_": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"msub") }
    },
    "=": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"msubsup") }
    },
    "u": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"munder") }
    },
    "v": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"mover") }
    },
    "U": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"munderover") }
    },
    "m": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"mmultiscripts") }
    },
    ".": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"none") }
    },
    "p": {
        execute: function (mode) { trivialInsertModeCommand_insertDescribedElement(mode,"mprescripts") }
    },
    "t": {
        execute: trivialInsertModeCommand_table // For inserting table, tr or td elements
    },
    "\n": {
        execute: trivialInsertModeCommand_cursorJump
    },
}
trivialInsertModeCommands[String.fromCharCode(0x1b)] = { // Escape
    execute: trivialInsertModeCommand_exit
}

