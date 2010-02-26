
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
            var view = this;
            window.setInterval(function () { view.commandInput[0].focus(); }, 300);
        };

        View.prototype.getCommand = function () {
            var command = this.commandInput.val();
            var previous = create('<li></li>');
            previous.text(command); 
            this.formListItem.before(previous);
            this.commandInput.val('');
            // TODO fix this
            window.scrollTo(0, 9999999);
        };

        var Model = function () {

        };

        var Controller = function () {
            this.view = new View();
            this.view.init('body');
            this.view.initEventHandlers(this);

            this.model = new Model();
        };

        var keys = {
            'ENTER' : 'processCommand'
        };

        Controller.prototype.processCommand = function () {
            var command = this.view.getCommand();
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

