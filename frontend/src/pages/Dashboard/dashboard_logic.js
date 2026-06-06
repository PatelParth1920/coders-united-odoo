document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  const getEl = id => document.getElementById(id);

  const init = async () => {
    if(!window.supabaseClient) return console.error('Supabase not loaded');
    
    try {
      // Fetch Metrics from Supabase
      let [{ data: rfqs }, { data: approvals }, { data: invoices }] = await Promise.all([
        window.supabaseClient.from('rfqs').select('id, rfq_id, vendor_name, status, created_at'),
        window.supabaseClient.from('approvals').select('status'),
        window.supabaseClient.from('invoices').select('id, invoice_id, vendor_name, grand_total, status, created_at')
      ]);

      
      // Mock data fallback if database is empty
      if (!rfqs || rfqs.length === 0) {
        rfqs = [
          { id: '1', rfq_id: 'RFQ-7091', vendor_name: 'TechCorp Solutions', status: 'Open', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
          { id: '2', rfq_id: 'RFQ-8820', vendor_name: 'Global Industries', status: 'Closed', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
          { id: '3', rfq_id: 'RFQ-4432', vendor_name: 'Nexus Hardware', status: 'Open', created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() }
        ];
      }

      if (!approvals || approvals.length === 0) {
        approvals = [
          { status: 'Pending' }, { status: 'Pending' }, { status: 'Approved' }
        ];
      }

      if (!invoices || invoices.length === 0) {
        invoices = [
          { id: '1', invoice_id: 'INV-1092', vendor_name: 'TechCorp Solutions', grand_total: 15400, status: 'Paid', created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), issue_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
          { id: '2', invoice_id: 'INV-3021', vendor_name: 'Apex Manufacturing', grand_total: 8200, status: 'Pending', created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), issue_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
          { id: '3', invoice_id: 'INV-4011', vendor_name: 'Global Industries', grand_total: 4100, status: 'Overdue', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), issue_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString() },
          { id: '4', invoice_id: 'INV-9002', vendor_name: 'Nexus Hardware', grand_total: 21000, status: 'Paid', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), issue_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString() }
        ];
      }

      if (rfqs) {
        getEl('dashActiveRfqs').innerText = rfqs.filter(r => r.status === 'Open').length;
      }
      if (approvals) {
        getEl('dashPendingApprovals').innerText = approvals.filter(a => a.status === 'Pending').length;
      }
      
      let overdueCount = 0;
      let pendingCount = 0;
      let monthlyData = [0, 0, 0, 0, 0, 0];

      if (invoices) {
        invoices.forEach(inv => {
          if (inv.status === 'Overdue') overdueCount++;
          if (inv.status === 'Pending') pendingCount++;
          
          if (inv.status === 'Paid') {
            const issue = new Date(inv.issue_date || inv.created_at); const mIdx = issue.getMonth() % 6;
            monthlyData[mIdx] += parseFloat(inv.grand_total || 0);
          }
        });
        
        getEl('dashOverdueInvoices').innerText = overdueCount;
        getEl('dashPendingInvoices').innerText = pendingCount;
      }

      // Render Chart
      const totalVolume = monthlyData.reduce((a,b)=>a+b,0);
      if(totalVolume === 0) {
        renderPremiumChart([12000, 19000, 15000, 22000, 18000, 28000]);
      } else {
        renderPremiumChart(monthlyData);
      }

      // Build Activity Table
      buildActivityTable(rfqs || [], invoices || []);

    } catch(err) {
      console.error('Dashboard fetch error:', err);
      renderPremiumChart([12000, 19000, 15000, 22000, 18000, 28000]);
    }
  };

  const buildActivityTable = (rfqs, invoices) => {
    const tbody = getEl('activityTableBody');
    if(!tbody) return;

    let activities = [];
    
    rfqs.forEach(r => {
      activities.push({
        type: 'RFQ',
        ref: r.rfq_id || ('RFQ-'+r.id.substring(0,4)),
        entity: r.vendor_name || 'System',
        status: r.status || 'Draft',
        date: new Date(r.created_at || Date.now())
      });
    });

    invoices.forEach(i => {
      activities.push({
        type: 'Invoice',
        ref: i.invoice_id || ('INV-'+i.id.substring(0,4)),
        entity: i.vendor_name || 'System',
        status: i.status || 'Draft',
        date: new Date(i.created_at || Date.now())
      });
    });

    // Sort by date desc
    activities.sort((a,b) => b.date - a.date);
    
    // Take top 8
    activities = activities.slice(0, 8);

    if(activities.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-[10px] font-light uppercase tracking-widest text-slate-400">No recent activity</td></tr>';
      return;
    }

    let html = '';
    activities.forEach(act => {
      
      let statusColor = 'bg-slate-100 text-slate-600';
      if(act.status === 'Paid' || act.status === 'Approved') statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      if(act.status === 'Pending' || act.status === 'Open') statusColor = 'bg-blue-50 text-blue-600 border border-blue-100';
      if(act.status === 'Overdue' || act.status === 'Rejected') statusColor = 'bg-red-50 text-red-600 border border-red-100';

      html += '<tr class="hover:bg-slate-50/50 transition-colors">' +
          '<td class="py-3 px-5 whitespace-nowrap">' +
            '<span class="text-[10px] font-light uppercase tracking-widest text-slate-800">' + act.type + '</span>' +
          '</td>' +
          '<td class="py-3 px-5 whitespace-nowrap">' +
            '<span class="text-[10px] font-light uppercase tracking-widest text-vb-blue">' + act.ref + '</span>' +
          '</td>' +
          '<td class="py-3 px-5 hidden sm:table-cell truncate max-w-[150px]">' +
            '<span class="text-[10px] font-light uppercase tracking-widest text-slate-500">' + act.entity + '</span>' +
          '</td>' +
          '<td class="py-3 px-5 text-right whitespace-nowrap">' +
            '<span class="' + statusColor + ' text-[9px] font-light uppercase tracking-widest px-2 py-0.5 rounded-sm">' + act.status + '</span>' +
          '</td>' +
        '</tr>';
    });

    tbody.innerHTML = html;
  };

  const renderPremiumChart = (dataArr) => {
    const canvas = getEl('volumeChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.15)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Volume',
          data: dataArr,
          borderColor: '#2563eb',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#2563eb',
          pointBorderWidth: 1.5,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f8fafc', drawBorder: false },
            ticks: { 
              callback: (val) => '$' + (val/1000) + 'k',
              font: { family: 'Inter', size: 9, weight: '300' },
              color: '#94a3b8'
            },
            border: { display: false }
          },
          x: { 
            grid: { display: false, drawBorder: false },
            ticks: { 
              font: { family: 'Inter', size: 9, weight: '300' },
              color: '#94a3b8'
            },
            border: { display: false }
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });
  };

  init();
  const setupRealtime = () => {
    if(!window.supabaseClient) return;
    window.supabaseClient.channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, payload => {
        init();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rfqs' }, payload => {
        init();
      })
      .subscribe();
  };
  setupRealtime();

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
      if(collapseBtn) collapseBtn.innerHTML = '<i data-lucide="chevrons-left" class="w-5 h-5 shrink-0"></i><span class="sidebar-label">Collapse</span>';
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