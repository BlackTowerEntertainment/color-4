/**
 * Created by Alex on 9/24/14.
 */
//var TagServer = require('./TagServer.js');
var express = require('express');
var http = require('http');
var Player = require('./src/Player.js');
var TilesetGame = require('./src/TilesetGame.js');

function Main()
{
    var app = express();
    // Statically serve html files
    app.use(express.static('./public/'));
    app.use(express.static('./public/vendor'));
    // Setup http server
    var httpServer = http.Server(app);
    var tilesetGame = new TilesetGame(httpServer);
    var gamePort = 80;
    httpServer.listen(gamePort, function()
    {
        console.log('Server Listening on port: ' + gamePort);
    });
}

Main();
