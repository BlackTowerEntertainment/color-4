import Ember from 'ember';

export default Ember.Component.extend({
    websocket: Ember.inject.service(),
    init : function()
    {
        let socket = this.get("websocket.socket");
        this.set("tileset", []);
        var self = this;
        socket.on('tileset change', function (tilesetData) {
            self.set("tileset", tilesetData);
            console.log("Tileset", tilesetData);
            //SetTileSet(tileset);
        });
        return;
        var geometry = new THREE.BoxGeometry(1,1,1);
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

    }
});


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
