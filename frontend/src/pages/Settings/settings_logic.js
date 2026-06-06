document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. DOM SELECTORS
    // ==========================================
    // Tab Elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel-section');
    const triggerSecurityTab = document.getElementById('trigger-security-tab');

    // Forms
    const profileForm = document.getElementById('profile-form');
    const companyForm = document.getElementById('company-form');
    const notificationForm = document.getElementById('notification-form');
    const invoiceForm = document.getElementById('invoice-form');
    const securityForm = document.getElementById('security-form');

    // Profile Inputs
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profilePhone = document.getElementById('profile-phone');

    // Company Inputs
    const companyNameInput = document.getElementById('company-name');
    const companyGstInput = document.getElementById('company-gst');
    const companyAddressInput = document.getElementById('company-address');
    const logoUploadInput = document.getElementById('logo-upload');
    const logoUploadTrigger = document.getElementById('logo-upload-trigger');
    const logoImg = document.getElementById('logo-img');
    const logoSvg = document.getElementById('logo-svg');

    // Notification Inputs
    const notifyRfqCheckbox = document.getElementById('notify-rfq');
    const notifyApprovalCheckbox = document.getElementById('notify-approval');
    const notifyInvoiceCheckbox = document.getElementById('notify-invoice');

    // Invoice Inputs
    const invoiceGstRate = document.getElementById('invoice-gst-rate');
    const invoicePrefixInput = document.getElementById('invoice-prefix');
    const poPrefixInput = document.getElementById('po-prefix');

    // Security Inputs
    const oldPassword = document.getElementById('old-password');
    const newPassword = document.getElementById('new-password');
    const confirmNewPassword = document.getElementById('confirm-new-password');
    const logoutSessionsBtn = document.getElementById('logout-sessions-btn');

    // User Management Elements
    const usersTableBody = document.getElementById('users-table-body');
    const addUserBtn = document.getElementById('add-user-btn');
    
    // Modal Elements
    const userModal = document.getElementById('user-modal');
    const userModalForm = document.getElementById('user-modal-form');
    const modalTitleText = document.getElementById('modal-title-text');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const editUserIndex = document.getElementById('edit-user-index');
    const userModalName = document.getElementById('user-modal-name');
    const userModalEmail = document.getElementById('user-modal-email');
    const userModalRole = document.getElementById('user-modal-role');

    // Alert Box
    const settingsAlert = document.getElementById('settings-alert');
    const alertMessage = settingsAlert.querySelector('.alert-message');
    const alertIconPath = settingsAlert.querySelector('.alert-icon-path');

    // Default mock users database
    const defaultUsers = [
        { name: 'Nitin Patel', email: 'nitin.patel@organization.com', role: 'admin', status: 'active' },
        { name: 'Arjun Patel', email: 'arjun.patel@organization.com', role: 'manager', status: 'active' },
        { name: 'Mahir Shah', email: 'mahir.shah@supplier.com', role: 'vendor', status: 'active' },
        { name: 'Jane Doe', email: 'jane.doe@organization.com', role: 'procurement', status: 'active' }
    ];

    // ==========================================
    // 2. ALERT UTILITY
    // ==========================================
    let alertTimeout;
    function showAlert(type, message) {
        clearTimeout(alertTimeout);
        settingsAlert.className = `alert-box ${type}`;
        settingsAlert.style.display = 'flex';
        alertMessage.textContent = message;

        if (type === 'success') {
            alertIconPath.setAttribute('d', 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3');
        } else {
            alertIconPath.setAttribute('d', 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01');
        }

        // Auto hide after 4 seconds
        alertTimeout = setTimeout(() => {
            settingsAlert.style.display = 'none';
        }, 4000);
    }

    // ==========================================
    // 3. TAB NAVIGATION
    // ==========================================
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            
            // Toggle active button class
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle active panel visibility
            panels.forEach(panel => {
                if (panel.id === target) {
                    panel.classList.add('active');
                } else {
                    panel.classList.remove('active');
                }
            });
            
            settingsAlert.style.display = 'none'; // Clear alert when changing tabs
        });
    });

    // Shortcut inside profile settings to open security settings tab
    triggerSecurityTab.addEventListener('click', () => {
        const securityTabBtn = document.querySelector('[data-target="security-panel"]');
        if (securityTabBtn) {
            securityTabBtn.click();
        }
    });

    // ==========================================
    // 4. STORAGE LOAD & INITS
    // ==========================================
    // Profile Initialization
    profileName.value = localStorage.getItem('profile-name') || 'Arjun Patel';
    profileEmail.value = localStorage.getItem('profile-email') || 'arjun.patel@organization.com';
    profilePhone.value = localStorage.getItem('profile-phone') || '+91 98765 43210';

    // Company Initialization
    companyNameInput.value = localStorage.getItem('company-name') || 'VendorBridge Corp Ltd';
    companyGstInput.value = localStorage.getItem('company-gst') || '24AAAAA1111A1Z1';
    companyAddressInput.value = localStorage.getItem('company-address') || '101, Enterprise Tower, SG Highway, Ahmedabad, Gujarat, India';
    
    // Load logo if saved
    const savedLogo = localStorage.getItem('company-logo');
    if (savedLogo) {
        logoImg.src = savedLogo;
        logoImg.classList.remove('hidden');
        logoSvg.classList.add('hidden');
    }

    // Notification Initialization
    notifyRfqCheckbox.checked = localStorage.getItem('notify-rfq') !== 'false';
    notifyApprovalCheckbox.checked = localStorage.getItem('notify-approval') !== 'false';
    notifyInvoiceCheckbox.checked = localStorage.getItem('notify-invoice') === 'true';

    // Invoice Initialization
    invoiceGstRate.value = localStorage.getItem('invoice-gst-rate') || '18';
    invoicePrefixInput.value = localStorage.getItem('invoice-prefix') || 'INV-';
    poPrefixInput.value = localStorage.getItem('po-prefix') || 'PO-';

    // ==========================================
    // 5. PROFILE SETTINGS SAVE
    // ==========================================
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = profileName.value.trim();
        const email = profileEmail.value.trim();
        const phone = profilePhone.value.trim();

        if (!name) {
            showAlert('error', 'Please enter your full name.');
            profileName.focus();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('error', 'Please enter a valid email address.');
            profileEmail.focus();
            return;
        }

        localStorage.setItem('profile-name', name);
        localStorage.setItem('profile-email', email);
        localStorage.setItem('profile-phone', phone);

        showAlert('success', 'Profile settings updated successfully!');
    });

    // ==========================================
    // 6. COMPANY SETTINGS SAVE & LOGO UPLOAD
    // ==========================================
    logoUploadTrigger.addEventListener('click', () => {
        logoUploadInput.click();
    });

    logoUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Logo = event.target.result;
                logoImg.src = base64Logo;
                logoImg.classList.remove('hidden');
                logoSvg.classList.add('hidden');
                
                try {
                    localStorage.setItem('company-logo', base64Logo);
                    showAlert('success', 'Logo uploaded successfully. Save company config to apply.');
                } catch (err) {
                    console.warn('Storage quota limit exceeded.');
                }
            };
            reader.readAsDataURL(file);
        }
    });

    companyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const compName = companyNameInput.value.trim();
        const compGst = companyGstInput.value.trim();
        const compAddr = companyAddressInput.value.trim();

        if (!compName) {
            showAlert('error', 'Please enter your company name.');
            companyNameInput.focus();
            return;
        }

        localStorage.setItem('company-name', compName);
        localStorage.setItem('company-gst', compGst);
        localStorage.setItem('company-address', compAddr);

        showAlert('success', 'Company configurations saved successfully!');
    });

    // ==========================================
    // 7. NOTIFICATION SETTINGS SAVE
    // ==========================================
    notificationForm.addEventListener('submit', (e) => {
        e.preventDefault();

        localStorage.setItem('notify-rfq', notifyRfqCheckbox.checked);
        localStorage.setItem('notify-approval', notifyApprovalCheckbox.checked);
        localStorage.setItem('notify-invoice', notifyInvoiceCheckbox.checked);

        showAlert('success', 'Notification preferences updated!');
    });

    // ==========================================
    // 8. INVOICE SETTINGS SAVE
    // ==========================================
    invoiceForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const gstRate = invoiceGstRate.value.trim();
        const invPrefix = invoicePrefixInput.value.trim();
        const poPrefix = poPrefixInput.value.trim();

        if (gstRate === '' || gstRate < 0 || gstRate > 100) {
            showAlert('error', 'Please enter a valid tax percentage between 0 and 100.');
            invoiceGstRate.focus();
            return;
        }

        if (!invPrefix) {
            showAlert('error', 'Please define an invoice prefix.');
            invoicePrefixInput.focus();
            return;
        }

        if (!poPrefix) {
            showAlert('error', 'Please define a Purchase Order prefix.');
            poPrefixInput.focus();
            return;
        }

        localStorage.setItem('invoice-gst-rate', gstRate);
        localStorage.setItem('invoice-prefix', invPrefix);
        localStorage.setItem('po-prefix', poPrefix);

        showAlert('success', 'Invoice and PO settings saved successfully!');
    });

    // ==========================================
    // 9. SECURITY & SESSION CONTROL
    // ==========================================
    securityForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const oldPass = oldPassword.value;
        const newPass = newPassword.value;
        const confirmPass = confirmNewPassword.value;

        if (!oldPass) {
            showAlert('error', 'Please enter your old password.');
            oldPassword.focus();
            return;
        }

        if (!newPass || newPass.length < 6) {
            showAlert('error', 'New password must be at least 6 characters long.');
            newPassword.focus();
            return;
        }

        if (newPass !== confirmPass) {
            showAlert('error', 'Confirm password does not match.');
            confirmNewPassword.focus();
            return;
        }

        // Simulate password change
        showAlert('success', 'Security password updated successfully!');
        oldPassword.value = '';
        newPassword.value = '';
        confirmNewPassword.value = '';
    });

    logoutSessionsBtn.addEventListener('click', () => {
        // Mock session cleanup
        showAlert('success', 'Logged out of all other active sessions successfully.');
    });

    // ==========================================
    // 10. USER MANAGEMENT (CRUD SYSTEM)
    // ==========================================
    function getUsersList() {
        const usersStr = localStorage.getItem('vendorbridge-users-db');
        if (!usersStr) {
            localStorage.setItem('vendorbridge-users-db', JSON.stringify(defaultUsers));
            return defaultUsers;
        }
        return JSON.parse(usersStr);
    }

    function saveUsersList(users) {
        localStorage.setItem('vendorbridge-users-db', JSON.stringify(users));
    }

    function renderUsersTable() {
        const users = getUsersList();
        usersTableBody.innerHTML = '';

        if (users.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--color-text-muted);">No users found. Click Add User to register.</td>
                </tr>
            `;
            return;
        }

        users.forEach((user, index) => {
            const row = document.createElement('tr');
            
            // Role Display Map
            const rolesFriendly = {
                admin: 'Admin',
                procurement: 'Procurement Officer',
                vendor: 'Vendor',
                manager: 'Manager/Approver'
            };

            row.innerHTML = `
                <td style="font-weight: 600;">${user.name}</td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${rolesFriendly[user.role] || user.role}</span></td>
                <td><span style="color: ${user.status === 'active' ? 'var(--color-success)' : 'var(--color-text-muted)'}; font-weight: 600; text-transform: capitalize;">${user.status}</span></td>
                <td style="text-align: right;">
                    <div class="action-buttons" style="justify-content: flex-end;">
                        <button type="button" class="btn-table-action edit-btn" data-index="${index}" title="Edit User">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn-table-action delete-btn" data-index="${index}" title="Delete User">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            usersTableBody.appendChild(row);
        });

        // Attach action click listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = btn.getAttribute('data-index');
                openModalForEdit(idx);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = btn.getAttribute('data-index');
                deleteUser(idx);
            });
        });
    }

    // Modal Triggers
    addUserBtn.addEventListener('click', () => {
        openModalForAdd();
    });

    modalCloseBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);
    
    // Close modal if clicking overlay backdrop
    userModal.addEventListener('click', (e) => {
        if (e.target === userModal) {
            closeModal();
        }
    });

    function openModalForAdd() {
        userModalForm.reset();
        editUserIndex.value = '';
        modalTitleText.textContent = 'Add New User';
        userModal.classList.add('active');
        userModalName.focus();
    }

    function openModalForEdit(index) {
        const users = getUsersList();
        const user = users[index];

        userModalName.value = user.name;
        userModalEmail.value = user.email;
        userModalRole.value = user.role;
        editUserIndex.value = index;

        modalTitleText.textContent = 'Edit User Settings';
        userModal.classList.add('active');
        userModalName.focus();
    }

    function closeModal() {
        userModal.classList.remove('active');
    }

    function deleteUser(index) {
        const users = getUsersList();
        const name = users[index].name;

        if (confirm(`Are you sure you want to delete user "${name}"?`)) {
            users.splice(index, 1);
            saveUsersList(users);
            renderUsersTable();
            showAlert('success', `User "${name}" has been deleted.`);
        }
    }

    // Modal submit handler
    userModalForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = userModalName.value.trim();
        const email = userModalEmail.value.trim();
        const role = userModalRole.value;
        const index = editUserIndex.value;

        if (!name) {
            alert('Please enter a user name.');
            userModalName.focus();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            userModalEmail.focus();
            return;
        }

        if (!role) {
            alert('Please select a permission role.');
            userModalRole.focus();
            return;
        }

        const users = getUsersList();

        if (index === '') {
            // Adding a new user
            const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
            if (emailExists) {
                alert('A user with this email address already exists.');
                userModalEmail.focus();
                return;
            }

            users.push({
                name,
                email,
                role,
                status: 'active'
            });
            saveUsersList(users);
            showAlert('success', `New user "${name}" registered successfully.`);
        } else {
            // Editing existing user
            const emailExists = users.some((u, i) => i !== parseInt(index) && u.email.toLowerCase() === email.toLowerCase());
            if (emailExists) {
                alert('A user with this email address already exists.');
                userModalEmail.focus();
                return;
            }

            users[index].name = name;
            users[index].email = email;
            users[index].role = role;
            
            saveUsersList(users);
            showAlert('success', `User details for "${name}" updated.`);
        }

        closeModal();
        renderUsersTable();
    });

    // Initial render
    renderUsersTable();
});
