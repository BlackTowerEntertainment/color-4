
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var container, camera, scene, renderer;

var ground;

var playerInfo = null;

var tileSpacing = 10;
var light;
var clock = new THREE.Clock();


var blockGrid = [];
var sphereGeom = new THREE.SphereGeometry(1);

function UpdateCamera()
{
}

function Update(delta)
{
    UpdateCamera();
}

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
        new THREE.Color(1,.2,0),
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

function onDocumentClick( event ) {
    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
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
var output;
function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    document.createElement("div");


    output = document.createElement( 'div' );
    output.innerHTML = "Score: 0";
    output.style.cssText = 'position: absolute; left: 10px; top: 10px; font-size: 20px; color :white ';
    document.body.appendChild( output );

    // CAMERA

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.up.set( 0, 0,-1);
    // SCENE

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x222222, 1000, 4000 );

    scene.add( camera );

    // LIGHTS

    scene.add( new THREE.AmbientLight( 0x222222 ) );

    light = new THREE.DirectionalLight( 0xffffff, 2.25 );
    light.position.set(10,100,5);
    //light.shadowMapDebug =true;
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
            var material = new THREE.MeshBasicMaterial({ opacity : 0,transparent : true});
            var cube = new THREE.Mesh(geometry, material);
            cube.visible = false;
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
        var material = new THREE.MeshBasicMaterial({opacity: 1, color : "black", transparent: true});
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
    camera.position.set( width/2, 150, height/2);
    camera.lookAt(new THREE.Vector3( width/2, 0, height/2));
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

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    container.appendChild( renderer.domElement );

    //

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMapEnabled = false;

    //renderer.shadowMapCascade = true;
    //renderer.shadowMapType = THREE.PCFSoftShadowMap;
    //renderer.shadowMapDebug = true;

    // EVENTS

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'click', onDocumentClick, false );

}

// EVENT HANDLERS

function onWindowResize( event ) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

    camera.aspect = SCREEN_WIDTH/ SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

}

function Animate() {
    var delta = clock.getDelta();
    requestAnimationFrame( Animate );
    Update(delta);
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
playerName = prompt("What's your name");
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