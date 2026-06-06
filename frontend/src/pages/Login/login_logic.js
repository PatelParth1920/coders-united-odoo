document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Cards
    const loginCard = document.getElementById('login-card');
    const forgotCard = document.getElementById('forgot-card');

    // DOM Elements - Forms
    const loginForm = document.getElementById('login-form');
    const forgotForm = document.getElementById('forgot-form');

    // DOM Elements - Login Card Fields
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const passwordToggleBtn = document.getElementById('password-toggle');
    const loginSubmitBtn = document.getElementById('login-submit');
    const loginAlertBox = document.getElementById('login-alert');

    // DOM Elements - Forgot Card Fields
    const recoveryEmailInput = document.getElementById('recovery-email');
    const recoverySubmitBtn = document.getElementById('recovery-submit');
    const forgotAlertBox = document.getElementById('forgot-alert');

    // DOM Elements - Card Triggers
    const triggerForgotLink = document.getElementById('trigger-forgot');
    const triggerLoginBtn = document.getElementById('trigger-login');

    // SVGs for Password Toggle Icon
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
    // 1. CARD NAVIGATION
    // ==========================================
    triggerForgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        clearAlerts();
        loginCard.classList.add('hidden');
        forgotCard.classList.remove('hidden');
        recoveryEmailInput.focus();
    });

    triggerLoginBtn.addEventListener('click', () => {
        clearAlerts();
        forgotCard.classList.add('hidden');
        loginCard.classList.remove('hidden');
        usernameInput.focus();
    });

    // ==========================================
    // 2. FOCUS MICRO-INTERACTION (Username Focus Highlight)
    // ==========================================
    usernameInput.addEventListener('focus', () => {
        loginCard.classList.add('focus-username');
    });

    usernameInput.addEventListener('blur', () => {
        loginCard.classList.remove('focus-username');
    });

    // ==========================================
    // 3. PASSWORD VISIBILITY TOGGLE
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
    // 4. ALERTS MANAGEMENT
    // ==========================================
    function showAlert(alertContainer, type, message) {
        alertContainer.className = `alert-box ${type}`;
        alertContainer.style.display = 'flex';
        
        const messageSpan = alertContainer.querySelector('.alert-message');
        const iconPath = alertContainer.querySelector('.alert-icon-path');
        
        messageSpan.textContent = message;

        if (type === 'success') {
            // Checkmark SVG path
            iconPath.setAttribute('d', 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3');
        } else {
            // Warning SVG path
            iconPath.setAttribute('d', 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01');
        }
    }

    function clearAlerts() {
        loginAlertBox.style.display = 'none';
        loginAlertBox.className = 'alert-box';
        forgotAlertBox.style.display = 'none';
        forgotAlertBox.className = 'alert-box';
    }

    // ==========================================
    // 5. LOGIN FORM VALIDATION & SUBMISSION
    // ==========================================
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAlerts();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Validation checks
        if (!username) {
            showAlert(loginAlertBox, 'error', 'Please enter your username or email address.');
            usernameInput.focus();
            return;
        }

        if (!password) {
            showAlert(loginAlertBox, 'error', 'Please enter your password.');
            passwordInput.focus();
            return;
        }

        if (password.length < 6) {
            showAlert(loginAlertBox, 'error', 'Password must be at least 6 characters long.');
            passwordInput.focus();
            return;
        }

        // Trigger Loading State
        setLoginLoading(true);

        // Simulate API authentication call
        setTimeout(() => {
            setLoginLoading(false);

            if (username.toLowerCase().includes('error') || password.includes('error')) {
                showAlert(loginAlertBox, 'error', 'Invalid username or password. Please try again.');
            } else {
                showAlert(loginAlertBox, 'success', `Welcome back, ${username}! Logging you in...`);
                // Clear input fields
                usernameInput.value = '';
                passwordInput.value = '';
            }
        }, 1500);
    });

    function setLoginLoading(isLoading) {
        if (isLoading) {
            loginSubmitBtn.classList.add('loading');
            loginSubmitBtn.disabled = true;
            usernameInput.disabled = true;
            passwordInput.disabled = true;
            triggerForgotLink.style.pointerEvents = 'none';
            triggerForgotLink.style.opacity = '0.5';
        } else {
            loginSubmitBtn.classList.remove('loading');
            loginSubmitBtn.disabled = false;
            usernameInput.disabled = false;
            passwordInput.disabled = false;
            triggerForgotLink.style.pointerEvents = 'auto';
            triggerForgotLink.style.opacity = '1';
        }
    }

    // ==========================================
    // 6. RECOVERY FORM VALIDATION & SUBMISSION
    // ==========================================
    forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAlerts();

        const email = recoveryEmailInput.value.trim();

        // Email structure validation
        if (!email) {
            showAlert(forgotAlertBox, 'error', 'Please enter your recovery email address.');
            recoveryEmailInput.focus();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert(forgotAlertBox, 'error', 'Please enter a valid email address.');
            recoveryEmailInput.focus();
            return;
        }

        // Trigger Loading State
        setRecoveryLoading(true);

        // Simulate Password Reset Dispatch API
        setTimeout(() => {
            setRecoveryLoading(false);

            if (email.toLowerCase().includes('error')) {
                showAlert(forgotAlertBox, 'error', 'We couldn\'t find an account matching that email.');
            } else {
                showAlert(forgotAlertBox, 'success', `Recovery instructions sent to ${email}. Check your inbox!`);
                recoveryEmailInput.value = '';
            }
        }, 1500);
    });

    function setRecoveryLoading(isLoading) {
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
});
