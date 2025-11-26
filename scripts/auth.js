import * as dom from './dom.js';
import * as utils from './utils.js';
import { showMainApp, updateAllInterestContainers } from './ui.js';

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
    { inputId: 'registerUsername', errorId: 'registerUsernameError', validationFn: v => /^[a-zA-Z0-9_]{3,15}$/.test(v), errorMessage: 'Логін: 3-15 символів, лише літери, цифри, _' },
    { inputId: 'registerAge', errorId: 'registerAgeError', validationFn: v => v >= 16 && v <= 100, errorMessage: 'Вік: від 16 до 100' },
    { inputId: 'registerLocation', errorId: 'registerLocationError', validationFn: v => v.length >= 2, errorMessage: 'Місце: від 2 символів' }
];

export function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmailInitial')?.value.trim().toLowerCase();
    const password = document.getElementById('loginPasswordInitial')?.value;
    if (!email || !password) {
        utils.showToast('Заповніть усі поля', 'error');
        return;
    }
    const user = utils.getUsers().find(u => u.email === email && u.password === password);
    if (!user) {
        utils.showToast('Невірна пошта або пароль', 'error');
        return;
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
    showMainApp(user);
    dom.loginFormInitial.reset();
}

export async function handleRegisterSubmit(e) {
    e.preventDefault();
    const isValid = registerValidations.every(({ inputId, errorId, validationFn, errorMessage }) => 
        utils.validateInput(document.getElementById(inputId), document.getElementById(errorId), validationFn, errorMessage));
    
    if (!isValid) {
        utils.showToast('Заповніть усі поля коректно', 'error');
        return;
    }

    const consentCheckbox = document.getElementById('registerConsent');
    const consentError = document.getElementById('registerConsentError');
    
    if (!consentCheckbox.checked) {
        utils.showToast('Ви повинні погодитися на обробку даних', 'error');
        if (consentError) {
            consentError.textContent = 'Це поле є обов\'язковим';
            consentError.style.display = 'block';
        }
        consentCheckbox.addEventListener('change', () => {
            if (consentCheckbox.checked && consentError) {
                consentError.style.display = 'none';
            }
        }, { once: true }); 
        return; 
    } else {
        if (consentError) {
            consentError.style.display = 'none';
        }
    }

    const selectedInterests = Array.from(dom.registerInterestsContainer?.querySelectorAll('.interest-tag.selected') || []).map(tag => tag.dataset.interest);
    if (selectedInterests.length < 1) {
        utils.showToast('Виберіть хоча б один інтерес', 'error');
        return;
    }

    const users = utils.getUsers();
    const email = document.getElementById('registerEmail')?.value.trim().toLowerCase();
    const username = document.getElementById('registerUsername')?.value.trim();
    if (email && users.some(u => u.email === email)) {
        utils.showToast('Ця пошта вже зареєстрована', 'error');
        return;
    }
    if (username && users.some(u => u.username === username)) {
        utils.showToast('Цей логін вже зайнятий', 'error');
        return;
    }

    let avatarBase64 = '';
    // Примітка: у вашому HTML немає <input type="file" id="registerPhoto">
    // Якщо він є, цей код працюватиме.
    const photo = document.getElementById('registerPhoto')?.files[0];
    if (photo) {
        avatarBase64 = await utils.fileToBase64(photo);
        if (!avatarBase64) return;
    }

    const newUser = {
        id: users.length + 1,
        name: document.getElementById('registerName')?.value.trim(),
        email,
        username,
        password: document.getElementById('registerPassword')?.value,
        age: parseInt(document.getElementById('registerAge')?.value),
        location: document.getElementById('registerLocation')?.value.trim(),
        interests: selectedInterests,
        avatarBase64
    };

    users.push(newUser);
    utils.saveUsers(users);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    showMainApp(newUser);
    utils.closeModal(dom.registerModal); // Припускаючи, що реєстрація в модалці
    dom.registerForm.reset();
    utils.showToast('Реєстрація успішна!', 'success');
}

export function handleAddCustomInterest() {
    const interest = dom.customInterestInput.value.trim();
    if (interest && interest.length <= 20) {
        if (utils.addGlobalInterest(interest)) {
            updateAllInterestContainers();
            dom.customInterestInput.value = '';
            utils.showToast('Інтерес додано', 'success');
        } else {
            utils.showToast('Цей інтерес вже існує', 'error');
        }
    } else {
        utils.showToast(interest.length > 20 ? 'Інтерес занадто довгий' : 'Введіть інтерес', 'error');
    }
}