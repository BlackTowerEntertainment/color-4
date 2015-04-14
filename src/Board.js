/**
 * Created by adines on 4/7/15.
 */
var Signals = require("signals");

ColorBoard = function(width, height)
{
    this.width = width;
    this.height = height;
    this.colors = {
        none : 0,
        red : 1,
        green : 2,
        blue : 3,
        yellow : 4,
        purple : 5,
        orange : 6,
        totalKinds : 7
    };
    this.tiles = [];
    this.resolveLength = 4;
    this.Fill();

    //Signals
    this.tileRemoved = new Signals.Signal();
    this.tilePlaced = new Signals.Signal();
};

ColorBoard.prototype =
{
    constructor : ColorBoard,

    GiveRandomTile : function()
    {
        return Math.floor(Math.random() * this.colors.totalKinds);
    },

    GiveRandomUsableTile : function()
    {
        return Math.floor(Math.random() * (this.colors.totalKinds-1))+1;
    },

    GetWidth : function()
    {
        return this.width;
    },

    GetHeight : function()
    {
        return this.height;
    },

    Fill : function()
    {
        for(var row = 0; row < this.GetHeight(); ++row)
        {
            if(this.tiles[row] === undefined)
                this.tiles[row] = [];
            for(var col = 0; col < this.GetWidth(); ++col)
            {
                this.tiles[row][col] = this.GiveRandomTile();
            }
        }
    },

    GetKindAt : function(row, col)
    {
        if(row < 0 || col < 0 || col >= this.tiles[0].length || row >= this.tiles.length)
            return -1;
        return this.tiles[row][col];
    },

    ResolveGrid : function(row,col)
    {
        var kind = this.GetKindAt(row, col);
        //Go Up and down count num contig seg
        //Count the tiles going up
        var sameKindUp = 0;
        var currentRow = row + 1;
        while(this.GetKindAt(currentRow, col) == kind)
        {
            sameKindUp++;
            currentRow++;
        }
        //Count the tiles going down
        var sameKindDown = 0;
        var currentRow = row - 1;
        while(this.GetKindAt(currentRow, col) == kind)
        {
            sameKindDown++;
            currentRow--;
        }

        //Go Left and right count num contig seg
        //Count tiles going left
        var sameKindLeft = 0;
        var currentCol = col - 1;
        while(this.GetKindAt(row, currentCol) == kind)
        {
            sameKindLeft++;
            currentCol--;
        }
        var sameKindRight = 0;
        var currentCol = col + 1;
        while(this.GetKindAt(row, currentCol) == kind)
        {
            sameKindLeft++;
            currentCol++;
        }
        //Count up the number of contiguous tiles (including the starting tile)
        var sameKindHorizontal = sameKindLeft + sameKindRight + 1;
        var sameKindVertical = sameKindDown + sameKindUp + 1;
        var completions = 0;
        if(sameKindHorizontal >= this.resolveLength || sameKindVertical >= this.resolveLength)
        {
            completions += sameKindVertical;
            completions += sameKindHorizontal;
            return this.DestroyContiguousBlocks(row, col);
        }
        return null;
    },

    DestroyContiguousBlocks : function(row, col)
    {
        var destroyedBlocks = [];
        var kind = this.GetKindAt(row, col);
        //Destroy starting block
        this.DestroyBlock(row,col, destroyedBlocks);
        var currentRow = row + 1;
        while(this.GetKindAt(currentRow, col) == kind)
        {
            this.DestroyBlock(currentRow, col, destroyedBlocks);
            currentRow++;
        }
        //Count the tiles going down
        currentRow = row - 1;
        while(this.GetKindAt(currentRow, col) == kind)
        {
            this.DestroyBlock(currentRow, col, destroyedBlocks);
            currentRow--;
        }
        //Go Left and right count num contig seg
        //Count tiles going left
        var currentCol = col - 1;
        while(this.GetKindAt(row, currentCol) == kind)
        {
            this.DestroyBlock(row, currentCol, destroyedBlocks);
            currentCol--;
        }
        currentCol = col + 1;
        while(this.GetKindAt(row, currentCol) == kind)
        {
            this.DestroyBlock(row, currentCol, destroyedBlocks);
            currentCol++;
        }
        return destroyedBlocks;
    },

    DestroyBlock : function(row, col, destroyedBlocks)
    {
        destroyedBlocks.push({row : row, col : col, type : this.tiles[row][col]});
        var type = this.GiveRandomTile();
        this.tiles[row][col] = type;
        this.tilePlaced.dispatch(row, col, type);
    },

    /**
     * places tile in the grid if it completes it will return the blocks destroyed
     * @param row in the grid
     * @param col in the grid
     * @param type of tile to place
     * @returns {array} tiles destroyed or null
     * @constructor
     */
    PlaceTile : function(row, col, type)
    {
        this.tiles[row][col] = type;
        var destroyedBlocks = this.ResolveGrid(row, col);
        if(destroyedBlocks == null)
            this.tilePlaced.dispatch(row, col, type);
        return destroyedBlocks;
    }
};

module.exports = ColorBoard;