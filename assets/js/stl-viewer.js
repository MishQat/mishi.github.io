import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/STLLoader.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';


// quick module startup log
console.info('stl-viewer module loaded');

// Wait until DOM is ready, then initialize any viewers that exist on the page
document.addEventListener('DOMContentLoaded', () => {
	// auto-discover all viewer containers with a data-stl attribute or id fallback
	const containers = Array.from(document.querySelectorAll('.stl-viewer'));
	if (containers.length === 0) {
		console.info('STL viewer: no .stl-viewer elements found.');
		return;
	}

	containers.forEach(container => {
		const stlFromData = container.dataset.stl || container.dataset.gltf;
		// fallback: map known ids to defaults (keeps previous behaviour)
		const fallbackMap = {
			'chassis-viewer': 'assets/stl/chassis.gltf',
			'assembly-viewer': 'assets/stl/assembly.gltf',
			'd2assembly-viewer': 'assets/stl/D2FULLAssem.stl'
		};
		const stlPath = stlFromData || fallbackMap[container.id];

		if (!stlPath) {
			console.warn(`STL viewer: no data-stl found for element#${container.id}, skipping.`);
			return;
		}

		console.info(`STL viewer: initializing #${container.id} -> ${stlPath}`);
		initViewer(container, stlPath);
	});
});
async function loadCode() {
  const el = document.getElementById("py-code");
  if (!el) return;

  const res = await fetch("assets/code/dmt_velocity_model.py");
  el.textContent = await res.text();
  Prism.highlightElement(el);

}

loadCode();


function initViewer(container, stlPath) {
	// defensive checks
	if (!container) {
		console.error('initViewer called without a container element');
		return;
	}

	// WebGL availability check (simple)
	const testCanvas = document.createElement('canvas');
	const gl = testCanvas.getContext && (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'));
	if (!gl) {
		console.error('WebGL not available — 3D viewer will not work in this browser.');
		// continue so devs can see errors in console if loader tries
	}

	// Scene, camera, renderer
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xf5f7fa);

	const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
	camera.position.set(0, 80, 120);

	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

	// ensure canvas behaves responsively inside container
	renderer.domElement.style.display = 'block';
	renderer.domElement.style.width = '100%';
	renderer.domElement.style.height = '100%';

	// initial safe size
	const initialW = Math.max(300, container.clientWidth || 300);
	const initialH = Math.max(200, container.clientHeight || 200);
	renderer.setSize(initialW, initialH, false);

	// attach canvas
	container.appendChild(renderer.domElement);

	// Controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;
	controls.enablePan = false;

	// Lighting
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
	scene.add(ambientLight);
	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(50, 100, 50);
	scene.add(directionalLight);

	// Load model (STL or GLTF/GLB)
	const ext = (stlPath.split('.').pop() || '').toLowerCase();
	if (ext === 'stl') {
		const loader = new STLLoader();
		loader.load(
			stlPath,
			geometry => {
				const material = new THREE.MeshStandardMaterial({
					color: 0xcccccc,
					metalness: 0.1,
					roughness: 0.6
				});

				geometry.center();
				const mesh = new THREE.Mesh(geometry, material);
				mesh.rotation.x = -Math.PI / 2;
				scene.add(mesh);
			// Ensure camera.far covers very large models (use bounding sphere)
			const objBbox = new THREE.Box3().setFromObject(mesh);
			const sphere = objBbox.getBoundingSphere(new THREE.Sphere());
			const radius = Math.max(sphere.radius, 1);
			const newFar = Math.max(camera.far, radius * 20, 5000);
			if (camera.far < newFar) {
				camera.far = newFar;
				camera.updateProjectionMatrix();
				console.info(`STL viewer: raised camera.far to ${camera.far.toFixed(0)} (radius ${radius.toFixed(1)})`);
			}
				// Fit camera to object bounds
				if (geometry.boundingBox === null) geometry.computeBoundingBox();
				const bbox = geometry.boundingBox;
				const size = new THREE.Vector3();
				bbox.getSize(size);
				const maxDim = Math.max(size.x, size.y, size.z, 1);
				const fov = camera.fov * (Math.PI / 180);
				const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
				camera.position.set(0, maxDim, cameraZ * 1.4);
				camera.lookAt(0, 0, 0);
				controls.update();
			// Special-case: if this is the D2 assembly, start the camera farther away to avoid starting inside the model
			if (container.id === 'd2assembly-viewer' || /D2FULLAssem/i.test(stlPath)) {
				console.info('STL viewer: applying D2 extra camera distance');
				camera.position.set(camera.position.x * 0.3, camera.position.y * 0.3, camera.position.z * 0.3);
				controls.update();
			}
				onResize(); // ensure final sizing after object loaded
			},
			// progress
			xhr => {
				if (xhr && xhr.lengthComputable) {
					const pct = Math.round((xhr.loaded / xhr.total) * 100);
					console.debug(`STL loader (${stlPath}): ${pct}%`);
				}
			},
			err => {
				console.error(`STLLoader error for ${stlPath}:`, err);
				// Helpful hint for CORS / 404s
				if (err && err.target && err.target.status === 404) {
					console.error(`File not found: ${stlPath} (404). Verify path and presence in repository.`);
				}
			}
		);
	} else if (ext === 'gltf' || ext === 'glb') {
		const loader = new GLTFLoader();
		loader.load(
			stlPath,
			gltf => {
				const model = gltf.scene || (gltf.scenes && gltf.scenes[0]);
				if (!model) {
					console.error(`GLTFLoader: no scene found in ${stlPath}`);
					return;
				}

				// Ensure meshes cast/receive shadows and keep their materials
				model.traverse(node => {
					if (node.isMesh) {
						node.castShadow = true;
						node.receiveShadow = true;
					}
				});

				// Center model at origin using bounding box
				const bbox = new THREE.Box3().setFromObject(model);
				const size = new THREE.Vector3();
				bbox.getSize(size);
				const center = new THREE.Vector3();
				bbox.getCenter(center);
				model.position.sub(center);
				scene.add(model);

			// Ensure camera.far covers very large models (use bounding sphere)
			const objBbox = new THREE.Box3().setFromObject(model);
			const sphere = objBbox.getBoundingSphere(new THREE.Sphere());
			const radius = Math.max(sphere.radius, 1);
			const newFar = Math.max(camera.far, radius * 20, 5000);
			if (camera.far < newFar) {
				camera.far = newFar;
				camera.updateProjectionMatrix();
				console.info(`GLTF viewer: raised camera.far to ${camera.far.toFixed(0)} (radius ${radius.toFixed(1)})`);
			}
			const maxDim = Math.max(size.x, size.y, size.z, 1);
			const fov = camera.fov * (Math.PI / 180);
			const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
			camera.position.set(0, maxDim, cameraZ * 1.4);
			camera.lookAt(0, 0, 0);
			controls.update();

			// Special-case: if this is the D2 assembly, start the camera farther away to avoid starting inside the model
			if (container.id === 'd2assembly-viewer' || /D2FULLAssem/i.test(stlPath)) {
				console.info('GLTF viewer: applying D2 extra camera distance');
				camera.position.set(camera.position.x * 3, camera.position.y * 3, camera.position.z * 3);
				controls.update();
			}

			// Special-case: if this is the FULL_car_assembly, apply appropriate camera distance
			if (/FULL_car_assembly/i.test(stlPath)) {
				console.info('GLTF viewer: applying FULL_car_assembly camera adjustment');
				const carDistance = Math.max(radius * 1.8, 10);
				camera.position.set(0, Math.max(maxDim * 0.8, radius * 1.0), carDistance);
				camera.position.multiplyScalar(0.1);
				camera.lookAt(0, 0, 0);
				controls.update();
				console.info(`GLTF viewer: camera set to ${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`);
			}

			// close-in adjustment for chassis/assembly GLTFs (keeps D2 and FULL_car_assembly untouched)
			if ((container.id === 'chassis-viewer' || container.id === 'assembly-viewer' || /chassis\.gltf/i.test(stlPath) || /assembly\.gltf/i.test(stlPath)) && container.id !== 'd2assembly-viewer' && !/D2FULLAssem/i.test(stlPath) && !/FULL_car_assembly/i.test(stlPath)) {
				console.info('GLTF viewer: applying close camera adjustment for chassis/assembly');
				// Compute a stable close camera position based on the model's bounding sphere and max dimension.
				const closeDistance = Math.max(radius * 1.8, 10);
				camera.position.set(0, Math.max(maxDim * 0.8, radius * 1.0), closeDistance);
				camera.position.multiplyScalar(0.1);
				camera.lookAt(0, 0, 0);
				controls.update();
				console.info(`GLTF viewer: camera set to ${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`);
			}

			onResize();
			hideLoader(loader);
		},
		// progress
		xhr => {
			if (xhr && xhr.lengthComputable) {
				const pct = Math.round((xhr.loaded / xhr.total) * 100);
				console.debug(`GLTF loader (${stlPath}): ${pct}%`);
			}
		},
			err => {
				console.error(`GLTFLoader error for ${stlPath}:`, err);
				if (err && err.target && err.target.status === 404) {
					console.error(`File not found: ${stlPath} (404). Verify path and presence in repository.`);
				}
			}
		);
	} else {
		console.error(`Model format not supported for ${stlPath}. Supported: .stl, .gltf, .glb`);
	}

	// Handle sizing robustly
	function onResize() {
		const w = Math.max(1, container.clientWidth);
		const h = Math.max(1, container.clientHeight);
		if (w === 0 || h === 0) return;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h, false);
		renderer.setPixelRatio(window.devicePixelRatio || 1);
	}

	// Use ResizeObserver when available to detect container size changes
	if (window.ResizeObserver) {
		const ro = new ResizeObserver(() => onResize());
		ro.observe(container);
	} else {
		window.addEventListener('resize', onResize);
	}
	// always listen for hashchange (modal open/close via fragment)
	window.addEventListener('hashchange', () => {
		onResize();
		// small delay to handle CSS transitions
		setTimeout(onResize, 250);
	});
	// call once more shortly after init to handle transitions/painting
	setTimeout(onResize, 250);

	// Render loop
	function animate() {
		requestAnimationFrame(animate);
		controls.update();
		renderer.render(scene, camera);
	}
	animate();
}