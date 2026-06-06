document.addEventListener('DOMContentLoaded', () => {
  // Sidebar logic
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapseBtn');
  const logoText = document.getElementById('logoText');
  const menuToggle = document.getElementById('menuToggle');

  let isCollapsed = false;

  const toggleSidebar = () => {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      sidebar.classList.remove('w-64');
      sidebar.classList.add('w-20');
      if(logoText) logoText.classList.add('hidden');
      document.querySelectorAll('.sidebar-label').forEach(label => label.classList.add('hidden'));
      if(collapseBtn) collapseBtn.innerHTML = '<i data-lucide="chevrons-right" class="w-5 h-5 shrink-0"></i>';
    } else {
      sidebar.classList.remove('w-20');
      sidebar.classList.add('w-64');
      setTimeout(() => {
        if(logoText) logoText.classList.remove('hidden');
        document.querySelectorAll('.sidebar-label').forEach(label => label.classList.remove('hidden'));
      }, 150);
      if(collapseBtn) collapseBtn.innerHTML = '<i data-lucide="chevrons-left" class="w-5 h-5 shrink-0"></i><span class="sidebar-label">Collapse</span>';
    }
    lucide.createIcons();
  };

  if (collapseBtn) collapseBtn.addEventListener('click', toggleSidebar);
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
      sidebar.classList.toggle('absolute');
      sidebar.classList.toggle('z-50');
    });
  }

  // Vendors Data State
  let allVendors = [];

  // DOM Elements
  const vendorSearchInput = document.getElementById('vendorSearchInput');
  const chipAll = document.getElementById('chipAll');
  const chipActive = document.getElementById('chipActive');
  const chipPending = document.getElementById('chipPending');
  const chipBlocked = document.getElementById('chipBlocked');
  const tbody = document.querySelector('table tbody');

  // Search Logic
  if (vendorSearchInput) {
    vendorSearchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      
      const filtered = allVendors.filter(v => {
        const nameMatch = (v.name || '').toLowerCase().includes(searchTerm);
        const gstMatch = (v.gst_no || '').toLowerCase().includes(searchTerm);
        const catMatch = (v.category || '').toLowerCase().includes(searchTerm);
        return nameMatch || gstMatch || catMatch;
      });
      
      renderVendors(filtered);
    });
  }

  // Function to render vendors into the table
  const renderVendors = (vendors) => {
    tbody.innerHTML = '';
    
    if (!vendors || vendors.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-[10px] font-light uppercase tracking-widest text-slate-500">No vendors found.</td></tr>';
      return;
    }

    vendors.forEach(vendor => {
      let statusHtml = '';
      if(vendor.status === 'Active') {
        statusHtml = `<span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-light uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-100">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
           </span>`;
      } else if(vendor.status === 'Pending') {
        statusHtml = `<span class="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-light uppercase tracking-widest px-2 py-0.5 rounded border border-amber-100">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending
           </span>`;
      } else {
        statusHtml = `<span class="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[9px] font-light uppercase tracking-widest px-2 py-0.5 rounded border border-rose-100">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> ${vendor.status || 'Blocked'}
           </span>`;
      }

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors border-b border-slate-50';
      tr.innerHTML = `
        <td class="py-3 px-4 text-[10px] font-light uppercase tracking-widest text-slate-900">${vendor.name || '--'}</td>
        <td class="py-3 px-4 text-[10px] font-light uppercase tracking-widest text-slate-500">${vendor.category || '--'}</td>
        <td class="py-3 px-4 text-[10px] font-light uppercase tracking-widest text-vb-blue">${vendor.gst_no || '--'}</td>
        <td class="py-3 px-4 text-[10px] font-light uppercase tracking-widest text-slate-500">${vendor.contact || '--'}</td>
        <td class="py-3 px-4">${statusHtml}</td>
        <td class="py-3 px-4 text-center">
          <button onclick="window.openEditModal('${vendor.id}')" class="text-[9px] font-light uppercase tracking-widest text-vb-blue hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded border border-blue-100 px-3 py-1 transition-colors">Edit</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  };

  // Fetch vendors from Supabase
  const fetchVendors = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      allVendors = data || [];
      
      // Update counts
      let activeCount = 0;
      let pendingCount = 0;
      let blockedCount = 0;
      
      allVendors.forEach(v => {
        if(v.status === 'Active') activeCount++;
        else if(v.status === 'Pending') pendingCount++;
        else if(v.status === 'Blocked' || v.status === 'Suspended') blockedCount++;
      });
      
      if(chipAll) chipAll.innerHTML = `All (${allVendors.length})`;
      if(chipActive) chipActive.innerHTML = `Active (${activeCount})`;
      if(chipPending) chipPending.innerHTML = `Pending (${pendingCount})`;
      if(chipBlocked) chipBlocked.innerHTML = `Blocked (${blockedCount})`;
      
      renderVendors(allVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error.message);
    }
  };

  // Edit Vendor Logic
  let currentEditingVendorId = null;

  window.openEditModal = (id) => {
    const vendor = allVendors.find(v => v.id === id);
    if(!vendor) return;
    
    currentEditingVendorId = id;
    
    document.getElementById('vName').value = vendor.name || '';
    
    const standardCats = ['Hardware', 'Software', 'Services', 'Logistics', 'Marketing', 'Consulting'];
    const catSelect = document.getElementById('vCategory');
    const vOtherCategoryDiv = document.getElementById('vOtherCategoryDiv');
    
    if(standardCats.includes(vendor.category)) {
      catSelect.value = vendor.category;
      if(vOtherCategoryDiv) vOtherCategoryDiv.classList.add('hidden');
    } else {
      catSelect.value = 'Other';
      if(vOtherCategoryDiv) {
        vOtherCategoryDiv.classList.remove('hidden');
        document.getElementById('vOtherCategory').value = vendor.category || '';
      }
    }
    
    document.getElementById('vGst').value = vendor.gst_no || '';
    document.getElementById('vContact').value = vendor.contact || '';
    document.getElementById('vStatus').value = vendor.status || 'Active';
    document.getElementById('vRelationship').value = vendor.relationship || 'New';
    document.getElementById('vAddress').value = vendor.address || '';
    
    const modalTitle = document.querySelector('#addVendorModal h3');
    if(modalTitle) modalTitle.innerText = 'Edit Vendor Details';
    
    const saveBtn = document.getElementById('saveVendorBtn');
    if(saveBtn) saveBtn.innerHTML = 'Update Vendor';
    
    const addVendorModal = document.getElementById('addVendorModal');
    if(addVendorModal) addVendorModal.classList.remove('hidden');
  };

  // Add Vendor Modal Logic
  const addVendorBtn = document.getElementById('addVendorBtn');
  const addVendorModal = document.getElementById('addVendorModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelVendorBtn = document.getElementById('cancelVendorBtn');
  const saveVendorBtn = document.getElementById('saveVendorBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  
  const vCategory = document.getElementById('vCategory');
  const vOtherCategoryDiv = document.getElementById('vOtherCategoryDiv');
  const addVendorForm = document.getElementById('addVendorForm');

  const openModal = () => {
    currentEditingVendorId = null;
    const modalTitle = document.querySelector('#addVendorModal h3');
    if(modalTitle) modalTitle.innerText = 'Add New Vendor';
    const saveBtn = document.getElementById('saveVendorBtn');
    if(saveBtn) saveBtn.innerHTML = 'Save Vendor';

    if(addVendorModal) addVendorModal.classList.remove('hidden');
    if(addVendorForm) addVendorForm.reset();
    if(vOtherCategoryDiv) vOtherCategoryDiv.classList.add('hidden');
  };

  const closeModal = () => {
    if(addVendorModal) addVendorModal.classList.add('hidden');
  };

  if (addVendorBtn) addVendorBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelVendorBtn) cancelVendorBtn.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  if (vCategory) {
    vCategory.addEventListener('change', (e) => {
      if (e.target.value === 'Other') {
        vOtherCategoryDiv.classList.remove('hidden');
        document.getElementById('vOtherCategory').required = true;
      } else {
        vOtherCategoryDiv.classList.add('hidden');
        document.getElementById('vOtherCategory').required = false;
      }
    });
  }

  if (saveVendorBtn) {
    saveVendorBtn.addEventListener('click', async () => {
      if (!addVendorForm.checkValidity()) {
        addVendorForm.reportValidity();
        return;
      }

      const name = document.getElementById('vName').value;
      let category = document.getElementById('vCategory').value;
      if (category === 'Other') {
        category = document.getElementById('vOtherCategory').value;
      }
      const gst_no = document.getElementById('vGst').value;
      const contact = document.getElementById('vContact').value;
      const status = document.getElementById('vStatus').value;
      const relationship = document.getElementById('vRelationship').value;
      const address = document.getElementById('vAddress').value;
      
      const originalBtnText = saveVendorBtn.innerHTML;
      saveVendorBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline-block align-text-bottom mr-1"></i> Saving...';
      saveVendorBtn.disabled = true;

      try {
        let error;
        if (currentEditingVendorId) {
          const res = await supabaseClient
            .from('vendors')
            .update({ name, category, gst_no, contact, status, relationship, address })
            .eq('id', currentEditingVendorId);
          error = res.error;
        } else {
          const res = await supabaseClient
            .from('vendors')
            .insert([{ name, category, gst_no, contact, status, relationship, address }]);
          error = res.error;
        }
          
        if (error) throw error;
        
        closeModal();
        fetchVendors(); 
      } catch (error) {
        console.error('Error adding vendor:', error);
        alert('Failed to save vendor. Error: ' + (error.message || JSON.stringify(error)));
      } finally {
        saveVendorBtn.innerHTML = originalBtnText;
        saveVendorBtn.disabled = false;
        lucide.createIcons();
      }
    });
  }

  // Initial fetch
  if (typeof window.supabaseClient !== 'undefined') {
    fetchVendors();
  } else {
    console.warn("Supabase client not initialized.");
  }
});
