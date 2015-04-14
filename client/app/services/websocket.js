/* global io */

import Ember from 'ember';

export default Ember.Service.extend({
    availableIn : ['controllers','components','routes'],
    setup : function () {
        console.log('hello');
        let socket = this.socket = io(`${window.location.hostname}:80`);
        // Add a connect listener
        socket.on('connect',function() {
            console.log('Client established a connection with the server.\n');
            //if(playerInfo)
             //   window.location.reload();
        });
        // Add a disconnect listener
        socket.on('disconnect', function () {
            console.log('The server has disconnected!');
        });

        var playerID;
    }.on('init'),

    send: function (message) {
        this.socket.emit('message', message);
    }
});
