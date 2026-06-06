document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. DOM SELECTORS
    // ==========================================
    const poNumberInput = document.getElementById('po-number');
    const poDateInput = document.getElementById('po-date');
    const vendorSelect = document.getElementById('vendor-select');
    
    // Form Inputs
    const itemForm = document.getElementById('item-form');
    const itemNameInput = document.getElementById('item-name');
    const itemDescInput = document.getElementById('item-desc');
    const itemQtyInput = document.getElementById('item-qty');
    const itemPriceInput = document.getElementById('item-price');
    const itemGstSelect = document.getElementById('item-gst');

    // Document Preview Selectors
    const previewPoNumDisplay = document.getElementById('preview-po-num-display');
    const previewPoDate = document.getElementById('preview-po-date');
    const previewVName = document.getElementById('preview-v-name');
    const previewVContact = document.getElementById('preview-v-contact');
    const previewVAddress = document.getElementById('preview-v-address');
    const previewVGst = document.getElementById('preview-v-gst');
    const poTableBody = document.getElementById('po-table-body');

    // Totals Selectors
    const totalsSubtotal = document.getElementById('totals-subtotal');
    const totalsCgst = document.getElementById('totals-cgst');
    const totalsSgst = document.getElementById('totals-sgst');
    const totalsTax = document.getElementById('totals-tax');
    const totalsGrand = document.getElementById('totals-grand');

    // Action Buttons
    const btnPrint = document.getElementById('btn-print');
    const btnGenerateInvoice = document.getElementById('btn-generate-invoice');

    // Alert Box
    const poAlert = document.getElementById('po-alert');
    const alertMessage = poAlert.querySelector('.alert-message');
    const alertIconPath = poAlert.querySelector('.alert-icon-path');

    // ==========================================
    // 2. MOCK DATASETS (Vendors & Initial Items)
    // ==========================================
    const vendorDatabase = {
        apex: {
            name: 'Apex Electronics Ltd',
            contact: 'Amit Sharma (Procurement Coordinator)',
            phone: '+91 98989 12345',
            address: 'Plot 402, GIDC Industrial Estate, Sector 26, Gandhinagar, Gujarat - 382028',
            gstin: '24APEXX1234A1Z1'
        },
        mahir: {
            name: 'Mahir Logistics & Supplies',
            contact: 'Mahir Shah (Operations Director)',
            phone: '+91 95959 54321',
            address: '12, Transport Nagar, Narol, Ahmedabad, Gujarat - 382405',
            gstin: '24MAHIR5678B1Z2'
        },
        arjun: {
            name: 'Arjun Office Systems',
            contact: 'Arjun Patel (Sales Manager)',
            phone: '+91 88888 77777',
            address: '56, Stationery Market, Relief Road, Kalupur, Ahmedabad, Gujarat - 380001',
            gstin: '24ARJUN9999C1Z3'
        },
        global: {
            name: 'Global Tech Components',
            contact: 'Sarah Jenkins (Key Accounts)',
            phone: '+91 77777 66666',
            address: '808, IT Hub Park, Phase 2, Whitefield, Bangalore, Karnataka - 560066',
            gstin: '29GLOBA8888D1Z4'
        }
    };

    // Initialize with an empty items array on load as requested
    let poItems = [];

    // ==========================================
    // 3. INITIALIZATION & SYNCING
    // ==========================================
    // Initialize date inputs to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    poDateInput.value = `${yyyy}-${mm}-${dd}`;
    previewPoDate.textContent = `${dd}/${mm}/${yyyy}`;

    // Load initial vendor
    vendorSelect.value = 'apex';
    updateVendorPreview('apex');

    // Initial table render and total calculations
    renderTable();

    // Event listener: Sync PO Number input to document header
    poNumberInput.addEventListener('input', () => {
        const val = poNumberInput.value.trim() || 'PO-YYYY-0000';
        previewPoNumDisplay.textContent = val;
    });

    // Event listener: Sync Date input to document
    poDateInput.addEventListener('change', () => {
        const dateVal = poDateInput.value;
        if (dateVal) {
            const parts = dateVal.split('-');
            if (parts.length === 3) {
                previewPoDate.textContent = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }
    });

    // Event listener: Sync Vendor Dropdown
    vendorSelect.addEventListener('change', () => {
        const selectedKey = vendorSelect.value;
        updateVendorPreview(selectedKey);
        clearAlert();
    });

    function updateVendorPreview(key) {
        const vendor = vendorDatabase[key];
        if (vendor) {
            previewVName.textContent = vendor.name;
            previewVContact.textContent = `${vendor.contact} | ${vendor.phone}`;
            previewVAddress.textContent = vendor.address;
            previewVGst.textContent = `GSTIN: ${vendor.gstin}`;
        }
    }

    // ==========================================
    // 4. ALERT UTILITY
    // ==========================================
    let alertTimeout;
    function showAlert(type, message) {
        clearTimeout(alertTimeout);
        poAlert.className = `alert-box ${type}`;
        poAlert.style.display = 'flex';
        alertMessage.textContent = message;

        if (type === 'success') {
            alertIconPath.setAttribute('d', 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3');
        } else {
            alertIconPath.setAttribute('d', 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01');
        }

        alertTimeout = setTimeout(() => {
            poAlert.style.display = 'none';
        }, 4000);
    }

    function clearAlert() {
        poAlert.style.display = 'none';
    }

    // ==========================================
    // 5. PRODUCT TABLE RENDER & REMOVE
    // ==========================================
    function renderTable() {
        poTableBody.innerHTML = '';

        if (poItems.length === 0) {
            poTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--doc-text-muted); padding: 1.5rem 0;">No items added to this purchase order. Use form to add products.</td>
                </tr>
            `;
            calculateTotals();
            return;
        }

        poItems.forEach((item, index) => {
            const row = document.createElement('tr');
            
            const itemTotalBeforeTax = item.qty * item.price;
            const gstAmount = itemTotalBeforeTax * (item.gstRate / 100);
            const totalWithTax = itemTotalBeforeTax + gstAmount;

            row.innerHTML = `
                <td>
                    <span style="font-weight: 700; color: var(--doc-text-main); display: block;">${item.name}</span>
                    <span style="font-size: 0.75rem; color: var(--doc-text-muted); display: block; margin-top: 0.1rem;">${item.desc || 'No descriptions entered'}</span>
                </td>
                <td style="text-align: right; font-weight: 600;">${item.qty}</td>
                <td style="text-align: right;">${formatCurrency(item.price)}</td>
                <td style="text-align: right; color: var(--doc-text-muted);">${item.gstRate}%</td>
                <td style="text-align: right; font-weight: 700;">${formatCurrency(itemTotalBeforeTax)}</td>
                <td style="text-align: center;">
                    <button type="button" class="btn-remove-row" data-index="${index}" title="Remove Item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </td>
            `;
            poTableBody.appendChild(row);
        });

        // Add Delete event handlers
        document.querySelectorAll('.btn-remove-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-index'));
                removeItem(idx);
            });
        });

        calculateTotals();
    }

    function removeItem(index) {
        const itemName = poItems[index].name;
        poItems.splice(index, 1);
        renderTable();
        showAlert('success', `Removed "${itemName}" from Purchase Order.`);
    }

    // ==========================================
    // 6. TOTALS & TAX CALCULATIONS (CGST + SGST Splitting)
    // ==========================================
    function calculateTotals() {
        let subtotal = 0;
        let totalTax = 0;

        poItems.forEach(item => {
            const itemCost = item.qty * item.price;
            const itemTax = itemCost * (item.gstRate / 100);
            subtotal += itemCost;
            totalTax += itemTax;
        });

        // Split GST into Central and State GST (CGST and SGST are 50/50 breakdown in India)
        const cgstAmount = totalTax / 2;
        const sgstAmount = totalTax / 2;
        const grandTotal = subtotal + totalTax;

        // Populate values
        totalsSubtotal.textContent = formatCurrency(subtotal);
        totalsCgst.textContent = formatCurrency(cgstAmount);
        totalsSgst.textContent = formatCurrency(sgstAmount);
        totalsTax.textContent = formatCurrency(totalTax);
        totalsGrand.textContent = formatCurrency(grandTotal);
    }

    function formatCurrency(val) {
        return val.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // ==========================================
    // 7. FORM ITEM ADDITION
    // ==========================================
    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAlert();

        const name = itemNameInput.value.trim();
        const desc = itemDescInput.value.trim();
        const qty = parseInt(itemQtyInput.value);
        const price = parseFloat(itemPriceInput.value);
        const gstRate = parseInt(itemGstSelect.value);

        if (!name) {
            showAlert('error', 'Please enter a product name.');
            itemNameInput.focus();
            return;
        }

        if (isNaN(qty) || qty < 1) {
            showAlert('error', 'Quantity must be at least 1.');
            itemQtyInput.focus();
            return;
        }

        if (isNaN(price) || price <= 0) {
            showAlert('error', 'Unit price must be a positive number.');
            itemPriceInput.focus();
            return;
        }

        // Add to array
        poItems.push({
            name,
            desc,
            qty,
            price,
            gstRate
        });

        // Re-render and calculate
        renderTable();

        // Reset inputs
        itemNameInput.value = '';
        itemDescInput.value = '';
        itemQtyInput.value = '1';
        itemPriceInput.value = '';
        itemGstSelect.value = '18';
        
        itemNameInput.focus();
        showAlert('success', `Added "${name}" to Purchase Order.`);
    });

    // ==========================================
    // 8. PRINT PO HANDLER
    // ==========================================
    btnPrint.addEventListener('click', () => {
        window.print();
    });

    // ==========================================
    // 9. GENERATE INVOICE ACTIONS
    // ==========================================
    btnGenerateInvoice.addEventListener('click', () => {
        clearAlert();

        if (poItems.length === 0) {
            showAlert('error', 'Cannot generate invoice for an empty Purchase Order.');
            return;
        }

        const selectedVendorVal = vendorSelect.value;
        if (!selectedVendorVal) {
            showAlert('error', 'Please select a vendor before generating the invoice.');
            vendorSelect.focus();
            return;
        }

        const poNum = poNumberInput.value.trim() || 'PO-2026-0001';
        const vendorObj = vendorDatabase[selectedVendorVal];

        // Trigger Loading spinner
        setInvoiceLoading(true);

        setTimeout(() => {
            setInvoiceLoading(false);

            // Generate mock invoice data to store
            const invoiceNum = `INV-${yyyy}${mm}${dd}-${Math.floor(100 + Math.random() * 900)}`;
            const savedInvoices = JSON.parse(localStorage.getItem('vendorbridge-invoices') || '[]');
            
            const newInvoice = {
                invoiceNumber: invoiceNum,
                referencePo: poNum,
                vendorName: vendorObj.name,
                vendorGstin: vendorObj.gstin,
                items: poItems,
                dateGenerated: new Date().toLocaleDateString('en-IN'),
                status: 'pending'
            };

            savedInvoices.push(newInvoice);
            localStorage.setItem('vendorbridge-invoices', JSON.stringify(savedInvoices));

            showAlert('success', `Invoice ${invoiceNum} generated successfully from ${poNum}! Saved to database.`);
        }, 1800);
    });

    function setInvoiceLoading(isLoading) {
        if (isLoading) {
            btnGenerateInvoice.classList.add('loading');
            btnGenerateInvoice.disabled = true;
            btnPrint.disabled = true;
            vendorSelect.disabled = true;
            poNumberInput.disabled = true;
            poDateInput.disabled = true;
            itemForm.querySelector('button[type="submit"]').disabled = true;
        } else {
            btnGenerateInvoice.classList.remove('loading');
            btnGenerateInvoice.disabled = false;
            btnPrint.disabled = false;
            vendorSelect.disabled = false;
            poNumberInput.disabled = false;
            poDateInput.disabled = false;
            itemForm.querySelector('button[type="submit"]').disabled = false;
        }
    }
});
