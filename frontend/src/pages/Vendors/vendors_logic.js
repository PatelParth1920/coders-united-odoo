document.addEventListener('DOMContentLoaded', () => {
  // Sidebar logic (can be shared or abstracted later)
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapseBtn');
  const logoText = document.getElementById('logoText');
  const supportBox = document.getElementById('supportBox');
  const menuToggle = document.getElementById('menuToggle');
  const searchInput = document.getElementById('globalSearchInput');

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

  // Logic specific to Vendors Page

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
    addVendorModal.classList.remove('hidden');
    addVendorForm.reset();
    vOtherCategoryDiv.classList.add('hidden');
  };

  const closeModal = () => {
    addVendorModal.classList.add('hidden');
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
        const { error } = await supabaseClient
          .from('vendors')
          .insert([
            { name, category, gst_no, contact, status, relationship, address }
          ]);
          
        if (error) throw error;
        
        // Success
        closeModal();
        fetchVendors(); // Refresh the list
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

  // Function to render vendors into the table
  const renderVendors = (vendors) => {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = ''; // Clear existing rows
    
    if (!vendors || vendors.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-sm font-medium text-slate-500">No vendors found. Add a vendor to get started.</td></tr>';
      return;
    }

    vendors.forEach(vendor => {
      const statusHtml = vendor.status === 'Active' 
        ? `<span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold text-[11px] px-2 py-0.5 rounded-full border border-emerald-100">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
           </span>`
        : `<span class="inline-flex items-center gap-1 bg-rose-50 text-rose-700 font-semibold text-[11px] px-2 py-0.5 rounded-full border border-rose-100">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> ${vendor.status}
           </span>`;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';
      tr.innerHTML = `
        <td class="py-3 px-4 text-xs font-semibold text-slate-900">${vendor.name}</td>
        <td class="py-3 px-4 text-xs">${vendor.category}</td>
        <td class="py-3 px-4 text-xs font-mono text-slate-500">${vendor.gst_no}</td>
        <td class="py-3 px-4 text-xs">${vendor.contact}</td>
        <td class="py-3 px-4 text-xs">${statusHtml}</td>
        <td class="py-3 px-4 text-center">
          <button class="text-xs font-semibold text-vb-blue hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md px-3 py-1 transition-colors">View</button>
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
      renderVendors(data);
    } catch (error) {
      console.error('Error fetching vendors:', error.message);
    }
  };

  // Initial fetch
  if (typeof window.supabaseClient !== 'undefined') {
    fetchVendors();
  } else {
    console.warn("Supabase client not initialized.");
  }

  console.log("Vendors page initialized.");
});
