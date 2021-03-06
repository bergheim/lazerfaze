var camera, scene, renderer;
var effect, controls;
var element, container, gui;
var players = [];
var raycaster, crosshairs;
var score, timer;
var employeeGroup = [];
var isPlaying;
var maxDuration, remainingTime;
var isTimerStarted;
var startMesh;
var points_left, points_right, score_left, score_right;

const player = {
    velocity: {
        x: 0,
        z: 0,
    }
};

const randomMovements = [
    (i, j) => ({
        x: Math.sin(i) * 60,
        y: i + 50*Math.sin(i + j),
        z: i + 5*Math.sin(i + j),
    }),
];

function rand() {
    return Math.random() - 0.5;
}

function calc2Dist(vector) {
   return Math.sqrt(Math.pow(vector.x,2) + Math.pow(vector.y,2));  
}

function calc3Dist(vector) {
   return calc2Dist({x:calc2Dist({x:vector.x,y:vector.y}),y:vector.z});
}

// Det er for mange, og for langt unna! (den ene for�rsaker den andre)
function generateOriginPos(seed) {
    var returnObj = {
      x:  Math.random()*500-250,
      y:  Math.random()*250,
      z:  Math.random()*500-250
    }
    while(calc3Dist(returnObj) < 40) {
      //Ok, med litt uheldig RNG kan den her faktisk tryne spillet, men pytt
      returnObj = generateOriginPos();
    }
    return returnObj;
}


var clock = new THREE.Clock();
// var socket = io('http://localhost:3000');

// socket.on('welcome', function (data) {
//   console.log('registered as player:', data);
//   socket.emit('my other event', { my: 'data' });
// });
//
// socket.on('connect', function(){
//   console.log('connected to server.');
// });
//
// socket.on('all-players', function(data){
//   console.log('got message to all-players:', data);
// });
//
// socket.on('disconnect', function(){
//   console.log('disconnected from server.');
// });

init();
animate();

function startTimer() {
  isTimerStarted = true;
  return setInterval(() => {
    remainingTime -= 1;
  }, 1000);
}

function resetGame(scene, isReset) {
  score = 0;
  isPlaying = !isReset;
  maxDuration = 20;
  remainingTime = maxDuration;
  isTimerStarted = false;

    for (let i = 0; i < employees.length; i++) {
        employees[i].origin = generateOriginPos(i * 10);
    }
}

function init() {
    renderer = new THREE.WebGLRenderer();
    element = renderer.domElement;
    container = document.getElementById('app');
    container.appendChild(element);

    score_left = document.getElementById('score_left');
    score_right = document.getElementById('score_right');

    points_left = document.getElementById('points_left');
    points_right = document.getElementById('points_right');

    effect = new THREE.StereoEffect(renderer);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xefd1b5, 0.004 );

    camera = new THREE.PerspectiveCamera(90, 1, 0.001, 700);
    camera.position.set(0, 10, 0);
    scene.add(camera);

    resetGame(scene, true);

    for (var i = 0; i < employees.length; i++) {
      const increment = i * 3;
      scene.add(employees[i]);
      employeeGroup.push(employees[i]);
      employees[i].position.x = 8 + increment;
      employees[i].position.y = 3 + increment;
    }

    controls = new THREE.OrbitControls(camera, element);
    // controls.rotateUp(Math.PI / 4);
    controls.target.set(
        camera.position.x + 0.1,
        camera.position.y,
        camera.position.z
    );
    controls.noZoom = true;
    controls.noPan = true;

    function setOrientationControls(e) {
        if (!e.alpha) {
            return;
        }

        controls = new THREE.DeviceOrientationControls(camera, true);
        controls.connect();
        controls.update();

        element.addEventListener('click', fullscreen, false);

        window.removeEventListener('deviceorientation', setOrientationControls, true);
    }
    window.addEventListener('deviceorientation', setOrientationControls, true);

    raycaster = new THREE.Raycaster();
    // TODO: the width/height might be off
    const width = container.innerWidth / 4;
    const height = container.innerHeight / 4;
    crosshairs = new THREE.Vector2(width, height);

    var light = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 0.6);
    scene.add(light);

    var textureLoader = new THREE.TextureLoader();

    var texture = textureLoader.load('textures/patterns/checkers2.jpg');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat = new THREE.Vector2(10, 10);
    texture.anisotropy = renderer.getMaxAnisotropy();
    var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        specular: 0xffffff,
        shininess: 20,
        shading: THREE.FlatShading,
        map: texture,
        transparent: true,
        opacity: 0.5
    });
    var geometry = new THREE.PlaneGeometry(400, 400);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -10;
    scene.add(mesh);

    // Jeløya radio!
    objMat = new THREE.Texture();
    objTexLoad = new THREE.ImageLoader();
    objTexLoad.load('fasade.jpg', function(image) {
        objMat.image = image;
        objMat.needsUpdate = true;
    });

    var startThing = new THREE.BoxGeometry(3, 3, 3);
    var startMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    startMesh = new THREE.Mesh( startThing, startMaterial);
    startMesh.position.x = 10;
    startMesh.position.y = 2;
    scene.add(startMesh);

    var objLoader = new THREE.OBJLoader();
    objLoader.load('fasadefix3.obj', function(obj) {
        //obj.position.y = 10;
        obj.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
              child.material.map = objMat;
            }
        });
        scene.add(obj);
    });

    var materials = [
        new THREE.MeshBasicMaterial( { map: textureLoader.load('textures/cube/skybox/px.jpg'), side: THREE.BackSide } ), // right
        new THREE.MeshBasicMaterial( { map: textureLoader.load('textures/cube/skybox/nx.jpg'), side: THREE.BackSide } ), // left
        new THREE.MeshBasicMaterial( { map: textureLoader.load('textures/cube/skybox/py.jpg'), side: THREE.BackSide } ), // top
        new THREE.MeshBasicMaterial( { map: textureLoader.load('textures/cube/skybox/ny.jpg'), side: THREE.BackSide } ), // bottom
        new THREE.MeshBasicMaterial( { map: textureLoader.load('textures/cube/skybox/pz.jpg'), side: THREE.BackSide } ), // back
        new THREE.MeshBasicMaterial( { map: textureLoader.load('textures/cube/skybox/nz.jpg'), side: THREE.BackSide } )  // front
    ];
    var skyGeometry = new THREE.BoxGeometry( 600, 600, 600 );
    var skyMaterial = new THREE.MultiMaterial( materials );
    var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
    scene.add( skyBox );

    const boxGroup = new THREE.Object3D();
    for (let group = 0; group < numGroups; group++) {
        for (let j = 0; j < groupSize; j++) {
            const index = group * groupSize + j;
            const increment = index * 10;
            boxGroup.add(employees[index]);
            employeeGroup.push(employees[index]);
            employees[index].origin = generateOriginPos(increment);
        }
    }
    boxGroup.name = "Employees";
    scene.add(boxGroup);

    window.addEventListener('resize', resize, false);
    setTimeout(resize, 1);
}

function resize() {
    var width = container.offsetWidth;
    var height = container.offsetHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    effect.setSize(width, height);
}

function update(dt) {
    resize();

    camera.position.x += player.velocity.x;
    camera.position.z += player.velocity.z;

    controls.update(dt);
    camera.updateProjectionMatrix();
}

var i = 0;
function render(dt) {

    // update the picking ray with the camera and crosshairs position
    raycaster.setFromCamera( crosshairs, camera );

    if (!isPlaying) {
        // if heart collide with a box:
        raycaster.intersectObject(startMesh).map((intersection => {
          scene.remove(intersection.object);
          resetGame(scene, false);
        }));
    } else if (!isTimerStarted){
      // starting game, remove menu, show gui
      document.getElementById('menu_left').className = 'menu hide';
      document.getElementById('menu_right').className = 'menu hide';

      document.getElementById('score_left').className = 'score';
      document.getElementById('score_right').className = 'score';

      document.getElementById('heart_left').className = 'heart';
      document.getElementById('heart_right').className = 'heart';

      timer = startTimer();
    }

    // stop the game, show game over screen:
    if (remainingTime < 1) {
      isPlaying = false;
      window.clearInterval(timer);

      scene.add(startMesh);

      document.getElementById('menu_message_left').innerHTML = score + ' Poeng';
      document.getElementById('menu_message_right').innerHTML = score + ' Poeng';

      document.getElementById('menu_left').className = 'menu';
      document.getElementById('menu_right').className = 'menu';
    }

    i+= 0.02;

    // BOUNCE! frikafrikafrikafrika!
    // bouncer.position.y = 10*Math.abs(Math.sin(i));
    // bouncer.rotation.y = 10*Math.abs(Math.sin(i));

    // update employees for render:
    for (let group = 0; group < numGroups; group++) {
        const offset = {
            x: group * 10,
            z: group * 10,
        };
        for (let j = 0; j < groupSize; j++) {
            const index = group * groupSize + j;
            const e = employees[index];
            //const nextPos = randomMovements[0](i, j);
            e.position.x = e.origin.x + 10 * Math.sin(i*2+index);
            e.position.y = e.origin.y + 5 * Math.sin(i+index);
            e.position.z = e.origin.z + 20 * Math.cos(i+index);

            e.rotation.y += 0.01;
            e.rotation.x = Math.sin(i+index);
            e.rotation.z += 0.005;

        }
      // for å gå i ring: sin(x) cos(z)
    }

    if (isPlaying) {
      // detect collisions:
      var intersects = raycaster.intersectObjects( employeeGroup );
      for (let obj of intersects) {
          if (obj.object.parent && obj.object.parent.name === "Employees") {
              // obj.object.material.color.setHex( 0xff0000 );
              // scene.getObjectByName("Employees").remove(obj.object);
              // const p = generateOriginPos(Math.random() * 100);
              // obj.object.origin.x = p.x;
              // obj.object.origin.y = p.y;
              // obj.object.origin.z = p.z;
              obj.object.origin = generateOriginPos();
              ++score;
          }
      }
    }

    points_left.innerHTML =  score + ' Poeng';
    points_right.innerHTML = score + ' Poeng';

    duration_left.innerHTML = remainingTime + ' Sekunder';
    duration_right.innerHTML = remainingTime + ' Sekunder';

    effect.render(scene, camera);
}

function animate(t) {
    requestAnimationFrame(animate);

    update(clock.getDelta());
    render(clock.getDelta());
}

function fullscreen() {
    if (container.requestFullscreen) {
        container.requestFullscreen();
    } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
    } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
    } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
    }
}

// document.addEventListener('mousemose', (e) => {
//     raycaster.x = (e.clientX / window.innerWidth) * 2 - 1;
//     raycaster.y = (e.clientY / window.innerHeight) * 2 + 1;
// });
document.addEventListener('keydown', (e) => {
    switch(e.key) {
    case 'w':
        player.velocity.x = 1;
        break;
    case 's':
        player.velocity.x = -1;
        break;
    case 'a':
        player.velocity.z = -1;
        break;
    case 'd':
        player.velocity.z = 1;
        break;
    }
});
document.addEventListener('keyup', (e) => {
    switch(e.key) {
    case 'w':
    case 's':
        player.velocity.x = 0;
        break;
    case 'a':
    case 'd':
        player.velocity.z = 0;
        break;
    }
});
