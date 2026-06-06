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

  // --- UI Elements ---
  const loadingState = document.getElementById('quotationsLoadingState');
  
  // Home Screen
  const dashboardOverview = document.getElementById('dashboardOverview');
  const optSubmitQuoteBtn = document.getElementById('optSubmitQuoteBtn');
  const optAnalyzeQuotesBtn = document.getElementById('optAnalyzeQuotesBtn');

  // Submit Flow
  const codeEntryContainer = document.getElementById('codeEntryContainer');
  const backFromCodeBtn = document.getElementById('backFromCodeBtn');
  const rfqCodeInput = document.getElementById('rfqCodeInput');
  const verifyCodeBtn = document.getElementById('verifyCodeBtn');

  // Analyze Flow
  const receivedListView = document.getElementById('receivedListView');
  const backFromReceivedBtn = document.getElementById('backFromReceivedBtn');
  const receivedQuotesGrid = document.getElementById('receivedQuotesGrid');
  const noReceivedState = document.getElementById('noReceivedState');

  // Mode Containers
  const modeEntryContainer = document.getElementById('modeEntryContainer');
  const modeComparisonContainer = document.getElementById('modeComparisonContainer');
  const backToDashboardBtn1 = document.getElementById('backToDashboardBtn1');
  const backToDashboardBtn2 = document.getElementById('backToDashboardBtn2');

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
  const comparisonMatrixWrapper = document.getElementById('comparisonMatrixWrapper');
  const comparisonThead = document.getElementById('comparisonThead');
  const comparisonTbody = document.getElementById('comparisonTbody');
  const comparisonLegend = document.getElementById('comparisonLegend');

  // --- State ---
  let allRfqs = [];
  let currentRfq = null;
  let currentRfqItems = [];
  let assignedVendors = [];
  let existingQuotations = [];
  let selectedVendorId = '';
  let quoteLineItems = [];

  // --- Helpers ---
  const showLoading = (show) => {
    if (show) loadingState.classList.remove('hidden');
    else loadingState.classList.add('hidden');
  };

  const hideAllViews = () => {
    dashboardOverview.classList.add('hidden');
    codeEntryContainer.classList.add('hidden');
    receivedListView.classList.add('hidden');
    modeEntryContainer.classList.add('hidden');
    modeComparisonContainer.classList.add('hidden');
  };

  const showHomeScreen = () => {
    hideAllViews();
    dashboardOverview.classList.remove('hidden');
    currentRfq = null;
  };

  // --- Navigation Event Listeners ---
  backFromCodeBtn.addEventListener('click', showHomeScreen);
  backFromReceivedBtn.addEventListener('click', showHomeScreen);
  backToDashboardBtn1.addEventListener('click', showHomeScreen);
  backToDashboardBtn2.addEventListener('click', showHomeScreen);

  // --- FLOW 1: SUBMIT QUOTATION ---
  optSubmitQuoteBtn.addEventListener('click', () => {
    hideAllViews();
    codeEntryContainer.classList.remove('hidden');
    rfqCodeInput.value = '';
    rfqCodeInput.focus();
  });

  verifyCodeBtn.addEventListener('click', async () => {
    const code = rfqCodeInput.value.trim().toUpperCase();
    if (!code) return alert("Please enter a valid RFQ code.");

    showLoading(true);
    try {
      // Find RFQ by code
      const { data, error } = await window.supabaseClient.from('rfqs').select('*').eq('rfq_code', code).single();
      
      if (error || !data) {
        alert("Invalid RFQ Code. Please check the code and try again.");
        return;
      }

      currentRfq = data;
      await loadActiveRfqData('entry');
      
      hideAllViews();
      modeEntryContainer.classList.remove('hidden');
      
    } catch (err) {
      console.error(err);
      if (err.code === 'PGRST116') {
        alert("RFQ Code not found.");
      } else {
        alert("Error verifying code.");
      }
    } finally {
      showLoading(false);
    }
  });


  // --- FLOW 2: ANALYZE QUOTATIONS ---
  optAnalyzeQuotesBtn.addEventListener('click', async () => {
    hideAllViews();
    receivedListView.classList.remove('hidden');
    showLoading(true);
    
    try {
      // 1. Fetch all RFQs
      const { data: rfqs, error: rfqErr } = await window.supabaseClient.from('rfqs').select('*').order('created_at', { ascending: false });
      if (rfqErr) throw rfqErr;

      // 2. Fetch all quotations
      const { data: allQuotations, error: qErr } = await window.supabaseClient.from('quotations').select('rfq_id, vendor_id');
      if (qErr) throw qErr;

      let receivedCardsHtml = '';
      let receivedC = 0;
      allRfqs = rfqs; // Store for later

      rfqs.forEach(rfq => {
        const quotedForThis = allQuotations.filter(q => q.rfq_id === rfq.id);
        const totalQuoted = quotedForThis.length;

        if (totalQuoted > 0) {
          receivedC++;
          receivedCardsHtml += `
            <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between h-full group" onclick="openComparisonMode('${rfq.id}')">
              <div>
                <div class="flex items-start justify-between mb-2">
                  <h3 class="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-vb-blue transition-colors">${rfq.title}</h3>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0 whitespace-nowrap">${totalQuoted} bids</span>
                </div>
                <p class="text-[11px] text-slate-500 font-mono mb-3 bg-slate-50 inline-block px-1.5 py-0.5 rounded border border-slate-100">Code: ${rfq.rfq_code || 'N/A'}</p>
                <div class="flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${rfq.deadline}</span>
                </div>
              </div>
              <button class="mt-4 w-full bg-slate-50 group-hover:bg-emerald-500 group-hover:text-white border border-slate-200 group-hover:border-emerald-500 text-slate-700 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                <i data-lucide="bar-chart-2" class="w-3.5 h-3.5"></i> Analyze
              </button>
            </div>
          `;
        }
      });

      receivedQuotesGrid.innerHTML = receivedCardsHtml;

      if (receivedC === 0) noReceivedState.classList.remove('hidden');
      else noReceivedState.classList.add('hidden');

      lucide.createIcons();

    } catch (err) {
      console.error("Dashboard Load Error:", err);
      alert("Failed to load received quotations. Error: " + (err.message || JSON.stringify(err)));
    } finally {
      showLoading(false);
    }
  });

  window.openComparisonMode = async (rfqId) => {
    currentRfq = allRfqs.find(r => r.id === rfqId);
    await loadActiveRfqData('comparison');
    hideAllViews();
    modeComparisonContainer.classList.remove('hidden');
  };

  // --- Shared Logic ---
  const loadActiveRfqData = async (mode) => {
    showLoading(true);
    try {
      const { data: items } = await window.supabaseClient.from('rfq_items').select('*').eq('rfq_id', currentRfq.id);
      currentRfqItems = items || [];

      const { data: vendorLinks } = await window.supabaseClient.from('rfq_vendors').select('vendor_id, vendors(id, name, category)').eq('rfq_id', currentRfq.id);
      assignedVendors = vendorLinks ? vendorLinks.map(link => link.vendors) : [];

      const { data: quotes } = await window.supabaseClient.from('quotations').select('*, vendors(name), quotation_items(*)').eq('rfq_id', currentRfq.id);
      existingQuotations = quotes || [];

      selectedVendorId = '';

      if (mode === 'entry') setupEntryMode();
      if (mode === 'comparison') setupComparisonMode();
      
      lucide.createIcons();
    } catch (err) {
      console.error(err);
      alert("Failed to load RFQ data.");
    } finally {
      showLoading(false);
    }
  };

  // --- Entry Mode Logic ---
  const setupEntryMode = () => {
    entryRfqTitle.textContent = currentRfq.title;
    entryRfqDesc.textContent = `Deadline: ${currentRfq.deadline} | Items: ${currentRfqItems.length}`;

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

  vendorSelector.addEventListener('change', (e) => {
    selectedVendorId = e.target.value;
    renderEntryForm();
  });

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

  quoteTax.addEventListener('input', calculateTotals);

  submitQuoteBtn.addEventListener('click', async () => {
    if (!selectedVendorId) return alert("Select a vendor.");
    const delivery = parseInt(quoteDelivery.value) || 0;
    if (delivery <= 0) return alert("Enter valid delivery days.");
    
    const invalidItem = quoteLineItems.find(item => item.unit_price <= 0);
    if (invalidItem) return alert("Please enter valid unit prices for all items.");

    const taxPercent = parseFloat(quoteTax.value) || 0;
    const sub = quoteLineItems.reduce((acc, curr) => acc + curr.total, 0);
    const taxAmt = sub * (taxPercent / 100);
    const grand = sub + taxAmt;

    showLoading(true);
    try {
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
      const itemsToInsert = quoteLineItems.map(item => ({
        quotation_id: quotationId,
        rfq_item_id: item.rfq_item_id,
        unit_price: item.unit_price,
        total_price: item.total
      }));

      const { error: iError } = await window.supabaseClient.from('quotation_items').insert(itemsToInsert);
      if (iError) throw iError;

      alert("Quotation submitted successfully!");
      showHomeScreen(); 

    } catch (err) {
      console.error(err);
      alert("Failed to submit quotation. Error: " + (err.message || err));
    } finally {
      showLoading(false);
    }
  });

  // --- Comparison Mode Logic ---
  const setupComparisonMode = () => {
    comparisonSubtitle.textContent = `RFQ: ${currentRfq.title} - ${existingQuotations.length} quotations received`;
    comparisonMatrixWrapper.classList.remove('hidden');
    comparisonLegend.classList.remove('hidden');

    let lowestQuoteId = null;
    let minTotal = Infinity;
    existingQuotations.forEach(q => {
      if (q.grand_total < minTotal) {
        minTotal = q.grand_total;
        lowestQuoteId = q.id;
      }
    });

    comparisonThead.innerHTML = '';
    const trHead = document.createElement('tr');
    trHead.className = 'bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider';
    trHead.innerHTML = `<th class="py-4 px-4 text-left border-r border-slate-200 w-48">Criteria</th>`;

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

    comparisonTbody.innerHTML = '';
    
    // Rows generator helper
    const addRow = (label, prop, formatter) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100';
      tr.innerHTML = `<td class="py-4 px-4 text-left text-slate-500 border-r border-slate-200">${label}</td>`;
      existingQuotations.forEach(q => {
        const isLowest = q.id === lowestQuoteId;
        const classes = isLowest ? 'border-r border-emerald-200 bg-emerald-50/40' : 'border-r border-slate-200';
        tr.innerHTML += `<td class="py-4 px-4 ${classes}">${formatter(q[prop])}</td>`;
      });
      comparisonTbody.appendChild(tr);
    };

    addRow('Grand Total', 'grand_total', v => `<span class="font-bold text-slate-900">₹ ${v.toLocaleString('en-IN')}</span>`);
    addRow('Subtotal', 'subtotal', v => `₹ ${v.toLocaleString('en-IN')}`);
    addRow('GST %', 'tax_percentage', v => `${v}%`);
    addRow('Delivery (days)', 'delivery_days', v => v);
    addRow('Terms', 'terms', v => `<span class="text-[10px] text-slate-500 leading-tight">${v || '-'}</span>`);

    // Actions Row
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

  window.approveQuote = async (quoteId) => {
    if (!confirm("Are you sure you want to approve this quotation?")) return;
    showLoading(true);
    try {
      const { error } = await window.supabaseClient.from('quotations').update({ status: 'Approved' }).eq('id', quoteId);
      if (error) throw error;
      alert("Quotation approved!");
      showHomeScreen();
    } catch (err) {
      console.error(err);
      alert("Failed to approve quotation.");
    } finally {
      showLoading(false);
    }
  };

  // Launch (Remove init since we don't fetch data until a button is clicked)
});
