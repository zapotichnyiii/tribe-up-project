import * as dom from './dom.js';
import * as utils from './utils.js';
import { openEventDetail } from './events.js';
import { openOtherUserProfile } from './user.js';

export function toggleTheme() {
    console.log('Toggle theme function called');
    
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    console.log('Theme toggled to:', isDark ? 'dark' : 'light');
}

export function loadTheme() {
    try {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            if (dom.themeToggle) dom.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else if (dom.themeToggle) {
            dom.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    } catch (error) {
        console.error('Помилка завантаження теми:', error);
    }
}

export function handleBackToTop() {
    if (dom.backToTopBtn) {
        window.addEventListener('scroll', () => {
            dom.backToTopBtn.classList.toggle('visible', window.scrollY > 300);
            document.querySelector('header').classList.toggle('scrolled', window.scrollY > 0);
        });
        dom.backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        dom.backToTopBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

export function setupNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
        });
        menuToggle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            navLinks.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
        });
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            utils.scrollToSection(sectionId);
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
        link.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            utils.scrollToSection(sectionId);
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    if (dom.chatListBtn) {
        dom.chatListBtn.addEventListener('click', () => {
            // renderChatList() буде викликано з main.js
            utils.openModal(dom.chatListModal);
        });
        dom.chatListBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // renderChatList() буде викликано з main.js
            utils.openModal(dom.chatListModal);
        });
    }
}

export function showMainApp(user) {
    if (dom.authScreen && dom.mainApp) {
        dom.authScreen.style.display = 'none';
        dom.mainApp.style.display = 'block';
    }
    if (dom.profileUsername) dom.profileUsername.textContent = `@${user.username}`;
    if (dom.profileAvatar) dom.profileAvatar.src = user.avatarBase64 || 'https://via.placeholder.com/48?text=@';
    if (dom.profileDisplay) dom.profileDisplay.style.display = 'flex';
}

export function showAuthScreen() {
    if (dom.mainApp && dom.authScreen) {
        dom.mainApp.style.display = 'none';
        dom.authScreen.style.display = 'flex';
    }
    if (dom.profileDisplay) dom.profileDisplay.style.display = 'none';
}

export function renderInterests(container, selected = [], onToggle) {
    if (!container) return;
    const allInterests = [...utils.defaultInterests, ...utils.globalCustomInterests];
    
    container.innerHTML = allInterests.map(interest => `
        <span class="interest-tag ${selected.includes(interest) ? 'selected' : ''}" data-interest="${interest}">${interest}</span>
    `).join('');
    
    container.querySelectorAll('.interest-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('selected');
            if (onToggle) onToggle();
        });
        tag.addEventListener('touchstart', (e) => {
            e.preventDefault();
            tag.classList.toggle('selected');
            if (onToggle) onToggle();
        });
    });
}

export function updateAllInterestContainers() {
    const containers = [
        dom.registerInterestsContainer,
        dom.editProfileInterestsContainer, 
        dom.eventInterestsContainer,
        dom.editEventInterestsContainer,
        dom.peopleInterestFilter
    ];
    
    containers.forEach(container => {
        if (container) {
            const selected = Array.from(container.querySelectorAll('.interest-tag.selected'))
                .map(tag => tag.dataset.interest);
            renderInterests(container, selected, () => {});
        }
    });
}

export function openInterestSearchModal(interest) {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Будь ласка, увійдіть, щоб шукати за інтересами', 'info');
        return;
    }

    if (!dom.interestSearchModal || !dom.interestModalTitle || !dom.interestModalEventsGrid || !dom.interestModalPeopleGrid) return;

    dom.interestModalTitle.innerHTML = `Результати для: <span class="interest-tag selected" style="font-size: 0.8em; cursor: default;">${interest}</span>`;

    const allEvents = utils.getEvents();
    const filteredEvents = allEvents.filter(e => 
        e.interests.includes(interest) && 
        e.location.toLowerCase() === user.location.toLowerCase()
    );
    
    if (filteredEvents.length === 0) {
        dom.interestModalEventsGrid.innerHTML = '<p style="color: #888; font-size: 0.9em;">У вашому місті немає подій з цим інтересом.</p>';
    } else {
        dom.interestModalEventsGrid.innerHTML = filteredEvents.map(event => `
            <div class="interest-modal-event-item" data-event-id="${event.eventId}">
                <div class="item-title">${event.title}</div>
                <div class="item-meta">${utils.formatEventDate(event.date)}</div>
            </div>
        `).join('');
    }

    const allUsers = utils.getUsers();
    const filteredPeople = allUsers.filter(p => 
        p.interests.includes(interest) && 
        p.location.toLowerCase() === user.location.toLowerCase() &&
        p.id !== user.id
    );

    if (filteredPeople.length === 0) {
        dom.interestModalPeopleGrid.innerHTML = '<p style="color: #888; font-size: 0.9em;">У вашому місті немає людей з цим інтересом.</p>';
    } else {
        dom.interestModalPeopleGrid.innerHTML = filteredPeople.map(person => `
            <div class="interest-modal-person-item" data-user-id="${person.id}">
                <img src="${person.avatarBase64 || 'https://via.placeholder.com/40?text=' + person.username[0]}" alt="${person.name}" loading="lazy">
                <div>
                    <div class="item-title">@${person.username}</div>
                    <div class="item-meta">${person.name}, ${person.age} років</div>
                </div>
            </div>
        `).join('');
    }

    utils.openModal(dom.interestSearchModal);
}

let currentEventStep = 1;
const stepTitles = ["Основна інформація", "Логістика", "Інтереси"];

export function showEventStep(step) {
    if (step > currentEventStep) {
        if (currentEventStep === 1) {
            const titleValid = utils.validateInput(dom.eventTitle, document.getElementById('eventTitleError'), v => v.length >= 3, 'Назва: від 3 символів');
            const descValid = utils.validateInput(dom.eventDescription, document.getElementById('eventDescriptionError'), v => v.length >= 10, 'Опис: від 10 символів');
            const catValid = utils.validateInput(dom.eventCategory, document.getElementById('eventCategoryError'), v => v !== "", 'Оберіть категорію');
            if (!titleValid || !descValid || !catValid) {
                utils.showToast('Заповніть усі поля коректно', 'error');
                return; 
            }
        }
        if (currentEventStep === 2) {
            const locValid = utils.validateInput(dom.eventLocation, document.getElementById('eventLocationError'), v => v.length >= 2, 'Місце: від 2 символів');
            const dateValid = utils.validateInput(dom.eventDate, document.getElementById('eventDateError'), v => new Date(v) > new Date(), 'Дата: у майбутньому');
            const partValid = utils.validateInput(dom.eventParticipants, document.getElementById('eventParticipantsError'), v => v >= 2 && v <= 100, 'Учасники: від 2 до 100');
            if (!locValid || !dateValid || !partValid) {
                utils.showToast('Заповніть усі поля коректно', 'error');
                return; 
            }
        }
    }

    currentEventStep = step;
    dom.eventSteps.forEach((stepEl, index) => {
        stepEl.classList.toggle('active', (index + 1) === currentEventStep);
    });
    if (dom.eventStepIndicator) dom.eventStepIndicator.textContent = `Крок ${currentEventStep} з ${dom.eventSteps.length}`;
    if (dom.modalStepTitle) dom.modalStepTitle.textContent = stepTitles[currentEventStep - 1];
}

export function initEventSteps() {
    if (dom.eventStepNext1) dom.eventStepNext1.addEventListener('click', () => showEventStep(2));
    if (dom.eventStepNext2) dom.eventStepNext2.addEventListener('click', () => showEventStep(3));
    if (dom.eventStepBack2) dom.eventStepBack2.addEventListener('click', () => showEventStep(1));
    if (dom.eventStepBack3) dom.eventStepBack3.addEventListener('click', () => showEventStep(2));
}

export function handleAddEventInterest() {
    const interest = dom.eventCustomInterestInput.value.trim();
    if (interest && interest.length <= 20) {
        if (utils.addGlobalInterest(interest)) {
            updateAllInterestContainers(); 
            const newTag = document.querySelector(`#eventInterestsContainer .interest-tag[data-interest="${interest}"]`);
            if (newTag) {
                newTag.classList.add('selected');
            }
            dom.eventCustomInterestInput.value = '';
            utils.showToast('Інтерес додано та обрано', 'success');
        } else {
            utils.showToast('Цей інтерес вже існує', 'info');
        }
    } else {
        utils.showToast(interest.length > 20 ? 'Інтерес занадто довгий' : 'Введіть інтерес', 'error');
    }
}