var container;
var camera, scene, renderer;
var clock = new THREE.Clock();
var geom = new THREE.Geometry;;
var keyboard = new THREEx.KeyboardState();
const N = 300;

var t = [0, 1, 2, 3];
var T = 10;

var mouse = { x: 0, y: 0 };
var targetList = []; 
var cursor;
var circle;
var radius = 10;
var brushDirection = 0; 

var selectedObj = null;
var objectList = [];

var gui = new dat.GUI();
gui.width = 200;
var params =
{
    sx: 0, sy: 0, sz: 0,
    brush: true,
    addHouse: function() { loadModel('models/', 'Cyprys_House.obj', 'Cyprys_House.mtl', 1) },
    del: function() { delMesh() }
};

var folder1 = gui.addFolder('Scale');
var meshSX = folder1.add( params, 'sx' ).min(1).max(100).step(1).listen();
var meshSY = folder1.add( params, 'sy' ).min(1).max(100).step(1).listen();
var meshSZ = folder1.add( params, 'sz' ).min(1).max(100).step(1).listen();

var cubeVisible = gui.add( params, 'brush' ).name('brush').listen();
cubeVisible.onChange(function(value)
{
    cursor.visible = value;
    circle.visible = value;
});

gui.add( params, 'addHouse' ).name( "add house" );
gui.add( params, 'del' ).name( "delete" );


function init()
{
    container = document.getElementById( 'container' );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.set(150, 100, -150);
    camera.lookAt(new THREE.Vector3( N/2, 0, N/2));


    var light = new THREE.DirectionalLight(0xffffff);
    
    light.position.set( 1500, 500, 1000);
    light.target = new THREE.Object3D();
    light.target.position.set(  N/2, 0, N/2 );
    scene.add(light.target);
    light.castShadow = true;
    light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 70, 1, 1, 2500 ) );
    light.shadow.bias = 0.0001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add( light );
    
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x11aa11, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize, false );

    renderer.domElement.addEventListener('mousedown',onDocumentMouseDown,false);
    renderer.domElement.addEventListener('mouseup',onDocumentMouseUp,false);
    renderer.domElement.addEventListener('mousemove',onDocumentMouseMove,false);
    renderer.domElement.addEventListener('wheel',onDocumentMouseScroll,false);
    renderer.domElement.addEventListener("contextmenu", function (event){ event.preventDefault(); });

    var helper = new THREE.CameraHelper(light.shadow.camera);
    //scene.add( helper );

    mixer = new THREE.AnimationMixer( scene );
    CreateGeometry();
    addCursor();
    addCircle();
    //spawnModels();
    gui.open();
}

function onDocumentMouseScroll( event ) {
    if(radius > 1 && event.wheelDelta < 0)
        radius--;
    if(radius < 50 && event.wheelDelta > 0)
        radius++;
    circle.scale.set(radius, 1, radius);
}

function onDocumentMouseMove( event ) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    vector.unproject(camera);
    var ray = new THREE.Raycaster( camera.position,
    vector.sub( camera.position ).normalize() );
    var intersects = ray.intersectObjects( targetList );
    if(params.brush == true){
        if ( intersects.length > 0 )
        {
            console.log(intersects[0]);
            if(cursor != null){
                cursor.position.copy(intersects[0].point);
                cursor.position.y += 10;
                
            }
            if(circle != null){
                circle.position.copy(intersects[0].point);
                circle.position.y = 0;
                for(var i = 0; i<circle.geometry.vertices.length; i++){
                    var pos = new THREE.Vector3();
                    pos.copy(circle.geometry.vertices[i]);
                    pos.applyMatrix4(circle.matrixWorld);
                    var x = Math.round(pos.x);
                    var z = Math.round(pos.z);
                    
                    if(x >= 0 && x < N && z>=0 && z < N){
                        var y = geom.vertices[z+x*N].y;
                        circle.geometry.vertices[i].y = y + 0.1;
                    }else
                        circle.geometry.vertices[i].y = 0;
                }
                circle.geometry.verticesNeedUpdate = true;
            }
        }
    }else{
        //if(intersects.length > 0)
            if(selectedObj != null){
                selectedObj.position.copy(intersects[o].point);
                console.log(selectedObj);
            }
    }
}

function onDocumentMouseDown( event ) {
    if(params.brush == true){
        if(event.which == 1)
            brushDirection = 1;
        if(event.which == 3)
            brushDirection = -1;
    }else{
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

        var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
        vector.unproject(camera);
        var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
        var intersects = ray.intersectObjects( objectList, true );
        var arrowHelper = new THREE.ArrowHelper( vector, camera.position, vector.distanceTo(camera.position), 0xffff00 );
        scene.add( arrowHelper );
        if ( intersects.length > 0 ){
            selectedObj = intersects[0].object.parent;
            console.log(selectedObj);
        }
    }
}

function bruh(coeff){
    for(var i = 0; i < geom.vertices.length; i++){
        var x2 = geom.vertices[i].x;
        var z2 = geom.vertices[i].z;
        r = radius;
        var x1 = cursor.position.x;
        var z1 = cursor.position.z;
        var h = r*r - (((x2-x1) * (x2-x1) + (z2-z1) * (z2-z1)));
        if(h > 0){
            geom.vertices[i].y += Math.sqrt(h) * coeff; 
        }
        
    }
    geom.computeFaceNormals();
    geom.computeVertexNormals(); 
    geom.verticesNeedUpdate = true; 
    geom.normalsNeedUpdate = true;
}

function onDocumentMouseUp( event ) {
    if(params.brush == true){
        brushDirection = 0;
    }else{
        selectedObj = null;
    }
}

function addCircle(){
    var material = new THREE.LineBasicMaterial( { color: 0xffff00 } );
    
    var segments = 32;
    var circleGeometry = new THREE.CircleGeometry( 1, segments );
    //удаление центральной вершины
    

    for(var i = 0; i< circleGeometry.vertices.length; i++){
        circleGeometry.vertices[i].z = circleGeometry.vertices[i].y;
        circleGeometry.vertices[i].y = 0;
    }

    circleGeometry.vertices.shift();
    
    circle = new THREE.Line( circleGeometry, material );
    circle.scale.set(radius, 1, radius);
    scene.add( circle );
}

function addCursor(){
    var geometry = new THREE.CylinderGeometry( 10, 0, 20, 64 );
    var cyMaterial = new THREE.MeshLambertMaterial( {color: 0x888888} );
    cursor = new THREE.Mesh( geometry, cyMaterial );
    scene.add( cursor );
}

function CreateGeometry(){
    var depth = N;
    var width = N;

    var canvas = document.createElement('canvas');
    canvas.width = N;
    canvas.height = N;
    var ctx = canvas.getContext('2d');

    var img = new Image();
    img.src = "pics/plateau.jpg";
    
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            var pixel = ctx.getImageData(0, 0, width, depth);

            
            for (var x = 0; x < depth; x++) {
                for (var z = 0; z < width; z++) {
                    var vertex = new THREE.Vector3(x, 0, z );
                    geom.vertices.push(vertex);
                }

                
            }
            
            for (var z = 0; z < depth - 1; z++) {
                for (var x = 0; x < width - 1; x++) {
                    var a = x + z * width;
                    var b = (x + 1) + (z * width);
                    var c = x + ((z + 1) * width);
                    var d = (x + 1) + ((z + 1) * width);

                    var face1 = new THREE.Face3(a, b, d);
                    var face2 = new THREE.Face3(d, c, a);

                    geom.faces.push(face1);
                    geom.faces.push(face2);

                    geom.faceVertexUvs[0].push([new THREE.Vector2((x)/(width-1), (z)/(depth-1)),
                        new THREE.Vector2((x+1)/(width-1), (z)/(depth-1)),
                        new THREE.Vector2((x+1)/(width-1), (z+1)/(depth-1))]);
            
                    geom.faceVertexUvs[0].push([new THREE.Vector2((x+1)/(width-1), (z+1)/(depth-1)),
                        new THREE.Vector2((x)/(width-1), (z+1)/(depth-1)),
                        new THREE.Vector2((x)/(width-1), (z)/(depth-1))]);
                }
            }
            //spawnModels();
            //createCurve();
            var loader = new THREE.TextureLoader();
            var tex = loader.load( 'pics/rock_texture.jpg' );

            geom.computeVertexNormals();
            geom.computeFaceNormals();
            geometry = geom;
            mesh = new THREE.Mesh(geom, new THREE.MeshLambertMaterial({
                map:tex,
                wireframe: false,
                side:THREE.DoubleSide
            }));
            mesh.receiveShadow = true;
            //mesh.castShadow = true;
            scene.add(mesh);
            
            targetList.push(mesh);
            ///////////////////////////////////////////////////////////// sky

            var geometry = new THREE.SphereGeometry( 1500, 32, 32 );
            
            tex = loader.load( 'pics/sky.jpg' );
            var material = new THREE.MeshBasicMaterial({
                map: tex,
                side: THREE.DoubleSide
               });
            var sphere = new THREE.Mesh( geometry, material );
            sphere.position = new THREE.Vector3(N/2, -1000, N/2);
            scene.add(sphere);
        };
   
}

function delMesh(){
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    vector.unproject(camera);
    var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
    var link = ray.intersectObjects( objectList, true );
    console.log(link);
    var ind = objectList.indexOf(link);
    //если такой индекс существует, удаление одного эллемента из массива
    if (~ind) objectList.splice(ind, 1);
    //удаление из сцены объекта, на который ссылается link
    scene.remove(link); 
}


function loadModel(path, oname, mname, count)
{
    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( Math.round(percentComplete, 2) + '% downloaded' );
        }
    };
    var onError = function ( xhr ) { };

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath(path );

    mtlLoader.load( mname, function( materials )
    {
        materials.preload();

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        objLoader.setPath( path );

        objLoader.load( oname, function ( object )
        {
            for(var i = 0; i<count; i++){
                

                //object.scale.set(0.2, 0.2, 0.2);
                object.traverse( function ( child )
                {
                    if ( child instanceof THREE.Mesh )
                    {
                        child.castShadow = true;
                        child.parent = object;
                    }
                } );

                object.parent = object;

                var x = Math.random() * N;
                var z = Math.random() * N;
                var y = calcHeight(x, z);
                object.position.x = x;
                object.position.y = y;
                object.position.z = z;
                //model.receiveShadow = true;
                object.castShadow = true;
                scene.add( object.clone() );
                //targetList.push(model.clone());
                objectList.push(object.clone());
            }

        }, onProgress, onError );
    });
}



function calcHeight(x, z){
    return geom.vertices[Math.round(z) + Math.round(x) * N].y;
}


function randomVector3(){
    var x = Math.random() * N;
    var z = Math.random() * N;
    var y = calcHeight(x, z);
    return new THREE.Vector3(x, y, z); 
}

async function spawnModels(){
    loadModel('models/', 'Cyprys_House.obj', 'Cyprys_House.mtl', 1);
}



////////////////////////////////////////////////////
function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}





function animate()
{
    var delta = clock.getDelta();
    requestAnimationFrame( animate );
    render();
    if(brushDirection != 0){
        bruh(brushDirection * delta * 0.5);
    }
}


function render()
{
    renderer.render( scene, camera );

}




init();
animate();