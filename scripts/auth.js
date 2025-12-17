import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js'; 

let pendingUserId = null;

export function initAuthTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab + 'Tab';
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

export const loginValidations = [
    { inputId: 'loginEmailInitial', errorId: 'loginEmailError', validationFn: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), errorMessage: 'Введіть коректну пошту' },
    { inputId: 'loginPasswordInitial', errorId: 'loginPasswordError', validationFn: v => v.length >= 6, errorMessage: 'Пароль: від 6 символів' }
];

export const registerValidations = [
    { inputId: 'registerName', errorId: 'registerNameError', validationFn: v => v.length >= 2, errorMessage: 'Ім’я: від 2 символів' },
    { inputId: 'registerEmail', errorId: 'registerEmailError', validationFn: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), errorMessage: 'Введіть коректну пошту' },
    { inputId: 'registerPassword', errorId: 'registerPasswordError', validationFn: v => v.length >= 6, errorMessage: 'Пароль: від 6 символів' },
    { inputId: 'registerUsername', errorId: 'registerUsernameError', validationFn: v => /^[a-zA-Z0-9_]{3,15}$/.test(v), errorMessage: 'Логін: 3-15 символів' },
    { inputId: 'registerAge', errorId: 'registerAgeError', validationFn: v => v >= 16 && v <= 100, errorMessage: 'Вік: від 16 до 100' },
    { inputId: 'registerLocation', errorId: 'registerLocationError', validationFn: v => v.length >= 2, errorMessage: 'Місце: від 2 символів' }
];

// --- ЛОГІН ---
export async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmailInitial')?.value.trim().toLowerCase();
    const password = document.getElementById('loginPasswordInitial')?.value;
    
    try {
        const response = await fetch(`${utils.API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('token', data.token); // Це JWT токен
            location.reload();
        } else {
            const err = await response.json();
            if (err.userId && err.error && err.error.includes('Пошта не підтверджена')) {
                pendingUserId = err.userId;
                utils.openModal(dom.verifyModal);
                if (dom.verifyCodeInput) {
                    dom.verifyCodeInput.value = '';
                    dom.verifyCodeInput.focus();
                }
                utils.showToast('Введіть код підтвердження, який ми надіслали вам.', 'info');
            } else {
                 utils.showToast(err.error || 'Помилка входу', 'error');
            }
        }
    } catch (error) {
        utils.showToast('Помилка сервера', 'error');
    }
}

// --- РЕЄСТРАЦІЯ ---
export async function handleRegisterSubmit(e) {
    e.preventDefault();
    const isValid = registerValidations.every(({ inputId, errorId, validationFn, errorMessage }) => 
        utils.validateInput(document.getElementById(inputId), document.getElementById(errorId), validationFn, errorMessage));
    
    if (!isValid) { utils.showToast('Заповніть усі поля коректно', 'error'); return; }

    const consentCheckbox = document.getElementById('registerConsent');
    if (!consentCheckbox || !consentCheckbox.checked) { utils.showToast('Погодьтеся на обробку даних', 'error'); return; }

    const selectedInterests = Array.from(dom.registerInterestsContainer?.querySelectorAll('.interest-tag.selected') || []).map(tag => tag.dataset.interest);
    if (selectedInterests.length < 1) { utils.showToast('Виберіть інтерес', 'error'); return; }

    let avatarBase64 = '';
    const photoInput = document.getElementById('registerPhoto');
    if (photoInput && photoInput.files[0]) {
        avatarBase64 = await utils.fileToBase64(photoInput.files[0]);
    }

    const newUserPayload = {
        name: document.getElementById('registerName')?.value.trim(),
        email: document.getElementById('registerEmail')?.value.trim().toLowerCase(),
        username: document.getElementById('registerUsername')?.value.trim(),
        password: document.getElementById('registerPassword')?.value,
        age: parseInt(document.getElementById('registerAge')?.value),
        location: document.getElementById('registerLocation')?.value.trim(),
        interests: selectedInterests,
        avatarBase64: avatarBase64
    };

    try {
        const response = await fetch(`${utils.API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUserPayload)
        });

        if (response.ok) {
            const data = await response.json();
            pendingUserId = data.userId;
            utils.closeModal(dom.registerModal);
            utils.openModal(dom.verifyModal);
            if (dom.verifyCodeInput) {
                dom.verifyCodeInput.value = '';
                dom.verifyCodeInput.focus();
            }
            utils.showToast('Код надіслано на пошту!', 'info');
        } else {
            const err = await response.json();
            utils.showToast(err.error || 'Помилка реєстрації', 'error');
        }
    } catch (error) {
        utils.showToast('Помилка сервера', 'error');
    }
}

// --- ПІДТВЕРДЖЕННЯ КОДУ ---
export async function handleVerifySubmit() {
    const code = dom.verifyCodeInput.value.trim();
    if (code.length !== 6) {
        if (dom.verifyError) {
            dom.verifyError.textContent = "Введіть 6 цифр";
            dom.verifyError.style.display = 'block';
        }
        return;
    }

    try {
        const res = await fetch(`${utils.API_URL}/api/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: pendingUserId, code: code })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            utils.closeModal(dom.verifyModal);
            utils.showToast('Акаунт підтверджено!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            const err = await res.json();
            if (dom.verifyError) {
                dom.verifyError.textContent = err.error || "Невірний код";
                dom.verifyError.style.display = 'block';
            }
        }
    } catch (e) {
        utils.showToast('Помилка сервера', 'error');
    }
}

export function handleAddCustomInterest() {
    const interest = dom.customInterestInput.value.trim();
    if (!interest) return utils.showToast('Введіть назву інтересу', 'error');
    if (interest.length > 20) return utils.showToast('Занадто довга назва', 'error');

    if (utils.addGlobalInterest(interest)) {
        ui.updateAllInterestContainers();
        setTimeout(() => {
            const tags = dom.registerInterestsContainer.querySelectorAll('.interest-tag');
            tags.forEach(tag => {
                if (tag.dataset.interest === interest) {
                    tag.classList.add('selected');
                    tag.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }, 50);
        dom.customInterestInput.value = '';
        utils.showToast('Інтерес додано!', 'success');
    } else {
        utils.showToast('Такий інтерес вже є', 'info');
    }
}

// --- ВІДНОВЛЕННЯ ПАРОЛЮ ---
export function initForgotPassword() {
    if (dom.forgotPasswordLink) {
        dom.forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            utils.openModal(dom.forgotPasswordModal);
            if(dom.forgotStep1) dom.forgotStep1.style.display = 'block';
            if(dom.forgotStep2) dom.forgotStep2.style.display = 'none';
        });
    }

    if (dom.closeForgotPasswordModal) {
        dom.closeForgotPasswordModal.addEventListener('click', () => utils.closeModal(dom.forgotPasswordModal));
    }

    if (dom.sendResetCodeBtn) {
        dom.sendResetCodeBtn.addEventListener('click', async () => {
            const email = dom.forgotEmailInput.value.trim();
            if (!email || !email.includes('@')) return utils.showToast('Введіть коректну пошту', 'error');

            try {
                const res = await fetch(`${utils.API_URL}/api/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (res.ok) {
                    utils.showToast('Код надіслано!', 'success');
                    dom.forgotStep1.style.display = 'none';
                    dom.forgotStep2.style.display = 'block';
                    dom.forgotEmailDisplay.textContent = email;
                } else {
                    const err = await res.json();
                    utils.showToast(err.error || 'Помилка', 'error');
                }
            } catch (e) {
                utils.showToast('Помилка сервера', 'error');
            }
        });
    }

    if (dom.confirmResetBtn) {
        dom.confirmResetBtn.addEventListener('click', async () => {
            const email = dom.forgotEmailDisplay.textContent;
            const code = dom.forgotCodeInput.value.trim();
            const newPassword = dom.forgotNewPassword.value;

            if (code.length < 6) return utils.showToast('Введіть код', 'error');
            if (newPassword.length < 6) return utils.showToast('Пароль занадто короткий', 'error');

            try {
                const res = await fetch(`${utils.API_URL}/api/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, code, newPassword })
                });

                if (res.ok) {
                    utils.showToast('Пароль успішно змінено!', 'success');
                    utils.closeModal(dom.forgotPasswordModal);
                    document.querySelector('.tab-btn[data-tab="login"]')?.click();
                } else {
                    const err = await res.json();
                    utils.showToast(err.error || 'Помилка зміни паролю', 'error');
                }
            } catch (e) {
                utils.showToast('Помилка сервера', 'error');
            }
        });
    }
}