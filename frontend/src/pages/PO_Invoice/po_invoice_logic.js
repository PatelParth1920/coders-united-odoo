
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  const getEl = id => document.getElementById(id);
  const safeAdd = (id, e, cb) => { const el = getEl(id); if(el) el.addEventListener(e, cb); };

  let allInvoices = [];
  let allVendors = [];
  let filterTab = 'all'; // all, Sent, Received
  let currentInvoice = null;

  let frmItemsList = [{name: '', qty: 1, price: 0}];

  // --- INIT ---
  const init = async () => {
    safeAdd('btnOpenCreate', 'click', openCreateModal);
    safeAdd('btnCloseCreate', 'click', closeCreateModal);
    safeAdd('btnCancelCreate', 'click', closeCreateModal);
    safeAdd('btnBackToList', 'click', () => {
      getEl('detailViewContainer').classList.add('hidden');
      getEl('listViewContainer').classList.remove('hidden');
    });
    safeAdd('btnAddItem', 'click', () => {
      frmItemsList.push({name: '', qty: 1, price: 0});
      renderFrmItems();
    });
    safeAdd('frmTax', 'input', calculateFrmTotals);
    safeAdd('btnSaveInvoice', 'click', handleSaveInvoice);
    safeAdd('selUpdateStatus', 'change', handleStatusUpdate);

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.className = "tab-btn pb-3 px-2 text-sm font-bold border-b-2 transition-all border-transparent text-slate-500 hover:text-slate-700");
        e.target.className = "tab-btn pb-3 px-2 text-sm font-bold border-b-2 transition-all border-vb-blue text-vb-blue";
        filterTab = e.target.getAttribute('data-tab');
        renderList();
      });
    });

    const today = new Date().toISOString().split('T')[0];
    getEl('frmIssue').value = today;
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    getEl('frmDue').value = nextWeek.toISOString().split('T')[0];

    await fetchVendors();
    await fetchInvoices();
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await window.supabaseClient.from('vendors').select('id, name, contact, gst_no');
      if(!error && data) {
        allVendors = data;
      }
    } catch(err) { console.error(err); }
  };

  const fetchInvoices = async () => {
    getEl('listLoading').classList.remove('hidden');
    try {
      const { data, error } = await window.supabaseClient
        .from('invoices')
        .select('*, vendors(name)')
        .order('created_at', {ascending: false});
      if(error) throw error;
      allInvoices = data || [];
      renderList();
    } catch(err) { console.error(err); }
    finally { getEl('listLoading').classList.add('hidden'); }
  };

  const renderList = () => {
    const tbody = getEl('invoicesTbody');
    tbody.innerHTML = '';
    
    let filtered = allInvoices;
    if(filterTab !== 'all') filtered = allInvoices.filter(i => i.type === filterTab);

    if(filtered.length === 0) {
      getEl('listEmpty').classList.remove('hidden');
      return;
    }
    getEl('listEmpty').classList.add('hidden');

    const todayStr = new Date().toISOString().split('T')[0];

    filtered.forEach(inv => {
      let displayStatus = inv.status;
      if (inv.status === 'Pending' && inv.due_date < todayStr) displayStatus = 'Overdue';

      let statusColor = 'bg-amber-50 text-amber-600 border border-amber-200';
      if(displayStatus === 'Paid') statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      if(displayStatus === 'Overdue') statusColor = 'bg-red-50 text-red-600 border border-red-200 font-bold';

      let typeBadge = inv.type === 'Sent' ? '<i data-lucide="arrow-up-right" class="w-4 h-4 text-vb-blue inline"></i> Sent' : '<i data-lucide="arrow-down-left" class="w-4 h-4 text-purple-600 inline"></i> Received';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors cursor-pointer group';
      tr.innerHTML = `
        <td class="py-4 px-5 font-bold text-sm">${typeBadge}</td>
        <td class="py-4 px-5 font-mono text-xs font-bold text-slate-700">${inv.invoice_id || inv.po_number}</td>
        <td class="py-4 px-5 font-medium text-slate-600">${inv.vendors?.name || 'Unknown'}</td>
        <td class="py-4 px-5 text-slate-500 ${displayStatus === 'Overdue' ? 'text-red-500 font-bold':''}"><i data-lucide="calendar" class="w-3 h-3 inline"></i> ${inv.due_date}</td>
        <td class="py-4 px-5 text-right font-mono font-bold text-slate-900">$${parseFloat(inv.grand_total).toLocaleString()}</td>
        <td class="py-4 px-5 text-center"><span class="px-2 py-1.5 rounded-md text-[10px] uppercase tracking-wide ${statusColor}">${displayStatus}</span></td>
        <td class="py-4 px-5 text-right"><button class="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-vb-blue bg-blue-50 px-3 py-1.5 rounded-lg">View</button></td>
      `;
      tr.addEventListener('click', () => openDetail(inv.id, displayStatus));
      tbody.appendChild(tr);
    });
    lucide.createIcons();
  };

  const openDetail = (id, computedStatus) => {
    currentInvoice = allInvoices.find(i => i.id === id);
    if(!currentInvoice) return;

    getEl('listViewContainer').classList.add('hidden');
    getEl('detailViewContainer').classList.remove('hidden');

    getEl('detTitle').innerText = currentInvoice.type === 'Sent' ? 'Invoice (Sent)' : 'Invoice (Received)';
    getEl('detSubtitle').innerText = currentInvoice.invoice_id || currentInvoice.po_number;
    
    // Org Info generator
    const buildOrg = (name, contact, email, gst) => `
      <p class="font-bold text-base text-vb-blue">${name}</p>
      ${contact ? `<p class="flex items-center gap-1.5 text-slate-600 mt-1"><i data-lucide="phone" class="w-3 h-3"></i> ${contact}</p>` : ''}
      ${email ? `<p class="flex items-center gap-1.5 text-slate-600 mt-0.5"><i data-lucide="mail" class="w-3 h-3"></i> ${email}</p>` : ''}
      ${gst ? `<p class="mt-2 text-xs font-bold text-slate-400 uppercase tracking-wide">GSTIN: ${gst}</p>` : ''}
    `;

    const myOrgHTML = buildOrg('My Organization', '+1 555 123 4567', 'billing@myorg.com', 'GST-99887766');
    const vendorHTML = buildOrg(
      currentInvoice.vendors?.name || 'Vendor', 
      currentInvoice.contact || '', 
      currentInvoice.email || '', 
      currentInvoice.gst_number || ''
    );

    if(currentInvoice.type === 'Sent') {
      getEl('detFromInfo').innerHTML = myOrgHTML;
      getEl('detToInfo').innerHTML = vendorHTML;
    } else {
      getEl('detFromInfo').innerHTML = vendorHTML;
      getEl('detToInfo').innerHTML = myOrgHTML;
    }

    getEl('detInvId').innerText = currentInvoice.invoice_id || 'N/A';
    getEl('detPoNum').innerText = currentInvoice.po_number;
    getEl('detIssue').innerText = currentInvoice.issue_date;
    getEl('detDue').innerText = currentInvoice.due_date;
    getEl('detTc').innerText = currentInvoice.terms_conditions || 'No special terms provided.';

    const tb = getEl('detItemsTbody');
    tb.innerHTML = '';
    (currentInvoice.items || []).forEach(it => {
      tb.innerHTML += `<tr class="hover:bg-slate-50">
        <td class="py-4 px-6 text-slate-900">${it.name}</td>
        <td class="py-4 px-6 text-center">${it.qty}</td>
        <td class="py-4 px-6 text-right font-mono">$${parseFloat(it.price).toLocaleString()}</td>
        <td class="py-4 px-6 text-right font-mono font-bold">$${(it.qty * it.price).toLocaleString()}</td>
      </tr>`;
    });

    getEl('detSubtotal').innerText = `$${parseFloat(currentInvoice.subtotal).toLocaleString()}`;
    getEl('detTaxLabel').innerText = `Tax (${currentInvoice.tax_percentage}%)`;
    getEl('detTaxAmount').innerText = `$${((currentInvoice.subtotal * currentInvoice.tax_percentage)/100).toLocaleString()}`;
    getEl('detGrandTotal').innerText = `$${parseFloat(currentInvoice.grand_total).toLocaleString()}`;

    // Sync dropdown with current status
    getEl('selUpdateStatus').value = computedStatus;
    updateStatusBadgeVisual(computedStatus);

    lucide.createIcons();
  };

  const updateStatusBadgeVisual = (statusStr) => {
    let statusColor = 'bg-amber-100 text-amber-800 border-amber-200';
    if(statusStr === 'Paid') statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if(statusStr === 'Overdue') statusColor = 'bg-red-100 text-red-800 border-red-200';
    
    getEl('detStatusBadge').className = `border text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${statusColor}`;
    getEl('detStatusBadge').innerText = statusStr;
  }

  const handleStatusUpdate = async (e) => {
    if(!currentInvoice) return;
    const newStatus = e.target.value;
    try {
      // If it's dynamically Overdue, the actual DB status might be Pending, but user can explicitly force Overdue
      const { error } = await window.supabaseClient.from('invoices').update({status: newStatus}).eq('id', currentInvoice.id);
      if(error) throw error;
      currentInvoice.status = newStatus;
      updateStatusBadgeVisual(newStatus);
      renderList(); // Update background list
    } catch(err) { alert('Failed to update status.'); console.error(err); }
  };

  const openCreateModal = () => {
    getEl('createModal').classList.remove('hidden');
    setTimeout(() => {
      getEl('createModalPanel').classList.remove('translate-x-full');
    }, 10);
    // Auto-generate a dummy invoice ID
    getEl('frmInvId').value = 'INV-' + new Date().getFullYear() + '-' + Math.floor(Math.random()*1000).toString().padStart(3,'0');
    getEl('frmPo').value = 'PO-' + new Date().getFullYear() + '-' + Math.floor(Math.random()*1000).toString().padStart(3,'0');
    frmItemsList = [{name: '', qty: 1, price: 0}];
    renderFrmItems();
    calculateFrmTotals();
  };

  const closeCreateModal = () => {
    getEl('createModalPanel').classList.add('translate-x-full');
    setTimeout(() => {
      getEl('createModal').classList.add('hidden');
    }, 300);
  };

  const renderFrmItems = () => {
    const tb = getEl('frmItemsBody');
    tb.innerHTML = '';
    frmItemsList.forEach((it, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-2"><input type="text" class="w-full border rounded p-1.5 text-xs outline-none" value="${it.name}" oninput="window.updItem(${idx}, 'name', this.value)"></td>
        <td class="p-2"><input type="number" min="1" class="w-full border rounded p-1.5 text-xs outline-none text-center" value="${it.qty}" oninput="window.updItem(${idx}, 'qty', this.value)"></td>
        <td class="p-2"><input type="number" min="0" class="w-full border rounded p-1.5 text-xs outline-none text-right font-mono" value="${it.price}" oninput="window.updItem(${idx}, 'price', this.value)"></td>
        <td class="p-2 text-right"><button onclick="window.delItem(${idx})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
      `;
      tb.appendChild(tr);
    });
    lucide.createIcons();
  };

  window.updItem = (idx, field, val) => {
    if(field==='qty' || field==='price') frmItemsList[idx][field] = parseFloat(val) || 0;
    else frmItemsList[idx][field] = val;
    calculateFrmTotals();
  };
  window.delItem = (idx) => {
    frmItemsList.splice(idx, 1);
    renderFrmItems();
    calculateFrmTotals();
  };

  const calculateFrmTotals = () => {
    const sub = frmItemsList.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
    const taxPct = parseFloat(getEl('frmTax').value) || 0;
    const taxAmt = sub * (taxPct / 100);
    getEl('lblSub').innerText = sub.toLocaleString();
    getEl('lblTax').innerText = taxAmt.toLocaleString();
    getEl('lblTotal').innerText = (sub + taxAmt).toLocaleString();
  };

  const handleSaveInvoice = async () => {
    const type = 'Sent';
    const invoice_id = getEl('frmInvId').value.trim();
    const po = getEl('frmPo').value.trim();
    const contact = getEl('frmContact').value.trim();
    const email = getEl('frmEmail').value.trim();
    const gst_number = getEl('frmGst').value.trim();
    const terms_conditions = getEl('frmTc').value.trim();
    const issue = getEl('frmIssue').value;
    const due = getEl('frmDue').value;

    let vendor_id = getEl('frmVendor').value;
    const vendor_search = getEl('frmVendorSearch').value.trim();
    
    if(!vendor_search || !email || !issue || !due) return alert('Please fill out all required header fields: Vendor Name, Email, Issue Date, Due Date.');
    if(frmItemsList.length === 0 || frmItemsList.some(i => i.name.trim() === '' || i.price <= 0)) return alert('Please provide valid line items with prices.');

    if (!vendor_id && vendor_search) {
      const exactMatch = allVendors.find(v => (v.name || '').toLowerCase() === vendor_search.toLowerCase());
      if (exactMatch) {
        vendor_id = exactMatch.id;
      } else {
        // Create new vendor dynamically
        const { data: vData } = await window.supabaseClient.from('vendors').insert([{
            name: vendor_search,
            category: 'Other',
            gst_no: gst_number || 'N/A',
            contact: contact || '',
            status: 'Active',
            relationship: 'One-time'
        }]).select();
        if (vData && vData.length > 0) vendor_id = vData[0].id;
      }
    }

    const sub = frmItemsList.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
    const taxPct = parseFloat(getEl('frmTax').value) || 0;
    const grand = sub + (sub * taxPct / 100);

    const payload = {
      type, vendor_id, po_number: po, invoice_id, contact, email, gst_number, terms_conditions,
      subtotal: sub, tax_percentage: taxPct, grand_total: grand,
      issue_date: issue, due_date: due, status: 'Pending', items: frmItemsList
    };

    getEl('btnSaveInvoice').disabled = true;
    getEl('btnSaveInvoice').innerText = "Saving...";

    try {
      const { error } = await window.supabaseClient.from('invoices').insert([payload]);
      if(error) throw error;
      closeCreateModal();
      await fetchInvoices(); // Refresh list
    } catch(err) {
      console.error(err); alert("Failed to save invoice.");
    } finally {
      getEl('btnSaveInvoice').disabled = false;
      getEl('btnSaveInvoice').innerHTML = "Save Invoice";
    }
  };

  init();

  // --- SIDEBAR LOGIC ---
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
      if(collapseBtn) collapseBtn.innerHTML = `<i data-lucide="chevrons-left" class="w-5 h-5 shrink-0"></i><span class="sidebar-label">Collapse</span>`;
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
});
