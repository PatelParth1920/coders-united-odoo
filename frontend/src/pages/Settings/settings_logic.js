document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  const getEl = id => document.getElementById(id);

  let currentSettingsId = null;

  const init = async () => {
    if(!window.supabaseClient) return console.error("Supabase not loaded");
    
    // Fetch Settings
    try {
      const { data, error } = await window.supabaseClient.from('settings').select('*').limit(1);
      if(error) throw error;
      
      if(data && data.length > 0) {
        const s = data[0];
        currentSettingsId = s.id;
        
        getEl('setAdminName').value = s.admin_name || '';
        getEl('setAdminEmail').value = s.admin_email || '';
        getEl('setJobTitle').value = s.job_title || '';
        getEl('setCompanyName').value = s.company_name || '';
        getEl('setCurrency').value = s.base_currency || 'USD';
        getEl('setTaxPct').value = s.default_tax_pct || '';
        getEl('setCompanyGst').value = s.company_gst || '';
        getEl('notifRfq').checked = s.notif_rfq;
        getEl('notifInvoice').checked = s.notif_invoice;
      }
    } catch(e) {
      console.error("Failed to load settings:", e);
    }
  };

  const handleSave = async () => {
    const btn = getEl('btnSave');
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Saving...';
    lucide.createIcons();

    const payload = {
      admin_name: getEl('setAdminName').value.trim(),
      admin_email: getEl('setAdminEmail').value.trim(),
      job_title: getEl('setJobTitle').value.trim(),
      company_name: getEl('setCompanyName').value.trim(),
      base_currency: getEl('setCurrency').value,
      default_tax_pct: parseFloat(getEl('setTaxPct').value) || 0,
      company_gst: getEl('setCompanyGst').value.trim(),
      notif_rfq: getEl('notifRfq').checked,
      notif_invoice: getEl('notifInvoice').checked
    };

    try {
      if(currentSettingsId) {
        await window.supabaseClient.from('settings').update(payload).eq('id', currentSettingsId);
      } else {
        const { data } = await window.supabaseClient.from('settings').insert([payload]).select();
        if(data && data.length > 0) currentSettingsId = data[0].id;
      }
      
      btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Saved Successfully';
      btn.classList.remove('bg-vb-blue', 'hover:bg-blue-700');
      btn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
      lucide.createIcons();
      
      setTimeout(() => {
        btn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> Save All Changes';
        btn.classList.add('bg-vb-blue', 'hover:bg-blue-700');
        btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
        lucide.createIcons();
      }, 3000);

    } catch(e) {
      console.error(e);
      alert("Failed to save settings.");
      btn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> Save All Changes';
      lucide.createIcons();
    }
  };

  getEl('btnSave').addEventListener('click', handleSave);

  init();

  // SIDEBAR LOGIC
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
      document.querySelectorAll('.sidebar-label').forEach(l => l.classList.add('hidden'));
      if(collapseBtn) collapseBtn.innerHTML = '<i data-lucide="chevrons-right" class="w-5 h-5 shrink-0"></i>';
    } else {
      sidebar.classList.remove('w-20');
      sidebar.classList.add('w-64');
      setTimeout(() => {
        if(logoText) logoText.classList.remove('hidden');
        document.querySelectorAll('.sidebar-label').forEach(l => l.classList.remove('hidden'));
      }, 150);
      if(collapseBtn) collapseBtn.innerHTML = `<i data-lucide="chevrons-left" class="w-5 h-5 shrink-0"></i><span class="sidebar-label">Collapse</span>`;
    }
    lucide.createIcons();
  };

  if(collapseBtn) collapseBtn.addEventListener('click', toggleSidebar);
  if(menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
      sidebar.classList.toggle('absolute');
      sidebar.classList.toggle('z-50');
    });
  }
});
