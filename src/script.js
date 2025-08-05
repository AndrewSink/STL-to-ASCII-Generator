import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';
import html2canvas from 'html2canvas';

//LightMode
let lightMode = true

//Create a clock for rotation
const clock = new THREE.Clock()

// Set rotate boolean variable
let rotateModel = false

//Ugh, don't ask about this stuff
var userUploaded = false
let controls

// Creates empty mesh container
const myMesh = new THREE.Mesh();

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0, 0, 0);

//Lights
const pointLight1 = new THREE.PointLight(0xffffff, 1, 0, 0);
pointLight1.position.set(100, 100, 400);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, .5);
pointLight2.position.set(-500, 100, -400);
scene.add(pointLight2);

// Parameters
const stlLoader = new STLLoader()

//Material
const material = new THREE.MeshStandardMaterial()
material.flatShading = true
material.side = THREE.DoubleSide;

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 2000)

// Renderer
const renderer = new THREE.WebGLRenderer()

let effect;

let characters = ' .:-+*=%@#'
const effectSize = { amount: .205 }
let backgroundColor = 'black'
let ASCIIColor = 'white'

function createEffect() {
    effect = new AsciiEffect(renderer, characters, { invert: true, resolution: effectSize.amount });
    effect.setSize(sizes.width, sizes.height);
    effect.domElement.style.color = ASCIIColor;
    effect.domElement.style.backgroundColor = backgroundColor;
}

createEffect()

document.body.appendChild(effect.domElement)

document.getElementById("ascii").style.whiteSpace = "prewrap"

stlLoader.load(
    './models/test2.stl',
    function (geometry) {

        myMesh.material = material;
        myMesh.geometry = geometry;
        myMesh.scale.set(1, 1, 1); // Reset scale on model load
        // Reset rotation sliders and mesh rotation
        ['X', 'Y', 'Z'].forEach(axis => {
            document.getElementById(`rotate${axis}Slider`).value = 0;
            myMesh.rotation[axis.toLowerCase()] = 0;
        });

        var tempGeometry = new THREE.Mesh(geometry, material)
        myMesh.position.copy = (tempGeometry.position)

        geometry.computeVertexNormals();
        myMesh.geometry.center()

        myMesh.rotation.x = -90 * Math.PI / 180;

        myMesh.geometry.computeBoundingBox();
        var bbox = myMesh.geometry.boundingBox;

        myMesh.position.y = ((bbox.max.z - bbox.min.z) / 5)

        camera.position.x = ((bbox.max.x * 4));
        camera.position.y = ((bbox.max.y));
        camera.position.z = ((bbox.max.z * 3));

        scene.add(myMesh);


        controls = new OrbitControls(camera, effect.domElement)


        function tick() {
            if (rotateModel) {
                myMesh.rotation.z += 0.01; // Adjust speed as needed
            }
            render()
            window.requestAnimationFrame(tick)
        }

        function render() {
            effect.render(scene, camera);
        }

        tick()

        document.getElementById('file-selector').addEventListener('change', openFile, false);


        function openFile(evt) {
            const fileObject = evt.target.files[0];

            const reader = new FileReader();
            reader.readAsArrayBuffer(fileObject);
            reader.onload = function () {
                if (userUploaded == false) {
                    userUploaded = true;
                }
                const geometry = stlLoader.parse(this.result);
                tempGeometry = geometry;
                myMesh.geometry = geometry;
                myMesh.geometry.center()
                myMesh.scale.set(1, 1, 1); // Reset scale on file upload
                // Reset rotation sliders and mesh rotation
                ['X', 'Y', 'Z'].forEach(axis => {
                    document.getElementById(`rotate${axis}Slider`).value = 0;
                    myMesh.rotation[axis.toLowerCase()] = 0;
                });

                myMesh.rotation.x = -90 * Math.PI / 180;

                myMesh.geometry.computeBoundingBox();
                var bbox = myMesh.geometry.boundingBox;

                // camera.position.x = ((bbox.max.x * 4));
                // camera.position.y = ((bbox.max.y));
                // camera.position.z = ((bbox.max.z * 3));

                myMesh.position.y = ((bbox.max.z - bbox.min.z) / 6)

                scene.add(myMesh);
            };
        };
    }
)


document.getElementById('screenshotButton').addEventListener('click', takeScreenshot);

function takeScreenshot() {
    var container = document.body; // full page 
    html2canvas(container).then(function (canvas) {

        var link = document.createElement("a");
        document.body.appendChild(link);
        link.download = "ASCII.jpg";
        link.href = canvas.toDataURL("image/jpg");
        console.log(link.href);
        // link.target = '_blank';
        link.click();
    });
}

document.getElementById('updateASCII').addEventListener('click', updateASCII);

function updateASCII() {

    document.body.removeChild(effect.domElement)

    characters = " " + "." + document.getElementById('newASCII').value;

    createEffect()
    onWindowResize()

    document.body.appendChild(effect.domElement)

    controls = new OrbitControls(camera, effect.domElement)

}

document.getElementById('resetASCII').addEventListener('click', resetASCII);

function resetASCII() {

    document.body.removeChild(effect.domElement)

    characters = ' .:-+*=%@#'

    createEffect()
    onWindowResize()

    document.body.appendChild(effect.domElement)

    controls = new OrbitControls(camera, effect.domElement)
}

document.getElementById('lightDark').addEventListener('click', lightDark);

function lightDark() {
    lightMode = !lightMode
    if (lightMode === true) {
        document.getElementById("kofi").style.color = "white";
        document.body.style.backgroundColor = 'black';

        backgroundColor = 'black'
        ASCIIColor = 'white'

        effect.domElement.style.color = ASCIIColor;
        effect.domElement.style.backgroundColor = backgroundColor;
    } else {
        document.getElementById("kofi").style.color = "black";
        document.body.style.backgroundColor = 'white';

        backgroundColor = 'white'
        ASCIIColor = 'black'

        effect.domElement.style.color = ASCIIColor;
        effect.domElement.style.backgroundColor = backgroundColor;
    }
}

document.getElementById('lightSlider').addEventListener('input', function (e) {
    const angleDeg = parseFloat(e.target.value);
    const angleRad = angleDeg * Math.PI / 180;
    const radius = 420; // Distance from origin, similar to initial position
    const y = 100; // Keep height constant
    // Calculate new position in XZ plane
    const x = Math.cos(angleRad) * radius;
    const z = Math.sin(angleRad) * radius;
    pointLight1.position.set(x, y, z);
});

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    effect.setSize(window.innerWidth, window.innerHeight);
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

document.getElementById("copyASCII").addEventListener("click", function () {
    var text = document.getElementsByTagName("table")[0].innerText
    var filename = "ASCII.txt";

    download(filename, text);
}, false);

document.getElementById("clipboardASCII").addEventListener("click", function () {
    const textArea = document.createElement("textarea");
    textArea.textContent = document.getElementsByTagName("td")[0].innerText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    window.alert("ASCII copied to clipboard");
}, false);

document.getElementById('scaleSlider').addEventListener('input', function (e) {
    const scale = parseFloat(e.target.value);
    myMesh.scale.set(scale, scale, scale);
});

// Rotation sliders logic
['X', 'Y', 'Z'].forEach(axis => {
    document.getElementById(`rotate${axis}Slider`).addEventListener('input', function (e) {
        const value = parseFloat(e.target.value) * Math.PI / 180;
        myMesh.rotation[axis.toLowerCase()] = value;
    });
});

document.getElementById('rotateButton').addEventListener('click', function () {
    rotateModel = !rotateModel;
});
