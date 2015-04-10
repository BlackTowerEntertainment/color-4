import Ember from 'ember';

export default
Ember.Controller.extend({

    websocket: Ember.inject.service(),

    subscribe: function() {
        var controller = this;
        let socket = controller.get('websocket.socket');

        var self = this;
        // Add a connect listener
        socket.on('connect info', function (data) {
            console.log('Connect Info Received ID: ', data);
            self.get("websocket").playerID = data;
        });

        // Add a connect listener
        socket.on('user connect', function (data) {
            console.log('Received a user connect from the server:\n', data);
            self.transitionToRoute("game");
        });

    },

    unsubscribe: function() {
        let socket = this.get('websocket.socket');
        socket.removeAllListeners();
    },

    actions: {
        "Start Game": function () {
            if(this.get("name") !== "") {
                let socket = this.get('websocket.socket');
                socket.emit('register', this.get("name"));
            }
        }
    }
});
