import * as utils from './utils.js';
import * as ui from './ui.js';
import { initSharedComponents } from './shared.js'; // ІМПОРТ СПІЛЬНОЇ ЛОГІКИ

// Ініціалізація Socket.IO
const socket = io(utils.API_URL);

// Елементи форми (унікальні для цієї сторінки)
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
    // Прев'ю елементи
    previewTitle: document.getElementById('previewTitle'),
    previewDate: document.getElementById('previewDate'),
    previewLocation: document.getElementById('previewLocation'),
    previewDesc: document.getElementById('previewDesc'),
    previewCategoryBadge: document.getElementById('previewCategoryBadge'),
    previewParticipantsInfo: document.getElementById('previewParticipantsInfo'),
    previewAvatarImg: document.getElementById('previewAvatarImg'),
    previewCreatorName: document.getElementById('previewCreatorName')
};

let currentStep = 1;
const totalSteps = 3;
const user = utils.getCurrentUser();

document.addEventListener('DOMContentLoaded', async () => {
    if (!user) {
        window.location.href = '/'; 
        return;
    }

    // --- КЛЮЧОВИЙ МОМЕНТ: Запуск спільних компонентів ---
    // Це автоматично додасть хедер, модалки і всю їхню логіку
    await initSharedComponents(socket);

    await utils.fetchGlobalInterests();
    ui.renderInterests(elements.interestsContainer, [], () => {});

    setupWizard();
    setupPreview();
    setupInterests();
    
    elements.form.addEventListener('submit', handleFormSubmit);
});

// ... Далі йде логіка Wizard, Preview і Submit, яка не змінюється ...
// (Скопіюйте сюди функції setupWizard, updateStepsUI, validateStep, setupPreview, setupInterests, handleFormSubmit з попередньої відповіді, бо вони специфічні для цієї форми)
// АЛЕ! Переконайтесь, що validateStep використовує пом'якшені правила, як я показував раніше.

function setupWizard() {
    document.querySelectorAll('.next-step-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(validateStep(currentStep)) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    updateStepsUI();
                }
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
    document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${currentStep}`).classList.add('active');

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
        
        if (title.length < 3) {
            utils.showToast('Назва має бути довшою (мін. 3 символи)', 'error');
            return false;
        }
        if (desc.length < 3) { 
            utils.showToast('Введіть хоча б короткий опис', 'error');
            return false;
        }
        if (cat === "") {
            utils.showToast('Оберіть категорію', 'error');
            return false;
        }
        return true; 
    }
    if (step === 2) {
        const loc = elements.location.value.trim();
        const date = elements.date.value;
        const part = elements.participants.value;
        const minPart = elements.minParticipants.value;
        
        if (loc.length < 3) {
            utils.showToast('Введіть коректне місце проведення', 'error');
            return false;
        }
        if (!date) {
            utils.showToast('Встановіть дату та час події', 'error');
            return false;
        }
        if (parseInt(part) < 2 || parseInt(part) > 100) {
            utils.showToast('Макс. учасників: від 2 до 100', 'error');
            return false;
        }
        if (minPart && parseInt(minPart) > parseInt(part)) {
            utils.showToast('Мін. учасників не може перевищувати макс. учасників', 'error');
            return false;
        }
        return true;
    }
    return true; 
}

function setupPreview() {
    if (user) {
        if (elements.previewCreatorName) elements.previewCreatorName.textContent = user.username;
        if (elements.previewAvatarImg) elements.previewAvatarImg.src = user.avatarBase64 || 'https://via.placeholder.com/32';
    }

    elements.title.addEventListener('input', (e) => {
        elements.previewTitle.textContent = e.target.value.trim() || 'Назва події...';
    });

    const categoryNames = {
        'sports': 'Спорт', 'games': 'Ігри', 'arts': 'Мистецтво',
        'food': 'Їжа', 'outdoors': 'Природа', 'learning': 'Навчання',
        'social': 'Спілкування', 'music': 'Музика', 'travel': 'Подорожі',
        'boardgames': 'Настільні ігри'
    };

    elements.category.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val && categoryNames[val]) {
            elements.previewCategoryBadge.textContent = categoryNames[val];
            elements.previewCategoryBadge.style.display = 'inline-block';
        } else {
            elements.previewCategoryBadge.style.display = 'none';
        }
    });

    elements.location.addEventListener('input', (e) => {
        elements.previewLocation.textContent = e.target.value.trim() || 'Місце проведення';
    });

    elements.date.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val) {
            const dateObj = new Date(val);
            const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            elements.previewDate.textContent = dateObj.toLocaleString('uk-UA', options);
        } else {
            elements.previewDate.textContent = 'Дата та час';
        }
    });

    elements.description.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        elements.previewDesc.textContent = val || 'Тут з\'явиться короткий опис вашої події...';
    });

    elements.participants.addEventListener('input', updateParticipantsPreview);
    
    function updateParticipantsPreview() {
        const max = elements.participants.value || 0;
        elements.previewParticipantsInfo.innerHTML = `<i class="fas fa-users"></i> 1/${max}`;
    }
}

function setupInterests() {
    elements.addInterestBtn.addEventListener('click', () => {
        const val = elements.customInterestInput.value.trim();
        if (val) {
            if (val.length > 20) {
                utils.showToast('Занадто довга назва тегу', 'error');
                return;
            }
            if (utils.addGlobalInterest(val)) {
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
        const res = await fetch(`${utils.API_URL}/api/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(newEvent)
        });

        if (res.ok) {
            utils.showToast('Подію успішно створено!', 'success');
            
            const submitBtn = elements.form.querySelector('button[type="submit"]');
            if(submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Перехід...';
            }

            setTimeout(() => {
                window.location.replace('/#events');
            }, 500);
        } else {
            const err = await res.json();
            utils.showToast(err.error || 'Помилка створення', 'error');
        }
    } catch (error) {
        console.error(error);
        utils.showToast('Помилка сервера', 'error');
    }
}