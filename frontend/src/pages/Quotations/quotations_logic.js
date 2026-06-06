document.addEventListener('DOMContentLoaded', () => {
  // --- Sidebar Logic ---
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
      
      document.querySelectorAll('.sidebar-label').forEach(label => {
        label.classList.add('hidden');
      });
      
      if(collapseBtn) collapseBtn.innerHTML = '<i data-lucide="chevrons-right" class="w-5 h-5 shrink-0"></i>';
    } else {
      sidebar.classList.remove('w-20');
      sidebar.classList.add('w-64');
      
      setTimeout(() => {
        if(logoText) logoText.classList.remove('hidden');
        if(supportBox) supportBox.classList.remove('hidden');
        document.querySelectorAll('.sidebar-label').forEach(label => {
          label.classList.remove('hidden');
        });
      }, 150);
      
      if(collapseBtn) {
        collapseBtn.innerHTML = `
          <i data-lucide="chevrons-left" class="w-5 h-5 shrink-0"></i>
          <span class="sidebar-label">Collapse</span>
        `;
      }
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

  // --- UI Elements ---
  const rfqSelector = document.getElementById('rfqSelector');
  const modeEntryBtn = document.getElementById('modeEntryBtn');
  const modeComparisonBtn = document.getElementById('modeComparisonBtn');
  
  const loadingState = document.getElementById('quotationsLoadingState');
  const noRfqSelectedState = document.getElementById('noRfqSelectedState');
  const modeEntryContainer = document.getElementById('modeEntryContainer');
  const modeComparisonContainer = document.getElementById('modeComparisonContainer');

  // Entry Mode Elements
  const vendorSelector = document.getElementById('vendorSelector');
  const entryRfqTitle = document.getElementById('entryRfqTitle');
  const entryRfqDesc = document.getElementById('entryRfqDesc');
  const quoteFormArea = document.getElementById('quoteFormArea');
  const vendorAlreadySubmittedState = document.getElementById('vendorAlreadySubmittedState');
  const quoteItemsTbody = document.getElementById('quoteItemsTbody');
  
  const quoteTax = document.getElementById('quoteTax');
  const quoteDelivery = document.getElementById('quoteDelivery');
  const quoteTerms = document.getElementById('quoteTerms');
  const submitQuoteBtn = document.getElementById('submitQuoteBtn');
  
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryTaxPercent = document.getElementById('summaryTaxPercent');
  const summaryTaxAmount = document.getElementById('summaryTaxAmount');
  const summaryGrandTotal = document.getElementById('summaryGrandTotal');

  // Comparison Mode Elements
  const comparisonSubtitle = document.getElementById('comparisonSubtitle');
  const noQuotationsState = document.getElementById('noQuotationsState');
  const comparisonMatrixWrapper = document.getElementById('comparisonMatrixWrapper');
  const comparisonThead = document.getElementById('comparisonThead');
  const comparisonTbody = document.getElementById('comparisonTbody');
  const comparisonLegend = document.getElementById('comparisonLegend');

  // --- State ---
  let currentMode = 'entry'; // 'entry' or 'comparison'
  let allRfqs = [];
  let currentRfq = null;
  let currentRfqItems = [];
  
  let assignedVendors = [];
  let existingQuotations = [];
  let selectedVendorId = '';

  // Form State
  let quoteLineItems = []; // Array of { rfq_item_id, unit_price, qty, total }

  // --- Initialization ---
  const init = async () => {
    try {
      showLoading(true);
      const { data, error } = await window.supabaseClient.from('rfqs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      allRfqs = data;
      
      rfqSelector.innerHTML = '<option value="">Select an RFQ...</option>';
      allRfqs.forEach(rfq => {
        rfqSelector.innerHTML += `<option value="${rfq.id}">${rfq.title} (${rfq.status})</option>`;
      });
    } catch (err) {
      console.error("Failed to load RFQs:", err);
      alert("Failed to load RFQs.");
    } finally {
      showLoading(false);
    }
  };

  // --- Event Listeners ---
  modeEntryBtn.addEventListener('click', () => setMode('entry'));
  modeComparisonBtn.addEventListener('click', () => setMode('comparison'));
  
  rfqSelector.addEventListener('change', async (e) => {
    const rfqId = e.target.value;
    if (!rfqId) {
      currentRfq = null;
      renderBaseUI();
      return;
    }
    currentRfq = allRfqs.find(r => r.id === rfqId);
    await loadRfqData();
  });

  vendorSelector.addEventListener('change', (e) => {
    selectedVendorId = e.target.value;
    renderEntryForm();
  });

  quoteTax.addEventListener('input', calculateTotals);

  submitQuoteBtn.addEventListener('click', async () => {
    if (!selectedVendorId) return alert("Select a vendor.");
    const delivery = parseInt(quoteDelivery.value) || 0;
    if (delivery <= 0) return alert("Enter valid delivery days.");
    
    // Validate unit prices
    const invalidItem = quoteLineItems.find(item => item.unit_price <= 0);
    if (invalidItem) return alert("Please enter valid unit prices for all items.");

    const taxPercent = parseFloat(quoteTax.value) || 0;
    const sub = quoteLineItems.reduce((acc, curr) => acc + curr.total, 0);
    const taxAmt = sub * (taxPercent / 100);
    const grand = sub + taxAmt;

    showLoading(true);
    try {
      // 1. Insert Quotation
      const { data: qData, error: qError } = await window.supabaseClient.from('quotations').insert([{
        rfq_id: currentRfq.id,
        vendor_id: selectedVendorId,
        subtotal: sub,
        tax_percentage: taxPercent,
        grand_total: grand,
        delivery_days: delivery,
        terms: quoteTerms.value.trim(),
        status: 'Submitted'
      }]).select();
      if (qError) throw qError;

      const quotationId = qData[0].id;

      // 2. Insert Items
      const itemsToInsert = quoteLineItems.map(item => ({
        quotation_id: quotationId,
        rfq_item_id: item.rfq_item_id,
        unit_price: item.unit_price,
        total_price: item.total
      }));

      const { error: iError } = await window.supabaseClient.from('quotation_items').insert(itemsToInsert);
      if (iError) throw iError;

      alert("Quotation submitted successfully!");
      await loadRfqData(); // Refresh data

    } catch (err) {
      console.error(err);
      alert("Failed to submit quotation. Error: " + (err.message || err));
    } finally {
      showLoading(false);
    }
  });


  // --- Logic Functions ---
  const showLoading = (show) => {
    if (show) loadingState.classList.remove('hidden');
    else loadingState.classList.add('hidden');
  };

  const setMode = (mode) => {
    currentMode = mode;
    if (mode === 'entry') {
      modeEntryBtn.className = "flex-1 py-2 text-sm font-bold rounded-lg transition-colors bg-white text-vb-blue shadow-sm";
      modeComparisonBtn.className = "flex-1 py-2 text-sm font-bold rounded-lg transition-colors text-slate-500 hover:text-slate-700 bg-transparent";
    } else {
      modeComparisonBtn.className = "flex-1 py-2 text-sm font-bold rounded-lg transition-colors bg-white text-vb-blue shadow-sm";
      modeEntryBtn.className = "flex-1 py-2 text-sm font-bold rounded-lg transition-colors text-slate-500 hover:text-slate-700 bg-transparent";
    }
    renderBaseUI();
  };

  const renderBaseUI = () => {
    if (!currentRfq) {
      noRfqSelectedState.classList.remove('hidden');
      modeEntryContainer.classList.add('hidden');
      modeComparisonContainer.classList.add('hidden');
      return;
    }
    noRfqSelectedState.classList.add('hidden');
    
    if (currentMode === 'entry') {
      modeEntryContainer.classList.remove('hidden');
      modeComparisonContainer.classList.add('hidden');
      setupEntryMode();
    } else {
      modeComparisonContainer.classList.remove('hidden');
      modeEntryContainer.classList.add('hidden');
      setupComparisonMode();
    }
    lucide.createIcons();
  };

  const loadRfqData = async () => {
    if (!currentRfq) return;
    showLoading(true);
    try {
      // Load RFQ Items
      const { data: items } = await window.supabaseClient.from('rfq_items').select('*').eq('rfq_id', currentRfq.id);
      currentRfqItems = items || [];

      // Load Assigned Vendors
      const { data: vendorLinks } = await window.supabaseClient.from('rfq_vendors').select('vendor_id, vendors(id, name, category)').eq('rfq_id', currentRfq.id);
      assignedVendors = vendorLinks ? vendorLinks.map(link => link.vendors) : [];

      // Load Existing Quotations
      const { data: quotes } = await window.supabaseClient.from('quotations').select('*, vendors(name), quotation_items(*)').eq('rfq_id', currentRfq.id);
      existingQuotations = quotes || [];

      selectedVendorId = '';
      renderBaseUI();
    } catch (err) {
      console.error(err);
      alert("Failed to load RFQ data.");
    } finally {
      showLoading(false);
    }
  };

  // --- Entry Mode ---
  const setupEntryMode = () => {
    entryRfqTitle.textContent = currentRfq.title;
    entryRfqDesc.textContent = `Deadline: ${currentRfq.deadline} | Items: ${currentRfqItems.length}`;

    // Populate Vendor Dropdown (only those who haven't submitted)
    vendorSelector.innerHTML = '<option value="">Select Vendor...</option>';
    assignedVendors.forEach(v => {
      const hasSubmitted = existingQuotations.some(q => q.vendor_id === v.id);
      if (!hasSubmitted) {
        vendorSelector.innerHTML += `<option value="${v.id}">${v.name} (${v.category})</option>`;
      } else {
        vendorSelector.innerHTML += `<option value="${v.id}" disabled>${v.name} (Submitted)</option>`;
      }
    });

    renderEntryForm();
  };

  const renderEntryForm = () => {
    if (!selectedVendorId) {
      quoteFormArea.classList.add('hidden');
      vendorAlreadySubmittedState.classList.add('hidden');
      return;
    }

    const hasSubmitted = existingQuotations.some(q => q.vendor_id === selectedVendorId);
    if (hasSubmitted) {
      quoteFormArea.classList.add('hidden');
      vendorAlreadySubmittedState.classList.remove('hidden');
      return;
    }

    // Initialize state for form
    quoteLineItems = currentRfqItems.map(item => ({
      rfq_item_id: item.id,
      name: item.item_name,
      qty: item.quantity,
      unit: item.unit,
      unit_price: 0,
      total: 0
    }));

    vendorAlreadySubmittedState.classList.add('hidden');
    quoteFormArea.classList.remove('hidden');
    
    // Reset inputs
    quoteTax.value = 18;
    quoteDelivery.value = '';
    quoteTerms.value = '';

    renderQuoteItemsTable();
    calculateTotals();
  };

  const renderQuoteItemsTable = () => {
    quoteItemsTbody.innerHTML = '';
    quoteLineItems.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';
      tr.innerHTML = `
        <td class="py-3 px-4 text-slate-900">${item.name}</td>
        <td class="py-3 px-4 text-center">${item.qty}</td>
        <td class="py-3 px-4 text-center text-xs text-slate-500">${item.unit}</td>
        <td class="py-3 px-4">
          <input type="number" min="0" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-vb-blue rounded-lg px-3 py-1.5 text-sm text-slate-900 font-medium outline-none shadow-sm transition-all text-right price-input" data-idx="${idx}" placeholder="0.00">
        </td>
        <td class="py-3 px-4">
          <div class="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 font-medium text-right shadow-inner item-total" id="itemTotal_${idx}">₹ 0.00</div>
        </td>
      `;
      quoteItemsTbody.appendChild(tr);
    });

    document.querySelectorAll('.price-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = e.target.getAttribute('data-idx');
        const val = parseFloat(e.target.value) || 0;
        quoteLineItems[idx].unit_price = val;
        quoteLineItems[idx].total = val * quoteLineItems[idx].qty;
        document.getElementById(`itemTotal_${idx}`).textContent = `₹ ${quoteLineItems[idx].total.toLocaleString('en-IN')}`;
        calculateTotals();
      });
    });
  };

  const calculateTotals = () => {
    const subtotal = quoteLineItems.reduce((acc, curr) => acc + curr.total, 0);
    const taxPercent = parseFloat(quoteTax.value) || 0;
    const taxAmount = subtotal * (taxPercent / 100);
    const grandTotal = subtotal + taxAmount;

    summarySubtotal.textContent = `₹ ${subtotal.toLocaleString('en-IN')}`;
    summaryTaxPercent.textContent = taxPercent;
    summaryTaxAmount.textContent = `₹ ${taxAmount.toLocaleString('en-IN')}`;
    summaryGrandTotal.textContent = `₹ ${grandTotal.toLocaleString('en-IN')}`;
  };

  // --- Comparison Mode ---
  const setupComparisonMode = () => {
    comparisonSubtitle.textContent = `RFQ: ${currentRfq.title} - ${existingQuotations.length} quotations received`;

    if (existingQuotations.length === 0) {
      noQuotationsState.classList.remove('hidden');
      comparisonMatrixWrapper.classList.add('hidden');
      comparisonLegend.classList.add('hidden');
      return;
    }

    noQuotationsState.classList.add('hidden');
    comparisonMatrixWrapper.classList.remove('hidden');
    comparisonLegend.classList.remove('hidden');

    // Find lowest grand total
    let lowestQuoteId = null;
    let minTotal = Infinity;
    existingQuotations.forEach(q => {
      if (q.grand_total < minTotal) {
        minTotal = q.grand_total;
        lowestQuoteId = q.id;
      }
    });

    // Build Table Header
    comparisonThead.innerHTML = '';
    const trHead = document.createElement('tr');
    trHead.className = 'bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider';
    let thCriteria = `<th class="py-4 px-4 text-left border-r border-slate-200 w-48">Criteria</th>`;
    trHead.innerHTML = thCriteria;

    existingQuotations.forEach(q => {
      const isLowest = q.id === lowestQuoteId;
      if (isLowest) {
        trHead.innerHTML += `
          <th class="py-4 px-4 border-r border-emerald-200 bg-emerald-50 text-emerald-700 border-b-emerald-200 shadow-sm relative z-10 min-w-[160px]">
            <div class="flex items-center justify-center gap-1.5">
              <i data-lucide="award" class="w-4 h-4"></i>
              ${q.vendors.name} (Lowest)
            </div>
          </th>
        `;
      } else {
        trHead.innerHTML += `<th class="py-4 px-4 border-r border-slate-200 min-w-[160px]">${q.vendors.name}</th>`;
      }
    });
    comparisonThead.appendChild(trHead);

    // Build Table Body
    comparisonTbody.innerHTML = '';
    
    // Row: Grand Total
    const trGrand = document.createElement('tr');
    trGrand.className = 'border-b border-slate-100';
    trGrand.innerHTML = `<td class="py-4 px-4 text-left text-slate-500 border-r border-slate-200">Grand Total</td>`;
    existingQuotations.forEach(q => {
      const isLowest = q.id === lowestQuoteId;
      trGrand.innerHTML += `<td class="py-4 px-4 ${isLowest ? 'border-r border-emerald-200 bg-emerald-50/40 font-bold text-slate-900' : 'border-r border-slate-200'}">₹ ${q.grand_total.toLocaleString('en-IN')}</td>`;
    });
    comparisonTbody.appendChild(trGrand);

    // Row: Subtotal
    const trSub = document.createElement('tr');
    trSub.className = 'border-b border-slate-100';
    trSub.innerHTML = `<td class="py-4 px-4 text-left text-slate-500 border-r border-slate-200">Subtotal</td>`;
    existingQuotations.forEach(q => {
      const isLowest = q.id === lowestQuoteId;
      trSub.innerHTML += `<td class="py-4 px-4 ${isLowest ? 'border-r border-emerald-200 bg-emerald-50/40' : 'border-r border-slate-200'}">₹ ${q.subtotal.toLocaleString('en-IN')}</td>`;
    });
    comparisonTbody.appendChild(trSub);

    // Row: GST
    const trGst = document.createElement('tr');
    trGst.className = 'border-b border-slate-100';
    trGst.innerHTML = `<td class="py-4 px-4 text-left text-slate-500 border-r border-slate-200">GST %</td>`;
    existingQuotations.forEach(q => {
      const isLowest = q.id === lowestQuoteId;
      trGst.innerHTML += `<td class="py-4 px-4 ${isLowest ? 'border-r border-emerald-200 bg-emerald-50/40' : 'border-r border-slate-200'}">${q.tax_percentage}%</td>`;
    });
    comparisonTbody.appendChild(trGst);

    // Row: Delivery
    const trDel = document.createElement('tr');
    trDel.className = 'border-b border-slate-100';
    trDel.innerHTML = `<td class="py-4 px-4 text-left text-slate-500 border-r border-slate-200">Delivery (days)</td>`;
    existingQuotations.forEach(q => {
      const isLowest = q.id === lowestQuoteId;
      trDel.innerHTML += `<td class="py-4 px-4 ${isLowest ? 'border-r border-emerald-200 bg-emerald-50/40' : 'border-r border-slate-200'}">${q.delivery_days}</td>`;
    });
    comparisonTbody.appendChild(trDel);

    // Row: Terms
    const trTerms = document.createElement('tr');
    trTerms.className = 'border-b border-slate-100';
    trTerms.innerHTML = `<td class="py-4 px-4 text-left text-slate-500 border-r border-slate-200">Terms</td>`;
    existingQuotations.forEach(q => {
      const isLowest = q.id === lowestQuoteId;
      trTerms.innerHTML += `<td class="py-4 px-4 text-[10px] text-slate-500 leading-tight ${isLowest ? 'border-r border-emerald-200 bg-emerald-50/40' : 'border-r border-slate-200'}">${q.terms || '-'}</td>`;
    });
    comparisonTbody.appendChild(trTerms);

    // Row: Actions
    const trAct = document.createElement('tr');
    trAct.innerHTML = `<td class="py-4 px-4 text-left border-r border-slate-200"></td>`;
    existingQuotations.forEach(q => {
      const isLowest = q.id === lowestQuoteId;
      const isApproved = q.status === 'Approved';
      let btnHTML = '';
      if (isApproved) {
         btnHTML = `<button disabled class="bg-slate-200 text-slate-500 rounded-lg py-2.5 px-6 font-semibold text-sm w-full cursor-not-allowed">Approved</button>`;
      } else {
         btnHTML = `<button onclick="approveQuote('${q.id}')" class="${isLowest ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-white border border-slate-300 hover:border-slate-400 text-slate-700'} rounded-lg py-2.5 px-6 font-semibold text-sm shadow-sm transition-colors w-full">Select & Approve</button>`;
      }
      trAct.innerHTML += `<td class="py-4 px-4 ${isLowest ? 'border-r border-emerald-200 bg-emerald-50/40' : 'border-r border-slate-200'}">${btnHTML}</td>`;
    });
    comparisonTbody.appendChild(trAct);
  };

  // Global approve function
  window.approveQuote = async (quoteId) => {
    if (!confirm("Are you sure you want to approve this quotation?")) return;
    showLoading(true);
    try {
      const { error } = await window.supabaseClient.from('quotations').update({ status: 'Approved' }).eq('id', quoteId);
      if (error) throw error;
      alert("Quotation approved!");
      await loadRfqData();
    } catch (err) {
      console.error(err);
      alert("Failed to approve quotation.");
    } finally {
      showLoading(false);
    }
  };

  // Initialize
  if (window.supabaseClient) {
    init();
  } else {
    // Wait slightly if supabase loads asynchronously
    setTimeout(init, 500);
  }
});
