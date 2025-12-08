import * as dom from './dom.js';
import * as utils from './utils.js';

export function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

export function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        if (dom.themeToggle) dom.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else if (dom.themeToggle) {
        dom.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

export function handleBackToTop() {
    if (dom.backToTopBtn) {
        window.addEventListener('scroll', () => {
            dom.backToTopBtn.classList.toggle('visible', window.scrollY > 300);
            document.querySelector('header')?.classList.toggle('scrolled', window.scrollY > 0);
        });
        dom.backToTopBtn.addEventListener('click', () => {
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
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            utils.scrollToSection(sectionId);
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        });
    });

    if (dom.chatListBtn) {
        // Логіка відкриття чату викликається в main.js через renderChatList
    }
}

export function showMainApp(user) {
    if (dom.authScreen && dom.mainApp) {
        dom.authScreen.style.display = 'none';
        dom.mainApp.style.display = 'block';
    }
    if (dom.profileUsername) dom.profileUsername.textContent = user.username;
    if (dom.profileAvatar) dom.profileAvatar.src = user.avatarBase64 || 'https://via.placeholder.com/48';
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
    const allInterests = utils.globalCustomInterests;
    
    container.innerHTML = allInterests.map(interest => `
        <span class="interest-tag ${selected.includes(interest) ? 'selected' : ''}" data-interest="${interest}">${interest}</span>
    `).join('');
    
    container.querySelectorAll('.interest-tag').forEach(tag => {
        tag.addEventListener('click', () => {
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

export async function openInterestSearchModal(interest) {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб шукати за інтересами', 'info');
        return;
    }

    if (!dom.interestSearchModal) return;

    dom.interestModalTitle.innerHTML = `Результати для: <span class="interest-tag selected" style="font-size: 0.8em; cursor: default;">${interest}</span>`;

    const allEvents = await utils.getEvents();
    const filteredEvents = allEvents.filter(e => e.interests.includes(interest));
    
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

    const allUsers = await utils.getUsers();
    const filteredPeople = allUsers.filter(p => 
        p.interests.includes(interest) && 
        p.id !== user.id
    );

    if (filteredPeople.length === 0) {
        dom.interestModalPeopleGrid.innerHTML = '<p style="color: #888; font-size: 0.9em;">У вашому місті немає людей з цим інтересом.</p>';
    } else {
        dom.interestModalPeopleGrid.innerHTML = filteredPeople.map(person => `
            <div class="interest-modal-person-item" data-user-id="${person.id}">
                <img src="${person.avatarBase64 || 'https://via.placeholder.com/40'}" loading="lazy">
                <div>
                    <div class="item-title">${person.username}</div>
                </div>
            </div>
        `).join('');
    }

    utils.openModal(dom.interestSearchModal);
}

export let currentEventStep = 1;
const stepTitles = ["Основна інформація", "Логістика", "Інтереси"];

export function showEventStep(step) {
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
        }
    } else {
        utils.showToast(interest.length > 20 ? 'Інтерес занадто довгий' : 'Введіть інтерес', 'error');
    }
}