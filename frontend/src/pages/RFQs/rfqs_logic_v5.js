
document.addEventListener('DOMContentLoaded', () => {

  // --- UTILS ---
  const safeAddListener = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };
  const getEl = (id) => document.getElementById(id);

  // --- UI TOGGLING (Manage vs Create) ---
  let isManageMode = false;
  safeAddListener('toggleManageBtn', 'click', () => {
    isManageMode = !isManageMode;
    const btn = getEl('toggleManageBtn');
    if (isManageMode) {
      getEl('createWizardContainer').classList.remove('hidden');
      getEl('manageRfqsContainer').classList.add('hidden');
      btn.innerHTML = '<i data-lucide="list" class="w-4 h-4"></i> View RFQs';
      getEl('pageTitleText').innerText = 'Create RFQ';
      getEl('pageSubtitleText').innerText = 'Wizard to create a new RFQ';
    } else {
      getEl('createWizardContainer').classList.add('hidden');
      getEl('manageRfqsContainer').classList.remove('hidden');
      btn.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i> Create New RFQ';
      getEl('pageTitleText').innerText = "Manage RFQ's";
      getEl('pageSubtitleText').innerText = 'View and edit your created requests';
      fetchManageRfqs();
    }
    lucide.createIcons();
  });

  // --- CREATE RFQ WIZARD LOGIC ---
  let createLineItems = [];
  let createVendors = [];
  
  const renderCreateItems = () => {
    const tbody = getEl('rfqItemsTbody');
    tbody.innerHTML = '';
    createLineItems.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-2 px-4"><input type="text" class="w-full bg-slate-50 border rounded p-1 text-xs" value="${item.name}" oninput="updateCreateItem(${idx}, 'name', this.value)"></td>
        <td class="py-2 px-4"><input type="number" class="w-full bg-slate-50 border rounded p-1 text-xs" value="${item.qty}" oninput="updateCreateItem(${idx}, 'qty', this.value)"></td>
        <td class="py-2 px-4">
          <select class="w-full bg-slate-50 border rounded p-1 text-xs" onchange="updateCreateItem(${idx}, 'unit', this.value)">
            <option value="pcs" ${item.unit==='pcs'?'selected':''}>pcs</option>
            <option value="boxes" ${item.unit==='boxes'?'selected':''}>boxes</option>
            <option value="kg" ${item.unit==='kg'?'selected':''}>kg</option>
          </select>
        </td>
        <td class="py-2 px-4 text-center"><button class="text-red-500 hover:text-red-700" onclick="removeCreateItem(${idx})"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
      `;
      tbody.appendChild(tr);
    });
    lucide.createIcons();
  };
  window.updateCreateItem = (idx, field, val) => { createLineItems[idx][field] = val; };
  window.removeCreateItem = (idx) => { createLineItems.splice(idx, 1); renderCreateItems(); };
  safeAddListener('addLineItemBtn', 'click', () => { createLineItems.push({name:'', qty:1, unit:'pcs'}); renderCreateItems(); });

  const renderCreateVendors = () => {
    const ul = getEl('rfqVendorsList');
    ul.innerHTML = '';
    if(createVendors.length===0) ul.innerHTML = '<li class="p-4 text-center text-xs text-slate-500">No vendors added.</li>';
    createVendors.forEach((v, idx) => {
      const li = document.createElement('li');
      li.className = "flex justify-between items-center p-3 text-sm";
      li.innerHTML = `<span>${v.name}</span><button onclick="removeCreateVendor(${idx})" class="text-red-500"><i data-lucide="x" class="w-4 h-4"></i></button>`;
      ul.appendChild(li);
    });
    lucide.createIcons();
  };
  window.removeCreateVendor = (idx) => { createVendors.splice(idx, 1); renderCreateVendors(); };

  safeAddListener('saveRfqBtn', 'click', async () => {
    const title = getEl('rfqTitle').value;
    const deadline = getEl('rfqDeadline').value;
    const category = getEl('rfqCategory').value;
    const desc = getEl('rfqDescription').value;
    if(!title || !deadline) return alert("Title and Deadline required!");
    if(createLineItems.length===0) return alert("Add line items!");

    const rfq_code = 'RFQ-' + Math.random().toString(36).substring(2,6).toUpperCase();
    const btn = getEl('saveRfqBtn');
    btn.innerHTML = 'Saving...'; btn.disabled = true;
    try {
      const { data, error } = await window.supabaseClient.from('rfqs').insert([{title, category, deadline, description: desc, rfq_code, status: 'Issued'}]).select();
      if(error) throw error;
      const rfqId = data[0].id;
      
      const items = createLineItems.map(i => ({rfq_id: rfqId, item_name: i.name, quantity: i.qty, unit: i.unit}));
      await window.supabaseClient.from('rfq_items').insert(items);
      
      if(createVendors.length>0) {
        const vLinks = createVendors.map(v => ({rfq_id: rfqId, vendor_id: v.id}));
        await window.supabaseClient.from('rfq_vendors').insert(vLinks);
      }
      
      getEl('successRfqCode').innerText = rfq_code;
      getEl('rfqSuccessOverlay').classList.remove('hidden');
      let count = 3;
      setInterval(() => {
        count--;
        getEl('redirectCountdown').innerText = count;
        if(count<=0) window.location.reload();
      }, 1000);
    } catch(err) {
      console.error(err); alert("Failed to save!");
      btn.innerHTML = 'Save & Send to Vendors'; btn.disabled = false;
    }
  });


  // --- VENDOR SELECTION MODAL ---
  let allVendors = [];
  let vendorContext = 'create'; // or 'edit'

  const openVendorModal = async (ctx) => {
    vendorContext = ctx;
    getEl('vendorSelectionModal').classList.remove('hidden');
    const { data } = await window.supabaseClient.from('vendors').select('*');
    allVendors = data || [];
    renderLiveVendors(allVendors);
  };
  safeAddListener('addVendorBtn', 'click', () => openVendorModal('create'));
  safeAddListener('editAddVendorBtn', 'click', () => openVendorModal('edit'));
  
  const closeVendorModal = () => getEl('vendorSelectionModal').classList.add('hidden');
  safeAddListener('closeVendorModalBtn', 'click', closeVendorModal);
  safeAddListener('vendorModalBackdrop', 'click', closeVendorModal);

  const renderLiveVendors = (list) => {
    const ul = getEl('liveVendorsList');
    ul.innerHTML = '';
    list.forEach(v => {
      const li = document.createElement('li');
      li.className = "p-3 border border-slate-100 rounded-lg flex justify-between items-center cursor-pointer hover:border-vb-blue";
      li.innerHTML = `<div><p class="font-bold text-sm">${v.name}</p><p class="text-xs text-slate-500">${v.category}</p></div>`;
      li.addEventListener('click', () => {
        if(vendorContext === 'create') {
          if(!createVendors.find(x=>x.id===v.id)) createVendors.push(v);
          renderCreateVendors();
        } else {
          if(!editVendors.find(x=>x.id===v.id)) editVendors.push(v);
          renderEditVendors();
          checkEditChanges();
        }
        closeVendorModal();
      });
      ul.appendChild(li);
    });
  };

  safeAddListener('vendorSearchInput', 'input', (e) => {
    const q = e.target.value.toLowerCase();
    renderLiveVendors(allVendors.filter(v => v.name.toLowerCase().includes(q)));
  });


  // --- MANAGE RFQS ---
  let allCreatedRfqs = [];
  const fetchManageRfqs = async () => {
    getEl('manageLoadingState').classList.remove('hidden');
    getEl('manageEmptyState').classList.add('hidden');
    try {
      const { data, error } = await window.supabaseClient.from('rfqs').select('*').order('created_at', {ascending: false});
      if(error) throw error;
      allCreatedRfqs = data || [];
      renderManageTable();
    } catch(err) {
      console.error(err);
    } finally {
      getEl('manageLoadingState').classList.add('hidden');
    }
  };

  const renderManageTable = () => {
    const tbody = getEl('manageRfqsTbody');
    tbody.innerHTML = '';
    if(allCreatedRfqs.length===0) return getEl('manageEmptyState').classList.remove('hidden');
    
    allCreatedRfqs.forEach(rfq => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-4 px-5">
          <p class="font-bold text-sm">${rfq.title}</p>
          <p class="text-xs text-slate-500">${rfq.category||'Other'}</p>
        </td>
        <td class="py-4 px-5"><span class="bg-blue-50 text-vb-blue px-2 py-1 rounded text-xs font-mono font-bold cursor-pointer hover:bg-blue-100" onclick="copyCode('${rfq.rfq_code}')">${rfq.rfq_code}</span></td>
        <td class="py-4 px-5 text-center text-sm">${rfq.deadline}</td>
        <td class="py-4 px-5 text-center">
          <span class="px-2 py-1 rounded-md text-[10px] font-bold ${rfq.status==='Issued'?'bg-emerald-50 text-emerald-600': rfq.status==='Canceled'?'bg-red-50 text-red-600':'bg-slate-100 text-slate-500'}">${rfq.status||'Draft'}</span>
        </td>
        <td class="py-4 px-5 text-right">
          <button onclick="window.openEditRfq('${rfq.id}')" class="p-1.5 border rounded-lg hover:border-vb-blue hover:text-vb-blue"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
          <button onclick="window.deleteRfq('${rfq.id}')" class="p-1.5 border rounded-lg hover:border-red-500 hover:text-red-500 ml-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    lucide.createIcons();
  };

  window.copyCode = (code) => { navigator.clipboard.writeText(code); alert("Copied: "+code); };
  window.deleteRfq = async (id) => {
    if(!confirm("Delete this RFQ?")) return;
    await window.supabaseClient.from('rfqs').delete().eq('id', id);
    fetchManageRfqs();
  };


  // --- ADVANCED EDIT MODAL ---
  let editingRfqId = null;
  let editLineItems = [];
  let origLineItems = [];
  let editVendors = [];
  let origVendorsIds = [];
  let origHeader = {};

  window.openEditRfq = async (id) => {
    const rfq = allCreatedRfqs.find(r => r.id === id);
    if(!rfq) return;
    editingRfqId = id;
    
    getEl('editRfqTitle').value = rfq.title;
    getEl('editRfqCategory').value = rfq.category || 'Other';
    getEl('editRfqDeadline').value = rfq.deadline;
    getEl('editRfqDescription').value = rfq.description || '';
    origHeader = { title: rfq.title, category: rfq.category||'Other', deadline: rfq.deadline, desc: rfq.description||'' };

    const { data: items } = await window.supabaseClient.from('rfq_items').select('*').eq('rfq_id', id);
    origLineItems = items ? items.map(i => ({name: i.item_name, qty: i.quantity, unit: i.unit})) : [];
    editLineItems = JSON.parse(JSON.stringify(origLineItems));

    const { data: vLinks } = await window.supabaseClient.from('rfq_vendors').select('vendor_id').eq('rfq_id', id);
    if(vLinks && vLinks.length>0) {
      const vIds = vLinks.map(l=>l.vendor_id);
      origVendorsIds = vIds.sort();
      const { data: vDetails } = await window.supabaseClient.from('vendors').select('*').in('id', vIds);
      editVendors = vDetails || [];
    } else {
      origVendorsIds = [];
      editVendors = [];
    }

    renderEditItems();
    renderEditVendors();
    checkEditChanges();
    getEl('editRfqModal').classList.remove('hidden');
  };

  const closeEditModal = () => { getEl('editRfqModal').classList.add('hidden'); };
  safeAddListener('closeEditModalBtn', 'click', closeEditModal);
  safeAddListener('editModalBackdrop', 'click', closeEditModal);

  const renderEditItems = () => {
    const tbody = getEl('editRfqItemsTbody');
    tbody.innerHTML = '';
    editLineItems.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-2 px-2"><input type="text" class="w-full bg-white border rounded p-1 text-xs" value="${item.name}" oninput="updateEditItem(${idx}, 'name', this.value)"></td>
        <td class="py-2 px-2"><input type="number" class="w-full bg-white border rounded p-1 text-xs" value="${item.qty}" oninput="updateEditItem(${idx}, 'qty', this.value)"></td>
        <td class="py-2 px-2">
          <select class="w-full bg-white border rounded p-1 text-xs" onchange="updateEditItem(${idx}, 'unit', this.value)">
            <option value="pcs" ${item.unit==='pcs'?'selected':''}>pcs</option>
            <option value="boxes" ${item.unit==='boxes'?'selected':''}>boxes</option>
            <option value="kg" ${item.unit==='kg'?'selected':''}>kg</option>
          </select>
        </td>
        <td class="py-2 px-2 text-center"><button class="text-red-500 hover:text-red-700" onclick="removeEditItem(${idx})"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
      `;
      tbody.appendChild(tr);
    });
    lucide.createIcons();
  };
  window.updateEditItem = (idx, f, v) => { editLineItems[idx][f] = v; checkEditChanges(); };
  window.removeEditItem = (idx) => { editLineItems.splice(idx,1); renderEditItems(); checkEditChanges(); };
  safeAddListener('editAddLineItemBtn', 'click', () => { editLineItems.push({name:'',qty:1,unit:'pcs'}); renderEditItems(); checkEditChanges(); });

  const renderEditVendors = () => {
    const ul = getEl('editRfqVendorsList');
    ul.innerHTML = '';
    editVendors.forEach((v, idx) => {
      const li = document.createElement('li');
      li.className = "flex justify-between items-center p-3 text-sm";
      li.innerHTML = `<span>${v.name}</span><button onclick="removeEditVendor(${idx})" class="text-red-500"><i data-lucide="x" class="w-4 h-4"></i></button>`;
      ul.appendChild(li);
    });
    lucide.createIcons();
  };
  window.removeEditVendor = (idx) => { editVendors.splice(idx,1); renderEditVendors(); checkEditChanges(); };

  const checkEditChanges = () => {
    const currHeader = { 
      title: getEl('editRfqTitle').value, 
      category: getEl('editRfqCategory').value, 
      deadline: getEl('editRfqDeadline').value, 
      desc: getEl('editRfqDescription').value 
    };
    const headerChg = JSON.stringify(currHeader) !== JSON.stringify(origHeader);
    const itemsChg = JSON.stringify(editLineItems) !== JSON.stringify(origLineItems);
    const currVIds = editVendors.map(v=>v.id).sort();
    const vendorsChg = JSON.stringify(currVIds) !== JSON.stringify(origVendorsIds);

    const msg = getEl('editValidationMessage');
    const saveBtn = getEl('saveEditRfqBtn');
    const reissueBtn = getEl('reissueRfqBtn');

    if(itemsChg) {
      saveBtn.disabled = true; saveBtn.classList.add('opacity-50');
      reissueBtn.disabled = false; reissueBtn.classList.remove('opacity-50');
      msg.className = "mb-4 text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-2 bg-red-50 text-red-700 border border-red-200";
      msg.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4"></i><span>Line items modified. You must Reissue.</span>';
    } else if (headerChg || vendorsChg) {
      saveBtn.disabled = false; saveBtn.classList.remove('opacity-50');
      reissueBtn.disabled = true; reissueBtn.classList.add('opacity-50');
      msg.className = "mb-4 text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200";
      msg.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i><span>Safe changes detected. You may Save.</span>';
    } else {
      saveBtn.disabled = true; saveBtn.classList.add('opacity-50');
      reissueBtn.disabled = true; reissueBtn.classList.add('opacity-50');
      msg.className = "mb-4 text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200";
      msg.innerHTML = '<i data-lucide="info" class="w-4 h-4"></i><span>Make changes to enable actions.</span>';
    }
    lucide.createIcons();
  };

  ['editRfqTitle','editRfqCategory','editRfqDeadline','editRfqDescription'].forEach(id => {
    safeAddListener(id, 'input', checkEditChanges);
    safeAddListener(id, 'change', checkEditChanges);
  });

  safeAddListener('saveEditRfqBtn', 'click', async () => {
    if(getEl('saveEditRfqBtn').disabled) return;
    const title = getEl('editRfqTitle').value;
    const deadline = getEl('editRfqDeadline').value;
    if(!title || !deadline) return alert("Title and Deadline required");
    
    getEl('saveEditRfqBtn').innerText = "Saving...";
    try {
      await window.supabaseClient.from('rfqs').update({
        title, deadline, category: getEl('editRfqCategory').value, description: getEl('editRfqDescription').value
      }).eq('id', editingRfqId);

      await window.supabaseClient.from('rfq_vendors').delete().eq('rfq_id', editingRfqId);
      if(editVendors.length>0) {
        await window.supabaseClient.from('rfq_vendors').insert(editVendors.map(v=>({rfq_id: editingRfqId, vendor_id: v.id})));
      }
      alert("Saved successfully!");
      closeEditModal();
      fetchManageRfqs();
    } catch(e) { console.error(e); alert("Save failed."); }
    getEl('saveEditRfqBtn').innerText = "Save Details";
  });

  safeAddListener('reissueRfqBtn', 'click', async () => {
    if(getEl('reissueRfqBtn').disabled) return;
    if(!confirm("Cancel old RFQ and generate a brand new one?")) return;

    getEl('reissueRfqBtn').innerText = "Reissuing...";
    try {
      await window.supabaseClient.from('rfqs').update({status: 'Canceled'}).eq('id', editingRfqId);
      
      const rfq_code = 'RFQ-' + Math.random().toString(36).substring(2,6).toUpperCase();
      const { data } = await window.supabaseClient.from('rfqs').insert([{
        title: getEl('editRfqTitle').value + " (Reissued)",
        category: getEl('editRfqCategory').value,
        deadline: getEl('editRfqDeadline').value,
        description: getEl('editRfqDescription').value,
        rfq_code,
        status: 'Issued'
      }]).select();
      const newId = data[0].id;

      if(editLineItems.length>0) {
        await window.supabaseClient.from('rfq_items').insert(editLineItems.map(i=>({rfq_id: newId, item_name: i.name, quantity: i.qty, unit: i.unit})));
      }
      if(editVendors.length>0) {
        await window.supabaseClient.from('rfq_vendors').insert(editVendors.map(v=>({rfq_id: newId, vendor_id: v.id})));
      }
      alert("Reissued successfully under " + rfq_code);
      closeEditModal();
      fetchManageRfqs();
    } catch(e) { console.error(e); alert("Reissue failed."); }
    getEl('reissueRfqBtn').innerText = "Cancel & Reissue";
  });

  // Init
  fetchManageRfqs();

});
