
var SCREEN_WIDTH = 460;
var SCREEN_HEIGHT = 300;

var container, camera, scene, renderer;

var ground;

var playerInfo = null;

var tileSpacing = 10;
var light;
var clock = new THREE.Clock();


var blockGrid = [];
var sphereGeom = new THREE.SphereGeometry(1);

var preview = [];
var colors = {
    none : 0,
    red : 1,
    green : 2,
    blue : 3,
    yellow : 4,
    purple : 5,
    orange : 6,
    totalKinds : 7
};

var colorOfType =
    [
        new THREE.Color(0,0,0),
        new THREE.Color("red"),
        new THREE.Color("green"),
        new THREE.Color(0,0,1),
        new THREE.Color("yellow"),
        new THREE.Color("purple"),
        new THREE.Color(1,.4,0),
        null
    ];
var materialOfType =
    [
        new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: colorOfType[0]}),
        new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: colorOfType[1]}),
        new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: colorOfType[2]}),
        new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: colorOfType[3]}),
        new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: colorOfType[4]}),
        new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: colorOfType[5]}),
        new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: colorOfType[6]}),
        new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: colorOfType[7]})
    ];

var blockWidth = 0;
var blockHeight = 0;



function SetBlock(row, col, tileType)
{
    if(row < 0 || col < 0 || row >= blockWidth || col >= blockHeight)
        return;
    var block = blockGrid[row][col];
    if(!block)
        return;
    var oldType = block.type;
    if(oldType == tileType)
         return;
    block.type = tileType;
    var originalY = block.mesh.position.y;
    var upTween = new TWEEN.Tween(block.mesh.position).onStart(function()
    {
        var color = colorOfType[tileType];
        if(color)
            block.mesh.material.color.copy(color);
    }).to({ y: originalY}, 200);

    if(oldType > 0) {
        var downTween = new TWEEN.Tween(block.mesh.position)
            .to({y: -originalY}, 200)
            .chain(upTween)
            .start();
    }
    else
    {
        upTween.start();
    }

    if(tileType == this.colors.none)
    {/*
        var tween = new TWEEN.Tween(block.mesh.position)
            .to( { opacity:1}, 1000)
            .chain(new TWEEN.Tween(block.mesh.material).to( { opacity:.0}, 200))
            .start();*/
    }
    else {
        block.mesh.visible = true;
        var tween = new TWEEN.Tween(block.mesh.material)
            .to( { opacity: 1 }, 200 )
            .start();
    }
}

function SetTileSet(tileset)
{
    for(var i = 0; i < preview.length; ++i)
    {
        var tile = preview[i];
        if(tile)
        {
            tile.type = tileset[i];
            var color = colorOfType[tile.type];
            if(color)
                tile.mesh.material.color.copy(color);
            else
                tile.mesh.material.color.setRGB(0,0,0);

        }
        else
        {
            tile.type = 0;
            var color = colorOfType[tile.type];
            if(color)
                tile.mesh.material.color.copy(color);
            else
                tile.mesh.material.color.setRGB(0,0,0);
        }
    }
}

var mouse = new THREE.Vector2();

function onRendererClick( e ) {
    e.preventDefault();

    var parentOffset = $(this).offset();
    //or $(this).offset(); if you really just want the current element's offset
    var relX = e.pageX - parentOffset.left;
    var relY = e.pageY - parentOffset.top;

    mouse.x = ( relX / SCREEN_WIDTH ) * 2 - 1;
    mouse.y = - ( relY / SCREEN_HEIGHT ) * 2 + 1;
    ProjectVector(mouse);
}

var raycaster = new THREE.Raycaster();

function ProjectVector(mouse)
{
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObject( ground );
    if(tileset.length < 1)
        return;
    if ( intersects.length > 0 ) {

        var intersect = intersects[ 0 ];
        var point = intersect.point;
        var col = Math.floor(point.x / tileSpacing);
        var row = Math.floor(point.z / tileSpacing);
        if(socket) {
            var now = Date.now();
            if(now - lastPlaceTime > 150)
                lastPlaceTime = now;
            if(tileset[0] != this.blockGrid[row][col].type) {
                socket.emit("user place block", {id: playerID, row: row, col: col});
                SetBlock(row, col, tileset[0]);
                tileset.shift();
                SetTileSet(tileset);
            }
        }
    } else {

    }
}

var lastPlaceTime = 0;
var output, playersDisplay;

function init() {

    container = document.getElementById( 'container' );

    document.createElement("div");
    output = document.createElement( 'div' );
    output.innerHTML = "---";
    output.style.cssText = 'position: absolute; left: 10px; top: 10px; font-size: 1em; color :white; pointer-events: none;';
    document.body.appendChild( output );
    document.createElement("div");
    playersDisplay = document.createElement( 'div' );
    playersDisplay.innerHTML = "Players: --";
    playersDisplay.style.cssText = 'position: absolute; left: 10px; bottom: 10px; font-size: 1em; color :white; pointer-events: none;';
    document.body.appendChild( playersDisplay );

    // CAMERA
    camera = new THREE.PerspectiveCamera( 45,SCREEN_WIDTH/SCREEN_HEIGHT, 1, 4000 );
    camera.up.set( 0, 0,-1);

    // SCENE
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x222222, 1000, 4000 );
    scene.add( camera );

    // LIGHTS
    scene.add( new THREE.AmbientLight( 0x222222 ) );
    light = new THREE.DirectionalLight( 0xffffff, 2.25 );
    light.position.set(10,100,5);
    scene.add( light );

    // Block Grid
    blockWidth = 6;
    blockHeight = 6;
    var blockSizeRatio = .8;
    var blockSize = tileSpacing * blockSizeRatio;

    var width = blockWidth * tileSpacing;
    var height = blockHeight * tileSpacing;

    var geometry = new THREE.BoxGeometry(1,1,1);
    for(var col = 0; col < blockHeight; ++col) {
        blockGrid[col] = [];
        for (var row = 0; row < blockWidth; ++row) {
            var material = new THREE.MeshBasicMaterial({ opacity : 0,transparent : true, overdraw : true});
            var cube = new THREE.Mesh(geometry, material);
            cube.visible = false;
            cube.frustrumCulled = false;
            cube.position.set(row * tileSpacing + tileSpacing / 2, blockSize / 2, col * tileSpacing + tileSpacing / 2);
            cube.scale.set(blockSize,blockSize,blockSize);
            blockGrid[col][row] = { type : -1, mesh : cube};
            scene.add(cube);
            var tweenDown = new TWEEN.Tween(cube.position).to({y : "-4"}, 1000);
            var tweenUp = new TWEEN.Tween(cube.position).to({ y : "+4"}, 1000);
            tweenDown.delay(row * col).chain(tweenUp.chain(tweenDown)).start();
        }
    }

    //Block preview
    for(var i = 0; i < 3; ++i) {
        var material = new THREE.MeshBasicMaterial({opacity: 1, color : "black", overdraw : true, transparent: true});
        var cube = new THREE.Mesh(geometry, material);
        cube.visible = true;
        cube.position.set(width + 15, 10, 20 + 12 * i);

        if(i == 0) {
            cube.position.z -= 3;
            cube.scale.set(15, 15, 15);
        }
        else
            cube.scale.set(10, 10, 10);
        preview.push({type: 0, mesh: cube});
        scene.add(cube);
    }

    // Helpers
    var gridHelper = new THREE.GridHelper(width/2, tileSpacing);
    gridHelper.position.x = width/2;
    gridHelper.position.y = 2;
    gridHelper.position.z = height/2;
    camera.position.set( width/2 + 15, 80, height/2);
    camera.lookAt(new THREE.Vector3( width/2 + 15, 0, height/2));
    scene.add(gridHelper);
    //  GROUND

    var gg = new THREE.PlaneBufferGeometry(width, height);
    var gm = new THREE.MeshBasicMaterial({ specular : 0x000000, color: 0x000000 });

    ground = new THREE.Mesh( gg, gm );
    ground.rotation.x = - Math.PI / 2;
    ground.position.x = width/2;
    ground.position.z = height/2;
    // note that because the ground does not cast a shadow, .castShadow is left false
    ground.receiveShadow = false;
    scene.add( ground );

    // RENDERER

    function webglAvailable() {
        try {
            var canvas = document.createElement( 'canvas' );
            return !!( window.WebGLRenderingContext && (
            canvas.getContext( 'webgl' ) ||
            canvas.getContext( 'experimental-webgl' ) )
            );
        } catch ( e ) {
            return false;
        }
    }
    if ( webglAvailable() ) {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor( scene.fog.color );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    } else {
        renderer = new THREE.CanvasRenderer( { antialias: true } );
        renderer.setClearColor( scene.fog.color );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setFaceCulling (false);
        ground.visible = false;
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    }
    container.appendChild( renderer.domElement );

    // EVENTS

    window.addEventListener( 'resize', onWindowResize, false );
    $(renderer.domElement).click( onRendererClick );
    $("body").on('keypress', function(e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode == 116) {
            e.preventDefault();
            window.showTop = !showTop;
            UpdateScoreBoard();
            // call custom function here
        }
    });


}

// EVENT HANDLERS
limitedScore = false;
if(window.innerHeight > window.innerWidth){

    limitedScore = true;
}
else
    limitedScore = false;

function onWindowResize( event ) {

    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    if(window.innerHeight > window.innerWidth){
        output.style.bottom = "35px";
        output.style.top = "auto";
    }
    else {
        output.style.top = "10px";
        output.style.bottom = "auto";
    }
    UpdateScoreBoard();
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

}

function Animate() {
    var delta = clock.getDelta();
    requestAnimationFrame( Animate );
    TWEEN.update();
    Render(delta);
}

function Render(delta)
{
    renderer.render( scene, camera );
    THREE.AnimationHandler.update(delta);
}

var port = 2005;
var host = "localhost";

var socket = new io();
var clients = [];

function FindUser(id)
{
    for(var i = 0; i < clients.length; ++i)
        if(clients[i].id == id)
            return clients[i];
}

function UserConnected(data)
{
    var client = data;
    clients.push(client);
}

// Add a connect listener
socket.on('connect',function() {
    console.log('Client established a connection with the server.\n');
    if(playerInfo)
        window.location.reload();
    if(playerName.length > 12)
        playerName = playerName.substring(0,12);
    socket.emit('register', playerName);
});

// Add a connect listener
socket.on('user connect',function(data) {
    console.log('Received a user connect from the server:\n',data);
    if(data.id == playerID)
    {
        if(playerInfo === null)
        {
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
socket.on('connect info',function(data) {
    console.log('Connect Info Received ID: ', data);
    playerID = data;
    UpdateScoreBoard();
});
// Add a disconnect listener
socket.on('disconnect',function() {
    console.log('The server has disconnected!');
});

socket.on('board tile removed', function(data)
{
    var row = data.row;
    var col = data.col;
    SetBlock(row, col, colors.none);
});

var scores = [];

function ComparePlayers(a,b)
{
    if(a.score < b.score)
        return 1;
    else if(a.score == b.score)
        if(a.name < b.name)
            return 1;
        else if(a.name == b.name)
            return 0;
        else
            return -1;
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

    playersDisplay.innerHTML = "Players: " + scores.length;
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
    var score = this.scores[i].score + "";
    if(this.scores[i].score < 10)
        score = "000" + score;
    else if(this.scores[i].score < 100)
        score = "00" + score;
    else if(this.scores[i].score < 1000)
        score = "0" + score;
    else if(this.scores[i].score < 10000)
        score = score;
    return "[" + place + "] <b>" + score + "</b> " + this.scores[i].name;
}

var showTop = false;

function UpdateScoreBoard()
{
    SortScores();
    var place = GetPlace(playerID);
    var string = "";

    var numBelow = -5;
    var numAbove = 5;

    if(showTop)
    {
        for (var i = 1; i <= scores.length; ++i) {
            if (i == 0)
                string += "<span style='color:gold'>" + GetPlaceString(i) + "</span><br>";
            else
                string += GetPlaceString(i) + "<br>";

        }
    }
    else {
        for (var i = numBelow; i < numAbove; ++i) {
            if (i + place < 1)
                continue;
            if (i == 0)
                string += "<span style='color:gold'>" + GetPlaceString(i + place) + "</span><br>";
            else
                string += GetPlaceString(i + place) + "<br>";

        }
    }
    output.innerHTML = string;

}
playerName = prompt("What's your name");
if(playerName == null || playerName == "")
{
    var randNames = ["flyingfishbrewer",
    "apirbanker",
    "ocelotmagician",
    "lionplayer",
    "shadsannouncer",
    "cormorantknight",
    "chillminstrel",
    "hindsactuary",
    "dovemidwife",
    "partridgebricklayer",
    "poultrycurator",
    "aukmachinist",
    "ruffsnurse",
    "chamoistherapist",
    "macawcameraman",
    "hedgehogpilot",
    "penguintutor",
    "bisonworshipper",
    "seagullsheriff",
    "starlingaccountant",
    "cobrabroker",
    "shrimphunter",
    "ptarmigandesigner",
    "porcupinewriter",
    "bongofarmer"];
    playerName = randNames[Math.floor(Math.random() * randNames.length)];
}
socket.on('score change', function(id, name, score)
{
    UpdateScore(id, name, score);
    UpdateScoreBoard();
});

socket.on('board tile placed', function(data)
{
    var row = data.row;
    var col = data.col;
    var type = data.type;
    SetBlock(row, col, type);
});
var tileset = [];
socket.on('tileset change', function(tilesetData)
{
    tileset = tilesetData;
    SetTileSet(tileset);
});

CreateExplosion = function(tile)
{
    var star = new THREE.Mesh(sphereGeom, materialOfType[tile.type]);
    star.scale.set(2,2,2);
    star.material.opacity = 1;
    star.material.overdraw = true;
    star.position.set(tile.col * tileSpacing + tileSpacing / 2, 10, tile.row * tileSpacing + tileSpacing / 2);
    scene.add(star);
    new TWEEN.Tween(star.position).easing(TWEEN.Easing.Quadratic.Out).to({x:Math.random() * 200 - 100, y: Math.random()*100,z: Math.random()*200 - 100},500).start();
    new TWEEN.Tween(star.material).to({opacity : 0},500).onComplete(function()
    {
        star.parent.remove(star);
    }).start();
};

socket.on('blocks destroyed', function(destroyedTiles)
{
    for(var i = 0; i < destroyedTiles.length; ++i)
        CreateExplosion(destroyedTiles[i]);
});

init();
Animate();