
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
            this.element.get('input')[0].focus();
        };

        View.prototype.initEventHandlers = function (controller) {
            bind( 'keyup', controller.onkeyup, controller);
            bind(this.commandInput, 'keypress', controller.onkeypress, controller);
            bind(this.form, 'submit', function () { return false; });
            var focused = false;
            bind(this.commandInput, 'blur', function () { console.log('blurred'); focused = false; }, this);
            var view = this;
            bind(window, 'focus', function () { view.commandInput[0].focus(); });
/*            window.setInterval(function () {
                if (! focused) {
                    view.commandInput[0].focus();
                    focused = true;
                }
            }, 300);
*/
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
        };

        Controller.prototype.onkeypress = function (e) {
            if (e.key && keys[e.key]) {
                this[keys[e.key]].call(this);
            }
        };

        ns.init = function () {
            var controller = new Controller();
            
        };

        return ns;
    }
});

