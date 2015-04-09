/* global io */

import Ember from 'ember';

export default Ember.Service.extend({
    availableIn : 'controllers',
    init: function () {
        var socket = this.socket = io();
        // Add a connect listener
        debugger;
        socket.on('connect', function () {
            console.log('Client established a connection with the server.\n');
            if (playerInfo)
                window.location.reload();
        });

        // Add a connect listener
        socket.on('user connect', function (data) {
            console.log('Received a user connect from the server:\n', data);
            if (data.id == playerID) {
                if (playerInfo === null) {
                    playerInfo = data;
                }
                else
                    console.warn("Player made twice:", data);
            }
            else
                UserConnected(data);
        });

        var playerID;
        // Add a connect listener
        socket.on('connect info', function (data) {
            console.log('Connect Info Received ID: ', data);
            playerID = data;
        });
        // Add a disconnect listener
        socket.on('disconnect', function () {
            console.log('The server has disconnected!');
        });

        socket.on('board tile removed', function (data) {
            var row = data.row;
            var col = data.col;
            SetBlock(row, col, colors.none);
        });

        socket.on('score change', function (score) {
            output.innerHTML = ("Score: " + score );
        });

        socket.on('board tile placed', function (data) {
            var row = data.row;
            var col = data.col;
            var type = data.type;
            SetBlock(row, col, type);
        });
        var tileset = [];
        socket.on('tileset change', function (tilesetData) {
            tileset = tilesetData;
            SetTileSet(tileset);
        });
    }.on('init'),

    send: function (message) {
        this.socket.emit('message', message);
    }
});
