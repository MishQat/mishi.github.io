import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/STLLoader.js';


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
		const stlFromData = container.dataset.stl;
		// fallback: map known ids to defaults (keeps previous behaviour)
		const fallbackMap = {
			'chassis-viewer': 'assets/stl/chassis.stl',
			'assembly-viewer': 'assets/stl/assembly.stl'
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

	// Load STL
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
