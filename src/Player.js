/**
 * Created by adines on 4/9/15.
 */


Player = function(io, socket, name)
{
    this.io = io;
    this.previewLength = 3;
    this.id = socket.id;
    this.socket = socket;
    this.blocks = [];
    this.score = 0;
    this.name = name;
};

Player.prototype =
{
    constructor : Player,

    GivePoints : function(points)
    {
        this.score += points;
        this.SendScore(this.io);
    },

    SendScore : function(socket)
    {
        socket.emit("score change", this.id, this.name, this.score);
    },

    GiveTile : function(tile)
    {
        if(this.blocks.length < this.previewLength) {
            this.blocks.push(tile);
            this.socket.emit("tileset change", this.blocks);
        }
    },

    TakeTile : function()
    {
        if(this.blocks.length < 1)
            return null;
        else {
            var tile = this.blocks.shift();
            this.socket.emit("tileset change", this.blocks);
            return tile;
        }
    }
};
