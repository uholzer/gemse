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
    repeatingRegex: /^([1-9][0-9]*)/,
    longRegex: /^([^\s!]+)(!?)((\s+)(.*))?\n/,
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
        // Make a string object from the buffer, so the optimisations
        // from UString kick in. (buffer must not be changed during
        // the parsing process.
        this.buffer = new String(this.editor.inputBuffer);
        // Track where the next unprocessed character is  
        // in the input buffer, counting unicode characters
        this.pos = 0;
        // The command instance we are going to populate
        this.instance = new CommandInstance();
        // How often to repeat
        this.instance.repeat = 1; // will be deleted after parsing

        // Tells whether we can continue parsing
        var goOn = true;

        /* Repeating */
        if (this.options.repeating) {
            goOn = this.scanRepeating();
        }
        if (!goOn) { return this.instance }

        /* single character arguments */
        goOn = this.scanSingleCharacterPreArguments();
        if (!goOn) { return this.instance }

        /* The command itself */
        goOn = this.scanCommand();
        if (!goOn) { return this.instance }

        /* Argument */
        goOn = this.scanArgument();
        if (!goOn) { return this.instance }

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
        this.instance.fullCommand = this.buffer.uSlice(0,this.pos);
        this.instance.selection = this.selection;
        this.instance.implementation = this.instance.commandInfo.implementation;
        this.instance.executionHandler = this.instance.commandInfo.executionHandler;
        this.instance.resultHandler = this.instance.commandInfo.resultHandler;

        this.instance.isComplete = true;

        /* Eat */
        if (this.pos < 1) {
            throw new Error("pos must be at least 1 here");
        }
        this.editor.eatInput(this.pos);

        return this.instance; // Success!
    },
    /* Maybe it will be possible to use the following procedures from
     * the outside. They could come in handy, if you just need to
     * parse a subexpression of a more complex command.
     * This is the reason why state information of the parsing is
     * stored as properties of the parser object.
     */
    scanRepeating: function() {
        // Fetch digits at the beginning. The first digit must not
        // be a 0.
        if (this.pos > 0) { throw new Error("scanRepeating requires pos to be 0"); }
        var matchRes = this.buffer.match(this.repeatingRegex);
        if (matchRes) {
            this.instance.repeat = parseInt(matchRes[1]);
            this.pos += matchRes[1].uLength;
        }
        return true; // Go on with parsing in any case
    },
    scanSingleCharacterPreArguments: function() {
        var firstChar = this.buffer.uCharAt(this.pos);
        var firstCharInfo = this.commandTable[firstChar];

        while (firstCharInfo && firstCharInfo.type == "singleCharacterPreArgumentPrefix") {
            ++this.pos; // Points now to the argument, if present
            if (this.buffer.uLength<=this.pos) { 
                // The user started to enter a single
                // characterPreArgument by entering the prefix, but
                // the argument is still missing
                return false;
            }
            this.instance.singleCharacterPreArguments.push(this.buffer.uCharAt(this.pos));
            ++this.pos;
            firstChar = this.buffer.uCharAt(this.pos);
            firstCharInfo = this.commandTable[firstChar];
        }
        return true;
        // After this loop, pos points to the next character after the
        // last single character argument. This characters exists,
        // since otherweise 0 would have already been returned by the
        // loop. firstChar holds this character and firstCharInfo
        // information about it from the command table.
    },
    scanCommand: function() {
        // Assure that there is at least one character
        if (this.pos >= this.buffer.uLength) { return false; }
        var command = "";
        var commandInfo = null;
        // The mainloop. It terminates on its only if the command
        // is not yet complete. (that is, the command type is disamb)
        // In all other cases, return is called from withing the loop.
        while (this.pos < this.buffer.uLength) {
            command += this.buffer.uCharAt(this.pos);
            ++this.pos;
            commandInfo = this.commandTable[command];
            if (!commandInfo) {
                // command does not exist
                this.instance.notFound = true;
                return false;
            }
            else if (commandInfo.type == "command") {
                // normal command
                this.instance.command     = command;
                this.instance.commandInfo = commandInfo;
                return true;
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
                this.pos -= command.length;
                var matchRes = this.buffer.slice(this.pos).match(this.longRegex);
                if (matchRes) {
                    // The command seems to be complete
                    command = matchRes[1];
                    commandInfo = this.commandTable[command];
                    if (!commandInfo) {
                        // command does not exist
                        this.instance.notFound = true;
                        return false;
                    }
                    // Is the force flag set?
                    if (matchRes[2]) { this.instance.forceFlag = true }
                    // Move pos to first character of argument, or the
                    // newline if there is no argument. (That is, skip
                    // the command, the force flag and the whitespaces if present)
                    this.pos += matchRes[1].length;
                    if (matchRes[2]) { this.pos += matchRes[2].length; }
                    if (matchRes[4]) { this.pos += matchRes[4].length; }
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
                            this.pos += 1;
                        }
                    }
                    else if (commandInfo.argument!="newlineTerminated" && commandInfo.argument!="parameters") {
                        throw new Error("Error in command table")
                    }
                    this.instance.command     = command;
                    this.instance.commandInfo = commandInfo;
                    return true;
                }
                else {
                    // The command is incomplete
                    this.editor.applyBackspaceInInput();
                    break; // terminate the loop
                }
            }
            else {
                throw new Error("Unsupported command table entry type: " + commandInfo.type + " (for command " + command + ")" ); //TODO
            }
        }
        // Since the loop terminated, command is not yet complete
        // entered by the user at this point.
        return false;
    },
    scanArgument: function() {
        var argument;
        var parameters;
        if (this.instance.commandInfo.argument=="none") {
            argument = null;
            parameters = null;
        }
        else if (this.instance.commandInfo.argument=="paramters") {
            // TODO: Parsing of paramters should be improved
            var end = this.buffer.uIndexOf("\n",this.pos);
            if (end==-1) {
                // Command is incomplete
                return false;
            }
            var paramterStringList = buffer.uSlice(this.pos,end).split(" ");
            parameters = {};
            parameterStringList.forEach(function(s) {
                var equalSignIndex = s.indexOf("="); // Counting UTF16 characters
                if (equalSignIndex == -1) {
                    throw new Error("Invalid parameter syntax");
                }
                parameters[s.slice(0,equalSignIndex)] = s.slice(equalSign+1);
            });
            argument = null;
            this.pos = end+1;
        }
        else if (this.instance.commandInfo.argument=="newlineTerminated") {
            var end = this.buffer.uIndexOf("\n",this.pos);
            if (this.instance.commandInfo.argumentLineCount) {
                for (var i=1; end!=-1 && i<this.instance.commandInfo.argumentLineCount; ++i) {
                    end = this.buffer.uIndexOf("\n",end+1);
                }
            }
            if (end==-1) {
                // Command is incomplete
                return false;
            }
            parameters = null;
            argument = this.buffer.slice(this.pos,end);
            this.pos = end+1;
        }
        else if (this.instance.commandInfo.argument=="characters") {
            var ccount = this.instance.commandInfo.argumentCharacterCount
            if (this.buffer.uLength < this.pos + ccount) {
                // Command is incomplete
                return false;
            }
            argument = this.buffer.uSlice(this.pos,this.pos+ccount);
            parameters = null;
            this.pos += ccount;
        }
        else if (this.instance.commandInfo.argument=="manual") {
            argument = this.instance.commandInfo.extractArgument(this);
            if (argument === undefined) {
                // Command is incomplete
                return false;
            }
            parameters = null;
        }
        else if (this.instance.commandInfo.argument=="regex") {
            // TODO
            throw new Error("regex not yet supported");
        }
        else if (this.instance.commandInfo.argument=="selection") {
            // If selection is aleady set, we are done
            if (!this.selection) {
                // TODO
                throw new Error("Selection by argument is not yet supported");
            }
        }
        else {
            throw new Error("Unknown argument type: " + this.instance.commandInfo.argument);
        }
        
        this.instance.argument = argument;
        this.instance.parameters = parameters;
        return true;
    },
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
