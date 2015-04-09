/**
 * Created by adines on 4/9/15.
 */

var ColorBoard = require('./Board.js');
var http = require('http');

TilesetGame = function(http)
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

    var giveBlocksInterval = 1000;
    //Give tiles to all player at a given interval
    setInterval(this.GiveTilesToPlayers.bind(this), giveBlocksInterval);
};

TilesetGame.prototype =
{
    constructor : TilesetGame,

    OnConnect : function(socket)
    {
        console.log('User[', socket.id,'] connected');
        socket.on('disconnect', this.OnDisconnect.bind(this, socket));

        //Handle player position
        socket.on('user place block', this.OnBlockPlace.bind(this));

        var name = "Bill";
        //Make a new player
        var player = new Player(socket, name);
        //Give player starting tiles
        for(var i = 0; i < 3; i++)
            player.GiveTile(this.board.GiveRandomUsableTile());

        this.players.push(player);
        this.SendBoard(socket);
        //Send the player his id
        socket.emit('connect info', player.id);
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
                var points = this.board.PlaceTile(row, col, tile);
                if (points > 0) {
                    player.GivePoints(points);
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

module.exports = TilesetGame;