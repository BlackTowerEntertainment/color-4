/**
 * Created by Alex on 9/24/14.
 */
var express = require('express');
var http = require('http');
var Color4Game = require('./src/Color4Game.js');

function Main()
{
    var app = express();
    // Statically serve html files
    app.use(express.static('./public/'));
    app.use(express.static('./public/vendor'));
    // Setup http server
    var httpServer = http.Server(app);
    var color4Game = new Color4Game(httpServer);
    var port = process.env.port || 80;
    // Start receiving connections
    httpServer.listen(port, function()
    {
        console.log('Server Listening on port: ' + port);
    });
}

Main();
