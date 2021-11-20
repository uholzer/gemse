/**
 * @class Facility for handling options
 * The scope of an option has two axis, an object axis
 * {global, class, object} and the equation axis {eqindep, eqlocal}.
 * Options can be desclared globally or by a class. In the second
 * case, the option can be declared as local to the class. The user
 * can set an option in some scope. If the option is declared local to
 * a class, the scope can not be global.
 *
 * In this implementation, the scope (object, eqlocal) does not exist.
 * same as (object, eqindep). (This is because the scope 
 * (object, eqlocal) is not used by any object. It would be possible
 * to implement it, but then the objects needing it would have to ask
 * the OptionsAssistant for changes everytime the current equation
 * changes.)
 *
 * Objects that whish to access options do not need to care about the
 * scope, they always get the options from (object, eqindep). When
 * setting options however, the scope has to be given. 
 * When an object O of class looks up an option while equation E is
 * the current equation, the scopes are searched for a
 * value in the following order (by traversing the prototype-chain):
 * (O, eqindep), (C, E), (C, eqindep), (global, E), (global, eqindep)
 *
 * Every object is supposed to get an options object (it should store
 * it as a member called 'o') through the OptionsAssistant, stating
 * which scope it cares about. The OptionsAssistant takes the freedom
 * to store its stuff in the objects using the property 
 * _optionsAssistantCache. In classes, the same property is used. 
 * Options in the scope
 * (global, E) and (Class, E) are stored in the equations themselves
 * in a property of the name _optionsAssistantCache. All these are not
 * referenced by the OptionsAssistant from anywhere else except by the options objects higher
 * in the prototype stack. This should prevent memory leaks. (In other
 * words, objects and equations that have options do not need to
 * opt-out when they get destroyed.)
 */
export function OptionsAssistant() {
    /**
     * Holds all descriptions. Do not write directly, use
     * loadDescriptions to add options.
     */
    this.descs = {};
    /**
     * Holds global options
     * @private
     */
    this.global_eqindep_o = new OptionsCache('OptionsAssistant, global eqindep');
    this.global_eqlocal_o = new OptionsCache('OptionsAssistant, global eqlocal');;
    this.global_eqlocal_o.__proto__ = this.global_eqindep_o;
    /**
     * List of classes
     */
    this.classes = [];
    /**
     * Equation that is considered to be current. May be null. The
     * object it points to (if it is not null) must have property
     * _optionsAssistantCache pointing to an array.
     */
    this.currentEquation = null;
}
OptionsAssistant.prototype = {
    obtainOptionsObject: function(forClass,forObject,eqindep) {
        return this.obtainOptionsCache(forClass,forObject,(eqindep ?  null : true));
    },
    /**
     * @private
     */
    obtainOptionsCache: function(localToClass,localToObject,localToEquation) {
        // Note that if the class forClass is already known, then 
        // this.currentEquation._optionsAssistantCache.*[classIndex]
        // does already exist, as ensured by setCurrentEquation and
        // the block of the following if statement
        if (localToClass) {
            var classIndex;
            if (this.classes.lastIndexOf(localToClass)==-1) {
                classIndex = this.classes.push(localToClass) - 1;
                localToClass._optionsAssistantCache = { eqindep: new OptionsCache('class, classlocal eqindep'), eqlocal: new OptionsCache('class, classlocal eqlocal') };
                if (this.currentEquation) {
                    this.currentEquation._optionsAssistantCache.classlocal[classIndex] = new OptionsCache('equation, classlocal');
                }
                localToClass._optionsAssistantCache.eqlocal.__proto__ = localToClass._optionsAssistantCache.eqindep;
                localToClass._optionsAssistantCache.eqindep.__proto__ = this.global_eqlocal_o;
            }
        }
        if (localToObject) {
            if (!localToObject._optionsAssistantCache) {
                localToObject._optionsAssistantCache = new OptionsCache('object, objlocal');
                if (!localToClass) {
                    throw new Error("OptionsAssistant expects class to be specified when obtaining an object-local obtions object.");
                }
                localToObject._optionsAssistantCache.__proto__ = this.obtainOptionsCache(localToClass,null,true);
            }            
            return localToObject._optionsAssistantCache;
        }
        else if (localToEquation) { // Captures both cases
            if (localToClass) {
                return localToClass._optionsAssistantCache.eqlocal;
            }
            else {
                return this.global_eqlocal_o;
            }
        }
        else if (localToClass) { // and eqindep
            return localToClass._optionsAssistantCache.eqindep;
        }
        else {
            return this.global_eqindep_o;
        }
    },
    set: function(name,value,localToClass,localToObject,localToEquation) {
        if (!this.descs[name]) {
            throw new Error("There is no option called '" + name + "'.\n");
        }
        // Validate
        if (!this.descs[name].validator(value)) {
            throw new Error("'" + value + "' is not a valid value for the option '"
                        + name + "'.\n");
        }
        // Find out which options object to use
        var cache = this.obtainOptionsCache(localToClass||this.descs[name].localToClass,localToObject,localToEquation);
        // Set into the options object
        this.descs[name].setter(cache,value);
        cache["_" + name] = value;
    },
    remove: function(name,localToClass,localToObject,localToEquation) {
        var cache = this.obtainOptionsCache(localToClass||this.descs[name].localToClass,localToObject,localToEquation);
        this.descs[name].remover(cache);
        delete cache["_" + name];
    },
    inheritanceInfo: function(name,localToClass,localToObject,localToEquation) {
        //XXX: Might be broken, especially when this.currentEquation==null
        localToClass = localToClass || this.descs[name].localToClass;
        var top_o = this.obtainOptionsCache(localToClass,localToObject,localToEquation);
        var global_eqindep_v = this.global_eqindep_o["_"+name];
        var global_eqlocal_v = this.global_eqlocal_o["_"+name];
        var classlocal_eqindep_v = localToClass ? localToClass._optionsAssistantCache.eqindep["_"+name] : null;
        var classlocal_eqlocal_v = localToClass ? localToClass._optionsAssistantCache.eqlocal["_"+name] : null;
        var objlocal_eqindep_v = localToObject ? localToObject._optionsAssistantCache["_"+name] : null;

        function OptionInheritanceInfo() {
            this.global_eqindep = global_eqindep_v;
            this.global_eqlocal = global_eqlocal_v;
            this.classlocal_eqindep = classlocal_eqindep_v;
            this.classlocal_eqlocal = classlocal_eqlocal_v;
            this.objlocal_eqindep = objlocal_eqindep_v;
        }
        OptionInheritanceInfo.prototype = {
            toString: function() {
                var s = "";
                s += "global: (independent of equation: " + this.global_eqindep;
                s += ", local to equation: " + this.global_eqlocal + "); ";
                s += "local to class: (independent of equation: " + this.classlocal_eqindep;
                s += ", local to equation: " + this.classlocal_eqlocal + "); ";
                if (this.global_eqindep!==undefined) {
                    s += "local to object: (independent of equation: " + this.global_eqindep;
                    s += "); ";
                }
                return s;
            }
        };

       return new OptionInheritanceInfo();
    },
    setDefault: function(name) {
        this.set(name,this.descs[name].defaultValue);
    },
    /**
     * Loads option descriptions and sets defaults
     */
    loadDescriptions: function(newDescs) {
        // First load all options
        for (var name in newDescs) {
            this.descs[name] = newDescs[name];
        }
        // Set defaults for the loaded options
        // TODO: An option may depend on another one, so setting it
        // may require having set the other before. May there arise
        // problems out of this, is there an easy solution?
        for (var name in newDescs) {
            this.setDefault(name);
        }
    },
    /**
     * Changes the equation that is considered the current one by the
     * OptionsAssistant. It may not be set to null.
     */
    setCurrentEquation: function(equation) {
        // Note: Never set a __proto__ to null! This leads to problems
        // while debugging, since it becomes impossible to inspect an
        // object. (One can set it to Object.prototype)
        // Check availability of _optionsAssistantCache on equation
        if (!equation._optionsAssistantCache) {
            var emptyClasslocal = [];
            for (var i=0; i<this.classes.length; ++i) { 
                var obj = new OptionsCache('equation, classlocal');
                emptyClasslocal.push(obj);
            }
            var emptyGlobal = new OptionsCache('equation, global');
            equation._optionsAssistantCache = {global: emptyGlobal, classlocal: emptyClasslocal};
        }

        // Set global_eqlocal_o and make shure its prototype is correct
        if (this.currentEquation) {
            // Make copy of old eqlocal options
            this.clearProperties(this.currentEquation._optionsAssistantCache.global);
            this.copyProperties(this.currentEquation._optionsAssistantCache.global, this.global_eqlocal_o);
        }
        // Create empty object for equation if missing
        if (!equation._optionsAssistantCache.global) {
            equation._optionsAssistantCache.global = new OptionsCache('OptionsAssistant, global eqlocal');
        }
        // Copy over properties from object of equation
        this.clearProperties(this.global_eqlocal_o);
        this.copyProperties(this.global_eqlocal_o, equation._optionsAssistantCache.global);
        // Set prototype
        this.global_eqlocal_o.__proto__ = this.global_eqindep_o;

        // Loop over all classes
        this.classes.forEach(function (c, i) {
            if (this.currentEquation) {
                // Make copy of old eqlocal options
                this.clearProperties(this.currentEquation._optionsAssistantCache.classlocal[i]);
                this.copyProperties(this.currentEquation._optionsAssistantCache.classlocal[i], c._optionsAssistantCache.eqlocal);
            }

            // Create empty object for equation if missing
            if (!equation._optionsAssistantCache.classlocal[i]) {
                equation._optionsAssistantCache.classlocal[i] = new OptionsCache('equation, classlocal');
            }

            // Copy over properties from object of equation
            this.clearProperties(c._optionsAssistantCache.eqlocal);
            this.copyProperties(c._optionsAssistantCache.eqlocal, equation._optionsAssistantCache.classlocal[i]);

            // Set prototype of eqindep to global_eqdep_o
            c._optionsAssistantCache.eqlocal.__proto__ = c._optionsAssistantCache.eqindep;
        }, this);
            
        this.currentEquation = equation;
    },
    /**
     * @private
     */
    clearProperties: function(obj) { 
        // Although this also loops over properties inherited from the
        // prototype, they do not get deleted from the prototype.
        for (var key in obj) {
            delete obj[key];
        }
    },
    /**
     * Copies all enumerable Properties of the template to obj. (Properties from
     * the prototype-chain of template are not included.)
     */
    copyProperties: function(obj, template) {
        // XXX: Maybe we should use Object.defineProperties instead,
        // although it has been introduced in Mozilla 2.
        // XXX: Problem: The following loops also over properties
        // inherited from the prototype. Workaround: Remove prototype
        // temporarly.
        var preservedPrototype = template.__proto__;
        template.__proto__ = Object.prototype;
        for (var key in template) {
            obj[key] = template[key];
        }
        template.__proto__ = preservedPrototype;
    },
}
OptionsAssistant.debugidcounter = 0;
OptionsAssistant.validators = {
    /** For parsers.truthVal */
    truthVal: function(value) {
        return (value=="on" ||value=="true" ||value=="1"||value=="yes"||
                value=="off"||value=="false"||value=="0"||value=="no");
    },
    /** For parsers.number_integer */
    number_integer: function(value) {
        return /^[+-]?(0x)?\d+/.test(value);
    },
    /** For parsers.number_integer */
    number_positiveInteger: function(value) {
        return number_integer(value) && (OptionsAssistant.parsers.number_integer(value) > 0);
    },
    /** For parsers.number_integer */
    number_positiveIntegerOrZero: function(value) {
        return number_integer(value) && (OptionsAssistant.parsers.number_integer(value) >= 0);
    },
    /** For parsers.number_float */
    number_float: function(value) {
        return /^[+-]?\d+(.\d+)?/.test(value);
    },
    /** For parsers.number_float */
    number_positiveFloat: function(value) {
        return number_float(value) && (OptionsAssistant.parsers.number_float(value) > 0);
    },
    /** For parsers.number_float */
    number_positiveFloatOrZero: function(value) {
        return number_float(value) && (OptionsAssistant.parsers.number_float(value) >= 0);
    },
};
OptionsAssistant.parsers = {
    truthVal: function(value) {
        return (value=="on"||value=="true"||value=="1"||value=="yes");
    },
    number_integer: function(value) {
        return parseFloat(value);
    },
    number_float: function(value) {
        return parseFloat(value);
    },
};

function OptionsCache(debugusage) {
    this.__debugid = OptionsAssistant.debugidcounter++;
    this.__debugusage = debugusage;
}
