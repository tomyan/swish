
soda.module({
    'name' : 'shell',
    'code' : function () {
        var ns = {};

        var $      = glow.dom.get,
            create = glow.dom.create,
            bind   = glow.events.addListener,
            unbind = glow.events.removeListener,
            fire   = glow.events.fire;

        var View = function () {};

        View.prototype.init = function (to) {
            this.element = create(
                '<div class="shell">' +
                  '<ol>' +
                    '<li>' +
                      '<form action="#" method="post">' +
                        '<p>' +
                          '<input autocomplete="off" type="text">' +
                          '<input type="submit" value="Enter">' +
                        '</p>' +
                      '</form>' +
                    '</li>' +
                  '</ol>' +
                    // taking mask out for now as it stops text selection
//                  '<div class="mask"></div>' +
                '</div>'
            );
            this.element.appendTo(to);
            this.commandInput = $(this.element.get('input')[0]);
            this.form = this.element.get('form');
            this.outputList = this.element.get('ol');
            this.formListItem = $(this.outputList.children()[0]);
            this.focusInput();
        };

        View.prototype.focusInput = function () {
            this.commandInput[0].focus();
        };

        View.prototype.initEventHandlers = function (controller) {
            bind(this.commandInput, 'keydown',  controller.onkeydown,  controller);
            bind(this.commandInput, 'keyup',    controller.onkeyup,    controller);
            bind(this.commandInput, 'keypress', controller.onkeypress, controller);
            bind(this.form,         'submit',   function () { return false; });

            // TODO get focus to remain in the command input whilst allowing the user
            // to select, copy and paste other text into the command input
            // a bit of a challenge...

            bind(
                window,
                'focus',
                function (e) {
                    if (e.source == e.attachedTo)
                        this.focusInput();
                  },
                 this
            );

            // these seem to break copy and paste
            // need a way to do this without it being a huge pain in the arse
            //bind(window, 'keydown', function () { this.focusInput(); }, this);
            //bind(window, 'focus',    function () { this.focusInput(); }, this);
        };

        View.prototype.currentCommand = function () {
            return this.commandInput.val();
        };

        View.prototype.setSearchBackwardsPrompt = function () {
            this.resetPrompt();
            this.formListItem.addClass('search-backwards');
        };

        View.prototype.setSearchForwardsPrompt = function () {
            this.resetPrompt();
            this.formListItem.addClass('search-forwards');
        };

        View.prototype.resetPrompt = function () {
            this.formListItem[0].className = '';
        };

        View.prototype.setCurrentCommand = function (command) {
            this.commandInput.val(command);
        };

        View.prototype.getCommand = function () {
            var command = this.currentCommand();
            delete this.currentCommandOutput;
            this.resetPrompt();
            var previous = this.lastCommandListItem = create('<li></li>');
            previous.text(command); 
            this.formListItem.before(previous);
            this.commandInput.val('');
            this.scrollToEnd();
            return command;
        };

        View.prototype.scrollToEnd = function () {
            // TODO fix this
            window.scrollTo(0, 9999999);
        };

        View.prototype.addCommandOutput = function (output) {
            if (! this.currentCommandOutput) {
                this.currentCommandOutput = create('<pre class="output"></pre>');
                this.currentCommandOutput.appendTo(this.lastCommandListItem);
            }
            // TODO optimise this? (appending to innerText works okay in Chrome but not FF)
            this.currentCommandOutput.text(this.currentCommandOutput.text() + output);
        };

        View.prototype.outputError = function (message) {
            var errorView = create('<pre class="error"></pre>');
            errorView.text(message);
            errorView.appendTo(this.lastCommandListItem);
        };

        View.prototype.clear = function () {
            this.outputList.html('');
            this.formListItem.appendTo(this.outputList);
            this.focusInput();
        };

        var CommandExecutionContext = function (command, controller, view) {
            this.command = command;
            this.controller = controller;
            this.view = view;
        };

        CommandExecutionContext.prototype.run = function (args) {
            this.command.func.apply(this, args);
        };

        CommandExecutionContext.prototype.print = function (output) {
            fire(this, 'output', { 'output' : output });
            this.view.scrollToEnd();
        };

        CommandExecutionContext.prototype.say = function (output) {
            this.print(output + '\n');
        };

        var Command = function (func) {
            this.func = func;
        };

        Command.prototype.context = function (controller) {
            return new CommandExecutionContext(this, controller, controller.view);
        };

        var Controller = function () {
            this.view = new View();
            this.view.init('body');
            this.view.initEventHandlers(this);
            this.history = [];
            // this is a sparse array of modified versions of the history that is overwritten after
            // every command
            this.currentHistory = [];
            this.currentHistoryPosition = 0;
        };

        var builtins = {};

        builtins.clear = new Command(function () {
            this.view.clear();
        });

        builtins.help = new Command(function () {
            this.say('Shell Help\n');
            this.say('Builtin commands are:');
            var commands = [];
            for (var i in builtins) {
                commands.push(i);
            }
            this.print('    ' + commands.sort().join(', '));
        });

        builtins.history = new Command(function () {
            this.print(this.controller.history.join('\n'));
        });

        builtins.echo = new Command(function () {
            this.print(Array.prototype.join.call(arguments, ' '));
        });

        var keys = {
            'press=ENTER'       : 'processCommand',
            'press=CTRL+l'      : 'clearScreen',
            'down=CTRL+r'       : 'startSearchBackwards',
            'press=CTRL+r'      : null,
            'up=CTRL+r'         : null,
            'press=CTRL+s'      : null,
            'down=CTRL+s'       : 'startSearchForwards',
            'up=CTRL+s'         : null,
            'down=UP'           : 'previousCommand',
            'down=DOWN'         : 'nextCommand',
            // TODO these are probably highly dependent on British Mac keyboard layout
            // maybe make them based on keyCode? (they are ALT+< and ALT+>)
            'press=ALT+SHIFT+¯' : 'firstCommand',
            'press=ALT+SHIFT+˘' : 'currentCommand',
            'down=TAB'          : 'complete',
            'press=TAB'         : null,
            'press=CTRL+c'      : null,
            'down=CTRL+c'       : 'cancelCommand'
        };

        Controller.prototype.complete = function () {
            // TODO
            return false;
        };

        Controller.prototype.cancelCommand = function () {
            // TODO use this to kill running commands as well
            this.view.getCommand();
            return false;
        };

        Controller.prototype.parseCommand = function (command) {
            // TODO lots of parsing
            return command.split(/\s+/);
        };

        Controller.prototype.clearScreen = function () {
            this.view.clear();
            return false;
        };

        Controller.prototype.startSearchBackwards = function () {
            this.view.setSearchBackwardsPrompt();
        };

        Controller.prototype.startSearchForwards = function () {
            this.view.setSearchForwardsPrompt();
        };

        Controller.prototype.goToHistoryItem = function (i) {
            if (i != this.currentHistoryPosition && i >= 0 && i <= this.history.length) {
                this.currentHistory[this.currentHistoryPosition] = this.view.currentCommand();
                this.currentHistoryPosition = i;
                this.view.setCurrentCommand(
                    typeof(this.currentHistory[this.currentHistoryPosition]) == 'undefined' ?
                        this.history[this.currentHistoryPosition] :
                        this.currentHistory[this.currentHistoryPosition]
                );
            }
            return false;
        };

        Controller.prototype.previousCommand = function () {
            return this.goToHistoryItem(this.currentHistoryPosition - 1);
        };

        Controller.prototype.nextCommand = function () {
            return this.goToHistoryItem(this.currentHistoryPosition + 1);
        };

        Controller.prototype.firstCommand = function () {
            return this.goToHistoryItem(0);
        };

        Controller.prototype.currentCommand = function () {
            return this.goToHistoryItem(this.history.length);
        };

        Controller.prototype.processCommand = function () {
            var plain = this.view.getCommand();

            this.currentHistory = [];

            // TODO history expansion before adding command to history
            if (/\S/.test(plain)) {
                this.history.push(plain);
                this.currentHistoryPosition = this.history.length;

                var args = this.parseCommand(plain),
                    name = args.shift();
                if (name == '') return;
                var command;
                if (name in builtins) {
                    command = builtins[name];
                }
                else {
                    this.view.outputError(name + ': command not found');
                }
                if (command) {
                    var context = command.context(this);
                    var listener = bind(context, 'output', this.handleCommandOutput, this);
                    context.run(args);
                    unbind(listener);
                }
            }
            this.view.scrollToEnd();
            this.view.focusInput();
            return false;
        };

        Controller.prototype.handleCommandOutput = function (e) {
            this.view.addCommandOutput(e.output);
        };

        var arrowKeysSendPress = false;

        // these get replaced after the first keypress is received, so that you don't get the first
        // keydown event and the first keypress
        var delayedKeyMapping = {
            // make firefox pretend to send keydown for certain keypresses, as chrome wont send keypresses
            'press=CTRL+c' : 'down=CTRL+c',
            'press=UP'     : 'down=UP',
            'press=DOWN'   : 'down=DOWN',
            'press=TAB'    : 'down=TAB'
        };

        var keyMapping = {
            // Chrome
            'press=CTRL+[12]' : 'press=CTRL+l',
            // FF (is keydown to stop it beeping at me)
            'down=CTRL+[82]'  : 'down=CTRL+r',
            'down=CTRL+[83]'  : 'down=CTRL+s'
         };

        Controller.prototype.keyStringFromEvent = function (eventType, e) {
            var modifiers = (e.ctrlKey  ? 'CTRL+' : '')
                          + (e.altKey   ? 'ALT+' : '')
                          + (e.shiftKey ? 'SHIFT+' : ''),
                keyName   = (e.key || e.chr || '[' + e.keyCode + ']'),
                keyString = eventType + '=' + modifiers + keyName;

            if (keyString in keyMapping) {
                keyString = keyMapping[keyString];
            }
            else if (keyString in delayedKeyMapping) {
                keyMapping[keyString] = delayedKeyMapping[keyString];
                keyMapping[delayedKeyMapping[keyString]] = null;
            }

            return keyString;
        };

        function keyHandler (eventType) {
            return function (e) {
                var keyString = this.keyStringFromEvent(eventType, e);
                //console.log('key ' + eventType + ': ' + keyString);
                if (keyString in keys) {
                    return keys[keyString] ? this[keys[keyString]].call(this) : false;
                }
            };
        }

        Controller.prototype.onkeypress = keyHandler('press');
        Controller.prototype.onkeyup    = keyHandler('up');
        Controller.prototype.onkeydown  = keyHandler('down');

        ns.init = function () {
            var controller = new Controller();
            
        };

        return ns;
    }
});

