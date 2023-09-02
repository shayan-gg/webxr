import * as THREE from 'three';
import CameraControls from "camera-controls";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { XRButton } from 'three/examples/jsm/webxr/XRButton';
import { Orbitcontrol } from 'three/examples/jsm/orbitcontrol';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

let container;
let camera;
let renderer;
let controller;
let scene;

// XR globals.
let xrButton = null;
let xrRefSpace = null;
let xrViewerSpace = null;
let xrHitTestSource = null;

initThree();
// initWebXR();
stats();

CameraControls.install( { THREE: THREE } );

const clock = new THREE.Clock();
const cameraControls = new CameraControls( camera, renderer.domElement );

animate();

function initThree() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
  
  renderer = new THREE.WebGLRenderer( { antialias: false, alpha: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  function onWindowResize() {
    window.addEventListener( 'resize', onWindowResize);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  } onWindowResize();

}

function initWebXR() {

  function addHemiLight() {
    var light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
    light.position.set( 0.5, 1, 0.25 );
    scene.add( light );
  }

  // WebXR
  function webXrInit() {
    renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    // xrButton = new XRButton({
    //   // onRequestSession: onRequestSession,
    //   // onEndSession: onEndSession,
    //   textEnterXRTitle: "START AR",
    //   textXRNotFoundTitle: "AR NOT FOUND",
    //   textExitXRTitle: "EXIT  AR",
    // });

    // document.querySelector('header').appendChild(xrButton.domElement);

    document.body.appendChild( XRButton.createButton( renderer ) );
  }

  let geometry = new THREE.CylinderGeometry( 0, 0.05, 0.2, 32 ).rotateX( Math.PI / 2 );

  function onSelect() {
    var material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random() } );
    var mesh = new THREE.Mesh( geometry, material );
    mesh.position.set( 0, 0, - 0.3 ).applyMatrix4( controller.matrixWorld );
    mesh.quaternion.setFromRotationMatrix( controller.matrixWorld );
    
    scene.add( mesh );
  }

  // Add Controller
  function controllerXR() {
    controller = renderer.xr.getController( 0 );
    controller.addEventListener( 'select', onSelect );
    scene.add( controller );
  }

  webXrInit();
  controllerXR();
  onSelect();
  addHemiLight();

}

function animate() {

  renderer.setAnimationLoop( animate );
  renderer.render( scene, camera );

  const delta = clock.getDelta();
	const hasControlsUpdated = cameraControls.update( delta );

}

function stats() {
  const stats1 = new Stats();
  stats1.showPanel(0);
  const stats2 = new Stats();
  stats2.showPanel(1);
  stats2.dom.style.cssText = 'position:absolute;top:0px;left:80px;';
  const stats3 = new Stats();
  stats3.showPanel(2);
  stats3.dom.style.cssText = 'position:absolute;top:0px;left:160px;';
  document.body.appendChild(stats1.dom);
  document.body.appendChild(stats2.dom);
  document.body.appendChild(stats3.dom);
  
  function statsUpdate() {
    requestAnimationFrame(statsUpdate);
    stats1.update();
    stats2.update();
    stats3.update();
  }
  
  statsUpdate();
}


scene.clear = false;

function initXR() {
  xrButton = new XRButton({
    onRequestSession: onRequestSession,
    onEndSession: onEndSession,
    textEnterXRTitle: "START AR",
    textXRNotFoundTitle: "AR NOT FOUND",
    textExitXRTitle: "EXIT  AR",
  });
  console.log(xrButton);
  document.querySelector('header').appendChild(xrButton.domElement);

  if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-ar')
                .then((supported) => {
      xrButton.enabled = supported;
    });
  }
}

function onRequestSession() {
  return navigator.xr.requestSession('immersive-ar', {requiredFeatures: ['local', 'hit-test']})
                      .then((session) => {
    xrButton.setSession(session);
    onSessionStarted(session);
  });
}

function onSessionStarted(session) {
  session.addEventListener('end', onSessionEnded);
  session.addEventListener('select', onSelect);

  if (!gl) {
    gl = createWebGLContext({
      xrCompatible: true
    });

    renderer = new Renderer(gl);

    scene.setRenderer(renderer);
  }

  session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });

  // In this sample we want to cast a ray straight out from the viewer's
  // position and render a reticle where it intersects with a real world
  // surface. To do this we first get the viewer space, then create a
  // hitTestSource that tracks it.
  session.requestReferenceSpace('viewer').then((refSpace) => {
    xrViewerSpace = refSpace;
    session.requestHitTestSource({ space: xrViewerSpace }).then((hitTestSource) => {
      xrHitTestSource = hitTestSource;
    });
  });

  session.requestReferenceSpace('local').then((refSpace) => {
    xrRefSpace = refSpace;

    session.requestAnimationFrame(onXRFrame);
  });
}

function onEndSession(session) {
  xrHitTestSource.cancel();
  xrHitTestSource = null;
  session.end();
}

function onSessionEnded(event) {
  xrButton.setSession(null);
}

initXR();