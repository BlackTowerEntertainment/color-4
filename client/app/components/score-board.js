import Ember from 'ember';

export default Ember.Component.extend({
    websocket: Ember.inject.service(),
    init : function()
    {
        let socket = this.get("websocket.socket");
        socket.on('score change', function (id, name, score) {
            console.log("ID:", id, ", Name:", name, ", Score", score);
        });
    }
});

var scores = [];

function ComparePlayers(a,b)
{
    if(a.score < b.score)
        return 1;
    else if(a.score == b.score)
        return 0;
    else
        return -1;
}

function SortScores()
{
    scores.sort(ComparePlayers);

}

function UpdateScore(id, name, score)
{
    for(var i = 0; i < scores.length; ++i)
    {
        if(scores[i].id == id) {
            scores[i].score = score;
            return true;
        }
    }
    scores[i] = {name:name, id : id, score:score};
}

function GetPlace(id)
{
    for(var i = 0; i < scores.length; ++i)
    {
        if(this.scores[i].id == id) {
            return i+1;
        }
    }
    return 0;
}

function GetPlaceString(place)
{
    var i = place - 1;
    if(i < 0)
        return "It's lonely on top.";
    if(i >= this.scores.length)
        return "";
    return "[" + place + "]" + this.scores[i].name + " score " + this.scores[i].score;
}

function UpdateScoreBoard()
{
    SortScores();
    var place = GetPlace(playerID);
    var string = GetPlaceString(place-1) + "<br>";
    string += "<span style='color:gold'>"+GetPlaceString(place)+"</span><br>";
    string += GetPlaceString(place+1);
    output.innerHTML = string;

}
/*
socket.on('score change', function(id, name, score)
{
    UpdateScore(id, name, score);
    UpdateScoreBoard();
});*/
