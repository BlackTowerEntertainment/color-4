/**
 * Created by adines on 4/9/15.
 */

var ColorBoard = require('./Board.js');
var http = require('http');
var Player = require('./Player.js');

Color4Game = function(http)
{
    this.io = require('socket.io')(http);
    //Socket IO Events
    this.io.on('connection', this.OnConnect.bind(this));

    this.io.on('error', function(error)
    {
        console.error(error);
    });
    this.players = [];
    this.board = new ColorBoard(6,6);
    //Add board listeners
    this.board.tileRemoved.add(this.OnBoardTileRemoved, this);
    this.board.tilePlaced.add(this.OnBoardTilePlaced, this);
    this.pointsPerCompletion = 10;

    var giveBlocksInterval = 1000;
    //Give tiles to all player at a given interval
    setInterval(this.GiveTilesToPlayers.bind(this), giveBlocksInterval);
};

Color4Game.prototype =
{
    constructor : Color4Game,

    OnConnect : function(socket)
    {
        console.log('User[', socket.id,'] connected');
        socket.on('disconnect', this.OnDisconnect.bind(this, socket));
        var self = this;
        socket.on('register', function(name)
        {
            self.OnRegister(this, name)
        });

        socket.emit('connect info', socket.id);
    },

    OnRegister : function(socket, name)
    {
        for(var i = 0; i < this.players.length; ++i)
            if(this.players[i].name == name)
                name += "!";
        //Handle player position
        socket.on('user place block', this.OnBlockPlace.bind(this));

        //Make a new player
        var player = new Player(this.io, socket, name);
        //Give player starting tiles
        for(i = 0; i < 3; ++i)
            player.GiveTile(this.board.GiveRandomUsableTile());
        this.players.push(player);
        for(i = 0; i < this.players.length; ++i)
            this.players[i].SendScore(socket);
        this.SendBoard(socket);
        //Send the player his id
        socket.emit('user connect', { id : player.id, name : player.name, score : player.score});
    },

    OnBoardTileRemoved : function(row, col)
    {
        this.io.emit("board tile removed", { row : row, col : col})
    },

    OnBoardTilePlaced : function(row, col, type)
    {
        this.io.emit("board tile placed", { row : row, col : col, type : type})
    },

    OnDisconnect : function(socket)
    {
        this.RemovePlayer(socket.id);
        console.log('User[',socket.id,'] disconnected');
    },

    OnBlockPlace : function(msg)
    {
        var id = msg.id;
        var row = msg.row;
        var col = msg.col;
        if(id === undefined || row === undefined || col === undefined)
            return console.log("Malformed block placement");
        var player = this.FindPlayer(id);
        if(player)
        {
            var tile = player.TakeTile();
            if(tile !== null) {
                var destroyedBlocks = this.board.PlaceTile(row, col, tile);
                if (destroyedBlocks !== null) {
                    player.GivePoints(destroyedBlocks.length * this.pointsPerCompletion);
                    player.socket.emit("blocks destroyed", destroyedBlocks)
                }
            }
            else
                console.log("Player[",player.name,"] has no tile to place");
        }
        else
            console.log("Player with id [",id,"] not found");
    },

    SendBoard : function(socket)
    {
        for(var col = 0; col < this.board.GetHeight(); ++col)
            for(var row = 0; row < this.board.GetWidth(); ++row) {
                socket.emit("board tile placed", { row : row, col : col, type : this.board.GetKindAt(row, col)});
            }
    },

    FindPlayer : function(id)
    {
        for(var i = 0; i < this.players.length; ++i)
            if(this.players[i].id == id)
                return this.players[i];
        return null;
    },

    RemovePlayer : function(id)
    {
        for(var i = 0; i < this.players.length; ++i)
            if (this.players[i].id == id)
                return this.players.splice(i, 1);
    },

    GiveTilesToPlayers : function()
    {
        for(var i = 0; i < this.players.length; ++i)
        {
            var player = this.players[i];
            player.GiveTile(this.board.GiveRandomUsableTile());
        }
    }
};

module.exports = Color4Game;