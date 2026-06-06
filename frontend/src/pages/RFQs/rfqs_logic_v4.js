document.addEventListener('DOMContentLoaded', () => {
  // Sidebar logic (can be shared or abstracted later)
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapseBtn');
  const logoText = document.getElementById('logoText');
  const supportBox = document.getElementById('supportBox');
  const menuToggle = document.getElementById('menuToggle');

  let isCollapsed = false;

  const toggleSidebar = () => {
    isCollapsed = !isCollapsed;
    
    if (isCollapsed) {
      sidebar.classList.remove('w-64');
      sidebar.classList.add('w-20');
      
      logoText.classList.add('hidden');
      supportBox.classList.add('hidden');
      
      document.querySelectorAll('.sidebar-label').forEach(label => {
        label.classList.add('hidden');
      });
      
      collapseBtn.innerHTML = '<i data-lucide="chevrons-right" class="w-5 h-5 shrink-0"></i>';
    } else {
      sidebar.classList.remove('w-20');
      sidebar.classList.add('w-64');
      
      setTimeout(() => {
        logoText.classList.remove('hidden');
        supportBox.classList.remove('hidden');
        document.querySelectorAll('.sidebar-label').forEach(label => {
          label.classList.remove('hidden');
        });
      }, 150);
      
      collapseBtn.innerHTML = `
        <i data-lucide="chevrons-left" class="w-5 h-5 shrink-0"></i>
        <span class="sidebar-label">Collapse</span>
      `;
    }
    lucide.createIcons();
  };

  if (collapseBtn) {
    collapseBtn.addEventListener('click', toggleSidebar);
  }

  // Mobile menu toggle
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
      sidebar.classList.toggle('absolute');
      sidebar.classList.toggle('z-50');
    });
  }

  // --- RFQ Creation Logic ---
  
  // State
  let lineItems = [];
  let assignedVendors = [];
  let allVendors = []; // Fetched from Supabase

  // Elements
  const rfqItemsTbody = document.getElementById('rfqItemsTbody');
  const addLineItemBtn = document.getElementById('addLineItemBtn');
  const rfqVendorsList = document.getElementById('rfqVendorsList');
  const addVendorBtn = document.getElementById('addVendorBtn');
  
  const vendorSelectionModal = document.getElementById('vendorSelectionModal');
  const vendorModalBackdrop = document.getElementById('vendorModalBackdrop');
  const closeVendorModalBtn = document.getElementById('closeVendorModalBtn');
  const liveVendorsList = document.getElementById('liveVendorsList');
  const vendorSearchInput = document.getElementById('vendorSearchInput');

  const saveRfqBtn = document.getElementById('saveRfqBtn');

  // --- Wizard Navigation Logic ---
  let currentStep = 1;
  const btnNext1 = document.getElementById('btnNext1');
  const btnNext2 = document.getElementById('btnNext2');
  const btnBack2 = document.getElementById('btnBack2');
  const btnBack3 = document.getElementById('btnBack3');

  const stepContainers = [
    document.getElementById('step1Container'),
    document.getElementById('step2Container'),
    document.getElementById('step3Container')
  ];
  const stepCircles = [
    document.getElementById('stepCircle1'),
    document.getElementById('stepCircle2'),
    document.getElementById('stepCircle3')
  ];
  const stepTexts = [
    document.getElementById('stepText1'),
    document.getElementById('stepText2'),
    document.getElementById('stepText3')
  ];

  const updateStepUI = () => {
    stepContainers.forEach((container, idx) => {
      if (idx + 1 === currentStep) {
        container.classList.remove('hidden');
        container.classList.add('block');
      } else {
        container.classList.add('hidden');
        container.classList.remove('block');
      }
    });

    stepCircles.forEach((circle, idx) => {
      if (idx + 1 === currentStep) {
        circle.className = 'w-10 h-10 rounded-full bg-vb-blue text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white transition-colors';
        circle.innerHTML = (idx + 1).toString();
        stepTexts[idx].className = 'text-xs font-semibold text-slate-800';
      } else if (idx + 1 < currentStep) {
        circle.className = 'w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white transition-colors';
        circle.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i>';
        stepTexts[idx].className = 'text-xs font-semibold text-slate-800';
      } else {
        circle.className = 'w-10 h-10 rounded-full bg-white text-slate-400 border border-slate-300 flex items-center justify-center font-bold text-sm ring-4 ring-white transition-colors';
        circle.innerHTML = (idx + 1).toString();
        stepTexts[idx].className = 'text-xs font-semibold text-slate-400';
      }
    });
    lucide.createIcons();
  };

  if (btnNext1) {
    btnNext1.addEventListener('click', () => {
      const title = document.getElementById('rfqTitle').value.trim();
      const deadline = document.getElementById('rfqDeadline').value;
      if (!title || !deadline) {
        alert("Please fill in the required fields: Title and Deadline.");
        return;
      }
      currentStep = 2;
      updateStepUI();
    });
  }

  if (btnNext2) {
    btnNext2.addEventListener('click', () => {
      if (lineItems.length === 0) {
        alert("Please add at least one line item.");
        return;
      }
      if (assignedVendors.length === 0) {
        alert("Please assign at least one vendor.");
        return;
      }
      
      // Populate review section
      document.getElementById('reviewTitle').textContent = document.getElementById('rfqTitle').value.trim();
      document.getElementById('reviewDescription').textContent = document.getElementById('rfqDescription').value.trim() || 'No description provided.';
      document.getElementById('reviewCategory').textContent = document.getElementById('rfqCategory').value;
      document.getElementById('reviewDeadline').textContent = document.getElementById('rfqDeadline').value;
      document.getElementById('reviewItemCount').textContent = lineItems.length;
      document.getElementById('reviewVendorCount').textContent = assignedVendors.length;

      currentStep = 3;
      updateStepUI();
    });
  }

  if (btnBack2) btnBack2.addEventListener('click', () => { currentStep = 1; updateStepUI(); });
  if (btnBack3) btnBack3.addEventListener('click', () => { currentStep = 2; updateStepUI(); });

  updateStepUI();

  // --- 1. Line Items Management ---
  const renderLineItems = () => {
    rfqItemsTbody.innerHTML = '';
    if (lineItems.length === 0) {
      rfqItemsTbody.innerHTML = `
        <tr><td colspan="4" class="py-4 text-center text-xs text-slate-500 italic">No line items added yet.</td></tr>
      `;
      return;
    }
    lineItems.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';
      tr.innerHTML = `
        <td class="py-2 px-4">
          <input type="text" class="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-vb-blue outline-none text-xs py-1" value="${item.name}" data-index="${index}" data-field="name" placeholder="Item name">
        </td>
        <td class="py-2 px-4">
          <input type="number" class="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-vb-blue outline-none text-xs text-center py-1" value="${item.qty}" data-index="${index}" data-field="qty" placeholder="Qty">
        </td>
        <td class="py-2 px-4">
          <input type="text" class="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-vb-blue outline-none text-xs text-center py-1" value="${item.unit}" data-index="${index}" data-field="unit" placeholder="Unit">
        </td>
        <td class="py-2 px-4 text-center">
          <button class="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-slate-100 remove-item-btn" data-index="${index}">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      `;
      rfqItemsTbody.appendChild(tr);
    });
    
    // Attach event listeners to new inputs
    document.querySelectorAll('#rfqItemsTbody input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = e.target.getAttribute('data-index');
        const field = e.target.getAttribute('data-field');
        lineItems[idx][field] = e.target.value;
      });
    });
    
    // Attach event listeners to remove buttons
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.getAttribute('data-index');
        lineItems.splice(idx, 1);
        renderLineItems();
        lucide.createIcons();
      });
    });
  };

  if (addLineItemBtn) {
    addLineItemBtn.addEventListener('click', () => {
      lineItems.push({ name: '', qty: '', unit: 'NOS' });
      renderLineItems();
      lucide.createIcons();
    });
  }

  // Initial render of line items
  renderLineItems();


  // --- 2. Vendor Assignment Management ---
  const renderAssignedVendors = () => {
    rfqVendorsList.innerHTML = '';
    if (assignedVendors.length === 0) {
      rfqVendorsList.innerHTML = `
        <li class="py-3 px-4 text-slate-400 text-xs italic text-center" id="emptyVendorsMessage">No vendors assigned yet.</li>
      `;
      return;
    }
    
    assignedVendors.forEach((vendor, index) => {
      const li = document.createElement('li');
      li.className = 'py-3 px-4 flex items-center justify-between hover:bg-slate-50 transition-colors';
      li.innerHTML = `
        <span>${vendor.name} <span class="text-[10px] text-slate-400 ml-2">(${vendor.category})</span></span>
        <button class="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-slate-100 remove-vendor-btn" data-index="${index}">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      `;
      rfqVendorsList.appendChild(li);
    });
    
    document.querySelectorAll('.remove-vendor-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.getAttribute('data-index');
        assignedVendors.splice(idx, 1);
        renderAssignedVendors();
        lucide.createIcons();
      });
    });
  };

  const openVendorModal = async () => {
    vendorSelectionModal.classList.remove('hidden');
    liveVendorsList.innerHTML = '<li class="py-4 text-center text-sm text-slate-500">Loading vendors...</li>';
    vendorSearchInput.value = '';
    
    try {
      const { data, error } = await window.supabaseClient.from('vendors').select('*').order('name');
      if (error) throw error;
      allVendors = data;
      renderLiveVendorsList(allVendors);
    } catch (err) {
      console.error(err);
      liveVendorsList.innerHTML = '<li class="py-4 text-center text-sm text-red-500">Failed to load vendors.</li>';
    }
  };

  const closeVendorModal = () => {
    vendorSelectionModal.classList.add('hidden');
  };

  const renderLiveVendorsList = (vendorsToRender) => {
    liveVendorsList.innerHTML = '';
    if (vendorsToRender.length === 0) {
      liveVendorsList.innerHTML = '<li class="py-4 text-center text-sm text-slate-500">No vendors found.</li>';
      return;
    }
    
    vendorsToRender.forEach(v => {
      const currentAssignedList = isEditingVendorSelection ? editAssignedVendors : assignedVendors;
      const isAssigned = currentAssignedList.some(av => av.id === v.id);
      
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors mb-2';
      li.innerHTML = `
        <div>
          <p class="text-sm font-semibold text-slate-800">${v.name}</p>
          <p class="text-xs text-slate-500">${v.category} • ${v.status}</p>
        </div>
        <button class="select-vendor-btn px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${isAssigned ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-vb-blue hover:bg-blue-100'}" data-id="${v.id}" ${isAssigned ? 'disabled' : ''}>
          ${isAssigned ? 'Added' : 'Add'}
        </button>
      `;
      liveVendorsList.appendChild(li);
    });
    
    document.querySelectorAll('.select-vendor-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const vendor = allVendors.find(v => v.id === id);
        if (vendor) {
          if (isEditingVendorSelection) {
            editAssignedVendors.push(vendor);
            renderEditAssignedVendors();
            checkEditChanges();
          } else {
            assignedVendors.push(vendor);
            renderAssignedVendors();
          }
          lucide.createIcons();
          closeVendorModal();
        }
      });
    });
  };

  if (addVendorBtn) addVendorBtn.addEventListener('click', () => { isEditingVendorSelection = false; openVendorModal(); });
  if (closeVendorModalBtn) closeVendorModalBtn.addEventListener('click', closeVendorModal);
  if (vendorModalBackdrop) vendorModalBackdrop.addEventListener('click', closeVendorModal);
  
  if (vendorSearchInput) {
    vendorSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = allVendors.filter(v => v.name.toLowerCase().includes(query) || v.category.toLowerCase().includes(query));
      renderLiveVendorsList(filtered);
    });
  }


  // --- 3. Save RFQ Flow ---
  if (saveRfqBtn) {
    saveRfqBtn.addEventListener('click', async () => {
      const title = document.getElementById('rfqTitle').value.trim();
      const category = document.getElementById('rfqCategory').value;
      const deadline = document.getElementById('rfqDeadline').value;
      const description = document.getElementById('rfqDescription').value.trim();
      
      if (!title || !deadline) {
        alert("Please fill in the required fields: Title and Deadline.");
        return;
      }
      if (lineItems.length === 0) {
        alert("Please add at least one line item.");
        return;
      }
      
      const originalBtnText = saveRfqBtn.innerHTML;
      saveRfqBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline-block align-text-bottom mr-1"></i> Saving...';
      saveRfqBtn.disabled = true;
      
      try {
        // Generate short code
        const rfq_code = 'RFQ-' + Math.random().toString(36).substring(2, 6).toUpperCase();

        // 1. Insert RFQ header
        const { data: rfqData, error: rfqError } = await window.supabaseClient
          .from('rfqs')
          .insert([{ title, category, deadline, description, rfq_code, status: 'Issued' }])
          .select();
          
        if (rfqError) throw rfqError;
        const newRfqId = rfqData[0].id;
        
        // 2. Insert Line Items
        const itemsToInsert = lineItems.map(item => ({
          rfq_id: newRfqId,
          item_name: item.name,
          quantity: parseInt(item.qty) || 0,
          unit: item.unit
        }));
        const { error: itemsError } = await window.supabaseClient.from('rfq_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
        
        // 3. Insert Vendors
        if (assignedVendors.length > 0) {
          const vendorsToInsert = assignedVendors.map(v => ({
            rfq_id: newRfqId,
            vendor_id: v.id
          }));
          const { error: vendorsError } = await window.supabaseClient.from('rfq_vendors').insert(vendorsToInsert);
          if (vendorsError) throw vendorsError;
        }
        
        // Show success overlay
        const rfqSuccessOverlay = document.getElementById('rfqSuccessOverlay');
        const successRfqCode = document.getElementById('successRfqCode');
        const redirectCountdown = document.getElementById('redirectCountdown');
        
        successRfqCode.textContent = rfq_code;
        rfqSuccessOverlay.classList.remove('hidden');

        let countdown = 3;
        redirectCountdown.textContent = countdown;
        
        const interval = setInterval(() => {
          countdown--;
          redirectCountdown.textContent = countdown;
          if (countdown <= 0) {
            clearInterval(interval);
            rfqSuccessOverlay.classList.add('hidden');
            
            // Reset form
            document.getElementById('rfqTitle').value = '';
            document.getElementById('rfqDeadline').value = '';
            document.getElementById('rfqDescription').value = '';
            lineItems = [];
            assignedVendors = [];
            renderLineItems();
            renderAssignedVendors();
            currentStep = 1;
            updateStepUI();
            lucide.createIcons();
            
            // Automatically switch to Manage RFQs view
            if (!isManageMode) {
              toggleMode();
            }
          }
        }, 1000);
      } catch (err) {
        console.error("Error creating RFQ:", err);
        alert("Failed to save RFQ. Error: " + (err.message || JSON.stringify(err)));
      } finally {
        saveRfqBtn.innerHTML = originalBtnText;
        saveRfqBtn.disabled = false;
        lucide.createIcons();
      }
    });
  }

  // --- 4. Manage RFQs Flow ---
  const toggleManageBtn = document.getElementById('toggleManageBtn');
  const createWizardContainer = document.getElementById('createWizardContainer');
  const manageRfqsContainer = document.getElementById('manageRfqsContainer');
  const pageTitleText = document.getElementById('pageTitleText');
  const pageSubtitleText = document.getElementById('pageSubtitleText');
  const manageRfqsTbody = document.getElementById('manageRfqsTbody');
  const manageLoadingState = document.getElementById('manageLoadingState');
  const manageEmptyState = document.getElementById('manageEmptyState');
  
  // Edit Modal Elements
  const editRfqModal = document.getElementById('editRfqModal');
  const editModalBackdrop = document.getElementById('editModalBackdrop');
  const closeEditModalBtn = document.getElementById('closeEditModalBtn');
  const editRfqTitle = document.getElementById('editRfqTitle');
  const editRfqCategory = document.getElementById('editRfqCategory');
  const editRfqDeadline = document.getElementById('editRfqDeadline');
  const editRfqDescription = document.getElementById('editRfqDescription');
  const saveEditRfqBtn = document.getElementById('saveEditRfqBtn');
  
  const editRfqItemsTbody = document.getElementById('editRfqItemsTbody');
  const editAddLineItemBtn = document.getElementById('editAddLineItemBtn');
  const editRfqVendorsList = document.getElementById('editRfqVendorsList');
  const editAddVendorBtn = document.getElementById('editAddVendorBtn');
  const editValidationMessage = document.getElementById('editValidationMessage');
  const reissueRfqBtn = document.getElementById('reissueRfqBtn');
  

  let isManageMode = false;
  let allCreatedRfqs = [];
  let editingRfqId = null;
  let isEditingVendorSelection = false;
  
  let originalEditLineItems = [];
  let editLineItems = [];
  let originalEditVendors = [];
  let editAssignedVendors = [];

  const toggleMode = async () => {
    isManageMode = !isManageMode;
    if (isManageMode) {
      createWizardContainer.classList.add('hidden');
      manageRfqsContainer.classList.remove('hidden');
      toggleManageBtn.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i> Create New RFQ';
      pageTitleText.textContent = "Manage RFQ's";
      pageSubtitleText.textContent = "View and edit your created requests";
      await fetchManageRfqs();
    } else {
      manageRfqsContainer.classList.add('hidden');
      createWizardContainer.classList.remove('hidden');
      toggleManageBtn.innerHTML = '<i data-lucide="list" class="w-4 h-4"></i> Manage RFQs';
      pageTitleText.textContent = "Create RFQ's";
      pageSubtitleText.textContent = "New request for quotation";
    }
    lucide.createIcons();
  };

  if (toggleManageBtn) toggleManageBtn.addEventListener('click', toggleMode);

  const fetchManageRfqs = async () => {
    manageLoadingState.classList.remove('hidden');
    manageEmptyState.classList.add('hidden');
    manageRfqsTbody.innerHTML = '';
    
    try {
      const { data, error } = await window.supabaseClient.from('rfqs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      console.log("Fetched RFQs from DB:", data);
      allCreatedRfqs = data || [];
      manageLoadingState.classList.add('hidden');
      
      if (allCreatedRfqs.length === 0) {
        manageEmptyState.classList.remove('hidden');
        manageEmptyState.innerHTML = `<div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4"><i data-lucide="inbox" class="w-8 h-8"></i></div><p class="text-sm text-slate-500">You haven't created any RFQs yet.</p>`;
      } else {
        renderManageRfqsTable();
      }
    } catch (err) {
      console.error("Fetch Manage RFQs Error:", err);
      manageLoadingState.classList.add('hidden');
      manageEmptyState.classList.remove('hidden');
      manageEmptyState.innerHTML = `<p class="text-red-500 font-bold">Error loading RFQs: ${err.message || JSON.stringify(err)}</p>`;
    }
  };

  const renderManageRfqsTable = () => {
    manageRfqsTbody.innerHTML = '';
    allCreatedRfqs.forEach(rfq => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';
      tr.innerHTML = `
        <td class="py-4 px-5">
          <p class="font-bold text-slate-900">${rfq.title}</p>
          <p class="text-[11px] text-slate-500">${rfq.category}</p>
        </td>
        <td class="py-4 px-5">
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200" id="code-${rfq.id}">${rfq.rfq_code || 'N/A'}</span>
            ${rfq.rfq_code ? `<button class="text-slate-400 hover:text-vb-blue" onclick="copyCode('${rfq.rfq_code}')" title="Copy Code"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button>` : ''}
          </div>
        </td>
        <td class="py-4 px-5 text-center text-sm font-medium text-slate-600">${rfq.deadline}</td>
        <td class="py-4 px-5 text-center">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-md 
            ${rfq.status === 'Issued' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
              rfq.status === 'Canceled' ? 'bg-red-50 text-red-600 border border-red-200' : 
              'bg-slate-100 text-slate-500 border border-slate-200'}">${rfq.status || 'Draft'}</span>
        </td>
        <td class="py-4 px-5 text-right">
          <div class="flex items-center justify-end gap-2">
            <button class="bg-white border border-slate-200 hover:border-vb-blue hover:text-vb-blue text-slate-600 rounded-lg p-1.5 shadow-sm transition-colors" onclick="openEditRfq('${rfq.id}')" title="Edit">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button class="bg-white border border-slate-200 hover:border-red-500 hover:text-red-500 text-slate-600 rounded-lg p-1.5 shadow-sm transition-colors" onclick="deleteRfq('${rfq.id}')" title="Delete">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      `;
      manageRfqsTbody.appendChild(tr);
    });
    lucide.createIcons();
  };

  window.copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert("RFQ Code copied to clipboard: " + code);
  };

  
  // ================= ADVANCED EDIT MODAL LOGIC =================
  const renderEditLineItems = () => {
    editRfqItemsTbody.innerHTML = '';
    if (editLineItems.length === 0) {
      editRfqItemsTbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-slate-500 text-xs">No line items added yet.</td></tr>';
    } else {
      editLineItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="py-2 px-4">
            <input type="text" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-vb-blue rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none transition-all" value="${item.name}" data-index="${index}" data-field="name">
          </td>
          <td class="py-2 px-4">
            <input type="number" min="1" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-vb-blue rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none transition-all text-center" value="${item.qty}" data-index="${index}" data-field="qty">
          </td>
          <td class="py-2 px-4">
            <select class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-vb-blue rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none transition-all appearance-none text-center" data-index="${index}" data-field="unit">
              <option value="pcs" ${item.unit === 'pcs' ? 'selected' : ''}>pcs</option>
              <option value="boxes" ${item.unit === 'boxes' ? 'selected' : ''}>boxes</option>
              <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>kg</option>
              <option value="liters" ${item.unit === 'liters' ? 'selected' : ''}>liters</option>
              <option value="sets" ${item.unit === 'sets' ? 'selected' : ''}>sets</option>
            </select>
          </td>
          <td class="py-2 px-4 text-center">
            <button class="edit-remove-item-btn p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" data-index="${index}">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        `;
        editRfqItemsTbody.appendChild(tr);
      });
      lucide.createIcons();
    }

    // Attach listeners for line item updates
    document.querySelectorAll('#editRfqItemsTbody input, #editRfqItemsTbody select').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = e.target.getAttribute('data-index');
        const field = e.target.getAttribute('data-field');
        editLineItems[idx][field] = e.target.value;
        checkEditChanges();
      });
      input.addEventListener('keyup', (e) => {
        const idx = e.target.getAttribute('data-index');
        const field = e.target.getAttribute('data-field');
        editLineItems[idx][field] = e.target.value;
        checkEditChanges();
      });
    });

    document.querySelectorAll('.edit-remove-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.getAttribute('data-index');
        editLineItems.splice(idx, 1);
        renderEditLineItems();
        checkEditChanges();
      });
    });
  };

  if (editAddLineItemBtn) {
    editAddLineItemBtn.addEventListener('click', () => {
      editLineItems.push({ name: '', qty: 1, unit: 'pcs' });
      renderEditLineItems();
      checkEditChanges();
    });
  }

  const renderEditAssignedVendors = () => {
    editRfqVendorsList.innerHTML = '';
    if (editAssignedVendors.length === 0) {
      editRfqVendorsList.innerHTML = '<li class="p-4 text-center text-xs text-slate-500">No vendors assigned.</li>';
    } else {
      editAssignedVendors.forEach((vendor, idx) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors';
        li.innerHTML = `
          <div>
            <p class="text-xs font-semibold text-slate-800">${vendor.name}</p>
            <p class="text-[10px] text-slate-500">${vendor.category} • ${vendor.status}</p>
          </div>
          <button class="edit-remove-vendor-btn p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" data-index="${idx}">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        `;
        editRfqVendorsList.appendChild(li);
      });
      lucide.createIcons();
    }
    
    document.querySelectorAll('.edit-remove-vendor-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.getAttribute('data-index');
        editAssignedVendors.splice(idx, 1);
        renderEditAssignedVendors();
        checkEditChanges();
      });
    });
  };

  const checkEditChanges = () => {
    // Determine if Items changed
    const itemsChanged = JSON.stringify(originalEditLineItems) !== JSON.stringify(editLineItems);
    
    // Determine if Header or Vendors changed
    const currentHeader = {
      title: editRfqTitle.value.trim(),
      category: editRfqCategory.value,
      deadline: editRfqDeadline.value,
      description: editRfqDescription.value.trim()
    };
    
    const origRfq = allCreatedRfqs.find(r => r.id === editingRfqId) || {};
    const origHeader = {
      title: origRfq.title || '',
      category: origRfq.category || 'Other',
      deadline: origRfq.deadline || '',
      description: origRfq.description || ''
    };
    
    const headerChanged = JSON.stringify(currentHeader) !== JSON.stringify(origHeader);
    
    const origVendorsIds = originalEditVendors.map(v => v.id).sort();
    const currentVendorsIds = editAssignedVendors.map(v => v.id).sort();
    const vendorsChanged = JSON.stringify(origVendorsIds) !== JSON.stringify(currentVendorsIds);
    
    if (itemsChanged) {
      saveEditRfqBtn.disabled = true;
      saveEditRfqBtn.classList.add('opacity-50', 'cursor-not-allowed');
      reissueRfqBtn.disabled = false;
      reissueRfqBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      editValidationMessage.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-red-600"></i><span class="text-red-700">Line Items were modified. You must Cancel & Reissue this RFQ. Save is disabled.</span>';
      editValidationMessage.className = 'mb-4 text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-2 bg-red-50 border border-red-200';
    } else if (headerChanged || vendorsChanged) {
      saveEditRfqBtn.disabled = false;
      saveEditRfqBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      reissueRfqBtn.disabled = true;
      reissueRfqBtn.classList.add('opacity-50', 'cursor-not-allowed');
      editValidationMessage.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4 shrink-0 text-emerald-600"></i><span class="text-emerald-700">Safe changes detected. You may Save Details.</span>';
      editValidationMessage.className = 'mb-4 text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-2 bg-emerald-50 border border-emerald-200';
    } else {
      saveEditRfqBtn.disabled = true;
      saveEditRfqBtn.classList.add('opacity-50', 'cursor-not-allowed');
      reissueRfqBtn.disabled = true;
      reissueRfqBtn.classList.add('opacity-50', 'cursor-not-allowed');
      editValidationMessage.innerHTML = '<i data-lucide="info" class="w-4 h-4 shrink-0 text-blue-600"></i><span class="text-blue-700">Make changes to see available save actions.</span>';
      editValidationMessage.className = 'mb-4 text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-2 bg-blue-50 border border-blue-200';
    }
    lucide.createIcons();
  };

  [editRfqTitle, editRfqCategory, editRfqDeadline, editRfqDescription].forEach(el => {
    el.addEventListener('input', checkEditChanges);
    el.addEventListener('change', checkEditChanges);
  });

  window.openEditRfq = async (id) => {
    const rfq = allCreatedRfqs.find(r => r.id === id);
    if (!rfq) return;
    editingRfqId = id;
    
    editRfqTitle.value = rfq.title;
    editRfqCategory.value = rfq.category || 'Other';
    editRfqDeadline.value = rfq.deadline;
    editRfqDescription.value = rfq.description || '';
    
    // Fetch Items
    const { data: items } = await window.supabaseClient.from('rfq_items').select('*').eq('rfq_id', id);
    originalEditLineItems = items ? items.map(i => ({ name: i.item_name, qty: i.quantity, unit: i.unit })) : [];
    editLineItems = JSON.parse(JSON.stringify(originalEditLineItems)); // Deep copy
    
    // Fetch Vendors
    const { data: vLinks } = await window.supabaseClient.from('rfq_vendors').select('vendor_id').eq('rfq_id', id);
    if (vLinks && vLinks.length > 0) {
      const vIds = vLinks.map(l => l.vendor_id);
      const { data: vendorDetails } = await window.supabaseClient.from('vendors').select('*').in('id', vIds);
      originalEditVendors = vendorDetails || [];
    } else {
      originalEditVendors = [];
    }
    editAssignedVendors = JSON.parse(JSON.stringify(originalEditVendors));
    
    renderEditLineItems();
    renderEditAssignedVendors();
    checkEditChanges();
    
    editRfqModal.classList.remove('hidden');
  };

  const closeEditModal = () => {
    editRfqModal.classList.add('hidden');
    editingRfqId = null;
  };
  if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);
  if (editModalBackdrop) editModalBackdrop.addEventListener('click', closeEditModal);

  if (saveEditRfqBtn) {
    saveEditRfqBtn.addEventListener('click', async () => {
      if (!editingRfqId || saveEditRfqBtn.disabled) return;
      
      const title = editRfqTitle.value.trim();
      const category = editRfqCategory.value;
      const deadline = editRfqDeadline.value;
      const description = editRfqDescription.value.trim();
      
      if (!title || !deadline) return alert("Title and Deadline are required.");
      
      const originalText = saveEditRfqBtn.innerHTML;
      saveEditRfqBtn.innerHTML = "Saving...";
      saveEditRfqBtn.disabled = true;
      
      try {
        // 1. Update Header
        const { error } = await window.supabaseClient.from('rfqs')
          .update({ title, category, deadline, description })
          .eq('id', editingRfqId);
        if (error) throw error;
          
        // 2. Update Vendors (Delete old, Insert new)
        await window.supabaseClient.from('rfq_vendors').delete().eq('rfq_id', editingRfqId);
        
        if (editAssignedVendors.length > 0) {
          const vInserts = editAssignedVendors.map(v => ({ rfq_id: editingRfqId, vendor_id: v.id }));
          const { error: vError } = await window.supabaseClient.from('rfq_vendors').insert(vInserts);
          if (vError) throw vError;
        }
        
        alert("RFQ updated successfully!");
        closeEditModal();
        fetchManageRfqs();
      } catch (err) {
        console.error(err);
        alert("Failed to update RFQ.");
      } finally {
        saveEditRfqBtn.innerHTML = originalText;
        saveEditRfqBtn.disabled = false;
      }
    });
  }

  if (reissueRfqBtn) {
    reissueRfqBtn.addEventListener('click', async () => {
      if (!editingRfqId || reissueRfqBtn.disabled) return;
      if (!confirm("This will Cancel the current RFQ and create a brand new one with your updated items. Continue?")) return;
      
      const title = editRfqTitle.value.trim();
      const category = editRfqCategory.value;
      const deadline = editRfqDeadline.value;
      const description = editRfqDescription.value.trim();
      
      const originalText = reissueRfqBtn.innerHTML;
      reissueRfqBtn.innerHTML = "Reissuing...";
      reissueRfqBtn.disabled = true;
      
      try {
        // 1. Mark old as canceled
        await window.supabaseClient.from('rfqs').update({ status: 'Canceled' }).eq('id', editingRfqId);

        // 2. Insert new RFQ
        const rfq_code = "RFQ-" + Math.random().toString(36).substring(2, 6).toUpperCase();
        const { data: newRfq, error: rfqError } = await window.supabaseClient
          .from('rfqs')
          .insert([{ title: title + " (Reissued)", category, deadline, description, rfq_code, status: 'Issued' }])
          .select();
        if (rfqError) throw rfqError;
        
        const newRfqId = newRfq[0].id;

        // 3. Insert new Items
        if (editLineItems.length > 0) {
          const itemInserts = editLineItems.map(item => ({
            rfq_id: newRfqId,
            item_name: item.name,
            quantity: item.qty,
            unit: item.unit
          }));
          const { error: itemsError } = await window.supabaseClient.from('rfq_items').insert(itemInserts);
          if (itemsError) throw itemsError;
        }

        // 4. Insert new Vendors
        if (editAssignedVendors.length > 0) {
          const vInserts = editAssignedVendors.map(v => ({ rfq_id: newRfqId, vendor_id: v.id }));
          const { error: vError } = await window.supabaseClient.from('rfq_vendors').insert(vInserts);
          if (vError) throw vError;
        }
        
        alert("Success! RFQ was reissued under new code: " + rfq_code);
        closeEditModal();
        fetchManageRfqs();

      } catch (err) {
        console.error(err);
        alert("Failed to reissue RFQ.");
      } finally {
        reissueRfqBtn.innerHTML = originalText;
        reissueRfqBtn.disabled = false;
      }
    });
  }

window.deleteRfq = async (id) => {
    if (!confirm("Are you sure you want to delete this RFQ? All associated items and quotations will be permanently deleted.")) return;
    try {
      const { error } = await window.supabaseClient.from('rfqs').delete().eq('id', id);
      if (error) throw error;
      fetchManageRfqs();
    } catch (err) {
      console.error(err);
      alert("Failed to delete RFQ.");
    }
  };

  console.log("RFQs page initialized.");
});
