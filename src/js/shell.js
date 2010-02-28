
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
            bind( 'keyup', controller.onkeyup, controller);
            bind(this.commandInput, 'keypress', controller.onkeypress, controller);
            bind(this.form, 'submit', function () { return false; });
            var view = this;
            bind(window, 'focus', function () { view.focusInput(); });
        };

        View.prototype.getCommand = function () {
            var command = this.commandInput.val();
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

        var Model = function () {

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

            this.model = new Model();
        };

        var builtins = {};

        builtins.clear = new Command(function (controller) {
            controller.view.clear();
        });

        var keys = {
            'ENTER' : 'processCommand',
            'CTRL+l' : 'clearScreen'
        };

        Controller.prototype.parseCommand = function (command) {
            // TODO lots
            return command.split(/\s+/);
        };

        Controller.prototype.clearScreen = function () {
            this.view.clear();
            return false;
        };

        Controller.prototype.processCommand = function () {
            var args = this.parseCommand(this.view.getCommand()),
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
            this.view.focusInput();
            return false;
        };

        Controller.prototype.keyStringFromEvent = function (e) {
            var modifiers = (e.ctrlKey ? 'CTRL+' : ''),
                keyName = (e.key || e.chr);
            // work around Glow/Chrome bug for CTRL+l
            if (! keyName && e.keyCode == 12) {
                keyName = 'l';
            }
            return modifiers + keyName;
        };

        Controller.prototype.onkeypress = function (e) {
            var keyString = this.keyStringFromEvent(e);
            console.log('key pressed: ' + keyString);
            if (keys[keyString]) {
                return this[keys[keyString]].call(this);
            }
        };

        ns.init = function () {
            var controller = new Controller();
            
        };

        return ns;
    }
});

