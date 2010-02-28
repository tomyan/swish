
soda.module({
    'name' : 'shell',
    'code' : function () {
        var ns = {};

        var $      = glow.dom.get,
            create = glow.dom.create,
            bind   = glow.events.addListener,
            unbind = glow.events.removeListener;

        var View = function () {

        };

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
                  '<div class="mask"></div>' +
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
            bind(this.commandInput, 'keydown', controller.onkeydown, controller);
            bind(this.commandInput, 'keyup', controller.onkeyup, controller);
            bind(this.commandInput, 'keypress', controller.onkeypress, controller);
            bind(this.form, 'submit', function () { return false; });
            var view = this;
            bind(window, 'focus', function () { view.focusInput(); });
        };

        View.prototype.currentCommand = function () {
            return this.commandInput.val();
        };

        View.prototype.setCurrentCommand = function (command) {
            this.commandInput.val(command);
        };

        View.prototype.getCommand = function () {
            var command = this.currentCommand();
            var previous = this.lastCommandListItem = create('<li></li>');
            previous.text(command); 
            this.formListItem.before(previous);
            this.commandInput.val('');
            // TODO fix this
            window.scrollTo(0, 9999999);
            return command;
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

        var Command = function (func) {
            this.func = func;
        };

        Command.prototype.run = function (controller) {
            this.func(controller);
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

        builtins.clear = new Command(function (controller) {
            controller.view.clear();
        });

        var keys = {
            'press=ENTER'  : 'processCommand',
            'press=CTRL+l' : 'clearScreen',
            'down=UP'      : 'previousCommand',
            'down=DOWN'    : 'nextCommand'
        };

        Controller.prototype.parseCommand = function (command) {
            // TODO lots of parsing
            return command.split(/\s+/);
        };

        Controller.prototype.clearScreen = function () {
            this.view.clear();
            return false;
        };

        Controller.prototype.previousCommand = function () {
            if (this.currentHistoryPosition != 0) {
                // save the current edits
                this.currentHistory[this.currentHistoryPosition] = this.view.currentCommand();
                this.currentHistoryPosition--;
                this.view.setCurrentCommand(
                    typeof(this.currentHistory[this.currentHistoryPosition]) == 'undefined' ?
                        this.history[this.currentHistoryPosition] :
                        this.currentHistory[this.currentHistoryPosition]
                );
            }
            return false;
        };

        Controller.prototype.nextCommand = function () {
            if (this.currentHistoryPosition != this.history.length) {
                // save the current edits
                this.currentHistory[this.currentHistoryPosition] = this.view.currentCommand();
                this.currentHistoryPosition++;
                this.view.setCurrentCommand(
                    typeof(this.currentHistory[this.currentHistoryPosition]) == 'undefined' ?
                        this.history[this.currentHistoryPosition] :
                        this.currentHistory[this.currentHistoryPosition]
                );
            }
            return false;
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
                    return this.view.outputError(name + ': command not found');
                }
                command.run(this, args);
            }
            this.view.focusInput();
            return false;
        };

        var arrowKeysSendPress = false;

        Controller.prototype.keyStringFromEvent = function (eventType, e) {
            var modifiers = (e.ctrlKey ? 'CTRL+' : ''),
                keyName = (e.key || e.chr);

            // work around for FF (don't really know who is right, but doing it this way around)
            // detect sending of keypress for UP and DOWN and treat as keydown's to match Chrome
            // ignores the first press, because the first down will have already happened
            if (keyName == 'UP' || keyName == 'DOWN') {
                if (eventType == 'press') {
                    if (arrowKeysSendPress) {
                        eventType = 'down';
                    }
                    else {
                        arrowKeysSendPress = true;
                    }
                }
                else if (eventType == 'down' && arrowKeysSendPress) {
                    eventType = 'ignore';
                }
            }

            // work around Glow/Chrome bug for CTRL+l
            if (! keyName && e.keyCode == 12) {
                keyName = 'l';
            }
            return eventType + '=' + modifiers + keyName;
        };

        function keyHandler (eventType) {
            return function (e) {
                var keyString = this.keyStringFromEvent(eventType, e);
                //console.log('key ' + eventType + ': ' + keyString);
                if (keys[keyString]) {
                    return this[keys[keyString]].call(this);
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

