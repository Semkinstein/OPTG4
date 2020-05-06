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

var houseModel = null;
var bushModel = null;
var gradeModel = null;
var selectedObj = null;
var previousObject = null;
var objectList = [];

var gui = new dat.GUI();
gui.width = 200;
var params =
{
    sx: 50, sy: 50, sz: 50,
    rx: 0, ry: 0, rz: 0,
    brush: true,
    addHouse: function() { createHouse() },
    addBush: function() { createBush() },
    addGrade: function() { createGrade() },
    del: function() { delMesh() }
};

var folder1 = gui.addFolder('Scale');
var meshSX = folder1.add( params, 'sx' ).min(1).max(100).step(1).listen();
var meshSY = folder1.add( params, 'sy' ).min(1).max(100).step(1).listen();
var meshSZ = folder1.add( params, 'sz' ).min(1).max(100).step(1).listen();

var folder2 = gui.addFolder('Rotation');
var meshRX = folder2.add( params, 'rx' ).min(-10).max(10).step(1).listen();
var meshRY = folder2.add( params, 'ry' ).min(-10).max(10).step(1).listen();
var meshRZ = folder2.add( params, 'rz' ).min(-10).max(10).step(1).listen();

meshSX.onChange(function(value) {
    if(previousObject != null){
        previousObject.scale.set(value/50, params.sy/50, params.sz/50);
        previousObject.userData.box.setFromObject(previousObject);
        var pos = new THREE.Vector3();
        previousObject.userData.box.getCenter(pos);
        var size = new THREE.Vector3();
        previousObject.userData.box.getSize(size);
        previousObject.userData.cube.scale.set(size.x, size.y, size.z);
        previousObject.userData.box.getSize(previousObject.userData.obb.halfSize).multiplyScalar(0.5);
        previousObject.userData.cube.position.copy(pos);
         previousObject.updateMatrixWorld();

        // // extract the rotation matrix
        //  const rotMat = new THREE.Matrix4();
        //  previousObject.matrixWorld.extractRotation(rotMat);

        // previousObject.userData.cube.applyMatrix4(rotMat);
        // previousObject.updateMatrixWorld();
        // // extract the rotation
        //  const euler = new THREE.Euler();
        //  euler.setFromRotationMatrix(rotMat);
        //  previousObject.userData.cube.position.applyEuler(euler);
    }
});
meshSY.onChange(function(value) {
    if(previousObject != null){
        previousObject.scale.set(params.sx/50, value/50, params.sz/50);
        previousObject.userData.box.setFromObject(previousObject);
        var pos = new THREE.Vector3();
        previousObject.userData.box.getCenter(pos);
        var size = new THREE.Vector3();
        previousObject.userData.box.getSize(size);
        previousObject.userData.cube.scale.set(size.x, size.y, size.z);
        previousObject.userData.box.getSize(previousObject.userData.obb.halfSize).multiplyScalar(0.5);
        previousObject.userData.cube.position.copy(pos);
    }
});
meshSZ.onChange(function(value) {
    if(previousObject != null){
        previousObject.scale.set(params.sx/50, params.sy/50, value/50);
        previousObject.userData.box.setFromObject(previousObject);
        var pos = new THREE.Vector3();
        previousObject.userData.box.getCenter(pos);
        var size = new THREE.Vector3();
        previousObject.userData.box.getSize(size);
        previousObject.userData.cube.scale.set(size.x, size.y, size.z);
        previousObject.userData.box.getSize(previousObject.userData.obb.halfSize).multiplyScalar(0.5);
        previousObject.userData.cube.position.copy(pos);
    }
});

meshRX.onChange(function(value) {
    previousObject.rotateX(value/180);
    previousObject.userData.box.setFromObject(previousObject);
    var pos = new THREE.Vector3();
    previousObject.userData.box.getCenter(pos);
    previousObject.userData.cube.position.copy(pos);
    previousObject.userData.cube.rotateX(value/180);
    previousObject.userData.obb.basis.extractRotation(previousObject.matrixWorld);
});
meshRY.onChange(function(value) {
    previousObject.rotateY(value/180);
    previousObject.userData.box.setFromObject(previousObject);
    var pos = new THREE.Vector3();
    previousObject.userData.box.getCenter(pos);
    previousObject.userData.cube.position.copy(pos);
    previousObject.userData.cube.rotateY(value/180);
    previousObject.userData.obb.basis.extractRotation(previousObject.matrixWorld);
});
meshRZ.onChange(function(value) {
    previousObject.rotateZ(value/180);
    previousObject.userData.box.setFromObject(previousObject);
    var pos = new THREE.Vector3();
    previousObject.userData.box.getCenter(pos);
    previousObject.userData.cube.position.copy(pos);
    previousObject.userData.cube.rotateZ(value/180);
    previousObject.userData.obb.basis.extractRotation(previousObject.matrixWorld);
});

var cubeVisible = gui.add( params, 'brush' ).name('brush').listen();
cubeVisible.onChange(function(value)
{
    cursor.visible = value;
    circle.visible = value;
});

gui.add( params, 'addHouse' ).name( "add house" );
gui.add( params, 'addBush' ).name( "add bush" );

gui.add( params, 'del' ).name( "delete" );


function init()
{
    container = document.getElementById( 'container' );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.set(150, 100, -150);
    camera.lookAt(new THREE.Vector3( N/2, 0, N/2));


    var light = new THREE.DirectionalLight(0xffffff);
    
    light.position.set( 1500, 500, -1000);
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

    mixer = new THREE.AnimationMixer( scene );
    CreateGeometry();
    addCursor();
    addCircle();
    loadModel('models/', 'Cyprys_House.obj', 'Cyprys_House.mtl', 1);
    loadModel('models/', 'Tree.obj', 'Tree.mtl', 1);
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
        
            if(selectedObj != null){
                var oldpos = new THREE.Vector3();
                oldpos.copy(selectedObj.position)
                selectedObj.position.copy(intersects[0].point);
                selectedObj.userData.box.setFromObject(selectedObj);
                var pos = new THREE.Vector3();
                selectedObj.userData.box.getCenter(pos);
                selectedObj.userData.cube.position.copy(pos);
                selectedObj.userData.obb.position.copy(pos);
                
                for(var i = 0; i < objectList.length; i++){
                    if(selectedObj.userData.cube != objectList[i]){
                        if(intersect(objectList[i].userData.model.userData, selectedObj.userData) == true){
                            console.log("intersect");
                            selectedObj.position.copy(oldpos);
                            selectedObj.userData.box.setFromObject(selectedObj);
                            var pos = new THREE.Vector3();
                            selectedObj.userData.box.getCenter(pos);
                            selectedObj.userData.cube.position.copy(pos);
                            selectedObj.userData.obb.position.copy(pos);
                        }
                    }
                }
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
    
        if ( intersects.length > 0 ){
            if(previousObject != null)
                previousObject.userData.cube.material.visible = false;
            selectedObj = intersects[0].object.userData.model;
            selectedObj.userData.cube.material.visible = true;
            selectedObjPos = selectedObj.position;
            console.log(selectedObj);
        }
    }
}



function onDocumentMouseUp( event ) {
    if(params.brush == true){
        brushDirection = 0;
    }else{
        previousObject = selectedObj;
        selectedObj.userData.cube.material.visible = false;
        previousObject.userData.cube.material.visible = true;
        selectedObj = null;
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
///////// Bounding box

function createBB(model){
    var box = new THREE.Box3();
    box.setFromObject(model);
    model.userData.box = box;

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    var cube = new THREE.Mesh( geometry, material );
    scene.add( cube );

    
    /////// AABB
    var pos = new THREE.Vector3();
    model.userData.box.getCenter(pos);
    //получение размеров объекта
    var size = new THREE.Vector3();
    model.userData.box.getSize(size);
    //установка позиции и размера объекта в куб
    cube.position.copy(pos);
    cube.scale.set(size.x, size.y, size.z);

    var obb = {};
    //структура состоит из матрицы поворота, позиции и половины размера
    obb.basis = new THREE.Matrix4();
    obb.halfSize = new THREE.Vector3();
    obb.position = new THREE.Vector3();
    //получение позиции центра объекта
    model.userData.box.getCenter(obb.position);
    //получение размеров объекта
    model.userData.box.getSize(obb.halfSize).multiplyScalar(0.5);
    //получение матрицы поворота объекта
    obb.basis.extractRotation(model.matrixWorld);
    //структура хранится в поле userData объекта
    model.userData.obb = obb;

    model.userData.cube = cube;
    cube.userData.model = model;
    
    cube.material.visible = false;
    scene.add(model);
    objectList.push(model.userData.cube);
}

function createHouse(){
    if(houseModel != null){
        var model = houseModel.clone();
        var x = Math.random() * N;
        var z = Math.random() * N;
        var y = calcHeight(x, z);
        model.position.x = x;
        model.position.y = y;
        model.position.z = z;

        createBB(model);
    }
}

function createBush(){
    if(bushModel != null){
        var model = bushModel.clone();
        var x = Math.random() * N;
        var z = Math.random() * N;
        var y = calcHeight(x, z);
        model.position.x = x;
        model.position.y = y;
        model.position.z = z;

        createBB(model);
    }
}



function delMesh(){
    var ind = objectList.indexOf(previousObject);
    if (~ind) objectList.splice(ind, 1);
    scene.remove(previousObject); 
    scene.remove(previousObject.userData.cube);
    scene.remove(previousObject.userData.box);
}

///////// Добавление моделей

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
                

                //object.scale.set(2, 2, 2);
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
                var model = object.clone();
                if(oname == 'Cyprys_House.obj'){
                    houseModel = model;
                    //model.scale.set(2, 2, 2);
                }
                if(oname == 'Tree.obj'){
                    bushModel = model;
                    //model.scale.set(0.2, 0.2, 0.2);
                }
                
                //scene.add( model );
                //return model;
                //targetList.push(model.clone());
                //objectList.push(model);
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

function intersect(ob1, ob2)
{
    var xAxisA = new THREE.Vector3();
    var yAxisA = new THREE.Vector3();
    var zAxisA = new THREE.Vector3();
    var xAxisB = new THREE.Vector3();
    var yAxisB = new THREE.Vector3();
    
    var zAxisB = new THREE.Vector3();
    var translation = new THREE.Vector3();
    var vector = new THREE.Vector3();

    var axisA = [];
    var axisB = [];
    var rotationMatrix = [ [], [], [] ];
    var rotationMatrixAbs = [ [], [], [] ];
    var _EPSILON = 1e-3;

    var halfSizeA, halfSizeB;
    var t, i;

    ob1.obb.basis.extractBasis( xAxisA, yAxisA, zAxisA );
    ob2.obb.basis.extractBasis( xAxisB, yAxisB, zAxisB );

    // push basis vectors into arrays, so you can access them via indices
    axisA.push( xAxisA, yAxisA, zAxisA );
    axisB.push( xAxisB, yAxisB, zAxisB );
    // get displacement vector
    vector.subVectors( ob2.obb.position, ob1.obb.position );
    // express the translation vector in the coordinate frame of the current
    // OBB (this)
    for ( i = 0; i < 3; i++ )
    {
    translation.setComponent( i, vector.dot( axisA[ i ] ) );
    }
    // generate a rotation matrix that transforms from world space to the
    // OBB's coordinate space
    for ( i = 0; i < 3; i++ )
    {
    for ( var j = 0; j < 3; j++ )
    {
    rotationMatrix[ i ][ j ] = axisA[ i ].dot( axisB[ j ] );
    rotationMatrixAbs[ i ][ j ] = Math.abs( rotationMatrix[ i ][ j ] ) + _EPSILON;
    }
    }
    // test the three major axes of this OBB
    for ( i = 0; i < 3; i++ )
    {
    vector.set( rotationMatrixAbs[ i ][ 0 ], rotationMatrixAbs[ i ][ 1 ], rotationMatrixAbs[ i ][ 2 ]
    );
    halfSizeA = ob1.obb.halfSize.getComponent( i );
    halfSizeB = ob2.obb.halfSize.dot( vector );
    
    
    if ( Math.abs( translation.getComponent( i ) ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    }
    // test the three major axes of other OBB
    for ( i = 0; i < 3; i++ )
    {
    vector.set( rotationMatrixAbs[ 0 ][ i ], rotationMatrixAbs[ 1 ][ i ], rotationMatrixAbs[ 2 ][ i ] );
    halfSizeA = ob1.obb.halfSize.dot( vector );
    halfSizeB = ob2.obb.halfSize.getComponent( i );
    vector.set( rotationMatrix[ 0 ][ i ], rotationMatrix[ 1 ][ i ], rotationMatrix[ 2 ][ i ] );
    t = translation.dot( vector );
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    }
    // test the 9 different cross-axes
    // A.x <cross> B.x
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 0 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 1 ];
    t = translation.z * rotationMatrix[ 1 ][ 0 ] - translation.y * rotationMatrix[ 2 ][ 0 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.x < cross> B.y
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 1 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 0 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 0 ];
    t = translation.z * rotationMatrix[ 1 ][ 1 ] - translation.y * rotationMatrix[ 2 ][ 1 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    
    // A.x <cross> B.z
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 2 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 0 ][ 1 ] + ob2.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 0 ];
    t = translation.z * rotationMatrix[ 1 ][ 2 ] - translation.y * rotationMatrix[ 2 ][ 2 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.y <cross> B.x
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 0 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 1 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 1 ];
    t = translation.x * rotationMatrix[ 2 ][ 0 ] - translation.z * rotationMatrix[ 0 ][ 0 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.y <cross> B.y
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 1 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 0 ];
    t = translation.x * rotationMatrix[ 2 ][ 1 ] - translation.z * rotationMatrix[ 0 ][ 1 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.y <cross> B.z
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 2 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 1 ] + ob2.obb.halfSize.y *
    rotationMatrixAbs[ 1 ][ 0 ];
    t = translation.x * rotationMatrix[ 2 ][ 2 ] - translation.z * rotationMatrix[ 0 ][ 2 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    
    // A.z <cross> B.x
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 0 ] + ob1.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 2 ][ 1 ];
    t = translation.y * rotationMatrix[ 0 ][ 0 ] - translation.x * rotationMatrix[ 1 ][ 0 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.z <cross> B.y
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 1 ] + ob1.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 2 ][ 0 ];
    t = translation.y * rotationMatrix[ 0 ][ 1 ] - translation.x * rotationMatrix[ 1 ][ 1 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.z <cross> B.z
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 2 ] + ob1.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 1 ] + ob2.obb.halfSize.y *
    rotationMatrixAbs[ 2 ][ 0 ];
    t = translation.y * rotationMatrix[ 0 ][ 2 ] - translation.x * rotationMatrix[ 1 ][ 2 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // no separating axis exists, so the two OBB don't intersect
    return true;
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