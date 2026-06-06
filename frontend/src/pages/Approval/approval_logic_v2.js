
document.addEventListener('DOMContentLoaded', () => {

  const getEl = id => document.getElementById(id);
  const safeAdd = (id, e, cb) => { const el = getEl(id); if(el) el.addEventListener(e, cb); };

  // Stages definition
  const STAGES = ['Submitted', 'L1 Review', 'L2 Approval', 'PO Generated', 'Rejected'];

  let allApprovals = [];
  let currentApproval = null;

  // --- UI TOGGLE ---
  const showList = () => {
    getEl('listContainer').classList.remove('hidden');
    getEl('detailContainer').classList.add('hidden');
    fetchApprovals();
  };
  safeAdd('backToListBtn', 'click', showList);

  // --- FETCH APPROVALS ---
  const fetchApprovals = async () => {
    getEl('manageLoadingState').classList.remove('hidden');
    try {
      const { data, error } = await window.supabaseClient
        .from('approvals')
        .select('*, rfq:rfq_id(title), vendor:vendor_id(name)')
        .order('created_at', {ascending: false});
      
      if(error) throw error;
      allApprovals = data || [];
      renderTable();
    } catch(err) {
      console.error(err);
    } finally {
      getEl('manageLoadingState').classList.add('hidden');
    }
  };

  const renderTable = () => {
    const tbody = getEl('approvalsTbody');
    tbody.innerHTML = '';
    if(allApprovals.length === 0) {
      getEl('manageEmptyState').classList.remove('hidden');
      return;
    }
    getEl('manageEmptyState').classList.add('hidden');

    allApprovals.forEach(app => {
      const stageIdx = STAGES.indexOf(app.stage);
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
        <td class="py-4 px-5 text-right">
          <button class="text-xs font-bold text-vb-blue bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">Review <i data-lucide="arrow-right" class="w-3 h-3 inline"></i></button>
        </td>
      `;
      tr.addEventListener('click', () => openDetail(app.id));
      tbody.appendChild(tr);
    });
    lucide.createIcons();
  };

  // --- DETAIL VIEW ---
  const openDetail = (id) => {
    currentApproval = allApprovals.find(a => a.id === id);
    if(!currentApproval) return;

    getEl('listContainer').classList.add('hidden');
    getEl('detailContainer').classList.remove('hidden');
    
    getEl('detailSubtitle').innerText = `RFQ: ${currentApproval.rfq?.title} - Vendor: ${currentApproval.vendor?.name}`;
    getEl('sumVendor').innerText = currentApproval.vendor?.name;
    getEl('sumAmount').innerText = '$' + parseFloat(currentApproval.amount).toLocaleString();
    getEl('sumDate').innerText = new Date(currentApproval.created_at).toLocaleDateString();

    getEl('remarkInput').value = '';
    
    renderStepper();
    renderChain();

    // Disable actions if fully approved or rejected
    const isTerminal = ['PO Generated', 'Rejected'].includes(currentApproval.stage);
    getEl('approveActionBtn').disabled = isTerminal;
    getEl('rejectActionBtn').disabled = isTerminal;
    getEl('approveActionBtn').className = isTerminal ? 'bg-slate-300 text-white rounded-xl py-3 px-4 font-semibold text-sm shadow-sm flex justify-center items-center gap-2 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 px-4 font-semibold text-sm shadow-sm flex justify-center items-center gap-2';
    getEl('rejectActionBtn').className = isTerminal ? 'bg-white border border-slate-200 text-slate-400 rounded-xl py-3 px-4 font-semibold text-sm shadow-sm flex justify-center items-center gap-2 cursor-not-allowed' : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl py-3 px-4 font-semibold text-sm shadow-sm flex justify-center items-center gap-2';
  };

  const renderStepper = () => {
    const nodes = getEl('stepperNodes');
    nodes.innerHTML = '';
    
    // Core 4 steps
    const steps = ['Submitted', 'L1 Review', 'L2 Approval', 'PO Generated'];
    const currIdx = steps.indexOf(currentApproval.stage);
    
    // Adjust progress bar
    let pct = 0;
    if(currentApproval.stage === 'Rejected') {
      pct = 100; getEl('stepperProgressBar').className = 'absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-red-500 transition-all duration-500';
    } else {
      pct = currIdx < 0 ? 0 : (currIdx / (steps.length-1)) * 100;
      getEl('stepperProgressBar').className = 'absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-vb-blue transition-all duration-500';
    }
    getEl('stepperProgressBar').style.width = `${pct}%`;

    steps.forEach((step, idx) => {
      const isPast = idx < currIdx || currentApproval.stage === 'PO Generated';
      const isCurrent = idx === currIdx;
      const isRejected = currentApproval.stage === 'Rejected';

      let circleClass = 'w-10 h-10 rounded-full bg-white text-slate-400 border-2 border-slate-200 flex items-center justify-center font-bold text-sm ring-4 ring-slate-50 z-10 relative';
      let content = (idx+1).toString();
      
      if(isRejected) {
        circleClass = 'w-10 h-10 rounded-full bg-white border-2 border-red-500 text-red-500 flex items-center justify-center shadow-sm ring-4 ring-slate-50 z-10 relative';
        content = '<i data-lucide="x" class="w-5 h-5"></i>';
      } else if (isPast) {
        circleClass = 'w-10 h-10 rounded-full bg-white border-2 border-emerald-500 text-emerald-500 flex items-center justify-center shadow-sm ring-4 ring-slate-50 z-10 relative';
        content = '<i data-lucide="check" class="w-5 h-5"></i>';
      } else if (isCurrent) {
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

  const renderChain = () => {
    const list = getEl('approvalChainList');
    list.innerHTML = '';
    const remarks = currentApproval.remarks || [];
    
    if(remarks.length === 0) {
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
    if(!currentApproval) return;
    const text = getEl('remarkInput').value.trim();
    
    let nextStage = currentApproval.stage;
    if(actionStr === 'Rejected') {
      nextStage = 'Rejected';
    } else {
      const stages = ['Submitted', 'L1 Review', 'L2 Approval', 'PO Generated'];
      const currIdx = stages.indexOf(currentApproval.stage);
      if(currIdx < stages.length - 1) {
        nextStage = stages[currIdx + 1];
      }
    }

    const newRemark = {
      action: actionStr,
      new_stage: nextStage,
      text,
      timestamp: new Date().toISOString()
    };

    const updatedRemarks = [...(currentApproval.remarks || []), newRemark];

    try {
      const { error } = await window.supabaseClient.from('approvals')
        .update({ stage: nextStage, remarks: updatedRemarks })
        .eq('id', currentApproval.id);
      
      if(error) throw error;
      
      // Update local state instantly to feel fast
      currentApproval.stage = nextStage;
      currentApproval.remarks = updatedRemarks;
      openDetail(currentApproval.id); // re-render
      
    } catch(err) {
      console.error(err);
      alert("Failed to update approval.");
    }
  };

  safeAdd('approveActionBtn', 'click', () => processAction('Approved'));
  safeAdd('rejectActionBtn', 'click', () => processAction('Rejected'));

  // Init
  fetchApprovals();
});
