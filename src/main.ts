import * as THREE from 'three';
import CameraControls from "camera-controls";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { XRButton } from 'three/examples/jsm/webxr/XRButton';
import { Orbitcontrol } from 'three/examples/jsm/orbitcontrol';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

let container: HTMLDivElement;
let camera: { aspect: number; updateProjectionMatrix: () => void; }, scene: { add: (arg0: any) => void; }, renderer: { domElement: HTMLElement | undefined; setPixelRatio: (arg0: number) => void; setSize: (arg0: number, arg1: number) => void; xr: { enabled: boolean; getController: (arg0: number) => any; }; setAnimationLoop: (arg0: () => void) => void; render: (arg0: any, arg1: any) => void; };
let controller: { matrixWorld: any; addEventListener: (arg0: string, arg1: () => void) => void; };

initThree();
initWebXR();
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