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
      const isAssigned = assignedVendors.some(av => av.id === v.id);
      
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
          assignedVendors.push(vendor);
          renderAssignedVendors();
          lucide.createIcons();
          closeVendorModal();
        }
      });
    });
  };

  if (addVendorBtn) addVendorBtn.addEventListener('click', openVendorModal);
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
        // 1. Insert RFQ header
        const { data: rfqData, error: rfqError } = await window.supabaseClient
          .from('rfqs')
          .insert([{ title, category, deadline, description }])
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
        
        alert("RFQ Created and Sent to Vendors successfully!");
        
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

  console.log("RFQs page initialized.");
});
