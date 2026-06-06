document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. LOCAL STORAGE DATABASE SEEDING
    // ==========================================
    const DEFAULT_USERS = [
        {
            email: 'procurement@vendorbridge.com',
            password: 'password123',
            name: 'Jane Doe',
            role: 'procurement',
            avatar: ''
        },
        {
            email: 'vendor@supplier.com',
            password: 'password123',
            name: 'Arjun Singh',
            role: 'vendor',
            avatar: ''
        },
        {
            email: 'admin@vendorbridge.com',
            password: 'password123',
            name: 'ERP Admin',
            role: 'admin',
            avatar: ''
        }
    ];

    function initializeUserDatabase() {
        if (!localStorage.getItem('vendorbridge-users')) {
            localStorage.setItem('vendorbridge-users', JSON.stringify(DEFAULT_USERS));
        }
    }
    initializeUserDatabase();

    function getUsers() {
        return JSON.parse(localStorage.getItem('vendorbridge-users'));
    }

    function saveUser(user) {
        const users = getUsers();
        users.push(user);
        localStorage.setItem('vendorbridge-users', JSON.stringify(users));
    }

    function findUserByEmail(email) {
        const users = getUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    // ==========================================
    // 2. DOM ELEMENTS
    // ==========================================
    // Card wrappers
    const loginCard = document.getElementById('login-card');
    const forgotCard = document.getElementById('forgot-card');
    const signupCard = document.getElementById('signup-card');

    // Forms
    const loginForm = document.getElementById('login-form');
    const forgotForm = document.getElementById('forgot-form');
    const signupForm = document.getElementById('signup-form');

    // Login Fields
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const passwordToggleBtn = document.getElementById('password-toggle');
    const loginSubmitBtn = document.getElementById('login-submit');
    const loginAlertBox = document.getElementById('login-alert');
    const loginSubtitle = document.getElementById('login-subtitle');

    // Session active wrapper (Inside Login Card)
    const sessionActiveView = document.getElementById('session-active-view');
    const sessionUsernameText = document.getElementById('session-username');
    const sessionRoleText = document.getElementById('session-role');
    const sessionDashboardBtn = document.getElementById('session-dashboard-btn');
    const sessionLogoutBtn = document.getElementById('session-logout-btn');

    // Forgot Fields
    const recoveryEmailInput = document.getElementById('recovery-email');
    const recoverySubmitBtn = document.getElementById('recovery-submit');
    const forgotAlertBox = document.getElementById('forgot-alert');

    // Signup Fields
    const signupNameInput = document.getElementById('signup-name');
    const signupEmailInput = document.getElementById('signup-email');
    const signupRoleInput = document.getElementById('signup-role');
    const signupPasswordInput = document.getElementById('signup-password');
    const signupConfirmPasswordInput = document.getElementById('signup-confirm-password');
    const signupSubmitBtn = document.getElementById('signup-submit');
    const signupAlertBox = document.getElementById('signup-alert');

    // Card state triggers
    const triggerForgotLink = document.getElementById('trigger-forgot');
    const triggerSignupLink = document.getElementById('trigger-signup');
    const triggerLoginBtn = document.getElementById('trigger-login');
    const triggerLoginFromSignupBtn = document.getElementById('trigger-login-from-signup');

    // Avatar handlers (Login Card)
    const profilePicContainer = document.getElementById('profile-pic');
    const avatarImg = document.getElementById('avatar-img');
    const avatarUploadInput = document.getElementById('avatar-upload');

    // Avatar handlers (Signup Card)
    const signupProfilePicContainer = document.getElementById('signup-profile-pic');
    const signupAvatarImg = document.getElementById('signup-avatar-img');
    const signupAvatarUploadInput = document.getElementById('signup-avatar-upload');

    let currentSignupAvatarBase64 = '';

    // SVGs for eye toggle icon
    const eyeOpenIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    `;
    const eyeCloseIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
            <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
            <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
    `;

    // ==========================================
    // 3. SESSION CHECK ON PAGE LOAD
    // ==========================================
    function checkSession() {
        const session = sessionStorage.getItem('vendorbridge-session');
        if (session) {
            const sessionData = JSON.parse(session);
            
            // Hide normal login form and titles
            loginForm.classList.add('hidden');
            loginSubtitle.classList.add('hidden');
            
            // Display active session view
            sessionActiveView.classList.remove('hidden');
            
            // Populate fields
            sessionUsernameText.textContent = sessionData.email;
            
            // Display friendly name role
            const rolesMap = {
                procurement: 'Procurement Manager / Buyer',
                vendor: 'Vendor / Supplier Portal',
                admin: 'ERP System Administrator'
            };
            sessionRoleText.textContent = rolesMap[sessionData.role] || sessionData.role;

            // Load custom avatar if saved
            if (sessionData.avatar) {
                avatarImg.src = sessionData.avatar;
            } else {
                // Check if user has avatar in database
                const dbUser = findUserByEmail(sessionData.email);
                if (dbUser && dbUser.avatar) {
                    avatarImg.src = dbUser.avatar;
                } else {
                    avatarImg.src = "../../../assets/user_avatar_arjun.png";
                }
            }
        } else {
            // Restore normal form view
            loginForm.classList.remove('hidden');
            loginSubtitle.classList.remove('hidden');
            sessionActiveView.classList.add('hidden');
            
            // Default avatar
            const savedGlobalAvatar = localStorage.getItem('vendorbridge-avatar');
            if (savedGlobalAvatar) {
                avatarImg.src = savedGlobalAvatar;
            } else {
                avatarImg.src = "../../../assets/user_avatar_arjun.png";
            }
        }
    }
    checkSession();

    // ==========================================
    // 4. NAVIGATIONS & CARD FLIPS
    // ==========================================
    triggerForgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        clearAlerts();
        loginCard.classList.add('hidden');
        forgotCard.classList.remove('hidden');
        recoveryEmailInput.focus();
    });

    triggerSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        clearAlerts();
        loginCard.classList.add('hidden');
        signupCard.classList.remove('hidden');
        signupNameInput.focus();
    });

    triggerLoginBtn.addEventListener('click', () => {
        clearAlerts();
        forgotCard.classList.add('hidden');
        loginCard.classList.remove('hidden');
        usernameInput.focus();
    });

    triggerLoginFromSignupBtn.addEventListener('click', () => {
        clearAlerts();
        signupCard.classList.add('hidden');
        loginCard.classList.remove('hidden');
        usernameInput.focus();
    });

    // Username input focus decoration
    usernameInput.addEventListener('focus', () => {
        loginCard.classList.add('focus-username');
    });
    usernameInput.addEventListener('blur', () => {
        loginCard.classList.remove('focus-username');
    });

    // ==========================================
    // 5. AVATAR UPLOAD TRIGGERS
    // ==========================================
    profilePicContainer.addEventListener('click', () => {
        avatarUploadInput.click();
    });

    avatarUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Data = event.target.result;
                avatarImg.src = base64Data;
                localStorage.setItem('vendorbridge-avatar', base64Data);

                // Update current user if logged in
                const session = sessionStorage.getItem('vendorbridge-session');
                if (session) {
                    const sessionData = JSON.parse(session);
                    sessionData.avatar = base64Data;
                    sessionStorage.setItem('vendorbridge-session', JSON.stringify(sessionData));

                    // Update in database
                    const users = getUsers();
                    const userIndex = users.findIndex(u => u.email.toLowerCase() === sessionData.email.toLowerCase());
                    if (userIndex !== -1) {
                        users[userIndex].avatar = base64Data;
                        localStorage.setItem('vendorbridge-users', JSON.stringify(users));
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    });

    signupProfilePicContainer.addEventListener('click', () => {
        signupAvatarUploadInput.click();
    });

    signupAvatarUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                currentSignupAvatarBase64 = event.target.result;
                signupAvatarImg.src = currentSignupAvatarBase64;
            };
            reader.readAsDataURL(file);
        }
    });

    // ==========================================
    // 6. PASSWORD VISIBILITY
    // ==========================================
    passwordToggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        if (isPassword) {
            passwordInput.setAttribute('type', 'text');
            passwordToggleBtn.innerHTML = eyeCloseIcon;
        } else {
            passwordInput.setAttribute('type', 'password');
            passwordToggleBtn.innerHTML = eyeOpenIcon;
        }
    });

    // ==========================================
    // 7. ALERTS DISPLAY LOGIC
    // ==========================================
    function showAlert(alertContainer, type, message) {
        alertContainer.className = `alert-box ${type}`;
        alertContainer.style.display = 'flex';
        
        const messageSpan = alertContainer.querySelector('.alert-message');
        const iconPath = alertContainer.querySelector('.alert-icon-path');
        
        messageSpan.textContent = message;

        if (type === 'success') {
            iconPath.setAttribute('d', 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3');
        } else {
            iconPath.setAttribute('d', 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01');
        }
    }

    function clearAlerts() {
        loginAlertBox.style.display = 'none';
        loginAlertBox.className = 'alert-box';
        forgotAlertBox.style.display = 'none';
        forgotAlertBox.className = 'alert-box';
        signupAlertBox.style.display = 'none';
        signupAlertBox.className = 'alert-box';
    }

    // ==========================================
    // 8. LOG IN CONTROLLER
    // ==========================================
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAlerts();

        const identifier = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!identifier) {
            showAlert(loginAlertBox, 'error', 'Please enter your username or email address.');
            usernameInput.focus();
            return;
        }

        if (!password) {
            showAlert(loginAlertBox, 'error', 'Please enter your password.');
            passwordInput.focus();
            return;
        }

        setLoginLoading(true);

        setTimeout(() => {
            setLoginLoading(false);

            // Fetch and check from LocalStorage DB
            const user = findUserByEmail(identifier);
            if (user && user.password === password) {
                // Store Session
                const sessionObject = {
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar
                };
                sessionStorage.setItem('vendorbridge-session', JSON.stringify(sessionObject));
                
                showAlert(loginAlertBox, 'success', `Welcome back, ${user.name}! Authenticating access...`);
                
                // Clear fields
                usernameInput.value = '';
                passwordInput.value = '';

                setTimeout(() => {
                    checkSession();
                }, 1000);
            } else {
                showAlert(loginAlertBox, 'error', 'Invalid email/username or password. Please try again.');
            }
        }, 1200);
    });

    function setLoginLoading(isLoading) {
        if (isLoading) {
            loginSubmitBtn.classList.add('loading');
            loginSubmitBtn.disabled = true;
            usernameInput.disabled = true;
            passwordInput.disabled = true;
            triggerForgotLink.style.pointerEvents = 'none';
            triggerSignupLink.style.pointerEvents = 'none';
        } else {
            loginSubmitBtn.classList.remove('loading');
            loginSubmitBtn.disabled = false;
            usernameInput.disabled = false;
            passwordInput.disabled = false;
            triggerForgotLink.style.pointerEvents = 'auto';
            triggerSignupLink.style.pointerEvents = 'auto';
        }
    }

    // ==========================================
    // 9. SIGN UP CONTROLLER
    // ==========================================
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAlerts();

        const name = signupNameInput.value.trim();
        const email = signupEmailInput.value.trim();
        const role = signupRoleInput.value;
        const password = signupPasswordInput.value;
        const confirmPassword = signupConfirmPasswordInput.value;

        // Validations
        if (!name) {
            showAlert(signupAlertBox, 'error', 'Please enter your full name.');
            signupNameInput.focus();
            return;
        }

        if (!email) {
            showAlert(signupAlertBox, 'error', 'Please enter your email address.');
            signupEmailInput.focus();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert(signupAlertBox, 'error', 'Please enter a valid email address.');
            signupEmailInput.focus();
            return;
        }

        if (!role) {
            showAlert(signupAlertBox, 'error', 'Please select a role.');
            signupRoleInput.focus();
            return;
        }

        if (!password) {
            showAlert(signupAlertBox, 'error', 'Please set a password.');
            signupPasswordInput.focus();
            return;
        }

        if (password.length < 6) {
            showAlert(signupAlertBox, 'error', 'Password must be at least 6 characters long.');
            signupPasswordInput.focus();
            return;
        }

        if (password !== confirmPassword) {
            showAlert(signupAlertBox, 'error', 'Passwords do not match.');
            signupConfirmPasswordInput.focus();
            return;
        }

        // Check if user already exists
        if (findUserByEmail(email)) {
            showAlert(signupAlertBox, 'error', 'An account with this email already exists.');
            signupEmailInput.focus();
            return;
        }

        setSignupLoading(true);

        setTimeout(() => {
            setSignupLoading(false);

            // Save user to local storage DB
            const newUser = {
                name,
                email,
                role,
                password,
                avatar: currentSignupAvatarBase64
            };
            saveUser(newUser);

            showAlert(signupAlertBox, 'success', 'Account created successfully! Switching to Login...');

            // Clear inputs
            signupNameInput.value = '';
            signupEmailInput.value = '';
            signupRoleInput.value = '';
            signupPasswordInput.value = '';
            signupConfirmPasswordInput.value = '';
            signupAvatarImg.src = "../../../assets/user_avatar_arjun.png";
            currentSignupAvatarBase64 = '';

            setTimeout(() => {
                signupCard.classList.add('hidden');
                loginCard.classList.remove('hidden');
                usernameInput.value = email;
                passwordInput.focus();
            }, 1500);

        }, 1200);
    });

    function setSignupLoading(isLoading) {
        if (isLoading) {
            signupSubmitBtn.classList.add('loading');
            signupSubmitBtn.disabled = true;
            signupNameInput.disabled = true;
            signupEmailInput.disabled = true;
            signupRoleInput.disabled = true;
            signupPasswordInput.disabled = true;
            signupConfirmPasswordInput.disabled = true;
            triggerLoginFromSignupBtn.disabled = true;
        } else {
            signupSubmitBtn.classList.remove('loading');
            signupSubmitBtn.disabled = false;
            signupNameInput.disabled = false;
            signupEmailInput.disabled = false;
            signupRoleInput.disabled = false;
            signupPasswordInput.disabled = false;
            signupConfirmPasswordInput.disabled = false;
            triggerLoginFromSignupBtn.disabled = false;
        }
    }

    // ==========================================
    // 10. FORGOT PASSWORD CONTROLLER
    // ==========================================
    forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAlerts();

        const email = recoveryEmailInput.value.trim();

        if (!email) {
            showAlert(forgotAlertBox, 'error', 'Please enter your email address.');
            recoveryEmailInput.focus();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert(forgotAlertBox, 'error', 'Please enter a valid email address.');
            recoveryEmailInput.focus();
            return;
        }

        setForgotLoading(true);

        setTimeout(() => {
            setForgotLoading(false);

            const user = findUserByEmail(email);
            if (user) {
                showAlert(forgotAlertBox, 'success', `A recovery link has been sent to ${email}!`);
                recoveryEmailInput.value = '';
            } else {
                showAlert(forgotAlertBox, 'error', 'Email address not found. Please register first.');
            }
        }, 1200);
    });

    function setForgotLoading(isLoading) {
        if (isLoading) {
            recoverySubmitBtn.classList.add('loading');
            recoverySubmitBtn.disabled = true;
            recoveryEmailInput.disabled = true;
            triggerLoginBtn.disabled = true;
        } else {
            recoverySubmitBtn.classList.remove('loading');
            recoverySubmitBtn.disabled = false;
            recoveryEmailInput.disabled = false;
            triggerLoginBtn.disabled = false;
        }
    }

    // ==========================================
    // 11. ACTIVE SESSION LOGOUT / DASHBOARD
    // ==========================================
    sessionLogoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('vendorbridge-session');
        checkSession();
    });

    sessionDashboardBtn.addEventListener('click', () => {
        alert('Simulating redirect to the VendorBridge Dashboard...');
    });
});
