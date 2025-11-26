import * as dom from './dom.js';
import * as utils from './utils.js';
import { openEventDetail } from './events.js';
import { loadPrivateChat } from './chat.js';    
import { renderInterests } from './ui.js';   
export let selectedPeopleInterests = [];

export function renderPeopleInterestFilter() {
    const users = utils.getUsers();
    const currentUser = utils.getCurrentUser();
    if (!currentUser) return;

    const sameCityUsers = users.filter(u => 
        u.location.toLowerCase() === currentUser.location.toLowerCase() && u.id !== currentUser.id
    );

    const allInterests = [...new Set(sameCityUsers.flatMap(u => u.interests))].sort();
    const container = dom.peopleInterestFilter;

    if (!container) return;

    container.innerHTML = allInterests.map(interest => `
        <span class="interest-tag ${selectedPeopleInterests.includes(interest) ? 'selected' : ''}" 
        data-interest="${interest}">${interest}</span>
    `).join('');
}

export function renderPeople() {
    if (!dom.peopleGrid) return;

    dom.peopleGrid.innerHTML = '';
    const users = utils.getUsers();
    const currentUser = utils.getCurrentUser();

    if (!currentUser) {
        dom.peopleGrid.innerHTML = '<p>Увійдіть, щоб бачити людей з вашого міста.</p>';
        return;
    }

    let filtered = users.filter(u => 
        u.location.toLowerCase() === currentUser.location.toLowerCase() && u.id !== currentUser.id
    );

    if (selectedPeopleInterests.length > 0) {
        filtered = filtered.filter(u => 
            u.interests.some(i => selectedPeopleInterests.includes(i))
        );
    }

    if (filtered.length === 0) {
        const msg = selectedPeopleInterests.length > 0
            ? 'Нікого не знайдено за вибраними інтересами.'
            : 'У вашому місті ще немає інших користувачів.';
        dom.peopleGrid.innerHTML = `<p>${msg}</p>`;
        return;
    }

    filtered.forEach(person => {
        const card = document.createElement('div');
        card.className = 'card people-card';
        card.dataset.userId = person.id;

        const interestsHtml = person.interests
            .map(i => `<span class="interest-tag selected">${i}</span>`)
            .join('');

        card.innerHTML = `
            <div class="people-card-header">
                <img src="${person.avatarBase64 || 'https://via.placeholder.com/60?text=' + person.username[0]}"
                    alt="${person.name}" loading="lazy">
                <div>
                    <h3>@${person.username}</h3>
                    <p>${person.age} років</p>
                </div>
            </div>
            <div class="interests">${interestsHtml}</div>
            <div class="card-actions">
                <button class="btn btn-outline btn-sm message-btn">Написати</button>
            </div>
        `;

        dom.peopleGrid.appendChild(card);
    });
}

export function renderUserEvents(user) {
    if (!dom.userEventsList) return;
    dom.userEventsList.innerHTML = '';

    const events = utils.getEvents();
    const joinedEvents = utils.getJoinedEvents();
    const userEvents = events.filter(e => e.creatorId === user.id || (joinedEvents[user.id] || []).includes(e.eventId));

    if (userEvents.length === 0) {
        dom.userEventsList.innerHTML = '<p style="color: #888; font-style: italic;">Ви ще не приєдналися до подій.</p>';
        return;
    }

    userEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        eventItem.dataset.eventId = event.eventId;
        eventItem.style.padding = '8px';
        eventItem.style.borderBottom = '1px solid #e0e0e0';
        eventItem.style.cursor = 'pointer';
        eventItem.innerHTML = `
            <div style="font-weight: 600; font-size: 0.9em;">${event.title}</div>
            <div style="font-size: 0.75em; color: #666;">${utils.formatEventDate(event.date)}</div>
        `;
        dom.userEventsList.appendChild(eventItem);
    });
}

export function openOtherUserProfile(userId) {
    const user = utils.getCurrentUser();
    const otherUser = utils.getUsers().find(u => u.id === userId);
    if (!otherUser) {
        utils.showToast('Користувача не знайдено', 'error');
        return;
    }

    if (dom.otherUserProfileAvatar) dom.otherUserProfileAvatar.src = otherUser.avatarBase64 || 'https://via.placeholder.com/100?text=@';
    if (dom.otherUserProfileName) dom.otherUserProfileName.textContent = otherUser.name;
    if (dom.otherUserProfileUsername) dom.otherUserProfileUsername.textContent = `@${otherUser.username}`;
    if (dom.otherUserProfileMeta) dom.otherUserProfileMeta.textContent = `${otherUser.location} · ${otherUser.age} років`;
    if (dom.otherUserProfileInterests) dom.otherUserProfileInterests.innerHTML = otherUser.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');

    if (dom.otherUserProfileEvents) {
        const events = utils.getEvents();
        const joinedEvents = utils.getJoinedEvents();
        const userEvents = events.filter(e => e.creatorId === otherUser.id || (joinedEvents[otherUser.id] || []).includes(e.eventId));

        dom.otherUserProfileEvents.innerHTML = userEvents.length === 0
            ? '<p style="color: #888; font-style: italic;">Користувач ще не приєднався до подій.</p>'
            : userEvents.map(event => `
                <div class="event-item" data-event-id="${event.eventId}" style="padding: 8px; border-bottom: 1px solid #e0e0e0; cursor: pointer;">
                    <div style="font-weight: 600; font-size: 0.9em;">${event.title}</div>
                    <div style="font-size: 0.75em; color: #666;">${utils.formatEventDate(event.date)}</div>
                </div>
            `).join('');
    }

    if (dom.otherUserMessageBtn) {
        dom.otherUserMessageBtn.disabled = user && user.id === otherUser.id;
        dom.otherUserMessageBtn.textContent = user && user.id === otherUser.id ? 'Це ви' : 'Написати';
        dom.otherUserMessageBtn.dataset.userId = otherUser.id; // Збережемо ID для обробника
    }

    utils.openModal(dom.otherUserProfileModal);
}

export function openUserProfile() {
    const user = utils.getCurrentUser();
    if (!user) return;
    dom.profileModalAvatar.src = user.avatarBase64 || 'https://via.placeholder.com/100?text=@';
    dom.profileModalName.textContent = user.name;
    dom.profileModalUsername.textContent = `@${user.username}`;
    dom.profileModalMeta.textContent = `${user.location} · ${user.age} років`;
    dom.profileModalInterests.innerHTML = user.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');
    renderUserEvents(user);
    utils.openModal(dom.profileModal);
}

export const editProfileValidations = [
    { inputId: 'editProfileName', errorId: 'editProfileNameError', validationFn: v => v.length >= 2, errorMessage: 'Ім’я: від 2 символів' },
    { inputId: 'editProfileUsername', errorId: 'editProfileUsernameError', validationFn: v => /^[a-zA-Z0-9_]{3,15}$/.test(v), errorMessage: 'Логін: 3-15 символів, лише літери, цифри, _' },
    { inputId: 'editProfileAge', errorId: 'editProfileAgeError', validationFn: v => v >= 16 && v <= 100, errorMessage: 'Вік: від 16 до 100' },
    { inputId: 'editProfileLocation', errorId: 'editProfileLocationError', validationFn: v => v.length >= 2, errorMessage: 'Місце: від 2 символів' }
];

export function openEditProfileModal() {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб редагувати профіль', 'error');
        return;
    }

    if (dom.editProfileName) dom.editProfileName.value = user.name;
    if (dom.editProfileUsername) dom.editProfileUsername.value = user.username;
    if (dom.editProfileAge) dom.editProfileAge.value = user.age;
    if (dom.editProfileLocation) dom.editProfileLocation.value = user.location;
    if (dom.editProfileAvatarPreview) dom.editProfileAvatarPreview.src = user.avatarBase64 || 'https://via.placeholder.com/100?text=@';
    if (dom.editProfileInterestsContainer) renderInterests(dom.editProfileInterestsContainer, user.interests, () => {});

    utils.openModal(dom.editProfileModal);
}

export async function handleEditProfileSubmit(e) {
    e.preventDefault();
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб редагувати профіль', 'error');
        return;
    }

    if (!editProfileValidations.every(v => utils.validateInput(dom.editProfileForm.querySelector(`#${v.inputId}`), dom.editProfileForm.querySelector(`#${v.errorId}`), v.validationFn, v.errorMessage))) {
        utils.showToast('Заповніть усі поля коректно', 'error');
        return;
    }

    const selectedInterests = Array.from(dom.editProfileInterestsContainer?.querySelectorAll('.interest-tag.selected') || []).map(tag => tag.dataset.interest);
    if (selectedInterests.length < 1) {
        utils.showToast('Виберіть хоча б один інтерес', 'error');
        return;
    }

    const users = utils.getUsers();
    const username = dom.editProfileUsername?.value.trim();
    if (username && username !== user.username && users.some(u => u.username === username)) {
        utils.showToast('Цей логін вже зайнятий', 'error');
        return;
    }

    let avatarBase64 = user.avatarBase64;
    const photo = dom.editProfilePhoto?.files[0];
    if (photo) {
        avatarBase64 = await utils.fileToBase64(photo);
        if (!avatarBase64) return;
    }

    const updatedUser = {
        ...user,
        name: dom.editProfileName?.value.trim(),
        username: username,
        age: parseInt(dom.editProfileAge?.value),
        location: dom.editProfileLocation?.value.trim(),
        interests: selectedInterests,
        avatarBase64
    };

    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    utils.saveUsers(updatedUsers);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    utils.closeModal(dom.editProfileModal);
    // showMainApp(updatedUser) буде викликано з main.js
    utils.showToast('Профіль оновлено!', 'success');
}

export function handleAddEditCustomInterest() {
    const interest = dom.editCustomInterestInput.value.trim();
    if (interest && interest.length <= 20) {
        if (utils.addGlobalInterest(interest)) {
            // updateAllInterestContainers() буде викликано з main.js
            dom.editCustomInterestInput.value = '';
            utils.showToast('Інтерес додано', 'success');
        } else {
            utils.showToast('Цей інтерес вже існує', 'error');
        }
    } else {
        utils.showToast(interest.length > 20 ? 'Інтерес занадто довгий' : 'Введіть інтерес', 'error');
    }
}