/** 
 * @class Highly configurable command handler.
 * @param mode
 * @param options Options controlling the behaviour
 *        This has to be an object having the following
 *        fields:
 *        <dl>
 *        <dt>onNotExistingCommand (not implemented)</dt>
 *        <dd>forget,throw,inform,handBack</dd>
 *        <dt>onExistingButMalformedCommand (not implemented)</dt>
 *        <dd>forget,throw,inform,handBack</dd>
 *        <dt>backspace</dt>
 *        <dd>removeLast,asCommand</dd>
 *        <dt>repeating</dt>
 *        <dd>Boolean. When true, commands are not allowed to
 *        begin with a digit, except the command 0.</dd>
 *        </dl>
 * @param commandTable A table of all known commands
 *        For every command c, commandTable[c] must be an object
 *        holding the following fields:
 *        <dl>
 *        <td>category</dt>
 *        <dd>Can be set by the user to any value. It is not
 *        considered.</dd>
 *        <dt>type</dt>
 *        <dd>disamb,singleCharacterPreArgumentPrefix,command,longPrefix</dd>
 *        <dt>argument</dt>
 *        <dd>none,parameters,characters,newlineTerminated,manual,regex,selection</dd>
 *        <dt>argumentLineCount</dt>
 *        <dd>number of lines (only if argument=newlineTerminated,
 *        default is 1)</dd>
 *        <dt>argumentCharacterCount (only if argument=characters)</dt>
 *        <dd>unsigned integer</dd>
 *        <dt>extractArgument (only if argument=manual)</dt>
 *        <dd>function(commandHandler), returns undefined if not
 *        complete. (null is a valid argument!) This procedure must
 *        update commandHandler.pos! argument=manual is not
 *        recommended, since it tampers with the internals of the
 *        CommandHandler, so use it only if the other possiblilities
 *        for argument fail.</dd>
 *        <dt>argumentRegex (only if argument=regex)</dt>
 *        <dd>RegExp object, TODO</dd>
 *        <dt>repeating</dt>
 *        <dd>external,internal,prevent</dd>
 *        <dt>resultHandler</dt>
 *        <dd>function(mode,data,commandInfo,result)</dd>
 *        <dt>executionHandler</dt>
 *        <dd>function(mode,data,commandInfo)</dd>
 *        <dt>implementation</dt>
 *        <dd>function(mode,data,commandInfo)</dd>
 *        </dl>
 */
export function CommandHandler(mode,options,commandTable) {
    this.editor = mode.editor;
    this.mode = mode;
    this.options = options;
    this.commandTable = commandTable;
    this.selection = null;
}
CommandHandler.prototype = {
    pos: null,     // parsing state information
    buffer: null,  // parsing state information
    instance: null,// parsing state information
    /**
     * Parses the next command from the input buffer
     * @returns {CommandInstance} A CommandInstance containing all
     * information needed to execute the command. If an error has been
     * encountered or the command is incomplete, a CommandInstance is
     * returned as well and holds all information about the problem.
     */
    parse: function() {
        // Check handling of backspaces before copying the input
        // buffer
        if (this.options.backspace == "removeLast") {
            this.editor.applyBackspaceInInput();
        }
        const buffer = this.editor.inputBuffer;
        // Track where the next unprocessed character is  
        // in the input buffer, counting unicode characters
        this.pos = 0;
        // The command instance we are going to populate
        this.instance = new CommandInstance();
        // How often to repeat
        this.instance.repeat = 1; // will be deleted after parsing

        /* Repeating */
        const [newPos, repeat] = this.options.repeating ? scanRepeating(buffer) : [0, null];
        if (repeat !== null) {
            this.instance.repeat = repeat;
        }
        if (newPos === null) { return this.instance }

        /* single character arguments */
        const [newPos1, preArguments] = scanSingleCharacterPreArguments(this.commandTable, buffer.slice(newPos));
        if (newPos1 === null) { return this.instance }
        this.instance.singleCharacterPreArguments = preArguments;

        /* The command itself */
        const [newPos2, command, commandInfo, forceFlag] = scanCommand(this.commandTable, buffer.slice(newPos + newPos1));
        if (newPos2 === null) {
            return this.instance;
        }
        if (command === null) {
            this.instance.notFound = true;
            return this.instance;
        }

        this.instance.command = command;
        this.instance.commandInfo = commandInfo;
        this.instance.forceFlag = forceFlag;

        /* Argument */

        const [newPos3, argument, parameters] = scanArgument(this.instance.commandInfo, this.selection, buffer.slice(newPos + newPos1 + newPos2));

        if (newPos3 === null) { return this.instance }

        this.instance.argument = argument;
        this.instance.parameters = parameters;

        /* Complete instance object */
        if (this.instance.commandInfo.repeating=="internal") {
            this.instance.internalRepeat = this.instance.repeat;
        }
        else if (this.instance.commandInfo.repeating=="external") {
            this.instance.externalRepeat = this.instance.repeat;
        }
        //else if (this.instance.commandInfo.repeating=="prevent") { /* noop */ }
        delete this.instance.repeat;
        this.instance.mode = this.mode;
        this.instance.category = this.instance.commandInfo.category;
        this.instance.fullCommand = buffer.uSlice(0,newPos + newPos1 + newPos2 + newPos3);
        this.instance.selection = this.selection;
        this.instance.implementation = this.instance.commandInfo.implementation;
        this.instance.executionHandler = this.instance.commandInfo.executionHandler;
        this.instance.resultHandler = this.instance.commandInfo.resultHandler;

        this.instance.isComplete = true;

        /* Eat */
        if (newPos + newPos1 + newPos2 + newPos3 < 1) {
            throw new Error("Sum of positions must be at least 1 here");
        }
        this.editor.eatInput(newPos + newPos1 + newPos2 + newPos3);

        return this.instance; // Success!
    },
}

const repeatingRegex = /^([1-9][0-9]*)/;
const longRegex = /^([^\s!]+)(!?)((\s+)(.*))?\n/;

function scanRepeating(buffer) {
    // Fetch digits at the beginning. The first digit must not
    // be a 0.
    var matchRes = buffer.match(repeatingRegex);
    if (matchRes) {
        return [matchRes[1].uLength, parseInt(matchRes[1])];
    }
    else {
        return [0, null];
    }
}

function scanSingleCharacterPreArguments(commandTable, buffer) {
    var firstChar = buffer.uCharAt(0);
    var firstCharInfo = commandTable[firstChar];
    var pos = 0;
    var singleCharacterPreArguments = [];

    while (firstCharInfo && firstCharInfo.type == "singleCharacterPreArgumentPrefix") {
        ++pos; // Points now to the argument, if present
        if (buffer.uLength <= pos) {
            // The user started to enter a single
            // characterPreArgument by entering the prefix, but
            // the argument is still missing
            return [null, null];
        }
        singleCharacterPreArguments.push(buffer.uCharAt(pos));
        ++pos;
        firstChar = buffer.uCharAt(pos);
        firstCharInfo = commandTable[firstChar];
    }
    // After this loop, pos points to the next character after the
    // last single character argument. This characters exists,
    // since otherweise 0 would have already been returned by the
    // loop. firstChar holds this character and firstCharInfo
    // information about it from the command table.
    return [pos, singleCharacterPreArguments];
}

function scanCommand(commandTable, buffer) {
    var pos = 0;
    // Assure that there is at least one character
    if (buffer.uLength === 0) { return [null, null, null, null]; }
    var command = "";
    var commandInfo = null;
    // The mainloop. It terminates on its only if the command
    // is not yet complete. (that is, the command type is disamb)
    // In all other cases, return is called from withing the loop.
    while (pos < buffer.uLength) {
        command += buffer.uCharAt(pos);
        ++pos;
        commandInfo = commandTable[command];
        if (!commandInfo) {
            // command does not exist
            return [pos, null, null, null];
        }
        else if (commandInfo.type == "command") {
            // normal command
            return [pos, command, commandInfo, false];
        }
        else if (commandInfo.type == "disamb") {
            // Command is not yet complete, so read more
            // characters, that is, let the loop continue
        }
        else if (commandInfo.type == "longPrefix") {
            // Fetch the whole long command at once.
            // Here, pos points to the first character after the
            // prefix. We set it back such that it points to the
            // first character of the prefix, that is, the first
            // character of the command. (XXX: Is it dangerous to
            // do that?)
            pos -= command.length;
            var matchRes = buffer.slice(pos).match(longRegex);
            if (matchRes) {
                // The command seems to be complete
                command = matchRes[1];
                commandInfo = commandTable[command];
                if (!commandInfo) {
                    // command does not exist
                    return [pos, null, null, null];
                }
                // Is the force flag set?
                if (matchRes[2]) { forceFlag = true }
                // Move pos to first character of argument, or the
                // newline if there is no argument. (That is, skip
                // the command, the force flag and the whitespaces if present)
                pos += matchRes[1].length;
                if (matchRes[2]) { pos += matchRes[2].length; }
                if (matchRes[4]) { pos += matchRes[4].length; }
                // Check whether argument is none,
                // newlineTerminated or parameters. Other values
                // are not allowed.
                if (commandInfo.argument=="none") {
                    if (matchRes[5]) {
                        // Throw error since the user provided argument anyway
                        throw new Error("No argument expected");
                    }
                    else {
                        // move pos behind newline since no
                        // argument processing will be performed
                        pos += 1;
                    }
                }
                else if (commandInfo.argument!="newlineTerminated" && commandInfo.argument!="parameters") {
                    throw new Error("Error in command table")
                }
                return [pos, command, commandInfo, forceFlag];
            }
            else {
                return [null, null, null, null];
            }
        }
        else {
            throw new Error("Unsupported command table entry type: " + commandInfo.type + " (for command " + command + ")" ); //TODO
        }
    }
    // Since the loop terminated, command is not yet complete
    // entered by the user at this point.
    return [null, null, null, null];
}

function scanArgument(commandInfo, selection, buffer) {
    var pos = 0;
    var argument;
    var parameters;
    if (commandInfo.argument=="none") {
        argument = null;
        parameters = null;
    }
    else if (commandInfo.argument=="paramters") {
        // TODO: Parsing of paramters should be improved
        var end = buffer.uIndexOf("\n",pos);
        if (end==-1) {
            // Command is incomplete
            return [null, null, null];
        }
        var paramterStringList = buffer.uSlice(pos,end).split(" ");
        parameters = {};
        parameterStringList.forEach(function(s) {
            var equalSignIndex = s.indexOf("="); // Counting UTF16 characters
            if (equalSignIndex == -1) {
                throw new Error("Invalid parameter syntax");
            }
            parameters[s.slice(0,equalSignIndex)] = s.slice(equalSign+1);
        });
        argument = null;
        pos = end+1;
    }
    else if (commandInfo.argument=="newlineTerminated") {
        var end = buffer.uIndexOf("\n",pos);
        if (commandInfo.argumentLineCount) {
            for (var i=1; end!=-1 && i<commandInfo.argumentLineCount; ++i) {
                end = buffer.uIndexOf("\n",end+1);
            }
        }
        if (end==-1) {
            // Command is incomplete
            return [null, null, null];
        }
        parameters = null;
        argument = buffer.slice(pos,end);
        pos = end+1;
    }
    else if (commandInfo.argument=="characters") {
        var ccount = commandInfo.argumentCharacterCount
        if (buffer.uLength < pos + ccount) {
            // Command is incomplete
            return [null, null, null];
        }
        argument = buffer.uSlice(pos,pos+ccount);
        parameters = null;
        pos += ccount;
    }
    else if (commandInfo.argument=="manual") {
        argument = commandInfo.extractArgument(this);
        if (argument === undefined) {
            // Command is incomplete
            return [null, null, null];
        }
        parameters = null;
    }
    else if (commandInfo.argument=="regex") {
        // TODO
        throw new Error("regex not yet supported");
    }
    else if (commandInfo.argument=="selection") {
        // If selection is aleady set, we are done
        if (!selection) {
            // TODO
            throw new Error("Selection by argument is not yet supported");
        }
    }
    else {
        throw new Error("Unknown argument type: " + this.instance.commandInfo.argument);
    }

    return [pos, argument, parameters];
}

/** 
 * @class Represents the command the user entered. It stores the name
 * of the command, the given arguments, repeating, information from
 * the command table, and so on. It is also used to represent
 * incomplete, unknown or invalid commands.
 * The method execute() can be used to execute the command.
 */
function CommandInstance() {
    // Must create these objects for every object, since otherwise, the
    // array of the prototype could be modified accidentally
    /**
     * Array containing the single character pre-arguments.
     */
    this.singleCharacterPreArguments = [];
    /**
     * Parameters provided by the user.
     */
    this.parameters = {};
}
CommandInstance.prototype = {
    /**
     * Mode object this instance is bound to.
     */
    mode: null,
    /**
     * Name of the command, as the user entered it.
     */
    command: null,
    /**
     * The full command, including digits for repeating, single
     * character arguments, arguments, termination string and so on.
     */
    fullCommand: null,
    /**
     * The class of the command, as defined in the command table. The
     * CommandHandler and CommandInstance objects do not look at this
     * value.
     */
    category: null,
    /**
     * The entry of the command table associated to this command
     * instance.
     */
    commandInfo: null,
    /**
     * Long commands can have a force flag
     */
    forceFlag: false,
    /**
     * Argument as string
     */
    argument: null,
    /**
     * Selection
     */
    selection: null,
    /**
     * How many times the command should be repeated by the implementation itself
     */
    internalRepeat: 1,
    /**
     * How many times the execution mechanism has to call the
     * implementation
     */
    externalRepeat: 1,
    /**
     * Function that should be used to execute the command, instead of
     * executing it directly
     */
    executionHandler: null,
    /**
     * Function that has to be used to handle the result.
     */
    resultHandler: null,
    /**
     * The function that implements the command.
     * This function is caled by the execution mechanism, that is, by
     * the execute method of this object. The mode is given as first
     * parameter and this object as the second.
     */
    implementation: null,
    /**
     * Whether the instance can be executed. If not, it is maybe an
     * invalid command.
     */
    get isReadyToExecute() { return this.isComplete && !this.notFound && !this.isInvalid },
    /**
     * True if the command is complete, otherwise false.
     */
    isComplete: false,
    /**
     * True if the command does not exist. (In this case, the command
     * is still in the input buffer, since there is no way to find its
     * end.)
     */
    notFound: false,
    /**
     * True if the command has been found but can not be parsed since
     * its syntax is wrong.
     */
    isInvalid: false,
    /**
     * Executes the command
     */
    execute: function() {
        var result;
        if (!this.isReadyToExecute) {
            throw new Error("This command instance is not ready to be executed!")
        }
        for (var i = 0; i < this.externalRepeat; ++i) {
            if (this.executionHandler) {
                result = this.executionHandler(this.mode,this);
            }
            else {
                var result = this.implementation(this.mode,this);
                if (this.resultHandler) {
                    result = this.resultHandler(this.mode,this,result);
                }
            }
        }
        return result;
    },
};
