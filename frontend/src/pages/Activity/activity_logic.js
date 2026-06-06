document.addEventListener('DOMContentLoaded', () => {
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
      if(logoText) logoText.classList.add('hidden');
      if(supportBox) supportBox.classList.add('hidden');
      document.querySelectorAll('.sidebar-label').forEach(label => label.classList.add('hidden'));
      if(collapseBtn) collapseBtn.innerHTML = '<i data-lucide="chevrons-right" class="w-5 h-5 shrink-0"></i>';
    } else {
      sidebar.classList.remove('w-20');
      sidebar.classList.add('w-64');
      setTimeout(() => {
        if(logoText) logoText.classList.remove('hidden');
        if(supportBox) supportBox.classList.remove('hidden');
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

  // Activity Logic
  const fetchActivity = async () => {
    try {
      if(!window.supabaseClient) throw new Error('Supabase not loaded');
      
      let [{ data: rfqs }, { data: invoices }] = await Promise.all([
        window.supabaseClient.from('rfqs').select('id, rfq_id, vendor_name, status, created_at').order('created_at', { ascending: false }).limit(10),
        window.supabaseClient.from('invoices').select('id, invoice_id, po_number, vendor_name, status, created_at').order('created_at', { ascending: false }).limit(10)
      ]);
      
      if (!rfqs || rfqs.length === 0) {
        rfqs = [
          { rfq_id: 'RFQ-7091', vendor_name: 'TechCorp Solutions', status: 'Open', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
          { rfq_id: 'RFQ-8820', vendor_name: 'Global Industries', status: 'Closed', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }
        ];
      }
      if (!invoices || invoices.length === 0) {
        invoices = [
          { invoice_id: 'INV-1092', po_number: 'PO-3011', vendor_name: 'TechCorp Solutions', status: 'Paid', created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
          { invoice_id: 'INV-3021', po_number: 'PO-3012', vendor_name: 'Apex Manufacturing', status: 'Pending', created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() }
        ];
      }

      let activityItems = [];
      
      rfqs.forEach(r => {
        activityItems.push({
          type: 'RFQ',
          title: `RFQ ${r.status === 'Open' ? 'Created' : 'Closed'} - ${r.rfq_id}`,
          desc: `${r.rfq_id} for ${r.vendor_name || 'Vendor'} is currently ${r.status}`,
          date: r.created_at,
          icon: 'file-text',
          color: 'blue'
        });
      });

      invoices.forEach(i => {
        activityItems.push({
          type: 'Invoice',
          title: `Invoice ${i.status} - ${i.invoice_id}`,
          desc: `Invoice ${i.invoice_id} (${i.po_number || ''}) for ${i.vendor_name || 'Vendor'} is ${i.status}`,
          date: i.created_at,
          icon: i.status === 'Paid' ? 'check' : (i.status === 'Overdue' ? 'alert-circle' : 'clock'),
          color: i.status === 'Paid' ? 'emerald' : (i.status === 'Overdue' ? 'red' : 'amber')
        });
      });

      activityItems.sort((a,b) => new Date(b.date) - new Date(a.date));

      const container = document.getElementById('activityTimelineBody');
      if(!container) return;
      container.innerHTML = '';

      if(activityItems.length === 0) {
        container.innerHTML = '<div class="p-6 text-center text-sm font-light uppercase tracking-widest text-slate-500">No activity found.</div>';
        return;
      }

      activityItems.forEach(item => {
        const d = new Date(item.date);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        let colorClasses = '';
        if(item.color === 'emerald') colorClasses = 'bg-emerald-50 border-emerald-500 text-emerald-600';
        else if(item.color === 'blue') colorClasses = 'bg-blue-50 border-vb-blue text-vb-blue';
        else if(item.color === 'red') colorClasses = 'bg-red-50 border-red-500 text-red-600';
        else colorClasses = 'bg-amber-50 border-amber-500 text-amber-600';

        container.innerHTML += `
          <div class="flex items-start gap-4 p-5 md:p-6 border-b border-slate-100 hover:bg-slate-50 transition-colors group">
            <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${colorClasses}">
              <i data-lucide="${item.icon}" class="w-5 h-5"></i>
            </div>
            <div class="flex-1 flex flex-col space-y-1">
              <h3 class="text-sm font-light uppercase tracking-widest text-slate-900">
                ${item.title} - <span class="font-medium text-slate-600 capitalize">${item.desc}</span>
              </h3>
              <span class="text-xs font-medium text-slate-400">${dateStr}, ${timeStr}</span>
            </div>
          </div>
        `;
      });
      lucide.createIcons();

    } catch(err) {
      console.error(err);
      const container = document.getElementById('activityTimelineBody');
      if(container) container.innerHTML = '<div class="p-6 text-center text-sm font-light uppercase tracking-widest text-red-500">Failed to load activity.</div>';
    }
  };

  fetchActivity();
});
