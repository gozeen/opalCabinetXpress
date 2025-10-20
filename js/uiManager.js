// uiManager.js
export class UIManager {
    constructor() {
        this.sceneManager = null;
        this.panelManager = null;
        this.cabinetManager = null;
        this.projectManager = null;

        // State management
        this.activeCabinet = null;
        this.activeFloor = null;
        this.activeProject = null;

        // DOM element references
        this.initializeDOMElements();
        
        // Event bindings
        this.bindEvents();

        // Initialize UI structure
        this._ensureLeftRoot();
    }

    // ==================== INITIALIZATION METHODS ====================

    /**
     * Initialize all DOM element references
     */
    initializeDOMElements() {
        // Header buttons
        this.newProjectBtn = document.getElementById('newProjectBtn');
        this.newCabinateBtn = document.getElementById('newCabinateBtn');
        this.newPanelBtn = document.getElementById('newPanelBtn');
        this.newSketchBtn = document.getElementById('newSketchBtn');
        this.showTemplatesBtn = document.getElementById('showTemplatesBtn');

        // Cabinet form elements
        this.createCabinetBtn = document.getElementById('createCabinetBtn');
        this.updateCabinetBtn = document.getElementById('updateCabinetBtn');
        this.cabinetNameInput = document.getElementById('cabinet_name');

        // Panel form elements
        this.addPanelBtn = document.getElementById('addPanelBtn');
        this.updatePanelBtn = document.getElementById('updatePanelBtn');

        // View controls
        this.solidView = document.querySelector('.solidView');
        this.wireView = document.querySelector('.wireView');

        // Navigation elements
        this.leftNav = document.querySelector('.left_nav');
        this.bottomNav = document.querySelector('.bottom_nav');

        this.addNewProjectBtn = document.getElementById('addNewProject');
        this.addNewFloorBtn = document.getElementById('addNewFloor');

        this.leftNav.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this._handleLeftNavRightClick(e);
        });
        this.bottomNav.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this._handleLeftNavRightClick(e);
        })
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Header button events
        this.newPanelBtn.addEventListener('click', () => this.showPanelCreation());
        this.newCabinateBtn.addEventListener('click', () => this.showCabinetCreation());
        this.showTemplatesBtn.addEventListener('click', () => this.listJsonFiles());

        // View mode events
        this.solidView.addEventListener('click', () => this.setViewMode('solid'));
        this.wireView.addEventListener('click', () => this.setViewMode('wire'));

        // Form submission events
        this.addPanelBtn.addEventListener('click', () => this.createPanel());
        this.createCabinetBtn.addEventListener('click', () => this.createCabinetFromForm());
        this.newProjectBtn.addEventListener('click', () => this.showNewProjectForm());
        this.addNewProjectBtn.addEventListener('click', () => this.showNewProjectForm());
    }

    // ==================== UI SETUP & CONTROLS ====================

    /**
     * Set active view mode (solid/wire)
     */
    setViewMode(mode) {
        const activeBtn = mode === 'solid' ? this.solidView : this.wireView;
        this.setActiveViewButton(activeBtn);
        this.panelManager.setView(mode);
    }

    /**
     * Set active view button styling
     */
    setActiveViewButton(activeBtn) {
        [this.solidView, this.wireView].forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    /**
     * Set initialProject
     */
    setupInitialNewProject() {
        const projectName = 'New Project';
        const floors = [];
        floors.push('Ground Floor');
        const projectData = this.projectManager.createProject(projectName, floors);
        console.log(projectData.id);
        const floorData = this.projectManager.getFloorsByProject(projectData.id);
        const floorId = floorData[0].id;
        console.log(floorId)
        this.activeProject = projectData.id;
        this.activeFloor = floorId;
        this.setActiveButton();
    }

    /**
     * Setting active button stats for project
     */
    setActiveButton() {
        const btnpId = this.activeProject;
        const btnp = document.getElementById(btnpId);
        btnp.classList.add('active');

        const btnfId = this.activeFloor;
        const btnf = document.getElementById(btnfId);
        btnf.classList.add('active');

        const btncId = this.activeCabinet;
        const btnc = document.getElementById(btncId);
        //btnc.classList.add('active');
    }

    // ==================== LEFT NAVIGATION MANAGEMENT ====================
    /**
     * Ensure left navigation has proper container structure !!!!! DO NOT FUCKING TOUCH THIS !!!!!
     */
    _ensureLeftRoot() {
        if (!this.leftNav.querySelector('.cabinet-list')) {
            const list = document.createElement('div');
            list.className = 'cabinet-list';
            this.leftNav.appendChild(list);
        }
    }

    /**
     * Create cabinet header element
     */
    _createCabinetHeader(name, wrapper, cabId) {
        const header = document.createElement('div');
        header.className = 'cabinet-header';

        // Cabinet name button
        const cabinetBtn = document.createElement('button');
        cabinetBtn.className = 'objectBtns cabinetBtn';
        cabinetBtn.id = cabId
        cabinetBtn.textContent = name;
        cabinetBtn.addEventListener('click', () => this.selectCabinetUI(name));

        // Dropdown toggle for panels visibility
        const dropdown = document.createElement('div');
        dropdown.className = 'cabinet-dropdown';

        const dropdownToggle = document.createElement('button');
        dropdownToggle.className = 'dropdown-toggle';
        dropdownToggle.innerHTML = '▼';
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const panels = wrapper.querySelector('.cabinet-panels');
            panels.classList.toggle('hidden');
            dropdownToggle.innerHTML = panels.classList.contains('hidden') ? '►' : '▼';
        });

        dropdown.appendChild(dropdownToggle);
        header.appendChild(cabinetBtn);
        header.appendChild(dropdown);

        return header;
    }

    /**
     * Create panels container with add panel button
     */
    _createPanelsContainer(cabId) {
        const children = document.createElement('div');
        children.className = 'cabinet-panels hidden';

        const addPanelContainer = document.createElement('div');
        addPanelContainer.className = 'add-panel-container';
        
        const addPanelBtn = document.createElement('button');
        addPanelBtn.className = 'objectBtns addPanelBtn';
        const btnId = addPanelBtn.id = cabId;
        addPanelBtn.textContent = "+ Add Panel";
        addPanelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectCabinetUI(btnId);
            //onsole.log('button pressed', btnId)
            this.showPanelCreation();
        });
        
        addPanelContainer.appendChild(addPanelBtn);
        children.appendChild(addPanelContainer);

        return children;
    }

    // ==================== RIGHT PANEL MODES ====================

    /**
     * Default view of nothing to show
     */
    defaultSection() {
        this._showSection('.sec_default');
    }

    /**
     * Show panel creation form
     */
    showPanelCreation() {
        this._setPanelFormHeader("Create Panel");
        this._showSection('.panel_creation');
        
        // Show dropdown, hide cabinet name display
        document.querySelector('.panelCabinetSelect')?.classList.remove('hidden');
        document.querySelector('.panleFormSelectedCabinet')?.classList.add('hidden');
        
        this.addPanelBtn.classList.remove('hidden');
        this.updatePanelBtn.classList.add('hidden');

        this.updateCabinetDropdown();
        this._setActiveCabinetInDropdown();
        this._resetPanelFormDefaults();
    }

    /**
     * Show cabinet creation form
     */
    showCabinetCreation() {
        this._setCabinetFormHeader("Create Cabinet");
        this._showSection('.cabinet_creation');
        
        this.createCabinetBtn.classList.remove('hidden');
        this.updateCabinetBtn.classList.add('hidden');

        // Suggest unique cabinet name
        this.cabinetNameInput.value = this._suggestCabinetName();
    }

    /**
     * Update cabinet dropdown options
     */
    updateCabinetDropdown() {
        const cabinetSelect = document.getElementById('panel_cabinet_select');
        if (!cabinetSelect) return;
        
        cabinetSelect.innerHTML = '';
        
        // Add existing cabinets
        const cabinets = this.cabinetManager.getAllCabinets();
        cabinets.forEach(cabinet => {
            const option = document.createElement('option');
            option.value = cabinet.id;
            option.textContent = cabinet.name;
            cabinetSelect.appendChild(option);
        });
        
        // Add "create new" option
        const newOption = document.createElement('option');
        newOption.value = 'new';
        newOption.textContent = '+ Create New Cabinet';
        cabinetSelect.appendChild(newOption);
    }

    // ==================== POP UP'S MANAGEMENT ===================
    /**
     * Show new Project window
     */

    showNewProjectForm() {
        // Remove if already exists
        const oldForm = document.getElementById("new-project-form");
        if (oldForm) oldForm.remove();

        // Overlay
        const overlay = document.createElement("div");
        overlay.id = "new-project-form";
        overlay.className = "project-form-overlay";

        // Form container
        const form = document.createElement("div");
        form.className = "project-form";

        // Title
        const title = document.createElement("h2");
        title.textContent = "Create New Project";

        // Project name input
        const projectInput = document.createElement("input");
        projectInput.type = "text";
        projectInput.placeholder = "Enter project name...";
        projectInput.id = "project-name-input";

        // Floor list container
        const floorList = document.createElement("div");
        floorList.className = "floor-list";

        // Add floor function
        let floorCount = 0;
        const addFloor = (name = null) => {
            floorCount++;
            const floorDiv = document.createElement("div");
            floorDiv.className = "floor-item";
            
            const floorInput = document.createElement("input");
            floorInput.type = "text";
            floorInput.className = "floor-input";

            if (name) {
                floorInput.value = name;
            } else {
                if (floorCount === 1) {
                    floorInput.value = "Ground Floor";
                } else {
                    floorInput.value = `${floorCount - 1} Floor`;
                }
            }

            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-floor-btn";
            deleteBtn.innerHTML = "&times;"; // × symbol
            deleteBtn.title = "Remove floor";
            
            deleteBtn.onclick = () => {
                if (floorList.children.length > 1) {
                    floorDiv.remove();
                    updateFloorNumbers();
                } else {
                    alert("At least one floor is required.");
                }
            };

            floorDiv.appendChild(floorInput);
            floorDiv.appendChild(deleteBtn);
            floorList.appendChild(floorDiv);
        };

        // Update floor numbers after deletion
        const updateFloorNumbers = () => {
            const floors = floorList.querySelectorAll('.floor-item');
            floors.forEach((floorDiv, index) => {
                const input = floorDiv.querySelector('.floor-input');
                if (index === 0) {
                    input.value = "Ground Floor";
                } else {
                    input.value = `${index} Floor`;
                }
            });
            floorCount = floors.length;
        };

        // Add floor button
        const addFloorBtn = document.createElement("button");
        addFloorBtn.textContent = "+ Add Floor";
        addFloorBtn.className = "add-floor-btn";
        addFloorBtn.onclick = () => addFloor();

        // Button container
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "form-buttons";

        // Cancel button
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "cancel-btn";
        cancelBtn.onclick = () => overlay.remove();

        // Create project button
        const createBtn = document.createElement("button");
        createBtn.textContent = "Create Project";
        createBtn.className = "create-project-btn";
        createBtn.onclick = () => {
            const projectName = projectInput.value.trim();
            if (!projectName) {
                alert("Please enter a project name");
                return;
            }

            const floors = [];
            const floorInputs = floorList.querySelectorAll('.floor-input');
            floorInputs.forEach(input => {
                const floorName = input.value.trim();
                if (floorName) {
                    floors.push(floorName);
                }
            });

            if (floors.length === 0) {
                alert("Please add at least one floor");
                return;
            }
            //console.log(projectName, floors)

            this.projectManager.createProject(projectName, floors);
            
            // Close the form
            overlay.remove();
        };

        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(createBtn);

        // Append everything
        form.appendChild(title);
        form.appendChild(projectInput);
        form.appendChild(floorList);
        form.appendChild(addFloorBtn);
        form.appendChild(buttonContainer);
        overlay.appendChild(form);
        document.body.appendChild(overlay);

        // Add initial floor
        addFloor("Ground Floor");

        projectInput.focus();

        // Close overlay when clicking outside
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        };
    }


    // ==================== CABINET MANAGEMENT ====================

    /**
     * Select cabinet and show its details
     */
    selectCabinetUI(cabId) {
        this.activeCabinet = cabId;
        this.updateActiveCabinetLabel();
        
        this._showCabinetDetails();
        this._populateCabinetForm(cabId);

        //
        const cabPanels = this.cabinetManager?.getCabinetPanels?.(cabId);
        const panel = cabPanels[0]
        //console.log(cabPanels);
        if (cabPanels.length != 0) {
            //console.log('not empty')
            this.panelManager.selectCabinet(panel.id, false);
        } //else { console.log('empty')}

        this.updateCabinetBtn.onclick = () => this.updateCabinet();
    }
    /**
     * simple helper for slectCabinetUI 
     */
    selectCabinetUIPanel(panelId) {
        const cabId = this.cabinetManager.findPanelCabinet(panelId);
        this.selectCabinetUI(cabId);
    }

    /**
     * Update cabinet name from form
     */
    updateCabinet() {
        const newName = this.cabinetNameInput?.value;
        if (!newName || !this.activeCabinet ) {
            return;
        }

        const success = this.cabinetManager.renameCabinet(this.activeCabinet, newName);
        
        if (success) {
            this._updateCabinetUI(this.activeCabinet, newName);
            this.updateActiveCabinetLabel();
        }
    }

    /**
     * Create new cabinet from form
     */
    createCabinetFromForm() {
        const name = this.cabinetNameInput?.value || this._suggestCabinetName();
        const cabData = this.cabinetManager.createCabinet(name);
        this.activeCabinet = cabData.id;
    }

    /**
     * Suggest unique cabinet name
     */
    _suggestCabinetName() {
        const base = "Cabinet";
        let i = 1;
        while (this.cabinetManager.getCabinetByName(`${base} ${i}`)) i++;
        return `${base} ${i}`;
    }

    /**
     * Update active cabinet label
     */
    updateActiveCabinetLabel() {
        const label = document.getElementById('active_cabinet_label');
        if (label) {
            const cabinet = this.cabinetManager.getCabinet(this.activeCabinet);
            label.textContent = cabinet ? cabinet.name : "None";
        }
    }

    // ==================== PANEL MANAGEMENT ====================

    /**
     * Create new panel from form data
     */
    createPanel() {
        const cabinetSelect = document.getElementById('panel_cabinet_select');
        let cabId = cabinetSelect?.value;
        
        // Handle "create new cabinet" option
        if (cabId === 'new') {
            const cabName = this._suggestCabinetName();
            const cabData = this.cabinetManager.createCabinet(cabName);
            cabId = cabData.id;
            this.activeCabinet = cabData.id;
            this.objectAppend('cabinet', cabData.name, null, cabData.id); 
            this.updateCabinetDropdown();
        } //else {
            //this.cabinetManager.getCabinet(cabId)
            //console.log(cabId);
        //}

        // Get form values
        const formData = this._getPanelFormData();
        
        // Create panel
        const result = this.cabinetManager.addPanelToCabinet(
            cabId, 
            formData.length, 
            formData.width, 
            formData.thickness, 
            formData.position, 
            formData.rotation, 
            formData.name
        );

        // Switch to update mode
        const panelData = {
            id: result.id,
            name: formData.name,
            length: formData.length,
            width: formData.width,
            thickness: formData.thickness,
            position: formData.position,
            rotation: formData.rotation
        };

        this.updatePanelForm(panelData, result.id);
    }

    /**
     * Update existing panel
     */
    updatePanel(panelId) {
        const formData = this._getPanelFormData();
        
        this.panelManager.updatePanel(
            formData.length, 
            formData.width, 
            formData.thickness, 
            formData.position, 
            formData.rotation, 
            formData.name, 
            panelId
        );

        // Refresh form with updated data
        const data = this.panelManager.getPanelById(panelId);
        this.updatePanelForm(data, panelId);

        // Update left nav button text
        const btnName = document.getElementById(`${panelId}`);
        if (btnName) btnName.textContent = formData.name;
    }

    /**
     * Show panel update form with data
     */
    updatePanelForm(data, panelId) {
        this._setPanelFormHeader("Update Panel");
        this._showSection('.panel_creation');
        
        // Hide dropdown, show cabinet name
        document.querySelector('.panelCabinetSelect')?.classList.add('hidden');
        const selectedPanelCabinet = document.querySelector('.panleFormSelectedCabinet');
        selectedPanelCabinet?.classList.remove('hidden');
        
        // Find and display cabinet name
        const cabId = this.cabinetManager.findPanelCabinet(panelId);
        const cabinet = this.cabinetManager.getCabinet(cabId);
        if (selectedPanelCabinet && cabinet) {
            selectedPanelCabinet.textContent = `Cabinet: ${cabinet.name}`;
        }
        
        this.addPanelBtn.classList.add('hidden');
        this.updatePanelBtn.classList.remove('hidden');

        // Populate form fields
        this._populatePanelForm(data);
        this.updatePanelBtn.onclick = () => this.updatePanel(panelId);
    }

    /**
     * Add panel to left navigation
     */
    objectAppend(type, name, idOrKey, cabId) {
        if (type === 'cabinet') {
            const list = this.leftNav.querySelector('.cabinet-list');
        
            // Prevent duplicates
            if (document.getElementById(cabId)) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'cabinet';
            wrapper.id = cabId;

            // Create cabinet header with button and dropdown toggle
            const header = this._createCabinetHeader(name, wrapper, cabId);
            const panelsContainer = this._createPanelsContainer(cabId);

            wrapper.appendChild(header);
            wrapper.appendChild(panelsContainer);
            list.appendChild(wrapper);
        }

        if (type === 'panel') {
            const wrap = document.getElementById(cabId);
            const list = wrap?.querySelector('.cabinet-panels');
            if (!list) return;

            const addPanelContainer = list.querySelector('.add-panel-container');
            
            const btn = document.createElement('button');
            btn.id = `${idOrKey}`;
            btn.textContent = name;
            btn.classList.add('objectBtns', 'panelBtn');

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const pid = idOrKey;
                const data = this.panelManager.getPanelById(pid);
                if (data) this.updatePanelForm(data, pid);
                this.panelManager.selectPanelSingle(pid);
            });

            list.insertBefore(btn, addPanelContainer);
        }
    }

    /**
     * Add Projects and Floors to bottom navigation
     */

    bottomNavAppend(type, name, id) {
        if (type === 'project') {
            const btn = document.createElement('button');
            btn.id = `${id}`;
            btn.textContent = name;
            btn.classList.add('bottomNavBtn');

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                //console.log(btn.id);
            });

            const projectNav = document.querySelector('.projectsNav');
            projectNav.appendChild(btn);
        }

        if (type === 'floor') {
            const btn = document.createElement('button');
            btn.id = `${id}`;
            btn.textContent = name;
            btn.classList.add('bottomNavBtn');

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                //console.log(btn.id);
            });

            const projectNav = document.querySelector('.floorsNav');
            projectNav.appendChild(btn);
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Show specified section, hide others
     */
    _showSection(selector) {
        document.querySelector('.sec_default')?.classList.add('hidden');
        document.querySelector('.cabinet_creation')?.classList.add('hidden');
        document.querySelector('.panel_creation')?.classList.add('hidden');
        document.querySelector('.templateSection')?.classList.add('hidden');
        document.querySelector(selector)?.classList.remove('hidden');
    }

    /**
     * Set panel form header text
     */
    _setPanelFormHeader(text) {
        const header = document.getElementById('panelManagerHeader');
        header.textContent = text;
    }

    /**
     * Set cabinet form header text
     */
    _setCabinetFormHeader(text) {
        const header = document.getElementById('cabinetManagerHeader');
        header.textContent = text;
    }

    /**
     * Set active cabinet in dropdown
     */
    _setActiveCabinetInDropdown() {
        if (this.activeCabinet) {
            const cabinetSelect = document.getElementById('panel_cabinet_select');
            if (cabinetSelect) {
                cabinetSelect.value = this.activeCabinet;
            }
        }
    }

    /**
     * Reset panel form to default values
     */
    _resetPanelFormDefaults() {
        const length = document.getElementById('panel_lenght');
        const width = document.getElementById('panel_width');
        const thickness = document.getElementById('panel_thickness');
        const x = document.getElementById('panel_x');
        const y = document.getElementById('panel_y');
        const z = document.getElementById('panel_z');
        const rx = document.getElementById('panel_rot_x');
        const ry = document.getElementById('panel_rot_y');
        const rz = document.getElementById('panel_rot_z');
        const panelName = document.getElementById('panel_name');

        // Set default values
        length.value = 800; width.value = 500; thickness.value = 20;
        x.value = 0; y.value = 0; z.value = 0;
        rx.value = 0; ry.value = 0; rz.value = 0;
        panelName.value = `Panel ${this.panelManager.getNumberOfPanels() + 1}`;
    }

    /**
     * Get panel form data
     */
    _getPanelFormData() {
        return {
            length: parseFloat(document.getElementById('panel_lenght')?.value) || 800,
            width: parseFloat(document.getElementById('panel_width')?.value) || 500,
            thickness: parseFloat(document.getElementById('panel_thickness')?.value) || 20,
            position: {
                x: parseFloat(document.getElementById('panel_x')?.value) || 0,
                y: parseFloat(document.getElementById('panel_y')?.value) || 0,
                z: parseFloat(document.getElementById('panel_z')?.value) || 0
            },
            rotation: {
                rx: parseFloat(document.getElementById('panel_rot_x')?.value) || 0,
                ry: parseFloat(document.getElementById('panel_rot_y')?.value) || 0,
                rz: parseFloat(document.getElementById('panel_rot_z')?.value) || 0
            },
            name: document.getElementById('panel_name')?.value || ""
        };
    }

    /**
     * Populate panel form with data
     */
    _populatePanelForm(data) {
        document.getElementById('panel_lenght').value = data.length;
        document.getElementById('panel_width').value = data.width;
        document.getElementById('panel_thickness').value = data.thickness;
        document.getElementById('panel_x').value = data.position.x;
        document.getElementById('panel_y').value = data.position.y;
        document.getElementById('panel_z').value = data.position.z;
        document.getElementById('panel_rot_x').value = data.rotation.rx;
        document.getElementById('panel_rot_y').value = data.rotation.ry;
        document.getElementById('panel_rot_z').value = data.rotation.rz;
        document.getElementById('panel_name').value = data.name;
    }

    /**
     * Show cabinet details section
     */
    _showCabinetDetails() {
        this._showSection('.cabinet_creation');
        this.createCabinetBtn.classList.add('hidden');
        this.updateCabinetBtn.classList.remove('hidden');
        this._setCabinetFormHeader("Update Cabinet");
    }

    /**
     * Populate cabinet form with name
     */
    _populateCabinetForm(cabId) {
        const cabinet = this.cabinetManager.getCabinet(cabId);
        if (this.cabinetNameInput && cabinet) {
            this.cabinetNameInput.value = cabinet.name;
        }
    }

    /**
     * Update cabinet UI after rename
     */
    _updateCabinetUI(cabId, newName) {
        const el = document.getElementById(cabId);
        if (el) {
            const btn = el.querySelector('.cabinetBtn');
            if (btn) btn.textContent = newName;
        }
    }

    // =================== LOAD CABINET TEMPLATES FROM JSON FILES ====================
    /**
     * loads the templates to the templates section 
     */
    listJsonFiles() {
        this._showSection('.templateSection');
        const templateSection = document.querySelector('.templates-grid');
        
        // Clear previous templates
        templateSection.innerHTML = '';
        
        fetch('../php/listJson.php')
            .then(r => r.json())
            .then(j => {
                // Handle error response
                if (j.error) {
                    console.error('Error listing templates:', j.error);
                    templateSection.innerHTML = '<p>Error loading templates</p>';
                    return;
                }
                
                // if PHP returns { files: [...] }
                const files = j.files || j;

                // if it's still not an array, convert object keys into an array
                const fileList = Array.isArray(files) ? files : Object.keys(files);

                fileList.forEach(name => {
                    // Remove .json extension for display
                    const displayName = name.replace('.json', '');
                    
                    const btn = document.createElement('button');
                    btn.textContent = displayName;
                    btn.className = 'template-btn';
                    btn.onclick = () => this.loadTemplate(name);
                    templateSection.appendChild(btn);
                });
                
                if (fileList.length === 0) {
                    templateSection.innerHTML = '<p>No templates found</p>';
                }
            })
            .catch(e => {
                console.error('listJson error', e);
                templateSection.innerHTML = '<p>Error loading templates</p>';
            });
    }

    /**
     * Load template from JSON file
     */
    async loadTemplate(templateName) {
        try {
            const response = await fetch(`../php/getJson.php?file=${encodeURIComponent(templateName)}`);
            const templateData = await response.json();

            if (!templateData.cabinets) {
                console.error('Invalid template format: missing cabinets array');
                return;
            }

            // Add cabinets and panels from template without clearing
            const newCabs = await this.cabinetManager.loadFromJson(templateData);

            this.defaultSection();
        } catch (err) {
            console.error('Error loading template:', err);
        }
    }

    // ================================= RIGHT CLICK CONTEXT METHODS =======================
    /**
     * Show context menu based on selection type
     */
    showContextMenu(event, type, cabId, panelId = null) {
        // Create or get context menu element
        let contextMenu = document.getElementById('context-menu');
        if (!contextMenu) {
            contextMenu = document.createElement('div');
            contextMenu.id = 'context-menu';
            contextMenu.className = 'context-menu';
            document.body.appendChild(contextMenu);
            
            // Add event listener to hide menu when clicking elsewhere
            document.addEventListener('click', (e) => {
                if (!contextMenu.contains(e.target)) {
                    this.hideContextMenu();
                }
            });
        }
        
        // Populate menu based on type
        contextMenu.innerHTML = '';
        
        if (type === 'cabinet') {
            this._populateCabinetContextMenu(contextMenu, cabId, panelId);
        } else if (type === 'panel') {
            this._populatePanelContextMenu(contextMenu, cabId, panelId);
        }
        
        // Position the menu
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
        contextMenu.classList.add('visible');
        
        // Store current context for menu actions
        this._currentContext = { type, cabId, panelId };
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu) {
            contextMenu.classList.remove('visible');
        }
        this._currentContext = null;
    }

    /**
     * Populate cabinet context menu
     */
    _populateCabinetContextMenu(menu, cabId, panelId) {
        const options = [
            { text: 'Move Cabinet', action: () => this.moveCabinet(cabId) },
            { text: 'Copy Cabinet', action: () => this.copyCabinet(cabId) },
            { text: 'Mirror Cabinet', action: () => this.mirrorCabinet(cabId) },
            { text: 'Edit Cabinet', action: () => this.selectCabinetUI(cabId) },
            { text: 'Properties', action: () => this.showCabinetProperties(cabId) },
            { text: 'Delete', action: () => this.deleteCabinet(cabId), className: 'danger' }
        ];
        
        this._createMenuItems(menu, options);
    }

    /**
     * Populate panel context menu
     */
    _populatePanelContextMenu(menu, cabId, panelId) {
        const options = [
            { text: 'Edit Panel', action: () => {
                const data = this.panelManager.getPanelById(panelId);
                this.updatePanelForm(data, panelId);
            }},
            { text: 'Copy Panel', action: () => this.copyPanel(panelId) },
            { text: 'Mirror Panel', action: () => this.mirrorPanel(panelId) },
            { text: 'Move to Cabinet', action: () => this.showMovePanelDialog(panelId) },
            { text: 'Properties', action: () => this.showPanelProperties(panelId) },
            { text: 'Delete', action: () => this.deletePanel(panelId), className: 'danger' }
        ];
        
        this._createMenuItems(menu, options);
    }

    /**
     * Create menu items from options
     */
    _createMenuItems(menu, options) {
        options.forEach(option => {
            const item = document.createElement('button');
            item.textContent = option.text;
            item.className = 'context-menu-item';
            if (option.className) {
                item.classList.add(option.className);
            }
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                option.action();
                this.hideContextMenu();
            });
            menu.appendChild(item);
        });
    }

    /**
     * Handle right-click on left navigation items
     */
    _handleLeftNavRightClick(event) {
        // Find the clicked element
        let target = event.target;
        
        // Check if it's a cabinet button
        if (target.classList.contains('cabinetBtn')) {
            const cabId = target.id;
            const cabinet = this.cabinetManager.getCabinet(cabId);
            //console.log('UI panel cabsel cabId:', cabId);
            if (cabinet) {
                this.selectCabinetUI(cabId);
                this.showContextMenu(event, 'cabinet', cabId);
            }
        }
        // Check if it's a panel button
        else if (target.classList.contains('panelBtn')) {
            const panelId = target.id;
            const cabId = this.cabinetManager.findPanelCabinet(panelId);
            //console.log('UI panel Id:', panelId);
            //console.log('UI panel cabId:', cabId);
            this.panelManager.selectPanelSingle(panelId);
            this.showContextMenu(event, 'panel', cabId, panelId);
        }
    }

    /**
     * Create menu items from options
     */
    moveCabinet(cabId) {
        console.log('Move cabinet:', cabId);
        // TODO: Implement cabinet movement
    }
    /**
     * Create menu items from options
     */
    copyCabinet(cabId) {
        console.log('Copy cabinet:', cabId);
        // TODO: Implement cabinet copying
    }
    /**
     * Create menu items from options
     */
    mirrorCabinet(cabId) {
        console.log('Mirror cabinet:', cabId);
        // TODO: Implement cabinet mirroring
    }
    /**
     * Create menu items from options
     */
    showCabinetProperties(cabId) {
        console.log('Cabinet properties:', cabId);
        // TODO: Implement cabinet properties dialog
    }
    /**
     * Create menu items from options
     */
    deleteCabinet(cabId) {
        const cabinet = this.cabinetManager.getCabinet(cabId);
        if (confirm(`Are you sure you want to delete cabinet?`)) {
            this.cabinetManager.removeCabinet(cabId);
            // Remove from UI
            const cabinetEl = document.getElementById(cabId);
            if (cabinetEl) {
                cabinetEl.remove();
            }
            this.activeCabinet = null;
            this.updateActiveCabinetLabel();
        }
    }
    /**
     * Create menu items from options
     */
    copyPanel(panelId) {
        console.log('Copy panel:', panelId);
        // TODO: Implement panel copying
    }
    /**
     * Create menu items from options
     */
    mirrorPanel(panelId) {
        console.log('Mirror panel:', panelId);
        // TODO: Implement panel mirroring
    }
    /**
     * Create menu items from options
     */
    showMovePanelDialog(panelId) {
        console.log('Move panel to cabinet:', panelId);
        // TODO: Implement panel movement between cabinets
    }
    /**
     * Create menu items from options
     */  
    showPanelProperties(panelId) {
        console.log('Panel properties:', panelId);
        // TODO: Implement panel properties dialog
    }
    /**
     * Create menu items from options
     */
    deletePanel(panelId) {
        if (confirm('Are you sure you want to delete this panel?')) {
            // Find which cabinet this panel belongs to
            const cabId = this.cabinetManager.findPanelCabinet(panelId);
            
            // Remove panel from cabinet
            this.cabinetManager.removePanelFromCabinet(cabId, panelId);
            //console.log(cabId, panelId);
            
            // Remove panel button from UI
            const panelBtn = document.getElementById(panelId.toString());
            if (panelBtn) {
                panelBtn.remove();
            }
            
            // Deselect panel
            this.panelManager.deselectAll();
        }
    }

    // ==================== FUTURE EXTENSIONS ====================

    /**
     * TODO: Implement template management system
     */
    // _setupTemplates() { }

    /**
     * TODO: Implement project save/load functionality
     */
    // _setupProjectManagement() { }

    /**
     * TODO: Implement sketch/drawing tools
     */
    // _setupSketchTools() { }

    /**
     * TODO: Implement undo/redo functionality
     */
    // _setupHistoryManagement() { }

    /**
     * TODO: Implement export functionality (PDF, OBJ, etc.)
     */
    // _setupExportFunctionality() { }

}