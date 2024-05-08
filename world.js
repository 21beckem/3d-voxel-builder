import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';


class BasicWorldDemo {
	constructor() {
		this.SUB_Initialize();
	}

	SUB_Initialize() {
		this._threejs = new THREE.WebGLRenderer({
			antialias: true,
		});
		this._threejs.shadowMap.enabled = true;
		this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
		this._threejs.setPixelRatio(window.devicePixelRatio);
		this._threejs.setSize(window.innerWidth, window.innerHeight);

		this._mouseMode = 'pan';

		document.body.appendChild(this._threejs.domElement);

		window.addEventListener('resize', () => {
			this.SUB_OnWindowResize();
		}, false);
		setTimeout(() => { this.SUB_OnWindowResize(); }, 10);

		this.SUB_createCamera();

		this._scene = new THREE.Scene();

		this.SUB_createLight();

		this.SUB_createFloor();

		this._controls = new OrbitControls(
			this._camera, this._threejs.domElement
		);
		this._controls.target.set(0, 20, 0);
		this._controls.update();

		this.SUB_createRaycaster();
		this.SUB_setupPainting();
		this.SUB_setupBuilding();

		this.SUB_createSkybox();

		this.SUB_RAF();
	}

	SUB_createCamera() {
		const fov = 60;
		const aspect = 1920 / 1080;
		const near = 1.0;
		const far = 1000.0;
		this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		this._camera.position.set(14, 147, -124);
		this._camera.rotation.set(0, 0, 0);
	}

	SUB_createLight() {
		let light = new THREE.DirectionalLight(0xFFFFFF, 0.5);
		light.position.set(20, 100, 10);
		light.target.position.set(0, 0, 0);
		light.castShadow = true;
		light.shadow.bias = -0.001;
		light.shadow.mapSize.width = 2048;
		light.shadow.mapSize.height = 2048;
		light.shadow.camera.near = 0.1;
		light.shadow.camera.far = 500.0;
		light.shadow.camera.near = 0.5;
		light.shadow.camera.far = 500.0;
		light.shadow.camera.left = 100;
		light.shadow.camera.right = -100;
		light.shadow.camera.top = 100;
		light.shadow.camera.bottom = -100;
		this._scene.add(light);

		light = new THREE.AmbientLight(0x101010, 8.0);
		this._scene.add(light);

		// let spotLight = new THREE.SpotLight( 0xffffff, 100 );
		// spotLight.position.set( 2.5, 5, 2.5 );
		// spotLight.angle = Math.PI / 6;
		// spotLight.penumbra = 1;
		// spotLight.decay = 2;
		// spotLight.distance = 0;

		// spotLight.castShadow = true;
		// spotLight.shadow.mapSize.width = 1024;
		// spotLight.shadow.mapSize.height = 1024;
		// spotLight.shadow.camera.near = 1;
		// spotLight.shadow.camera.far = 10;
		// spotLight.shadow.focus = 1;
		// this._scene.add( spotLight );
		// let lightHelper = new THREE.SpotLightHelper( spotLight );
		// this._scene.add( lightHelper );
	}

	SUB_intersect(pos) {
		this._raycaster.setFromCamera(pos, this._camera);
		return this._raycaster.intersectObjects(this._scene.children);
	}

	SUB_createRaycaster() {
		this._raycaster = new THREE.Raycaster();
		this._pointer = new THREE.Vector2();
		this._clickMouse = new THREE.Vector2();
		this._moveMouse = new THREE.Vector2();

		this._threejs.domElement.addEventListener('pointermove', event => {
			//console.log('move');
			event.preventDefault();
			this._moveMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			this._moveMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			this._draggingMouseMovedYet = true;
			this.SUB_paintOnMouseMove();
		});
	}

	SUB_setupPainting() {
		this._selectedPaint = new THREE.Color('#FF0000');
		this._eyeDropEnabled = false;
		this._drawing = false;

		this._threejs.domElement.addEventListener('pointerdown', event => {
			//console.log('down');
			if (this._mouseMode != 'paint') { return; }
			this._draggingMouseMovedYet = false;

			this._clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			this._clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;


			this._raycaster.setFromCamera(this._clickMouse, this._camera);
			let found = this._raycaster.intersectObjects(this._builtVoxels);

			if (found.length > 0) {
				this._drawing = true;
				this.SUB_paintAtThisIntersect(found[0]);
			}
		});
		this._threejs.domElement.addEventListener('pointerup', event => {
			//console.log('up');
			if (this._mouseMode != 'paint') { return; }
			this._drawing = false;
			if (this._eyeDropEnabled) {
				this.SUB_grabColorWithRaycast(event);
			}
		});
	}
	SUB_paintOnMouseMove() {
		if (this._mouseMode != 'paint') { return; }
		if (!this._drawing) { return; }
		this._raycaster.setFromCamera(this._moveMouse, this._camera);
		let found = this._raycaster.intersectObjects(this._builtVoxels);
		if (found.length > 0) {
			this.SUB_paintAtThisIntersect(found[0]);
		}
	}
	SUB_paintAtThisIntersect(intersect) {
		if (this._eyeDropEnabled) { return; }
		intersect.object.material.color = new THREE.Color(this._selectedPaint);
	}
	SUB_setupBuilding() {
		this._selectedPaint = new THREE.Color('#FF0000');
		this._eyeDropEnabled = false;
		this._builtVoxels = new Array();
		this._canBuildOn = new Array();
		this._canBuildOn.push(this._groundPlane);

		this._threejs.domElement.addEventListener('pointerdown', event => {
			if (this._mouseMode != 'build' && this._mouseMode != 'erase') { return; }
			this._clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			this._clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			this._draggingMouseMovedYet = false;
		});
		this._threejs.domElement.addEventListener('pointerup', event => {
			if (this._eyeDropEnabled) {
				this.SUB_grabColorWithRaycast(event);
			} else {
				if (!(this._mouseMode == 'build' || this._mouseMode == 'erase') || this._draggingMouseMovedYet) { return; }
				//console.log('click');
				this._clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				this._clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	
	
				this._raycaster.setFromCamera(this._clickMouse, this._camera);
				let found = this._raycaster.intersectObjects(this._canBuildOn);
	
				if (found.length > 0) {
					if (found[0].object.userData.canBuildOn) {
						if (this._mouseMode == 'erase') {
							this.SUB_eraseCubeAtThisIntersect(found[0]);
						} else {
							this.SUB_buildCubeAtThisIntersect(found[0]);
						}
					}
				}
			}
		});
	}
	SUB_eraseCubeAtThisIntersect(intersect) {
		this._scene.remove( intersect.object );
		this._builtVoxels.splice( this._builtVoxels.indexOf( intersect.object ), 1 );
		this._canBuildOn.splice( this._canBuildOn.indexOf( intersect.object ), 1 );
	}
	SUB_buildCubeAtThisIntersect(intersect) {
		const buildSize = 5;
		const voxel = new THREE.Mesh(
			new THREE.BoxGeometry(buildSize, buildSize, buildSize),
			new THREE.MeshPhongMaterial( {color: this._selectedPaint} )
		);
		voxel.position.copy(intersect.point).add(intersect.face.normal);
		//console.log(voxel.position);
		voxel.castShadow = true;
		voxel.receiveShadow = true;
		voxel.userData.canBuildOn = true;
		voxel.position.divideScalar(buildSize).floor().multiplyScalar(buildSize).addScalar(buildSize / 2);
		this._scene.add(voxel);
		this._builtVoxels.push(voxel);
		this._canBuildOn.push(voxel);
	}
	SUB_grabColorWithRaycast(event) {
		this._raycaster.setFromCamera(this._moveMouse, this._camera);
		let found = this._raycaster.intersectObjects(this._builtVoxels);
		if (found.length > 0) {
			this._selectedPaint = found[0].object.material.color;
			this._eyeDropEnabled = false;
			this.setMouseMode(this._mouseMode);
			this._afterUsedEyeDropCallback(this._selectedPaint.getHexString());
		}
	}

	SUB_createSkybox() {
		/*const loader = new THREE.CubeTextureLoader();
		const texture = loader.load([
			'./resources/posx.jpg',
			'./resources/negx.jpg',
			'./resources/posy.jpg',
			'./resources/negy.jpg',
			'./resources/posz.jpg',
			'./resources/negz.jpg',
		]);
		this._scene.background = texture;*/
		this._scene.background = new THREE.Color( 0xf0f0f0 );
	}

	SUB_createFloor() {
		const gridSquareSize = 10;
		const realWorldSize = 100;
		const divisions = realWorldSize / gridSquareSize;
		const gridHelper = new THREE.GridHelper(realWorldSize, divisions);
		gridHelper.position.set(0, 0, 0);
		this._scene.add(gridHelper);

		this._groundPlane = new THREE.Mesh(
			new THREE.PlaneGeometry( realWorldSize, realWorldSize ),
			new THREE.MeshBasicMaterial({ visible: false }) // THIS MAT CANNOT NOT FÅ SHADOW
		);
		this._groundPlane.rotateX(-Math.PI / 2);
		this._groundPlane.position.set(0, 0.001, 0);
		this._groundPlane.userData.canBuildOn = true;
		this._scene.add( this._groundPlane );
	}

	SUB_OnWindowResize() {
		this._camera.aspect = window.innerWidth / window.innerHeight;
		this._camera.updateProjectionMatrix();
		this._threejs.setSize(window.innerWidth, window.innerHeight);
	}

	SUB_RAF() {
		requestAnimationFrame(() => {
			this._threejs.render(this._scene, this._camera);
			this.SUB_RAF();
		});
	}
	// above is all jobbig stuff to start scene and such
	makeBox(x, y, z) {
		const box = new THREE.Mesh(
			new THREE.BoxGeometry(2, 2, 2),
			new THREE.MeshStandardMaterial({
				color: 0x808080,
			}));
		box.position.set(x, y, z);
		box.castShadow = true;
		box.receiveShadow = true;
		this._scene.add(box);
	}
	setMouseMode(mode) {
		this._mouseMode = mode;
		if (mode == 'paint') {
			this._controls.enabled = false;
		} else {
			this._controls.enabled = true;
		}
	}
	updateSlectedPaint(clrStr) {
		this._selectedPaint = new THREE.Color(clrStr);
	}
	enableEyeDrop(callback) {
		this._afterUsedEyeDropCallback = callback;
		this._eyeDropEnabled = true;
		this._controls.enabled = false;
	}
}



window.addEventListener('DOMContentLoaded', () => {
	globalThis._APP = new BasicWorldDemo();
});