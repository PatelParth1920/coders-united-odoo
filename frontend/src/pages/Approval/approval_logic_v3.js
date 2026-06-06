
document.addEventListener('DOMContentLoaded', () => {

  const getEl = id => document.getElementById(id);
  const safeAdd = (id, e, cb) => { const el = getEl(id); if(el) el.addEventListener(e, cb); };

  // Types
  let currentTab = 'tender'; // 'tender' or 'quotation'
  let allTenders = [];
  let allQuotations = [];
  let currentItem = null;

  // Stages
  const Q_STAGES = ['Submitted', 'L1 Review', 'L2 Approval', 'PO Generated', 'Rejected'];
  const T_STAGES = ['Pending Approval', 'Issued', 'Rejected'];

  // --- UI TABS ---
  safeAdd('tabTender', 'click', () => switchTab('tender'));
  safeAdd('tabQuotation', 'click', () => switchTab('quotation'));

  const switchTab = (tab) => {
    currentTab = tab;
    if(tab === 'tender') {
      getEl('tabTender').className = "pb-3 px-2 text-sm font-bold border-b-2 transition-all border-vb-blue text-vb-blue";
      getEl('tabQuotation').className = "pb-3 px-2 text-sm font-bold border-b-2 transition-all border-transparent text-slate-500 hover:text-slate-700";
      fetchTenders();
    } else {
      getEl('tabQuotation').className = "pb-3 px-2 text-sm font-bold border-b-2 transition-all border-vb-blue text-vb-blue";
      getEl('tabTender').className = "pb-3 px-2 text-sm font-bold border-b-2 transition-all border-transparent text-slate-500 hover:text-slate-700";
      fetchQuotations();
    }
  };

  // --- UI VIEW TOGGLE ---
  const showList = () => {
    getEl('listContainer').classList.remove('hidden');
    getEl('detailContainer').classList.add('hidden');
    if(currentTab === 'tender') fetchTenders();
    else fetchQuotations();
  };
  safeAdd('backToListBtn', 'click', showList);

  // --- FETCH DATA ---
  const fetchTenders = async () => {
    getEl('manageLoadingState').classList.remove('hidden');
    try {
      // Fetch all RFQs to see their approval status
      const { data, error } = await window.supabaseClient
        .from('rfqs')
        .select('*')
        .order('created_at', {ascending: false});
      
      if(error) throw error;
      allTenders = data || [];
      renderTable();
    } catch(err) { console.error(err); } 
    finally { getEl('manageLoadingState').classList.add('hidden'); }
  };

  const fetchQuotations = async () => {
    getEl('manageLoadingState').classList.remove('hidden');
    try {
      const { data, error } = await window.supabaseClient
        .from('approvals')
        .select('*, rfq:rfq_id(title), vendor:vendor_id(name)')
        .order('created_at', {ascending: false});
      
      if(error) throw error;
      allQuotations = data || [];
      renderTable();
    } catch(err) { console.error(err); } 
    finally { getEl('manageLoadingState').classList.add('hidden'); }
  };

  // --- RENDER TABLE ---
  const renderTable = () => {
    const tbody = getEl('approvalsTbody');
    const thead = getEl('approvalsThead');
    tbody.innerHTML = '';
    
    if(currentTab === 'tender') {
      thead.innerHTML = `
        <tr class="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <th class="py-4 px-5">RFQ Title</th>
          <th class="py-4 px-5 text-center">Category</th>
          <th class="py-4 px-5 text-center">Deadline</th>
          <th class="py-4 px-5 text-center">Stage</th>
          <th class="py-4 px-5 text-right">Actions</th>
        </tr>`;
        
      if(allTenders.length === 0) { getEl('manageEmptyState').classList.remove('hidden'); return; }
      getEl('manageEmptyState').classList.add('hidden');

      allTenders.forEach(t => {
        let stageColor = 'bg-blue-50 text-vb-blue';
        if(t.status === 'Pending Approval') stageColor = 'bg-amber-50 text-amber-600';
        if(t.status === 'Issued') stageColor = 'bg-emerald-50 text-emerald-600';
        if(t.status === 'Rejected' || t.status === 'Canceled') stageColor = 'bg-red-50 text-red-600';

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors cursor-pointer";
        tr.innerHTML = `
          <td class="py-4 px-5 font-bold text-sm">${t.title}</td>
          <td class="py-4 px-5 text-center font-medium text-slate-600">${t.category || 'Other'}</td>
          <td class="py-4 px-5 text-center text-slate-600">${t.deadline}</td>
          <td class="py-4 px-5 text-center"><span class="px-2 py-1 rounded-md text-[10px] font-bold uppercase ${stageColor}">${t.status}</span></td>
          <td class="py-4 px-5 text-right"><button class="text-xs font-bold text-vb-blue bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">Review <i data-lucide="arrow-right" class="w-3 h-3 inline"></i></button></td>
        `;
        tr.addEventListener('click', () => openDetail(t.id, 'tender'));
        tbody.appendChild(tr);
      });
    } else {
      thead.innerHTML = `
        <tr class="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <th class="py-4 px-5">RFQ Title</th>
          <th class="py-4 px-5">Vendor</th>
          <th class="py-4 px-5 text-right">Amount</th>
          <th class="py-4 px-5 text-center">Stage</th>
          <th class="py-4 px-5 text-right">Actions</th>
        </tr>`;

      if(allQuotations.length === 0) { getEl('manageEmptyState').classList.remove('hidden'); return; }
      getEl('manageEmptyState').classList.add('hidden');

      allQuotations.forEach(app => {
        let stageColor = 'bg-blue-50 text-vb-blue';
        if(app.stage === 'Rejected') stageColor = 'bg-red-50 text-red-600';
        if(app.stage === 'PO Generated') stageColor = 'bg-emerald-50 text-emerald-600';

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors cursor-pointer";
        tr.innerHTML = `
          <td class="py-4 px-5 font-bold text-sm">${app.rfq?.title || 'Unknown RFQ'}</td>
          <td class="py-4 px-5 font-medium text-slate-600">${app.vendor?.name || 'Unknown Vendor'}</td>
          <td class="py-4 px-5 text-right font-mono font-bold text-slate-800">$${parseFloat(app.amount).toLocaleString()}</td>
          <td class="py-4 px-5 text-center"><span class="px-2 py-1 rounded-md text-[10px] font-bold uppercase ${stageColor}">${app.stage}</span></td>
          <td class="py-4 px-5 text-right"><button class="text-xs font-bold text-vb-blue bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">Review <i data-lucide="arrow-right" class="w-3 h-3 inline"></i></button></td>
        `;
        tr.addEventListener('click', () => openDetail(app.id, 'quotation'));
        tbody.appendChild(tr);
      });
    }
    lucide.createIcons();
  };

  // --- DETAIL VIEW ---
  const openDetail = (id, type) => {
    getEl('listContainer').classList.add('hidden');
    getEl('detailContainer').classList.remove('hidden');
    getEl('remarkInput').value = '';

    if(type === 'tender') {
      currentItem = allTenders.find(t => t.id === id);
      getEl('detailSubtitle').innerText = `Tender Approval for RFQ: ${currentItem.rfq_code}`;
      getEl('sumVendor').innerText = 'Internal Approval';
      getEl('sumVendor').previousElementSibling.innerText = 'Type:';
      getEl('sumAmount').innerText = currentItem.category || 'Other';
      getEl('sumAmount').previousElementSibling.innerText = 'Category:';
      getEl('sumDate').innerText = currentItem.deadline;
      getEl('sumDate').previousElementSibling.innerText = 'Deadline:';
      
      renderStepper(T_STAGES, currentItem.status);
      renderChain(currentItem.remarks || []);

      const isTerminal = ['Issued', 'Rejected', 'Canceled'].includes(currentItem.status);
      updateActionButtons(isTerminal, 'Approve Tender');
    } else {
      currentItem = allQuotations.find(a => a.id === id);
      getEl('detailSubtitle').innerText = `RFQ: ${currentItem.rfq?.title} - Vendor: ${currentItem.vendor?.name}`;
      getEl('sumVendor').innerText = currentItem.vendor?.name;
      getEl('sumVendor').previousElementSibling.innerText = 'Vendor:';
      getEl('sumAmount').innerText = '$' + parseFloat(currentItem.amount).toLocaleString();
      getEl('sumAmount').previousElementSibling.innerText = 'Total:';
      getEl('sumDate').innerText = new Date(currentItem.created_at).toLocaleDateString();
      getEl('sumDate').previousElementSibling.innerText = 'Submitted:';

      renderStepper(Q_STAGES, currentItem.stage);
      renderChain(currentItem.remarks || []);

      const isTerminal = ['PO Generated', 'Rejected'].includes(currentItem.stage);
      updateActionButtons(isTerminal, 'Proceed to Next Stage');
    }
    
    // Always load item details
    loadItems(id, type);
  };

  const loadItems = async (id, type) => {
    getEl('itemsDetailContainer').classList.remove('hidden');
    getEl('itemsLoading').classList.remove('hidden');
    getEl('itemsTableWrapper').classList.add('hidden');
    getEl('extraQuoteDetails').classList.add('hidden');
    
    const tbody = getEl('itemsTbody');
    const thead = getEl('itemsThead');
    tbody.innerHTML = '';
    
    try {
      if(type === 'tender') {
        const { data, error } = await window.supabaseClient.from('rfq_items').select('*').eq('rfq_id', currentItem.id);
        if(error) throw error;
        
        thead.innerHTML = `<tr><th class="py-2 px-3">Item</th><th class="py-2 px-3 text-center">Qty</th><th class="py-2 px-3 text-right">Est. Price</th></tr>`;
        (data || []).forEach(it => {
          tbody.innerHTML += `<tr>
            <td class="py-2 px-3">${it.item_name}</td>
            <td class="py-2 px-3 text-center">${it.quantity} ${it.unit}</td>
            <td class="py-2 px-3 text-right font-mono">$${(it.estimated_price || 0).toLocaleString()}</td>
          </tr>`;
        });
      } else {
        // Quotation: fetch quotations row matching rfq_id and vendor_id
        const { data: qData, error: qErr } = await window.supabaseClient
          .from('quotations')
          .select('*, quotation_items(*, rfq_items(item_name, quantity, unit))')
          .eq('rfq_id', currentItem.rfq_id)
          .eq('vendor_id', currentItem.vendor_id)
          .limit(1);
          
        if(qErr) throw qErr;
        
        if(qData && qData.length > 0) {
          const q = qData[0];
          thead.innerHTML = `<tr><th class="py-2 px-3">Item</th><th class="py-2 px-3 text-center">Qty</th><th class="py-2 px-3 text-right">Unit Price</th><th class="py-2 px-3 text-right">Total</th></tr>`;
          
          (q.quotation_items || []).forEach(qi => {
            tbody.innerHTML += `<tr>
              <td class="py-2 px-3">${qi.rfq_items?.item_name || 'Unknown'}</td>
              <td class="py-2 px-3 text-center">${qi.rfq_items?.quantity || 0} ${qi.rfq_items?.unit || ''}</td>
              <td class="py-2 px-3 text-right font-mono">$${(qi.unit_price || 0).toLocaleString()}</td>
              <td class="py-2 px-3 text-right font-mono font-bold">$${(qi.total_price || 0).toLocaleString()}</td>
            </tr>`;
          });
          
          getEl('extraQuoteDetails').innerHTML = `
            <div class="flex justify-between text-[11px]"><span class="text-slate-500">Tax (${q.tax_percentage || 0}%)</span><span class="font-bold">+$${((q.subtotal||0)*(q.tax_percentage||0)/100).toLocaleString()}</span></div>
            <div class="flex justify-between text-[11px]"><span class="text-slate-500">Delivery</span><span class="font-bold">${q.delivery_days || 0} Days</span></div>
          `;
          getEl('extraQuoteDetails').classList.remove('hidden');
        } else {
          tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-slate-500 italic">No detailed items found (likely dummy data)</td></tr>`;
        }
      }
      
      getEl('itemsLoading').classList.add('hidden');
      getEl('itemsTableWrapper').classList.remove('hidden');
      lucide.createIcons();
    } catch(err) {
      console.error(err);
      getEl('itemsLoading').innerHTML = '<span class="text-red-500">Failed to load details.</span>';
    }
  };

  const updateActionButtons = (isTerminal, approveText) => {
    getEl('approveActionBtn').disabled = isTerminal;
    getEl('rejectActionBtn').disabled = isTerminal;
    getEl('approveActionBtn').innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i> ${approveText}`;
    
    getEl('approveActionBtn').className = isTerminal ? 'bg-slate-300 text-white rounded-xl py-3 px-4 font-semibold text-sm shadow-sm flex justify-center items-center gap-2 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 px-4 font-semibold text-sm shadow-sm flex justify-center items-center gap-2';
    getEl('rejectActionBtn').className = isTerminal ? 'bg-white border border-slate-200 text-slate-400 rounded-xl py-3 px-4 font-semibold text-sm shadow-sm flex justify-center items-center gap-2 cursor-not-allowed' : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl py-3 px-4 font-semibold text-sm shadow-sm flex justify-center items-center gap-2';
    lucide.createIcons();
  };

  const renderStepper = (stagesArr, currentStatus) => {
    const nodes = getEl('stepperNodes');
    nodes.innerHTML = '';
    
    // Normalize status for visual mapping if needed
    let visualStatus = currentStatus;
    if(currentTab === 'tender' && currentStatus === 'Canceled') visualStatus = 'Rejected';

    const currIdx = stagesArr.indexOf(visualStatus);
    let pct = 0;
    if(visualStatus === 'Rejected') {
      pct = 100; getEl('stepperProgressBar').className = 'absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-red-500 transition-all duration-500';
    } else {
      pct = currIdx < 0 ? 0 : (currIdx / (stagesArr.length-2)) * 100; // -2 because last is Rejected usually
      getEl('stepperProgressBar').className = 'absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-vb-blue transition-all duration-500';
      if (pct > 100) pct = 100;
    }
    getEl('stepperProgressBar').style.width = `${pct}%`;

    // Only render non-rejected steps in the line
    const displayStages = stagesArr.filter(s => s !== 'Rejected');

    displayStages.forEach((step, idx) => {
      const isPast = idx < currIdx || (currIdx === displayStages.length - 1);
      const isCurrent = idx === currIdx;
      const isRejected = visualStatus === 'Rejected';

      let circleClass = 'w-10 h-10 rounded-full bg-white text-slate-400 border-2 border-slate-200 flex items-center justify-center font-bold text-sm ring-4 ring-slate-50 z-10 relative';
      let content = (idx+1).toString();
      
      if(isRejected) {
        circleClass = 'w-10 h-10 rounded-full bg-white border-2 border-red-500 text-red-500 flex items-center justify-center shadow-sm ring-4 ring-slate-50 z-10 relative';
        content = '<i data-lucide="x" class="w-5 h-5"></i>';
      } else if (isPast && !isCurrent) {
        circleClass = 'w-10 h-10 rounded-full bg-white border-2 border-emerald-500 text-emerald-500 flex items-center justify-center shadow-sm ring-4 ring-slate-50 z-10 relative';
        content = '<i data-lucide="check" class="w-5 h-5"></i>';
      } else if (isCurrent || (isPast && idx === displayStages.length - 1)) {
        circleClass = 'w-10 h-10 rounded-full bg-vb-blue text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-slate-50 z-10 relative';
      }

      const div = document.createElement('div');
      div.className = "flex flex-col items-center gap-2 relative";
      div.innerHTML = `
        <div class="${circleClass}">${content}</div>
        <span class="text-xs font-semibold absolute -bottom-6 whitespace-nowrap ${isCurrent?'text-vb-blue':(isPast?'text-slate-700':'text-slate-400')}">${step}</span>
      `;
      nodes.appendChild(div);
    });
    lucide.createIcons();
  };

  const renderChain = (remarks) => {
    const list = getEl('approvalChainList');
    list.innerHTML = '';
    
    if(!remarks || remarks.length === 0) {
      list.innerHTML = '<p class="text-xs text-slate-500 ml-10">No remarks yet.</p>';
      return;
    }

    remarks.forEach(rem => {
      const div = document.createElement('div');
      div.className = "relative flex items-start justify-between mb-6 pb-6 border-b border-slate-200/60 last:mb-0 last:pb-0 last:border-0 pl-14";
      
      const isRej = rem.action === 'Rejected';
      const iconColor = isRej ? 'text-red-600 bg-red-50 border-red-500' : 'text-emerald-600 bg-emerald-50 border-emerald-500';
      const iconStr = isRej ? 'x' : 'check';
      
      div.innerHTML = `
        <div class="absolute left-0 w-10 h-10 rounded-full border-2 ${iconColor} flex items-center justify-center shadow-sm z-10 bg-white">
          <i data-lucide="${iconStr}" class="w-5 h-5"></i>
        </div>
        <div class="flex flex-col space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-slate-900">Admin</span>
            <span class="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Procurement</span>
          </div>
          <span class="text-xs font-medium ${isRej?'text-red-600':'text-emerald-600'} flex items-center gap-1.5">
            ${rem.action} to ${rem.new_stage}
          </span>
          <p class="text-sm text-slate-700 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">${rem.text || 'No remarks provided.'}</p>
        </div>
      `;
      list.appendChild(div);
    });
    lucide.createIcons();
  };

  const processAction = async (actionStr) => {
    if(!currentItem) return;
    const text = getEl('remarkInput').value.trim();
    
    if(currentTab === 'tender') {
      let nextStage = currentItem.status;
      if(actionStr === 'Rejected') nextStage = 'Rejected';
      else if(actionStr === 'Approved') nextStage = 'Issued';

      const newRemark = { action: actionStr, new_stage: nextStage, text, timestamp: new Date().toISOString() };
      const updatedRemarks = [...(currentItem.remarks || []), newRemark];

      try {
        const { error } = await window.supabaseClient.from('rfqs')
          .update({ status: nextStage, remarks: updatedRemarks })
          .eq('id', currentItem.id);
        
        if(error) throw error;
        currentItem.status = nextStage;
        currentItem.remarks = updatedRemarks;
        openDetail(currentItem.id, 'tender');
      } catch(err) { console.error(err); alert("Failed to update tender."); }

    } else {
      let nextStage = currentItem.stage;
      if(actionStr === 'Rejected') {
        nextStage = 'Rejected';
      } else {
        const currIdx = Q_STAGES.indexOf(currentItem.stage);
        if(currIdx < Q_STAGES.length - 2) nextStage = Q_STAGES[currIdx + 1];
      }

      const newRemark = { action: actionStr, new_stage: nextStage, text, timestamp: new Date().toISOString() };
      const updatedRemarks = [...(currentItem.remarks || []), newRemark];

      try {
        const { error } = await window.supabaseClient.from('approvals')
          .update({ stage: nextStage, remarks: updatedRemarks })
          .eq('id', currentItem.id);
        
        if(error) throw error;
        currentItem.stage = nextStage;
        currentItem.remarks = updatedRemarks;
        openDetail(currentItem.id, 'quotation');
      } catch(err) { console.error(err); alert("Failed to update quotation approval."); }
    }
  };

  safeAdd('approveActionBtn', 'click', () => processAction('Approved'));
  safeAdd('rejectActionBtn', 'click', () => processAction('Rejected'));

  // Init
  switchTab('tender');
});
