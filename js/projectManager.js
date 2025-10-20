import * as THREE from 'three'

export class ProjectManager {
    constructor() {
        this.sceneManager = null;
        this.uiManager = null;
        this.panelManager = null;
        this.cabinetManager = null;

        this.projects = [];
        // Removed global floors array since floors are now project-specific
    }

    // =========================== PROJECT MANAGEMENT METHODS ========================

    /**
     * Create Project with a name and optional floors
     */
    createProject(name = null, floors) {
        const id = `proj-${crypto.randomUUID()}`;
        
        if (name === null) {
            const base = 'new project';
            let i = this.projects.length + 1;
            name = `${base} ${i}`;
        }
        
        const projectGroup = new THREE.Object3D();
        projectGroup.name = name;
        this.uiManager.bottomNavAppend('project', name, id);
        //console.log('name of project', projectGroup.name);

        const projectData = {
            id,
            name,
            group: projectGroup,
            floors: []
        };

        // Handle floors parameter
        floors.forEach(floorName => {
            this.createFloor(floorName, projectData);
        });

        this.projects.push(projectData);
        this.sceneManager.addObject(projectGroup);

        return projectData;
    }

    /**
     * Remove project by ID
     */
    removeProject(projectId) {
        const index = this.projects.findIndex(p => p.id === projectId);
        if (index === -1) return false;

        const project = this.projects[index];
        
        // Remove all cabinets from all floors first
        project.floors.forEach(floor => {
            const cabIds = floor.cabinets.map(cabinet => cabinet.id);
            this.cabinetManager.removeCabinets(cabIds);
        });

        // Remove from scene
        this.sceneManager.removeObject(project.group);
        
        // Remove from projects array
        this.projects.splice(index, 1);

        return true;
    }

    // ===================== FLOOR MANAGEMENT METHODS ===========================

    /**
     * Create new floor Group for a specific project
     */
    createFloor(name = null, projectData) {
        const id = `floor-${crypto.randomUUID()}`;
        
        if (name === null) {
            const currentFloors = projectData.floors.length;
            if (currentFloors === 0) {
                name = 'Ground Floor';
            } else {
                name = `${currentFloors} Floor`;
            }
        }

        const floorGroup = new THREE.Object3D();
        floorGroup.name = name;

        const floorData = {
            id, 
            name, 
            group: floorGroup,
            cabinets: [],
            projectId: projectData.id // Reference to parent project
        };

        // Add to project's floors array
        projectData.floors.push(floorData);
        
        // Add to project group
        projectData.group.add(floorGroup);

        this.uiManager.bottomNavAppend('floor', name, id);

        return floorData;
    }

    /**
     * Add floor to specific project
     */
    addFloorToProject(name = null, projectId) {
        const project = this.getProject(projectId);
        if (!project) {
            console.error("Project not found");
            return null;
        }

        const floorData = this.createFloor(name, project);
        return floorData;
    }

    /**
     * Remove floor from project
     */
    removeFloorFromProject(floorId, projectId) {
        const project = this.getProject(projectId);
        if (!project) {
            console.error("Project not found");
            return false;
        }

        const floorIndex = project.floors.findIndex(f => f.id === floorId);
        if (floorIndex === -1) {
            console.error("Floor not found in project");
            return false;
        }

        const floor = project.floors[floorIndex];
        
        // Remove all cabinets from this floor
        const cabIds = floor.cabinets.map(cabinet => cabinet.id);
        this.cabinetManager.removeCabinets(cabIds);

        // Remove floor group from project group
        if (floor.group.parent) {
            floor.group.parent.remove(floor.group);
        }

        // Remove from scene
        this.sceneManager.removeObject(floor.group);
        
        // Remove from project's floors array
        project.floors.splice(floorIndex, 1);

        return true;
    }

    /**
     * Get floor by ID from specific project
     */
    getFloor(floorId, projectId) {
        const project = this.getProject(projectId);
        if (!project) return null;

        return project.floors.find(f => f.id === floorId) || null;
    }

    /**
     * Get all floors for a project
     */
    getFloorsByProject(projectId) {
        const project = this.getProject(projectId);
        return project ? project.floors : [];
    }

    // ==================== QUERY METHODS ================================
    
    /**
     * Get project by id 
     */
    getProject(projId) {
        return this.projects.find(p => String(p.id) === String(projId)) || null;
    }

    /**
     * Get all projects
     */
    getAllProjects() {
        return this.projects;
    }

    /**
     * Find project that contains a specific floor
     */
    getProjectByFloorId(floorId) {
        return this.projects.find(project => 
            project.floors.some(floor => floor.id === floorId)
        ) || null;
    }

    /**
     * Find project that contains a specific cabinet
     */
    getProjectByCabinetId(cabinetId) {
        return this.projects.find(project =>
            project.floors.some(floor =>
                floor.cabinets.some(cabinet => cabinet.id === cabinetId)
            )
        ) || null;
    }

    /**
     * Find floor that contains a specific cabinet
     */
    getFloorByCabinetId(cabinetId, projectId = null) {
        const projectsToSearch = projectId ? [this.getProject(projectId)] : this.projects;
        
        for (const project of projectsToSearch) {
            if (!project) continue;
            
            for (const floor of project.floors) {
                if (floor.cabinets.some(cabinet => cabinet.id === cabinetId)) {
                    return floor;
                }
            }
        }
        return null;
    }

    // ==================== UTILITY METHODS ================================

    /**
     * Clear all projects and floors
     */
    clearAll() {
        // Remove all projects (which will remove all floors and cabinets)
        this.projects.forEach(project => {
            this.removeProject(project.id);
        });
        
        this.projects = [];
    }

    /**
     * Export project data for saving
     */
    exportProjectData(projectId) {
        const project = this.getProject(projectId);
        if (!project) return null;

        return {
            id: project.id,
            name: project.name,
            floors: project.floors.map(floor => ({
                id: floor.id,
                name: floor.name,
                cabinets: floor.cabinets.map(cabinet => ({
                    // Include cabinet data for export
                    id: cabinet.id,
                    type: cabinet.type,
                    position: cabinet.group.position,
                    rotation: cabinet.group.rotation,
                    scale: cabinet.group.scale
                    // Add more cabinet properties as needed
                }))
            }))
        };
    }

    /**
     * Import project data
     */
    importProjectData(projectData) {
        const project = this.createProject(projectData.name);
        
        // Create floors
        projectData.floors.forEach(floorData => {
            const floor = this.createFloor(floorData.name, project);
            
            // Import cabinets (you'll need to implement cabinet import in cabinetManager)
            floorData.cabinets.forEach(cabinetData => {
                // this.cabinetManager.importCabinet(cabinetData, floor.id);
            });
        });

        return project;
    }
}