// panelManager.js
import * as THREE from 'three';

export class PanelManager {
    constructor(sceneManager, cabinetManager) {
        this.sceneManager = sceneManager;
        this.cabinetManager = cabinetManager;

        // Data structures
        this.panelData = [];             // [{ id, name, length, width, thickness, position, rotation }]
        this.panelGroups = [];           // [THREE.Object3D] (each has exactly 1 mesh child)
        this.idToGroup = new Map();      // id -> group
        this.idToIndex = new Map();      // id -> index in panelData
        this.currentView = 'wire';
        
        // Selection state
        this.selectedPanelIds = new Set();     // Currently selected panel ID
        this.cabinetSelectionIds = new Set(); // Store original colors for deselection
    }

    // ==================== GEOMETRY CREATION METHODS ====================

    /**
     * Create wireframe geometry + transparent solid for panel
     */
    createWireGeometry(length, width, thickness, position, rotation, name, panelId, isSelected = false) {
        const box = new THREE.BoxGeometry(length, width, thickness, 2, 2, 2);
        
        // --- Transparent solid mesh (glass-like) ---
        const solidMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,   // glass effect (clickable but not visually heavy)
            depthWrite: false, // prevents z-fighting with edges
        });
        const solidMesh = new THREE.Mesh(box, solidMaterial);

        // --- Edges overlay (wireframe lines) ---
        const edges = new THREE.EdgesGeometry(box);
        let color;
        if (isSelected) {
            // blue for single/multi, green for cabinet
            color = this.cabinetSelectionIds.has(panelId) ? 0x90EE90 : 0x87CEFA;
        } else {
            color = 0xffffff;
        }
        const edgeMaterial = new THREE.LineBasicMaterial({ color, linewidth: 2 });
        const edgeMesh = new THREE.LineSegments(edges, edgeMaterial);

        // --- Group them ---
        const group = new THREE.Group();
        group.add(solidMesh);
        group.add(edgeMesh);

        // --- Position & rotation ---
        group.position.set(position.x, position.y, position.z);
        group.rotation.set(
            THREE.MathUtils.degToRad(rotation.rx),
            THREE.MathUtils.degToRad(rotation.ry),
            THREE.MathUtils.degToRad(rotation.rz)
        );

        // --- Metadata ---
        group.name = name;
        group.userData.panelId = panelId;
        group.userData.isSelected = isSelected;

        return group;
    }


    /**
     * Create solid geometry for panel
     */
    createSolidGeometry(length, width, thickness, position, rotation, name, panelId, isSelected = false) {
        const geometry = new THREE.BoxGeometry(length, width, thickness);
        
        // Use green color for selected panels, white for others
        let color;
        if (isSelected) {
            // Use blue for single/multi selection, green for cabinet selection
            color = this.cabinetSelectionIds.has(panelId) ? 0x90EE90 : 0x87CEFA;
        } else {
            color = 0xffffff;
        }
        const material = new THREE.MeshStandardMaterial({ 
            color, 
            metalness: 0.5, 
            roughness: 0.5 
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.rotation.set(
            THREE.MathUtils.degToRad(rotation.rx),
            THREE.MathUtils.degToRad(rotation.ry),
            THREE.MathUtils.degToRad(rotation.rz)
        );
        mesh.name = name;
        mesh.userData.isSelected = isSelected;
        
        return mesh;
    }

    // ==================== PANEL CREATION & MANAGEMENT ====================

    /**
     * Create panel geometry and data structure
     */
    createGeometry(length, width, thickness, position = { x: 0, y: 0, z: 0 }, rotation = { rx: 0, ry: 0, rz: 0 }, name) {
        const id = `panel-${crypto.randomUUID()}`;

        const data = { 
            id, 
            name, 
            length, 
            width, 
            thickness, 
            position: { ...position }, 
            rotation: { ...rotation } 
        };
        
        const isSelected = this.selectedPanelIds.has(id) || this.cabinetSelectionIds.has(id);
        const mesh = (this.currentView === 'wire')
            ? this.createWireGeometry(length, width, thickness, position, rotation, name, id, isSelected)
            : this.createSolidGeometry(length, width, thickness, position, rotation, name, id, isSelected);

        const group = new THREE.Object3D();
        group.userData.panelId = id;
        group.name = name;
        mesh.userData.panelId = id;
        group.add(mesh);

        const index = this.panelData.length;
        this.panelData.push(data);
        this.panelGroups.push(group);
        this.idToGroup.set(id, group);
        this.idToIndex.set(id, index);

        // NOTE: Do NOT add to scene here; CabinetManager will parent this group.
        //console.log('panel created:', id, group);
        return { id, group };
    }

    /**
     * Rebuild mesh for a specific panel with current view type and selection state
     */
    _rebuildMesh(panelId, viewType) {
        const group = this.idToGroup.get(panelId);
        if (!group) return;

        // Remove & dispose all existing children to avoid leftover geometry
        while (group.children.length) {
            const child = group.children[0];
            group.remove(child);
            this._disposeMesh(child);
        }

        const idx = this.idToIndex.get(panelId);
        const panelData = this.panelData[idx];
        if (!panelData) return;

        const isSelected = this.selectedPanelIds.has(panelId) || this.cabinetSelectionIds.has(panelId);

        // Create new representation (could be Mesh or Group)
        const newNode = (viewType === 'solid')
            ? this.createSolidGeometry(
                panelData.length,
                panelData.width,
                panelData.thickness,
                panelData.position,
                panelData.rotation,
                panelData.name,
                panelId,
                isSelected
            )
            : this.createWireGeometry(
                panelData.length,
                panelData.width,
                panelData.thickness,
                panelData.position,
                panelData.rotation,
                panelData.name,
                panelId,
                isSelected
            );

        if (!newNode) return;

        // Ensure panelId is attached to the returned object and all children
        const attachPanelId = (node) => {
            node.userData = node.userData || {};
            node.userData.panelId = panelId;
            if (node.children && node.children.length) {
                node.children.forEach(child => attachPanelId(child));
            }
        };
        attachPanelId(newNode);

        // Add the new node as-is (if it's a Group it will contain both solid & edges)
        group.add(newNode);

        // Keep group name & optionally copy transform if needed (optional)
        group.name = panelData.name || group.name;
    }

    // ==================== SELECTION MANAGEMENT ====================

    /**
     * Select a panel and highlight it
     */
    selectPanelSingle(panelId, color = "blue") {
        this.deselectAll();
        this.selectedPanelIds.add(panelId);
        //console.log('single panel selected:', panelId);
        this._highlightPanel(panelId, true, color);
    }

    /**
     * Select Multiple panel and highlight it
     */
    selectPanelMulti(panelId, color = "blue") {
        this.selectedPanelIds.add(panelId);
        this._highlightPanel(panelId, true, color);
    }

    /**
     * Select a cabinet or multi if held ctrl
     */
    selectCabinet(panelId, multiAllowed = false) {
        if (!multiAllowed) this.deselectAll();

        const group = this.idToGroup.get(panelId);
        if (!group) return;

        const cabinetRoot = group.parent; // Cabinet Object3D
        cabinetRoot.traverse(child => {
            if (child.userData?.panelId) {
                const childPanelId = child.userData.panelId;
                this.selectedPanelIds.add(childPanelId);
                this.cabinetSelectionIds.add(childPanelId);
                this._highlightPanel(childPanelId, true, "green");
            }
        });
    }

    /**
     * Deselect ALL panels and restore their original appearance
     */
    deselectAll() {
        // Collect all currently selected ids (unique)
        const allIds = new Set([...this.selectedPanelIds, ...this.cabinetSelectionIds]);

        allIds.forEach(panelId => {
            const group = this.idToGroup.get(panelId);
            if (!group) return;

            // Reset color & flags on all relevant children
            group.traverse(child => {
                if (child.isMesh && child.material && child.material.color) {
                    child.material.color.set(0xffffff);
                    child.userData = child.userData || {};
                    child.userData.isSelected = false;
                    child.userData.selectionType = null;
                }
                if ((child.type === 'LineSegments' || child.isLineSegments) && child.material && child.material.color) {
                    child.material.color.set(0xffffff);
                    child.userData = child.userData || {};
                    child.userData.isSelected = false;
                    child.userData.selectionType = null;
                }
            });
        });

        // Clear selection sets
        this.selectedPanelIds.clear();
        this.cabinetSelectionIds.clear();
    }


    /**
     * Highlight or unhighlight a panel
     */
    _highlightPanel(panelId, highlight, color = "green") {
        const group = this.idToGroup.get(panelId);
        if (!group) return;

        // Determine target color
        const col = (color === "blue") ? 0x87CEFA : 0x90EE90;
        const targetColor = highlight ? col : 0xffffff;

        // Traverse the group recursively and color any Mesh or LineSegments that have a material.color
        group.traverse(child => {
            // Mesh (solid)
            if (child.isMesh && child.material && child.material.color) {
                child.material.color.set(targetColor);
                child.userData = child.userData || {};
                child.userData.isSelected = highlight;
                child.userData.selectionType = highlight ? color : null;
            }

            // LineSegments (wireframe)
            if ((child.type === 'LineSegments' || child.isLineSegments) && child.material && child.material.color) {
                child.material.color.set(targetColor);
                child.userData = child.userData || {};
                child.userData.isSelected = highlight;
                child.userData.selectionType = highlight ? color : null;
            }
        });

        // Keep selection sets consistent: remove on unhighlight
        if (!highlight) {
            this.selectedPanelIds.delete(panelId);
            this.cabinetSelectionIds.delete(panelId);
        }
    }

    // ==================== VIEW MANAGEMENT ====================

    /**
     * Switch between wireframe and solid view modes
     */
    setView(type) {
        if (type === this.currentView) return;

        this.panelData.forEach(panel => this._rebuildMesh(panel.id, type));
        this.currentView = type;
    }

    // ==================== DATA ACCESS METHODS ====================

    /**
     * Get all panel groups
     */
    getPanels() {
        return this.panelGroups;
    }

    /**
     * Get panel data by ID
     */
    getPanelById(id) {
        const idx = this.idToIndex.get(id);
        return idx !== undefined ? this.panelData[idx] : null;
    }

    /**
     * Get number of panels
     */
    getNumberOfPanels() {
        return this.panelData.length;
    }

    /**
     * Get currently selected panel ID
     */
    getSelectedPanelIds() {
        return Array.from(this.selectedPanelIds);
    }
    /**
     * Get currently selected cabiners panels ids 
     */
    getCabinetSelectedPanelIds() {
        return Array.from(this.cabinetSelectionIds);
    }

    /**
     * Get current view type
     */
    getCurrentViewType() {
        return this.currentView;
    }

    // ==================== PANEL UPDATE METHODS ====================

    /**
     * Update panel properties
     */
    updatePanel(length, width, thickness, position, rotation, name, panelId) {
        const idx = this.idToIndex.get(panelId);
        if (idx === undefined) return false;

        this.panelData[idx] = {
            id: panelId,
            name,
            length,
            width,
            thickness,
            position: { ...position },
            rotation: { ...rotation }
        };

        // Rebuild mesh with updated properties and current selection state
        this._rebuildMesh(panelId, this.currentView);

        // Update group name
        const group = this.idToGroup.get(panelId);
        if (group) group.name = name;

        return true;
    }

    // ==================== CLEANUP METHODS ====================

    /**
     * Remove a panel and clean up all references
     */
    removePanel(panelId) {
        const idx = this.idToIndex.get(panelId);
        if (idx === undefined) return false;

        const group = this.idToGroup.get(panelId);
        if (group) {
            // Cleanup mesh resources
            if (group.children.length > 0) {
                this._disposeMesh(group.children[0]);
            }
            
            // Remove from scene if parented
            if (group.parent) {
                group.parent.remove(group);
            }
        }

        // Remove all references
        this.panelData.splice(idx, 1);
        this.panelGroups.splice(idx, 1);
        this.idToGroup.delete(panelId);
        this.idToIndex.delete(panelId);
        this.selectedPanelIds.delete(panelId);
        this.cabinetSelectionIds.delete(panelId);

        // Update indices for remaining panels
        this.idToIndex.clear();
        this.panelData.forEach((panel, index) => {
            this.idToIndex.set(panel.id, index);
        });

        return true;
    }

    /**
     * Remove multiple panels at once
     */
    removePanels(panelIds) {
        panelIds.forEach(panelId => this.removePanel(panelId));
    }

    _disposeMesh(node) {
        if (!node) return;

        // Recursively dispose children first
        if (node.children && node.children.length) {
            const children = [...node.children];
            children.forEach(child => {
                node.remove(child);
                this._disposeMesh(child);
            });
        }

        // Dispose geometry
        if (node.geometry) {
            try { node.geometry.dispose(); } catch (e) { /* ignore */ }
        }

        // Dispose materials
        if (node.material) {
            try {
                if (Array.isArray(node.material)) {
                    node.material.forEach(m => m && m.dispose && m.dispose());
                } else {
                    node.material.dispose && node.material.dispose();
                }
            } catch (e) {
                /* ignore */
            }
        }
    }

    /**
     * Clear all panels and reset state
     */
    clearAllPanels() {
        // Detach and cleanup each group
        this.panelGroups.forEach(group => {
            if (group.parent) {
                group.parent.remove(group);
            }
            this.sceneManager.cleanupObject(group);
        });

        // Reset all data structures
        this.panelData = [];
        this.panelGroups = [];
        this.idToGroup.clear();
        this.idToIndex.clear();
        this.selectedPanelIds.clear();
        this.cabinetSelectionIds.clear();
        this.currentView = 'wire';
    }

    /**
     * Cleanup resources
     */
    dispose() {
        this.clearAllPanels();
    }

    // ==================== FUTURE EXTENSIONS ====================

    /**
     * TODO: Implement panel material system
     */
    // setPanelMaterial(panelId, materialProperties) { }

    /**
     * TODO: Implement panel texture mapping
     */
    // applyTextureToPanel(panelId, textureUrl) { }

    /**
     * TODO: Implement panel grouping/ungrouping
     */
    // groupPanels(panelIds) { }
    // ungroupPanel(groupId) { }

    /**
     * TODO: Implement panel duplication
     */
    // duplicatePanel(panelId) { }

    /**
     * TODO: Implement panel alignment tools
     */
    // alignPanels(panelIds, alignmentType) { }

    /**
     * TODO: Implement measurement tools
     */
    // getPanelDimensions(panelId) { }
    // calculateTotalArea() { }
}