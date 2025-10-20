// sceneManager.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
    constructor() {
        this.panelManager = null;
        this.uiManager = null;
        this.cabinetManager = null;
        this.projectManager = null;
        
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.frustumSize = 1000;
        this._isInteracting = false; // Add this flag
        
        // Helpers and utilities
        this.axisHelper = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Event binding
        this.onClick = this.onClick.bind(this);
        this.onHover = this.onHover.bind(this);
        this.onRightClick = this.onRightClick.bind(this);
        this.orbitCenter = new THREE.Vector3(); // store center of all objects
        this.lastCamPos = new THREE.Vector3();
        this.onControlStart = this.onControlStart.bind(this);
        this.onControlEnd = this.onControlEnd.bind(this);
    }
    
    // ==================== INITIALIZATION METHODS ====================
    
    /**
     * Initialize the entire scene
     */
    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLights();
        this.setupControls();
        this.setupHelpers();
        this.bindEvents();
    }
    
    /**
     * Setup WebGL renderer
     */
    setupRenderer() {
        const canvas = document.querySelector('.main_canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas,
            antialias: true
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    
    /**
     * Setup main scene
     */
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x202020);
    }
    
    /**
     * Setup perspective camera
     *
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000000000
        );
        this.camera.position.set(0, 0, 5000);
        this.camera.lookAt(0, 0, 0);
    }
    /**
     * Setup perspective camera
     */
    setupCamera() {
        const canvas = this.renderer.domElement;
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const left = -this.frustumSize * aspect / 2;
        const right = this.frustumSize * aspect / 2;
        const top = this.frustumSize / 2;
        const bottom = -this.frustumSize / 2;
        const near = 0.1;
        const far = 1000000;
        
        this.camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
        this.camera.zoom = 0.1; // Reduced zoom to see more
        this.camera.position.set(5000, 5000, 5000); // Position for isometric view
        this.camera.lookAt(0, 0, 0); // Look at scene center
        this.camera.updateProjectionMatrix();
    }
    
    /**
     * Setup scene lighting
     */
    setupLights() {
        // Ambient light for overall illumination
        this.scene.add(new THREE.AmbientLight(0xffffff, 2));
        
        // Pointlight from top
        const pointLight = new THREE.PointLight(0xffffff, 2);
        pointLight.position.set(0, 10000, 0);
        this.scene.add(pointLight);


        // Directional light for shadows and highlights
        const topLight = new THREE.DirectionalLight(0xffffff, 2);
        const sidelight = new THREE.DirectionalLight(0xffffff, 2);

        topLight.position.set(2500, 500, 400);
        sidelight.position.set(-1000, 1500, -400);

        this.scene.add(topLight);
        this.scene.add(sidelight);
    }
    
    /**
     * Setup orbit controls for camera navigation
     */
    setupControls() {
        const canvas = document.querySelector('.main_canvas');
        this.controls = new OrbitControls(this.camera, canvas);

        // Buttons: MMB = pan, RMB = rotate
        this.controls.mouseButtons = {
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE
        };
        this.controls.screenSpacePanning = true;
        this.controls.panSpeed = 1.0;
        
        // Add event listeners for interaction
        this.controls.addEventListener('start', this.onControlStart);
        this.controls.addEventListener('end', this.onControlEnd);
        
        this.controls.update();
    }

    onControlStart() {
        this._isInteracting = true;
    }

    onControlEnd() {
        this._isInteracting = false;
        // Optional: Auto-fit view after interaction ends
        //this.updateOrbitTargetAndView();
    }

    /**
     * Setup visual helpers (axes, grids, etc.)
     */
    setupHelpers() {
        // Axis helper for orientation
        this.axisHelper = new THREE.AxesHelper();
        this.axisHelper.material.depthTest = false;
        this.axisHelper.scale.set(50, 50, 50);
        this.scene.add(this.axisHelper);
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        const canvas = this.renderer.domElement;
        canvas.addEventListener('click', this.onClick);
        canvas.addEventListener('mousemove', this.onHover);
        canvas.addEventListener('contextmenu', this.onRightClick);
        
        // Window resize handling
        //window.addEventListener('resize', () => this.onWindowResize());
    }

    // ==================== ANIMATION & RENDERING ====================

    /**
     * Start the animation loop
     */
    startAnimationLoop() {
        const animate = () => {
            this.resizeRendererToDisplaySize();
            this.updateHelpers();
            this.controls.update(); // This is crucial for smooth controls
            this.updateObjectHelpers();
            this.renderer.render(this.scene, this.camera);
        };
        this.renderer.setAnimationLoop(animate);
    }
    /**
     * Update helper scales based on camera distance
     */
    updateHelpers() {
        if (!this.axisHelper) return;

        // Axis scaling (already there)
        const distance = this.camera.position.length();
        const scaleFactor = distance * 0.1;
        this.axisHelper.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
    
    /**
     * Handle window resize events
     *
    onWindowResize() {
        const canvas = document.querySelector('.main_canvas');
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    }
    /**
     * Handle window resize events
     */
    resizeRendererToDisplaySize() {
        const canvas = this.renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            this.renderer.setSize(width, height, false);
            
            // Update camera aspect ratio when window resizes
            const aspect = width / height;
            this.camera.left = -this.frustumSize * aspect / 2;
            this.camera.right = this.frustumSize * aspect / 2;
            this.camera.top = this.frustumSize / 2;
            this.camera.bottom = -this.frustumSize / 2;
            this.camera.updateProjectionMatrix();
        }
        return needResize;
    }

    // ==================== OBJECT MANAGEMENT ====================

    /**
     * Add object to scene
     */
    addObject(obj) {
        this.scene.add(obj);

        this.addObjectWithBoundingBox(obj);
    }
    /**
     * Public method to fit view to all objects
     */
    fitViewToObjects() {
        this.updateOrbitTargetAndView();
    }

    /**
     * Remove object from scene if it's a direct child
     */
    removeObjectFromScene(obj) {
        if (obj && obj.parent === this.scene) {
            this.scene.remove(obj);
            return true;
        }
        return false;
    }

    /**
     * Remove object and update orbit target
     */
    removeObject(obj) {
        if (obj && obj.parent) {
            obj.parent.remove(obj);
            this.cleanupObject(obj);
            
            // Remove from helpers map
            if (this._objectHelpers && this._objectHelpers.has(obj)) {
                this._objectHelpers.delete(obj);
            }
            
            // Update orbit target if there are still objects
            if (this._objectHelpers && this._objectHelpers.size > 0) {
                this.updateOrbitTargetAndView();
            } else {
                // Reset to origin if no objects
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            }
            
            return true;
        }
        return false;
    }

    /**
     * Recursively cleanup object resources
     */
    cleanupObject(obj) {
        // Dispose geometry
        if (obj.geometry) obj.geometry.dispose();
        
        // Dispose materials
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m && m.dispose());
            } else {
                obj.material.dispose && obj.material.dispose();
            }
        }
        
        // Recursively cleanup children
        if (obj.children && obj.children.length) {
            const children = [...obj.children];
            children.forEach(child => this.cleanupObject(child));
        }
    }

    /**
     * Remove object by name
     */
    removeObjectByName(name) {
        const object = this.scene.getObjectByName(name);
        if (object) return this.removeObject(object);
        return false;
    }

    /**
     * Remove all objects of a specific type
     */
    removeObjectsByType(type) {
        const toRemove = [];
        this.scene.traverse(o => { 
            if (o.type === type) toRemove.push(o); 
        });
        toRemove.forEach(o => this.removeObject(o));
        return toRemove.length;
    }

    /**
     * Clear entire scene except the scene itself
     */
    clearScene() {
        const objects = [];
        this.scene.traverse(o => { 
            if (o !== this.scene) objects.push(o); 
        });
        objects.forEach(o => { 
            if (o.parent) o.parent.remove(o); 
            this.cleanupObject(o); 
        });
        return objects.length;
    }

    /**
     * Bounding box to set targets
     */
    addObjectWithBoundingBox(obj, color = 0xffff00) {
        // Add object itself
        this.scene.add(obj);

        // --- Bounding Box Helper ---
        const boxHelper = new THREE.BoxHelper(obj, color);
        //this.scene.add(boxHelper);

        // --- Compute Box3 for center ---
        const box = new THREE.Box3().setFromObject(obj);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // --- Sphere marker at center ---
        const sphereGeo = new THREE.SphereGeometry(10, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const centerSphere = new THREE.Mesh(sphereGeo, sphereMat);
        centerSphere.position.copy(center);
        //this.scene.add(centerSphere);

        // --- Store references for updates ---
        if (!this._objectHelpers) this._objectHelpers = new Map();
        this._objectHelpers.set(obj, { boxHelper, centerSphere });

        // Update orbit controls target and camera view
        this.updateOrbitTargetAndView();

        return obj;
    }

    /**
     * Update all bounding boxes and center spheres
     */
    updateObjectHelpers() {
        if (!this._objectHelpers) return;

        const globalBox = new THREE.Box3();

        this._objectHelpers.forEach((helpers, obj) => {
            const { boxHelper, centerSphere } = helpers;

            // Update bounding box
            boxHelper.update();

            // Expand global bounding box
            const box = new THREE.Box3().setFromObject(obj);
            globalBox.union(box);

            // Update per-object center sphere
            const center = new THREE.Vector3();
            box.getCenter(center);
            centerSphere.position.copy(center);
        });

        // Update orbit center only when not actively panning
        if (!globalBox.isEmpty() && !this._isPanning) {
            globalBox.getCenter(this.orbitCenter);
            this.controls.target.copy(this.orbitCenter);
            this.controls.update();
        }
    }

    /**
     * Update orbit controls target to center of all objects and adjust camera view
     */
    updateOrbitTargetAndView() {
        if (!this._objectHelpers || this._objectHelpers.size === 0) return;

        const globalBox = new THREE.Box3();

        // Calculate global bounding box of all objects
        this._objectHelpers.forEach((helpers, obj) => {
            const box = new THREE.Box3().setFromObject(obj);
            globalBox.union(box);
        });

        if (globalBox.isEmpty()) return;

        // Get center of all objects
        const center = new THREE.Vector3();
        globalBox.getCenter(center);
        
        // Set orbit controls target to the center
        this.controls.target.copy(center);
        this.controls.update();

        // Calculate required zoom to fit all objects in view
        this.zoomToFit(globalBox);
    }

    /**
     * Adjust camera zoom to fit the bounding box in view
     */
    zoomToFit(boundingBox) {
        if (boundingBox.isEmpty()) return;

        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 1.5; // Add some padding

        // For orthographic camera, adjust zoom based on object size
        const canvas = this.renderer.domElement;
        const aspect = canvas.clientWidth / canvas.clientHeight;
        
        // Calculate required zoom to fit the object
        const requiredFrustumSize = maxDim * 1.2; // Add 20% padding
        const currentFrustumSize = this.frustumSize;
        
        // Adjust zoom to match required frustum size
        this.camera.zoom = currentFrustumSize / requiredFrustumSize;
        this.camera.zoom = Math.max(0.1, Math.min(this.camera.zoom, 10)); // Clamp zoom
        
        this.camera.updateProjectionMatrix();
        
        // Optional: Position camera at appropriate distance
        const direction = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
        this.camera.position.copy(this.controls.target).add(direction.multiplyScalar(distance));
        
        this.controls.update();
    }

    // ==================== QUERY METHODS ====================

    /**
     * Check if object exists in scene
     */
    hasObject(obj) {
        return !!(obj && obj.parent);
    }

    /**
     * Find object by name
     */
    findObjectByName(name) {
        return this.scene.getObjectByName(name);
    }

    /**
     * Get all objects in scene
     */
    getAllObjects() {
        const objects = [];
        this.scene.traverse(o => { 
            if (o !== this.scene) objects.push(o); 
        });
        return objects;
    }

    // ==================== INTERACTION HANDLING ====================

    /**
     * Handle mouse click events for object selection
     */
    onClick(event) {
        this._updateMousePosition(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const testObjects = this.panelManager ? this.panelManager.getPanels() : this.scene.children;
        const hits = this.raycaster.intersectObjects(testObjects, true);

        if (hits.length === 0) {
            this.panelManager?.deselectAll();
            this.uiManager?.showDefaultSection?.();
            return;
        }

        const panelObject = this._findPanelObject(hits[0].object);
        const panelId = panelObject?.userData?.panelId;

        if (panelId != null) {
            this._handlePanelSelection(panelId, event);
        }
    }
    /**
     * Handle right-click events for context menus
     */
    onRightClick(event) {
        event.preventDefault(); // Prevent browser context menu
        
        this._updateMousePosition(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const testObjects = this.panelManager ? this.panelManager.getPanels() : this.scene.children;
        const hits = this.raycaster.intersectObjects(testObjects, true);

        if (hits.length === 0) {
            // Hide any existing context menu
            this.uiManager?.hideContextMenu();
            return;
        }

        const panelObject = this._findPanelObject(hits[0].object);
        const panelId = panelObject?.userData?.panelId;

        if (panelId != null) {
            this._handleRightClickSelection(panelId, event);
        }
    }

    /**
     * Handle mouse hover events
     */
    onHover(event) {
        this._updateMousePosition(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const testObjects = this.panelManager ? this.panelManager.getPanels() : this.scene.children;
        const intersects = this.raycaster.intersectObjects(testObjects, true);

        // TODO: Implement hover effects or tooltips
        if (intersects.length > 0) {
            // Potential hover highlight implementation
            // this._handleHoverEffects(intersects[0].object);
        }
    }

    // ==================== PRIVATE HELPER METHODS ====================

    /**
     * Update mouse position from event
     */
    _updateMousePosition(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    /**
     * Find the parent object containing panel data
     */
    _findPanelObject(object) {
        let obj = object;
        while (obj && !obj.userData?.panelId) {
            obj = obj.parent;
        }
        return obj;
    }

    /**
     * Handel Panel or Cabinet selection
     */
    _handlePanelSelection(panelId, event) {
        const shift = event.shiftKey;
        const ctrl  = event.ctrlKey || event.metaKey; // support Mac cmd key

        if (shift && ctrl) {
            // Rule 4: Multi-panel selection across groups
            this.panelManager.selectPanelMulti(panelId, "blue");
            this.uiManager.defaultSection();
        }
        else if (ctrl) {
            // Rule 3: Multi-cabinet selection
            this.panelManager.selectCabinet(panelId, true); 
            this.uiManager.defaultSection();
        }
        else if (shift) {
            // Rule 2: Single panel only
            this.panelManager.selectPanelSingle(panelId, "blue");
            const data = this.panelManager.getPanelById(panelId);
            this.uiManager?.updatePanelForm?.(data, panelId)
        }
        else {
            // Rule 1: Entire cabinet
            this.panelManager.selectCabinet(panelId, false);
            this.uiManager?.selectCabinetUIPanel?.(panelId);
        }
    }

    /**
     * Handle right-click selection logic
     */
    _handleRightClickSelection(panelId, event) {
        const panelManager = this.panelManager;
        const uiManager = this.uiManager;
        
        // Check if the panel is selected
        const isSelected = panelManager.selectedPanelIds.has(panelId) || 
                           panelManager.cabinetSelectionIds.has(panelId);
        
        if (!isSelected) {
            uiManager.hideContextMenu();
            return;
        }
        
        // Determine selection type and show appropriate menu
        if (panelManager.cabinetSelectionIds.has(panelId)) {
            // Cabinet selection
            const cabId = this.cabinetManager.findPanelCabinet(panelId);
            //console.log('3D space cabsel panelid:',panelId);
            //console.log('3D space csbsel cabId:', cabId);
            this.uiManager.showContextMenu(event, 'cabinet', cabId, panelId);
        } else if (panelManager.selectedPanelIds.has(panelId)) {
            // Panel selection
            const cabId = this.cabinetManager.findPanelCabinet(panelId);
            //console.log('3D space panelid:',panelId);
            //console.log('3D space cabId:', cabId);
            this.uiManager.showContextMenu(event, 'panel', cabId, panelId);
        }
    }

    // ==================== FUTURE EXTENSIONS ====================

    /**
     * TODO: Implement screenshot functionality
     */
    // takeScreenshot(format = 'png', quality = 1) { }

    /**
     * TODO: Implement scene serialization/deserialization
     */
    // exportScene() { }
    // importScene(data) { }

    /**
     * TODO: Implement camera presets
     */
    // setCameraPreset(presetName) { }
    // saveCameraPreset(presetName) { }

    /**
     * TODO: Implement scene statistics
     */
    // getSceneStats() { }

    /**
     * TODO: Implement advanced lighting controls
     */
    // setupAdvancedLighting() { }
    // adjustLighting(intensity, color, position) { }

    /**
     * TODO: Implement environment maps
     */
    // loadEnvironmentMap(url) { }

    /**
     * TODO: Implement post-processing effects
     */
    // setupPostProcessing() { }
    // enableEffect(effectName) { }
    // disableEffect(effectName) { }
}