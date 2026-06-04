// Theme Mode: true = Dark (white on black), false = Light (black on white)
let isDarkMode = true

//Create a clock for rotation
const clock = new THREE.Clock()

// Set rotate boolean variable
let rotateModel = {
    x: false,
    y: false,
    z: false
}
let rotateLight = false

// Detect mobile device and enable light rotation by default
const isMobileDevice = /(Mobi|Android|iPhone|iPad|iPod|Mobile)/i.test(navigator.userAgent) || window.innerWidth <= 768;
if (isMobileDevice) {
    rotateLight = true;
}

// Update the Rotate Light button to reflect current state
function updateRotateLightButtonUI() {
    const btn = document.getElementById('rotateLightButton');
    if (!btn) return;
    // Remove existing color classes
    btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-500', 'bg-amber-500', 'hover:bg-amber-400', 'bg-slate-700', 'hover:bg-slate-600');

    if (rotateLight) {
        btn.textContent = 'Pause Light';
        btn.classList.add('bg-amber-500', 'hover:bg-amber-400');
    } else {
        btn.textContent = 'Auto-Rotate Light';
        btn.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
    }
}

// Initialize button state on load
updateRotateLightButtonUI();

// Update the Rotate Model button to reflect current state
function updateRotateModelButtonUI() {
    const btnX = document.getElementById('animateXButton');
    const btnY = document.getElementById('animateYButton');
    const btnZ = document.getElementById('animateZButton');
    
    if (rotateModel.x) {
        btnX.classList.add('bg-amber-500', 'hover:bg-amber-400');
    } else {
        btnX.classList.remove('bg-amber-500', 'hover:bg-amber-400');
        btnX.classList.add('bg-slate-700', 'hover:bg-slate-600');
    }


    if (rotateModel.y) {
        btnY.classList.add('bg-amber-500', 'hover:bg-amber-400');
    } else {
        btnY.classList.remove('bg-amber-500', 'hover:bg-amber-400');
        btnY.classList.add('bg-slate-700', 'hover:bg-slate-600');
    }

    if (rotateModel.z) {
        btnZ.classList.add('bg-amber-500', 'hover:bg-amber-400');
    } else {
        btnZ.classList.remove('bg-amber-500', 'hover:bg-amber-400');
        btnZ.classList.add('bg-slate-700', 'hover:bg-slate-600');
    }
}

updateRotateModelButtonUI();


//Ugh, don't ask about this stuff
var userUploaded = false
let controls
let defaultRotation = {
    x: -90 * Math.PI / 180,
    y: 0,
    z: 0
}
let defaultRotationDegrees = {
    x: -90,
    y: 0,
    z: 0
}

// Creates empty mesh container
const myMesh = new THREE.Mesh();

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0, 0, 0);

//Lights
const pointLight1 = new THREE.PointLight(0xffffff, 1, 0, 0);
pointLight1.position.set(100, 100, 400);
scene.add(pointLight1);

// const pointLight2 = new THREE.PointLight(0xffffff, .1);
// pointLight2.position.set(0, -50, 0); // Fill light on opposite side
// scene.add(pointLight2);

// Parameters
const stlLoader = new THREE.STLLoader()
const gltfLoader = new THREE.GLTFLoader()

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
    effect = new THREE.AsciiEffect(renderer, characters, { invert: isDarkMode, resolution: effectSize.amount });
    effect.setSize(sizes.width, sizes.height);
    effect.domElement.style.color = ASCIIColor;
    effect.domElement.style.backgroundColor = backgroundColor;
}

function updateViewOffset() {
    const sidebar = document.getElementById('ui-container');
    const sidebarWidth = (sidebar && getComputedStyle(sidebar).display !== 'none') ? sidebar.offsetWidth : 0;
    if (sidebarWidth > 0) {
        camera.setViewOffset(
            window.innerWidth, window.innerHeight,
            -Math.round(sidebarWidth / 2), 0,
            window.innerWidth, window.innerHeight
        );
    } else {
        camera.clearViewOffset();
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
}

// Create and configure orbit controls
function createOrbitControls() {
    const prevTarget = controls ? controls.target.clone() : new THREE.Vector3();
    controls = new THREE.OrbitControls(camera, effect.domElement);
    controls.target.copy(prevTarget);

    // Configure orbit controls for smoother interaction
    controls.enableDamping = true; // Add smooth damping
    controls.dampingFactor = 0.05; // Lower = smoother
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.5; // Slower rotation for smoother feel
    controls.zoomSpeed = 0.8; // Slightly slower zoom
    controls.panSpeed = 0.8; // Slightly slower pan

    // Configure mouse button controls
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.ROTATE
    }
}

createEffect()

document.body.appendChild(effect.domElement)

// Reuse the same mesh setup for STL and GLB uploads.
function applyGeometryToMesh(geometry, options = {}) {
    const {
        yOffsetDivisor = 6,
        updateCamera = false,
        rotation = {
            x: -90 * Math.PI / 180,
            y: 0,
            z: 0
        },
        rotationDegrees = {
            x: -90,
            y: 0,
            z: 0
        }
    } = options;

    // Keep the reset rotation and slider defaults aligned with the current file type.
    defaultRotation = { ...rotation };
    defaultRotationDegrees = { ...rotationDegrees };

    myMesh.material = material;
    myMesh.geometry = geometry;

    geometry.computeVertexNormals();
    myMesh.geometry.center();
    myMesh.geometry.computeBoundingBox();

    resetPositions();

    const bbox = myMesh.geometry.boundingBox;
    myMesh.position.y = ((bbox.max.z - bbox.min.z) / yOffsetDivisor);

    if (updateCamera) {
        camera.position.x = (bbox.max.x * 4);
        camera.position.y = (bbox.max.y);
        camera.position.z = (bbox.max.z * 3);
    }

    scene.add(myMesh);
}

// Flatten all meshes in a GLB into one geometry so the existing ASCII pipeline works.
function getMergedGeometryFromGLB(root) {
    const geometries = [];

    root.updateMatrixWorld(true);

    root.traverse(function (child) {
        if (!child.isMesh || !child.geometry) {
            return;
        }

        const geometry = child.geometry.clone();
        geometry.applyMatrix4(child.matrixWorld);

        if (geometry.index) {
            geometries.push(geometry.toNonIndexed());
        } else {
            geometries.push(geometry);
        }
    });

    if (!geometries.length) {
        return null;
    }

    return THREE.BufferGeometryUtils.mergeBufferGeometries(geometries, false);
}

function loadSTLFromArrayBuffer(arrayBuffer) {
    const geometry = stlLoader.parse(arrayBuffer);
    applyGeometryToMesh(geometry, {
        rotation: {
            x: -90 * Math.PI / 180,
            y: 0,
            z: 0
        },
        rotationDegrees: {
            x: -90,
            y: 0,
            z: 0
        }
    });
}

function loadGLBFromArrayBuffer(arrayBuffer) {
    gltfLoader.parse(arrayBuffer, '', function (gltf) {
        const geometry = getMergedGeometryFromGLB(gltf.scene);

        if (!geometry) {
            window.alert('No mesh geometry was found in this GLB file.');
            return;
        }

        applyGeometryToMesh(geometry, {
            rotation: {
                x: 0,
                y: 0,
                z: 0
            },
            rotationDegrees: {
                x: 0,
                y: 0,
                z: 0
            }
        });
    }, function (error) {
        console.error(error);
        window.alert('Unable to load this GLB file.');
    });
}

function openSTLFile(evt) {
    const fileObject = evt.target.files[0];
    if (!fileObject) {
        return;
    }

    const reader = new FileReader();
    reader.readAsArrayBuffer(fileObject);
    reader.onload = function () {
        if (userUploaded == false) {
            userUploaded = true;
        }

        loadSTLFromArrayBuffer(this.result);
    };

    evt.target.value = '';
}

function openGLBFile(evt) {
    const fileObject = evt.target.files[0];
    if (!fileObject) {
        return;
    }

    const reader = new FileReader();
    reader.readAsArrayBuffer(fileObject);
    reader.onload = function () {
        if (userUploaded == false) {
            userUploaded = true;
        }

        loadGLBFromArrayBuffer(this.result);
    };

    evt.target.value = '';
}

stlLoader.load(
    './models/model.stl',
    function (geometry) {
        applyGeometryToMesh(geometry, {
            yOffsetDivisor: 5,
            updateCamera: true,
            rotation: {
                x: -90 * Math.PI / 180,
                y: 0,
                z: 0
            },
            rotationDegrees: {
                x: -90,
                y: 0,
                z: 0
            }
        });

        createOrbitControls()
        updateViewOffset()

        function tick() {
            if (rotateModel.x) {
                myMesh.rotation.x += 0.01;
            }

            if (rotateModel.y) {
                myMesh.rotation.y += 0.01;
            }

            if (rotateModel.z) {
                myMesh.rotation.z += 0.01;
            }

            if (rotateLight) {
                const lightSlider = document.getElementById('lightSlider');
                let currentAngle = parseFloat(lightSlider.value);
                currentAngle = (currentAngle + 1) % 360;
                lightSlider.value = currentAngle;
                // Manually trigger the input event to update the light's position
                lightSlider.dispatchEvent(new Event('input'));
            }

            // Update controls for smooth damping
            controls.update();

            render()
            window.requestAnimationFrame(tick)
        }

        function render() {
            effect.render(scene, camera);
        }

        tick()

        document.getElementById('file-selector').addEventListener('change', openSTLFile, false);
        document.getElementById('glb-file-selector').addEventListener('change', openGLBFile, false);
    }
)


document.getElementById('screenshotButton').addEventListener('click', takeScreenshot);

function takeScreenshot() {
    html2canvas(effect.domElement).then(function (canvas) {
        // Scan pixels to find the bounding box of actual ASCII content
        const ctx = canvas.getContext('2d');
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const threshold = 20;

        let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const i = (y * canvas.width + x) * 4;
                const r = data[i], g = data[i + 1], b = data[i + 2];
                const isContent = isDarkMode
                    ? (r > threshold || g > threshold || b > threshold)
                    : (r < 255 - threshold || g < 255 - threshold || b < 255 - threshold);
                if (isContent) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        // Add 20% margin around the content
        const contentW = maxX - minX + 1;
        const contentH = maxY - minY + 1;
        const marginX = Math.round(contentW * 0.2);
        const marginY = Math.round(contentH * 0.2);

        const cropX = Math.max(0, minX - marginX);
        const cropY = Math.max(0, minY - marginY);
        const cropW = Math.min(canvas.width - cropX, contentW + 2 * marginX);
        const cropH = Math.min(canvas.height - cropY, contentH + 2 * marginY);

        // Draw cropped region into a new canvas
        const out = document.createElement('canvas');
        out.width = cropW;
        out.height = cropH;
        out.getContext('2d').drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        const link = document.createElement('a');
        link.download = 'ASCII.jpg';
        link.href = out.toDataURL('image/jpeg');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

document.getElementById('updateASCII').addEventListener('click', updateASCII);

function updateASCII() {

    document.body.removeChild(effect.domElement)

    characters = " " + "." + document.getElementById('newASCII').value;

    createEffect()
    onWindowResize()

    document.body.appendChild(effect.domElement)

    createOrbitControls()

}

document.getElementById('resetASCII').addEventListener('click', resetASCII);

function resetASCII() {

    document.body.removeChild(effect.domElement)

    characters = ' .:-+*=%@#'

    createEffect()
    onWindowResize()

    document.body.appendChild(effect.domElement)

    createOrbitControls()
}

document.getElementById('lightDark').addEventListener('click', lightDark);

function lightDark() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('light-mode', !isDarkMode);

    if (isDarkMode) {
        backgroundColor = 'black';
        ASCIIColor = 'white';
        scene.background = new THREE.Color(0, 0, 0);
    } else {
        backgroundColor = 'white';
        ASCIIColor = 'black';
        scene.background = new THREE.Color(1, 1, 1);
    }

    document.body.removeChild(effect.domElement);
    createEffect();
    effect.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(effect.domElement);
    createOrbitControls();
}

document.getElementById('lightSlider').addEventListener('input', function (e) {
    const angleDeg = parseFloat(e.target.value);
    const angleRad = angleDeg * Math.PI / 180;
    const radius = myMesh.geometry.boundingBox.max.z * 2; // Distance from origin, similar to initial position

    // Get height from the height slider
    const heightSlider = document.getElementById('lightHeightSlider');
    const heightMultiplier = parseFloat(heightSlider.value);

    // Calculate height based on bounding box
    let height = 85; // Default height
    if (myMesh.geometry.boundingBox) {
        const bbox = myMesh.geometry.boundingBox;
        const bboxHeight = bbox.max.y - bbox.min.y;
        height = bboxHeight * heightMultiplier;
    }

    // Calculate new position in XZ plane
    const x = Math.cos(angleRad) * radius;
    const z = Math.sin(angleRad) * radius;
    pointLight1.position.set(x, height, z);
    // pointLight2.position.set(-x, -y, -z);
});

document.getElementById('lightHeightSlider').addEventListener('input', function (e) {
    // Trigger the light slider to update position with new height
    document.getElementById('lightSlider').dispatchEvent(new Event('input'));
});



window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    updateViewOffset();
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
        if (axis === 'X') {
            // Account for initial -90° position
            myMesh.rotation.x = value;
        } else {
            myMesh.rotation[axis.toLowerCase()] = value;
        }
    });
});

document.getElementById('animateXButton').addEventListener('click', function () {
    rotateModel.x = !rotateModel.x;
    updateRotateModelButtonUI();
});

document.getElementById('animateYButton').addEventListener('click', function () {
    rotateModel.y = !rotateModel.y;
    updateRotateModelButtonUI();
});

document.getElementById('animateZButton').addEventListener('click', function () {
    rotateModel.z = !rotateModel.z;
    updateRotateModelButtonUI();
});

document.getElementById('rotateLightButton').addEventListener('click', function () {
    rotateLight = !rotateLight;
    updateRotateLightButtonUI();
});

document.getElementById('resetButton').addEventListener('click', resetPositions);

function resetPositions() {
    // Reset model rotation and scale
    myMesh.scale.set(1, 1, 1);
    myMesh.rotation.set(defaultRotation.x, defaultRotation.y, defaultRotation.z);

    // Reset sliders to initial model position
    document.getElementById('scaleSlider').value = 1;
    document.getElementById('rotateXSlider').value = defaultRotationDegrees.x;
    document.getElementById('rotateYSlider').value = defaultRotationDegrees.y;
    document.getElementById('rotateZSlider').value = defaultRotationDegrees.z;
    document.getElementById('lightSlider').value = 45;
    document.getElementById('lightHeightSlider').value = 2;

    // Reset light position
    if (myMesh.geometry.boundingBox) {
        document.getElementById('lightSlider').dispatchEvent(new Event('input'));
    }


    // Stop rotations
    rotateModel = { 
        x: false,
        y: false, 
        z: false
    };
    rotateLight = isMobileDevice;
    updateRotateLightButtonUI();
    updateRotateModelButtonUI();
}

document.getElementById('mobile-menu-button').addEventListener('click', function () {
    document.getElementById('ui-container').classList.toggle('hidden');
});
