import * as utils from './utils.js';
import * as ui from './ui.js';

// Елементи DOM, специфічні для цієї сторінки
const elements = {
    form: document.getElementById('fullPageCreateEventForm'),
    title: document.getElementById('eventTitle'),
    description: document.getElementById('eventDescription'),
    category: document.getElementById('eventCategory'),
    location: document.getElementById('eventLocation'),
    date: document.getElementById('eventDate'),
    participants: document.getElementById('eventParticipants'),
    minParticipants: document.getElementById('eventMinParticipants'),
    interestsContainer: document.getElementById('eventInterestsContainer'),
    customInterestInput: document.getElementById('eventCustomInterestInput'),
    addInterestBtn: document.getElementById('addEventCustomInterestBtn'),
    previewTitle: document.getElementById('previewTitle'),
    previewDate: document.getElementById('previewDate'),
    profileAvatar: document.getElementById('profileAvatar'),
    profileUsername: document.getElementById('profileUsername'),
    themeToggle: document.getElementById('themeToggle')
};

// Змінні стану
let currentStep = 1;
const totalSteps = 3;
const user = utils.getCurrentUser();

// --- Ініціалізація ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Перевірка авторизації
    if (!user) {
        window.location.href = '/'; 
        return;
    }

    // 2. Заповнення хедера профілю
    if (elements.profileAvatar) elements.profileAvatar.src = user.avatarBase64 || 'https://via.placeholder.com/48';
    if (elements.profileUsername) elements.profileUsername.textContent = user.username;

    // 3. Тема
    ui.loadTheme();
    if (elements.themeToggle) elements.themeToggle.addEventListener('click', ui.toggleTheme);

    // 4. Завантаження інтересів
    await utils.fetchGlobalInterests();
    ui.renderInterests(elements.interestsContainer, [], () => {});

    // 5. Налаштування подій (Wizard, Preview, Interests)
    setupWizard();
    setupPreview();
    setupInterests();
    
    // 6. Обробка відправки форми
    elements.form.addEventListener('submit', handleFormSubmit);
});

// --- Логіка Wizard (Кроки) ---
function setupWizard() {
    document.querySelectorAll('.next-step-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(validateStep(currentStep)) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    updateStepsUI();
                }
            } else {
                utils.showToast('Будь ласка, заповніть обов’язкові поля', 'error');
            }
        });
    });

    document.querySelectorAll('.prev-step-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStepsUI();
            }
        });
    });
}

function updateStepsUI() {
    // Перемикання вмісту кроків
    document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${currentStep}`).classList.add('active');

    // Оновлення прогрес-бару
    document.querySelectorAll('.progress-step').forEach(el => {
        const stepNum = parseInt(el.dataset.step);
        if (stepNum <= currentStep) el.classList.add('active');
        else el.classList.remove('active');
    });
}

function validateStep(step) {
    if (step === 1) {
        const title = elements.title.value.trim();
        const desc = elements.description.value.trim();
        const cat = elements.category.value;
        // Валідація: мінімум 3 символи для назви
        if (title.length < 3) {
            utils.showToast('Назва має бути довшою (мін. 3 символи)', 'error');
            return false;
        }
        return title.length >= 3 && desc.length > 0 && cat !== "";
    }
    if (step === 2) {
        const loc = elements.location.value.trim();
        const date = elements.date.value;
        const part = elements.participants.value;
        return loc.length > 0 && date !== "" && part > 1;
    }
    return true; // Крок 3 (інтереси) не обов'язковий, або можна додати перевірку
}

// --- Логіка Preview ---
function setupPreview() {
    elements.title.addEventListener('input', (e) => elements.previewTitle.textContent = e.target.value || 'Назва події...');
    elements.date.addEventListener('input', (e) => {
        const d = e.target.value ? utils.formatEventDate(e.target.value) : 'Дата';
        elements.previewDate.innerHTML = `<i class="fas fa-calendar"></i> ${d}`;
    });
}

// --- Логіка Інтересів ---
function setupInterests() {
    elements.addInterestBtn.addEventListener('click', () => {
        const val = elements.customInterestInput.value.trim();
        if (val) {
            if (val.length > 20) {
                utils.showToast('Занадто довга назва тегу', 'error');
                return;
            }
            if (utils.addGlobalInterest(val)) {
                // Перемальовуємо і вибираємо новий тег
                ui.renderInterests(elements.interestsContainer, [], () => {});
                setTimeout(() => {
                   const tags = elements.interestsContainer.querySelectorAll('.interest-tag');
                   tags.forEach(t => { if(t.dataset.interest === val) t.classList.add('selected'); });
                }, 50);
                elements.customInterestInput.value = '';
                utils.showToast('Тег додано!', 'success');
            } else {
                utils.showToast('Такий тег вже існує', 'info');
            }
        }
    });
}

// --- Відправка форми ---
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const selectedInterests = Array.from(elements.interestsContainer.querySelectorAll('.interest-tag.selected'))
        .map(tag => tag.dataset.interest);

    const newEvent = {
        title: elements.title.value.trim(),
        description: elements.description.value.trim(),
        category: elements.category.value,
        location: elements.location.value.trim(),
        date: elements.date.value,
        participants: parseInt(elements.participants.value),
        minParticipants: parseInt(elements.minParticipants.value) || 0,
        creatorId: user.id,
        interests: selectedInterests
    };

    try {
        const res = await fetch('http://localhost:5000/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(newEvent)
        });

        if (res.ok) {
            utils.showToast('Подію успішно створено!', 'success');
            // Перенаправлення на головну сторінку до списку подій
            setTimeout(() => {
                window.location.href = '/#events';
            }, 1000);
        } else {
            const err = await res.json();
            utils.showToast(err.error || 'Помилка створення', 'error');
        }
    } catch (error) {
        console.error(error);
        utils.showToast('Помилка сервера', 'error');
    }
}