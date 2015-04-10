import Ember from 'ember';

export default Ember.Component.extend({
    websocket: Ember.inject.service(),
    init : function() {
        var self = this;

        let socket = this.get("websocket.socket");
        socket.on('board tile removed', function (data) {
            var row = data.row;
            var col = data.col;
            self.SetBlock(row, col, colors.none);
            console.log("TileDeleted[", row,",", col,"]");
        });

        socket.on('board tile placed', function (data) {
            var row = data.row;
            var col = data.col;
            var type = data.type;
            console.log("TilePlaced[", row,",", col,"]", type);
            self.SetBlock(row, col, type);
        });

        socket.on('blocks destroyed', function(destroyedTiles)
        {
            for(var i = 0; i < destroyedTiles.length; ++i)
                this.CreateExplosion(destroyedTiles[i]);
        }.bind(this));
    },


    didInsertElement : function()
    {
        this.playerID = this.get("websocket.playerID");
        this.InitializeThreeJS();
        this.Animate();
    },

    InitializeThreeJS : function()
    {
        this.raycaster = new THREE.Raycaster();

        this.mouse = new THREE.Vector2();
        this.SCREEN_WIDTH = 400;
        this.SCREEN_HEIGHT = 400;
        this.container = null;
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.ground = null;
        this.tileSpacing = 10;
        this.light = null;
        this.clock = new THREE.Clock();
        this.blockGrid = [];
        this.sphereGeom = new THREE.SphereGeometry(1);
        this.lastPlaceTime = 0;
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
        this.colorOfType =
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
        this.materialOfType =
            [
                new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: this.colorOfType[0]}),
                new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: this.colorOfType[1]}),
                new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: this.colorOfType[2]}),
                new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: this.colorOfType[3]}),
                new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: this.colorOfType[4]}),
                new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: this.colorOfType[5]}),
                new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: this.colorOfType[6]}),
                new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, color: this.colorOfType[7]})
            ];

        this.camera = new THREE.PerspectiveCamera( 45, this.SCREEN_WIDTH / this.SCREEN_HEIGHT, 1, 4000 );
        this.camera.up.set( 0, 0,-1);
        // SCENE

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog( 0x222222, 1000, 4000 );

        this.scene.add( this.camera );

        // LIGHTS

        this.scene.add( new THREE.AmbientLight( 0x222222 ) );

        this.light = new THREE.DirectionalLight( 0xffffff, 2.25 );
        this.light.position.set(10,100,5);
        //light.shadowMapDebug =true;
        this.scene.add( this.light );

        // Block Grid
        this.blockWidth = 6;
        this.blockHeight = 6;
        var blockSizeRatio = .8;
        var blockSize = this.tileSpacing * blockSizeRatio;

        var width = this.blockWidth * this.tileSpacing;
        var height = this.blockHeight * this.tileSpacing;

        var geometry = new THREE.BoxGeometry(1,1,1);
        for(var col = 0; col < this.blockHeight; ++col) {
            this.blockGrid[col] = [];
            for (var row = 0; row < this.blockWidth; ++row) {
                var material = new THREE.MeshBasicMaterial({ opacity : 0,transparent : true});
                var cube = new THREE.Mesh(geometry, material);
                cube.visible = false;
                cube.position.set(row * this.tileSpacing + this.tileSpacing / 2, blockSize / 2, col * this.tileSpacing + this.tileSpacing / 2);
                cube.scale.set(blockSize,blockSize,blockSize);
                this.blockGrid[col][row] = { type : -1, mesh : cube};
                this.scene.add(cube);
                var tweenDown = new TWEEN.Tween(cube.position).to({y : "-4"}, 1000);
                var tweenUp = new TWEEN.Tween(cube.position).to({ y : "+4"}, 1000);
                tweenDown.delay(row * col).chain(tweenUp.chain(tweenDown)).start();
            }
        }

        // Helpers
        var gridHelper = new THREE.GridHelper(width/2, this.tileSpacing);
        gridHelper.position.x = width/2;
        gridHelper.position.y = 2;
        gridHelper.position.z = height/2;
        this.camera.position.set( width/2, 150, height/2);
        this.camera.lookAt(new THREE.Vector3( width/2, 0, height/2));
        this.scene.add(gridHelper);
        //  GROUND

        var gg = new THREE.PlaneBufferGeometry(width, height);
        var gm = new THREE.MeshBasicMaterial({ specular : 0x000000, color: 0x000000 });

        this.ground = new THREE.Mesh( gg, gm );
        this.ground.rotation.x = - Math.PI / 2;
        this.ground.position.x = width/2;
        this.ground.position.z = height/2;
        // note that because the ground does not cast a shadow, .castShadow is left false
        this.ground.receiveShadow = false;

        this.scene.add( this.ground );

        // RENDERER

        this.renderer = new THREE.WebGLRenderer( { canvas: this.$(".game-board")[0], antialias: true } );
        this.renderer.setClearColor( this.scene.fog.color );
        this.renderer.setPixelRatio( window.devicePixelRatio );

        // EVENTS

        this.renderer.domElement.addEventListener( 'click', this.onDocumentClick.bind(this), false );

    },

    CreateExplosion : function(tile)
    {
        var star = new THREE.Mesh(this.sphereGeom, this.materialOfType[tile.type]);
        star.scale.set(2,2,2);
        star.material.opacity = 1;
        star.position.set(tile.col * this.tileSpacing + this.tileSpacing / 2, 10, tile.row * this.tileSpacing + this.tileSpacing / 2);
        this.scene.add(star);
        new TWEEN.Tween(star.position).easing(TWEEN.Easing.Quadratic.Out).to({x:Math.random() * 200 - 100, y: Math.random()*100,z: Math.random()*200 - 100},500).start();
        new TWEEN.Tween(star.material).to({opacity : 0},500).onComplete(function()
        {
            star.parent.remove(star);
        }).start();
    },

    SetBlock : function(row, col, tileType)
    {
        if(row < 0 || col < 0 || row >= this.blockWidth || col >= this.blockHeight)
            return;
        var block = this.blockGrid[row][col];
        if(!block)
            return;
        var oldType = block.type;
        if(oldType == tileType)
            return;
        block.type = tileType;
        var self = this;
        var originalY = block.mesh.position.y;
        var upTween = new TWEEN.Tween(block.mesh.position).onStart(function()
        {
            var color = self.colorOfType[tileType];
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
    },

    onDocumentClick : function( event )
    {
        event.preventDefault();

        this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        this.ProjectVector(this.mouse);
    },

    ProjectVector : function(mouse) {
        var socket = this.get("websocket.socket");
        this.raycaster.setFromCamera(this.mouse, this.camera);
        var intersects = this.raycaster.intersectObject(this.ground);
        /*if (tileset.length < 1)
            return;TODO*/
        if (intersects.length > 0) {
            var intersect = intersects[0];
            var point = intersect.point;
            var col = Math.floor(point.x / this.tileSpacing);
            var row = Math.floor(point.z / this.tileSpacing);
            if (socket) {
                var now = Date.now();
                if (now - this.lastPlaceTime > 150)
                    this.lastPlaceTime = now;
                if (true){//TODOtileset[0] != this.blockGrid[row][col].type) {
                    socket.emit("user place block", { id: this.playerID, row: row, col: col });
                    //this.SetBlock(row, col, this.tileset[0]);
                    //TODO!
                    // tileset.shift();
                    //this.SetTileSet(tileset);
                }
            }
        } else {

        }
    },

    Animate : function() {
        var delta = this.clock.getDelta();
        requestAnimationFrame( this.Animate.bind(this) );
        TWEEN.update();
        this.Render(delta);
    },

    Render : function(delta)
    {
        this.renderer.render( this.scene, this.camera );
    }
});
