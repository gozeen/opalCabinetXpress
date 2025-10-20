// cabinetManager.js
import * as THREE from 'three';
import { calculatePanels } from './rulesEngine.js';

export class CabinetManager {
    constructor() {
        this.sceneManager = null;
        this.panelManager = null;
        this.uiManager = null;

        // Cabinet data structure: [{ id, name, group, panels: [{ id, group, name }] }]
        this.cabinets = [];
    }

    // ==================== CABINET MANAGEMENT METHODS ====================

    /**
     * Create a new cabinet with the given name
     */
    createCabinet(name, idFromJson = null) {
        const id = idFromJson || `cab-${crypto.randomUUID()}`;   // always string, safe
        const cabinetGroup = new THREE.Object3D();
        cabinetGroup.name = name;

        const cabinetData = { 
            id, 
            name, 
            group: cabinetGroup, 
            panels: [] 
        };
        
        this.cabinets.push(cabinetData);
        this.sceneManager.addObject(cabinetGroup);

        this.uiManager.objectAppend('cabinet', name, null, id);

        //console.log("Created cabinet:", cabinetData);

        return cabinetData;
    }


    /**
     * Remove a cabinet and all its panels
     */
    removeCabinet(cabId) {
        const index = this.cabinets.findIndex(c => c.id === cabId);
        if (index === -1) return false;

        const cabinet = this.cabinets[index];
        const panelIds = cabinet.panels.map(panel => panel.id);

        // Remove all panels from panelManager
        this.panelManager.removePanels(panelIds);

        // Remove the cabinet group itself
        this.sceneManager.removeObject(cabinet.group);
        this.cabinets.splice(index, 1);

        return true;
    }

    /**
     * Loop through the cabinet ids for multiple cabinets 
     */
    removeCabinets(cabIds) {
        cabIds.forEach(cabId => this.removeCabinet(cabId));
    }

    /**
     * Remove a panel from a cabinet
     */
    removePanelFromCabinet(cabId, panelId) {
        const cabinet = this.getCabinet(cabId);
        if (!cabinet) {
            console.warn("Cabinet not found:", cabId);
            return null;
        }

        const panelIndex = cabinet.panels.findIndex(p => p.id === panelId);
        if (panelIndex === -1) return false;

        const panel = cabinet.panels[panelIndex];
        
        // Remove panel from panelManager data structures
        this.panelManager.removePanel(panelId);
        
        // Remove panel group from cabinet group
        if (panel.group.parent) {
            panel.group.parent.remove(panel.group);
        }
        
        // Remove panel from cabinet's panel list
        cabinet.panels.splice(panelIndex, 1); // FIXED: Changed this.cabinet to cabinet
        
        return true;
    }

    /**
     * Rename an existing cabinet
     */
    renameCabinet(cabId, newName) {
        const cabinet = this.cabinets.find(c => c.id === cabId);
        if (!cabinet) return false;

        cabinet.name = newName;
        cabinet.group.name = newName;

        if (this.uiManager && this.uiManager.renameCabinetUI) {
            this.uiManager.renameCabinetUI(cabId, newName);
        }

        return true;
    }

    // ==================== PANEL MANAGEMENT METHODS ====================

    /**
     * Add a panel to a cabinet
     */
    addPanelToCabinet(cabId, length, width, thickness, position, rotation, name) {
        const cabinet = this.getCabinet(cabId);
        if (!cabinet) {
            console.warn("Cabinet not found:", cabId);
            return null;
        }

        // Create panel geometry
        const { id, group } = this.panelManager.createGeometry(
            length, width, thickness, position, rotation, name
        );

        // Attach panel's mesh/group to cabinet's group
        cabinet.group.add(group);

        // Store panel in cabinet data
        cabinet.panels.push({ id, group, name });

        // Update UI
        this.uiManager.objectAppend('panel', name, id, cabinet.id);

        return { id, group, cabId: cabinet.id };
    }


    /**
     * Move a panel from one cabinet to another
     */
    movePanelToCabinet(panelId, targetCabId) {
        const targetCabinet = this.getCabinet(targetCabId);

        // Find source cabinet containing the panel
        const sourceCabinet = this._findPanelCabinet(panelId);
        if (!sourceCabinet) return false;

        const panelIndex = sourceCabinet.panels.findIndex(p => p.id === panelId);
        if (panelIndex === -1) return false;

        const panel = sourceCabinet.panels[panelIndex];

        // Reparent the panel group
        if (panel.group.parent) {
            panel.group.parent.remove(panel.group);
        }
        targetCabinet.group.add(panel.group);

        // Update cabinet records
        sourceCabinet.panels.splice(panelIndex, 1);
        targetCabinet.panels.push(panel);

        // Update UI
        if (this.uiManager && this.uiManager.movePanelInUI) {
            this.uiManager.movePanelInUI(panelId, sourceCabinet.id, targetCabinet.id);
        }

        return true;
    }

    // ==================== QUERY METHODS ====================

    /**
     * Get cabinet by ID
     */
    getCabinet(cabId) {
        return this.cabinets.find(c => String(c.id) === String(cabId)) || null;
    }

    /**
     * Get cabinet by name (for backward compatibility)
     */
    getCabinetByName(name) {
        return this.cabinets.find(c => c.name === name) || null;
    }

    /**
     * Get all cabinets
     */
    getAllCabinets() {
        return this.cabinets;
    }

    /**
     * Get all panels in a cabinet
     */
    getCabinetPanels(cabId) {
        const cabinet = this.getCabinet(cabId);
        return cabinet ? cabinet.panels.map(p => ({ id: p.id, name: p.name })) : [];
    }

    /**
     * Find which cabinet contains a specific panel
     */
    findPanelCabinet(panelId) {
      const cab = this._findPanelCabinet(panelId);
      return cab ? cab.id : null;
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Generate a unique cabinet name
     */
    _generateCabinetName() {
        const base = 'Cabinet';
        let i = 1;
        while (this.cabinets.find(c => c.name === `${base} ${i}`)) i++;
        return `${base} ${i}`;
    }

    /**
     * Find the cabinet that contains a specific panel
     */
    _findPanelCabinet(panelId) {
      return this.cabinets.find(cab => cab.panels.some(p => p.id === panelId)) || null;
    }


    /**
     * Get total number of cabinets
     */
    getCabinetCount() {
        return this.cabinets.length;
    }

    /**
     * Get total number of panels across all cabinets
     */
    getTotalPanelCount() {
        return this.cabinets.reduce((total, cabinet) => total + cabinet.panels.length, 0);
    }

    // ==================== CLEANUP METHODS ====================

    /**
     * Remove all cabinets and panels
     */
    clearAll() {
      const ids = this.cabinets.map(c => c.id);
      ids.forEach(id => this.removeCabinet(id));
      this.cabinets = [];
    }


    // ====================== CABINET TEMPLATE MANAGMENT ===============

    /**
     * Adds cabinet and panels from the template files 
     */
    async loadFromJson(jsonData) {
        const createdCabinets = [];

        jsonData.cabinets.forEach(cabData => {
            // create cabinet with JSON's ID
            console.log(cabData.id);
            const cab = this.createCabinet(cabData.name, cabData.id);

            // generate panels using rulesEngine
            const panels = calculatePanels(
                cabData.width,
                cabData.height,
                cabData.depth,
                cabData.thickness,
                cabData.options
            );
            console.log(cab.id);

            panels.forEach(p => {
                this.addPanelToCabinet(
                    cab.id,
                    p.length,
                    p.width,
                    p.thickness,
                    p.position,
                    p.rotation,
                    p.name
                );
            });

            createdCabinets.push(cab);
        });

        return createdCabinets;
    }
    // ==================== FUTURE EXTENSIONS ====================

    /**
     * TODO: Implement cabinet templates system
     */
    // createCabinetFromTemplate(templateName, position) { }

    /**
     * TODO: Implement cabinet grouping/nesting
     */
    // groupCabinets(cabinetNames, groupName) { }
    // ungroupCabinetGroup(groupId) { }

    /**
     * TODO: Implement cabinet duplication
     */
    // duplicateCabinet(cabinetName, newName) { }

    /**
     * TODO: Implement cabinet export/import
     */
    // exportCabinet(cabinetName, format) { }
    // importCabinet(data, format) { }

    /**
     * TODO: Implement cabinet validation
     */
    // validateCabinetStructure(cabinetName) { }

    /**
     * TODO: Implement cabinet measurements and statistics
     */
    // getCabinetDimensions(cabinetName) { }
    // calculateTotalVolume() { }
    // calculateTotalCost() { }

    /**
     * TODO: Implement cabinet visibility toggling
     */
    // setCabinetVisibility(cabinetName, visible) { }
    // toggleCabinetVisibility(cabinetName) { }

    /**
     * TODO: Implement cabinet locking
     */
    // lockCabinet(cabinetName) { }
    // unlockCabinet(cabinetName) { }
}