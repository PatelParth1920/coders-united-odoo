document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  const getEl = id => document.getElementById(id);

  let rawInvoices = [];
  let rawVendors = [];
  let filteredInvoices = [];
  let trendChartInstance = null;

  const init = async () => {
    if(!window.supabaseClient) return console.error("Supabase not loaded");
    
    // Fetch initial data
    try {
      const [{ data: vendors }, { data: invoices }] = await Promise.all([
        window.supabaseClient.from('vendors').select('id, name, status'),
        window.supabaseClient.from('invoices').select('*, vendors(name)').order('created_at', { ascending: false })
      ]);
      
      rawVendors = vendors || [];
      rawInvoices = invoices || [];
      filteredInvoices = [...rawInvoices];

      populateVendorDropdown();
      updateDashboard();

    } catch(e) {
      console.error("Error fetching data for reports", e);
    }

    // Bind events
    getEl('btnApplyFilter').addEventListener('click', applyGlobalFilters);
    getEl('tblSearch').addEventListener('input', applyTableSearch);
    getEl('btnExportCSV').addEventListener('click', exportToCSV);
  };

  const populateVendorDropdown = () => {
    const sel = getEl('filterVendor');
    sel.innerHTML = '<option value="">All Vendors</option>';
    rawVendors.forEach(v => {
      sel.innerHTML += `<option value="${v.id}">${v.name}</option>`;
    });
  };

  const applyGlobalFilters = () => {
    const timeFilter = getEl('filterTime').value;
    const vendorFilter = getEl('filterVendor').value;

    filteredInvoices = rawInvoices.filter(inv => {
      let keep = true;
      
      // Vendor Filter
      if (vendorFilter && inv.vendor_id !== vendorFilter) keep = false;

      // Time Filter
      if (keep && timeFilter !== 'all') {
        const invDate = new Date(inv.issue_date);
        const now = new Date();
        const diffDays = (now - invDate) / (1000 * 60 * 60 * 24);
        
        if (timeFilter === 'month' && diffDays > 30) keep = false;
        if (timeFilter === 'year' && diffDays > 365) keep = false;
      }
      return keep;
    });

    updateDashboard();
  };

  const updateDashboard = () => {
    // 1. Compute KPIs
    let totalSpend = 0;
    let pendingLiab = 0;
    
    filteredInvoices.forEach(inv => {
      const val = parseFloat(inv.grand_total || 0);
      if(inv.status === 'Paid') totalSpend += val;
      if(inv.status === 'Pending' || inv.status === 'Overdue') pendingLiab += val;
    });

    getEl('kpiSpend').innerText = '$' + totalSpend.toLocaleString();
    getEl('kpiLiabilities').innerText = '$' + pendingLiab.toLocaleString();
    getEl('kpiVendors').innerText = rawVendors.filter(v => v.status === 'Active').length;
    getEl('kpiInvoices').innerText = filteredInvoices.length;

    // 2. Render Chart
    renderTrendChart();

    // 3. Render Top Vendors
    renderTopVendors();

    // 4. Render Table
    renderDataTable();
  };

  const renderTrendChart = () => {
    const ctx = getEl('trendChart').getContext('2d');
    
    // Group invoices by Month (for simplicity, we aggregate by YYYY-MM based on issue_date)
    const monthlyData = {};
    filteredInvoices.forEach(inv => {
      if(!inv.issue_date) return;
      const monthStr = inv.issue_date.substring(0, 7); // "YYYY-MM"
      monthlyData[monthStr] = (monthlyData[monthStr] || 0) + parseFloat(inv.grand_total || 0);
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(m => {
      const date = new Date(m + '-01');
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    const dataPoints = sortedMonths.map(m => monthlyData[m]);

    if(trendChartInstance) trendChartInstance.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

    trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [{
          label: 'Procurement Spend ($)',
          data: dataPoints.length > 0 ? dataPoints : [0],
          borderColor: '#2563eb',
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#2563eb',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: { callback: (val) => '$' + val.toLocaleString() }
          },
          x: { grid: { display: false } }
        }
      }
    });
  };

  const renderTopVendors = () => {
    const list = getEl('topVendorsList');
    list.innerHTML = '';

    // Aggregate spend by vendor
    const vSpend = {};
    filteredInvoices.forEach(inv => {
      if(inv.status !== 'Paid') return; // only rank by actual paid volume
      const vName = inv.vendors?.name || 'Unknown Vendor';
      vSpend[vName] = (vSpend[vName] || 0) + parseFloat(inv.grand_total || 0);
    });

    const sortedVendors = Object.keys(vSpend).map(k => ({ name: k, total: vSpend[k] })).sort((a,b) => b.total - a.total).slice(0, 5);

    if(sortedVendors.length === 0) {
      list.innerHTML = '<li class="p-6 text-center text-sm text-slate-500 font-medium">No paid data available.</li>';
      return;
    }

    sortedVendors.forEach((v, index) => {
      const maxSpend = sortedVendors[0].total;
      const pct = Math.max(5, Math.round((v.total / maxSpend) * 100)); // Visual progress bar
      
      list.innerHTML += `
        <li class="p-4 hover:bg-slate-50 transition-colors">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">${index + 1}</span>
              <span class="text-sm font-bold text-slate-800">${v.name}</span>
            </div>
            <span class="text-sm font-bold text-slate-900 font-mono">$${v.total.toLocaleString()}</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-1.5 ml-9" style="width: calc(100% - 2.25rem)">
            <div class="bg-vb-blue h-1.5 rounded-full" style="width: ${pct}%"></div>
          </div>
        </li>
      `;
    });
  };

  const applyTableSearch = (e) => {
    const q = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('.data-row');
    let visibleCount = 0;
    rows.forEach(row => {
      if(row.innerText.toLowerCase().includes(q)) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    getEl('tblCount').innerText = visibleCount;
  };

  const renderDataTable = () => {
    const tbody = getEl('dataTableBody');
    tbody.innerHTML = '';

    if(filteredInvoices.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-slate-500 font-medium text-sm">No records found.</td></tr>';
      getEl('tblCount').innerText = 0;
      return;
    }

    filteredInvoices.forEach(inv => {
      let statusColor = 'bg-amber-50 text-amber-600 border border-amber-200';
      if(inv.status === 'Paid') statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      if(inv.status === 'Overdue') statusColor = 'bg-red-50 text-red-600 border border-red-200 font-bold';

      tbody.innerHTML += `
        <tr class="hover:bg-slate-50 transition-colors data-row">
          <td class="py-4 px-6 font-mono text-xs font-bold text-slate-700">${inv.invoice_id || inv.po_number || 'N/A'}</td>
          <td class="py-4 px-6 text-slate-500"><i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i> ${inv.issue_date || 'N/A'}</td>
          <td class="py-4 px-6 font-bold text-slate-800">${inv.vendors?.name || 'Unknown'}</td>
          <td class="py-4 px-6 text-right font-mono font-bold text-slate-900">$${parseFloat(inv.grand_total).toLocaleString()}</td>
          <td class="py-4 px-6 text-center"><span class="px-2 py-1.5 rounded-md text-[10px] uppercase tracking-wide ${statusColor}">${inv.status}</span></td>
        </tr>
      `;
    });
    getEl('tblCount').innerText = filteredInvoices.length;
    lucide.createIcons();
  };

  const exportToCSV = () => {
    let csv = 'Invoice ID,Issue Date,Vendor Name,Amount,Status\n';
    filteredInvoices.forEach(inv => {
      const id = (inv.invoice_id || inv.po_number || '').replace(/,/g, '');
      const date = inv.issue_date || '';
      const vName = (inv.vendors?.name || 'Unknown').replace(/,/g, '');
      const amt = parseFloat(inv.grand_total).toFixed(2);
      const status = inv.status;
      csv += `${id},${date},${vName},${amt},${status}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'vendor_report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
