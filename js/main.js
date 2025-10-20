import * as THREE from 'three';
import { SceneManager } from './sceneManager.js';
import { UIManager } from './uiManager.js';
import { PanelManager } from './panelManager.js';
import { CabinetManager } from './cabinetManager.js';
import { ProjectManager } from './projectManager.js';

class MainApp {
    constructor() {
        // Create managers in the correct order
        this.panelManager = new PanelManager();
        this.cabinetManager = new CabinetManager();
        this.projectManager = new ProjectManager();
        this.uiManager = new UIManager();
        this.sceneManager = new SceneManager();
        
        // Wire up the dependencies AFTER all managers are created
        this.sceneManager.panelManager = this.panelManager;
        this.sceneManager.cabinetManager = this.cabinetManager;
        this.sceneManager.uiManager = this.uiManager;
        this.sceneManager.projectManager = this.projectManager;
        
        this.panelManager.sceneManager = this.sceneManager;
        this.panelManager.uiManager = this.uiManager;
        
        this.cabinetManager.sceneManager = this.sceneManager;
        this.cabinetManager.panelManager = this.panelManager;
        this.cabinetManager.uiManager = this.uiManager;
        
        this.projectManager.sceneManager = this.sceneManager;
        this.projectManager.uiManager = this.uiManager;
        this.projectManager.panelManager = this.panelManager;
        this.projectManager.cabinetManager = this.cabinetManager;
        
        this.uiManager.sceneManager = this.sceneManager;
        this.uiManager.panelManager = this.panelManager;
        this.uiManager.cabinetManager = this.cabinetManager;
        this.uiManager.projectManager = this.projectManager;
        
        this.init();
    }
    
    init() {
        // Initialize the scene
        this.sceneManager.init();
        
        // Start animation loop
        this.sceneManager.startAnimationLoop();


        //initial setup
        this.uiManager.setupInitialNewProject();
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MainApp();
});