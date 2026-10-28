/**
 * CBS Prime - Enterprise Banking Authentication Engine
 * Client-side security, quick-fill profiles, and session management
 */

document.addEventListener('DOMContentLoaded', () => {
    initLogin();
});

function initLogin() {
    setupTabSwitching();
    setupPasswordToggle();
    setupLoginForm();
    setupDemoQuickFill();
}

// Mode Switching (Customer vs Admin)
function setupTabSwitching() {
    const tabs = document.querySelectorAll('.mode-tab-btn');
    const identifierInput = document.getElementById('loginIdentifier');
    const identifierLabel = document.getElementById('identifierLabel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const mode = tab.getAttribute('data-mode');
            if (mode === 'admin') {
                if (identifierLabel) identifierLabel.textContent = 'Administrator ID / Username';
                if (identifierInput) {
                    identifierInput.placeholder = 'e.g. admin or manager';
                    identifierInput.value = 'admin';
                }
                const pwd = document.getElementById('loginPassword');
                if (pwd) pwd.value = 'admin123';
            } else {
                if (identifierLabel) identifierLabel.textContent = 'Account # or Customer Name';
                if (identifierInput) {
                    identifierInput.placeholder = 'e.g. 1001002001 or Sarah';
                    identifierInput.value = '';
                }
                const pwd = document.getElementById('loginPassword');
                if (pwd) pwd.value = '';
            }
            hideError();
        });
    });
}

// Password Visibility Toggle
function setupPasswordToggle() {
    const toggleBtn = document.getElementById('btnTogglePassword');
    const passwordInput = document.getElementById('loginPassword');

    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = isPassword ? 'fa fa-eye-slash' : 'fa fa-eye';
            }
        });
    }
}

// One-Click Demo Credentials
function setupDemoQuickFill() {
    document.querySelectorAll('.demo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const pwd = btn.getAttribute('data-pwd');
            const mode = btn.getAttribute('data-mode') || 'customer';

            // Select matching tab
            const targetTab = document.querySelector(`.mode-tab-btn[data-mode="${mode}"]`);
            if (targetTab) targetTab.click();

            const identifierInput = document.getElementById('loginIdentifier');
            const passwordInput = document.getElementById('loginPassword');

            if (identifierInput) identifierInput.value = id;
            if (passwordInput) passwordInput.value = pwd;

            hideError();

            // Subtle highlight flash
            const card = document.querySelector('.login-card');
            if (card) {
                card.style.boxShadow = '0 0 35px rgba(6, 182, 212, 0.4)';
                setTimeout(() => {
                    card.style.boxShadow = '';
                }, 400);
            }
        });
    });
}

// Login Form Submission
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('btnSubmitLogin');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const identifier = document.getElementById('loginIdentifier').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!identifier || !password) {
            showError('Please enter both your Account identifier and Password.');
            return;
        }

        try {
            setLoading(true);
            hideError();

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            const result = await response.json();

            if (response.ok && result.success && result.data) {
                // Save user and auth token to localStorage
                localStorage.setItem('cbs_token', result.data.token);
                localStorage.setItem('cbs_user', JSON.stringify(result.data));

                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="fa fa-check"></i> Authorized! Accessing Gateway...';
                    submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                }

                // Redirect to main banking dashboard
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 600);
            } else {
                showError(result.message || 'Authentication failed. Please check your credentials.');
                setLoading(false);
            }
        } catch (err) {
            console.error('Login network error:', err);
            showError('Unable to connect to Core Banking Server. Ensure application is running.');
            setLoading(false);
        }
    });
}

function setLoading(isLoading) {
    const submitBtn = document.getElementById('btnSubmitLogin');
    if (!submitBtn) return;

    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa fa-circle-o-notch fa-spin"></i> Authenticating Credentials...';
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa fa-lock"></i> Authorize &amp; Sign In <i class="fa fa-arrow-right"></i>';
        submitBtn.style.background = '';
    }
}

function showError(msg) {
    const errorBanner = document.getElementById('authErrorBanner');
    const errorMsgText = document.getElementById('errorMsgText');
    if (errorBanner && errorMsgText) {
        errorMsgText.textContent = msg;
        errorBanner.classList.add('visible');
    }
}

function hideError() {
    const errorBanner = document.getElementById('authErrorBanner');
    if (errorBanner) {
        errorBanner.classList.remove('visible');
    }
}
