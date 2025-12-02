import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js'; // <--- ОСЬ ЦЕ БУЛО ПРОПУЩЕНО АБО НЕПРАВИЛЬНО

// Змінна для збереження ID користувача
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
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            location.reload();
        } else {
            const err = await response.json();
            utils.showToast(err.error || 'Помилка входу', 'error');
        }
    } catch (error) {
        utils.showToast('Помилка сервера', 'error');
    }
}

// --- РЕЄСТРАЦІЯ (Крок 1) ---
export async function handleRegisterSubmit(e) {
    e.preventDefault();
    const isValid = registerValidations.every(({ inputId, errorId, validationFn, errorMessage }) => 
        utils.validateInput(document.getElementById(inputId), document.getElementById(errorId), validationFn, errorMessage));
    
    if (!isValid) { utils.showToast('Заповніть усі поля коректно', 'error'); return; }

    const consentCheckbox = document.getElementById('registerConsent');
    if (!consentCheckbox.checked) { utils.showToast('Погодьтеся на обробку даних', 'error'); return; }

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
        const response = await fetch('http://localhost:5000/api/auth/register', {
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

// --- ПІДТВЕРДЖЕННЯ КОДУ (Крок 2) ---
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
        const res = await fetch('http://localhost:5000/api/auth/verify', {
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
            if (dom.verifyError) {
                dom.verifyError.textContent = "Невірний код";
                dom.verifyError.style.display = 'block';
            }
        }
    } catch (e) {
        utils.showToast('Помилка сервера', 'error');
    }
}

export function handleAddCustomInterest() {
    const interest = dom.customInterestInput.value.trim();
    
    if (!interest) {
        return utils.showToast('Введіть назву інтересу', 'error');
    }
    if (interest.length > 20) {
        return utils.showToast('Занадто довга назва', 'error');
    }

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
        const tags = dom.registerInterestsContainer.querySelectorAll('.interest-tag');
        tags.forEach(tag => {
            if (tag.dataset.interest === interest) {
                tag.classList.add('selected');
                tag.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }
}