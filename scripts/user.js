import * as dom from './dom.js';
import * as utils from './utils.js';
import { renderInterests } from './ui.js';   

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export let selectedPeopleInterests = [];

export async function renderPeopleInterestFilter() {
    const users = await utils.getUsers();
    const currentUser = utils.getCurrentUser();
    if (!currentUser) return;
    
    const otherUsers = users.filter(u => u.id !== currentUser.id);
    const allInterests = [...new Set(otherUsers.flatMap(u => u.interests))].sort();
    
    if (dom.peopleInterestFilter) {
        dom.peopleInterestFilter.innerHTML = allInterests.map(interest => `
            <span class="interest-tag ${selectedPeopleInterests.includes(interest) ? 'selected' : ''}" data-interest="${interest}">${interest}</span>
        `).join('');
    }
}

// 👇 ОБРОБКА КЛІКУ ПО ТЕГУ
export function handlePeopleInterestClick(e) {
    const tag = e.target.closest('.interest-tag');
    if (!tag) return;

    const interest = tag.dataset.interest;
    const idx = selectedPeopleInterests.indexOf(interest);

    if (idx === -1) {
        selectedPeopleInterests.push(interest);
        tag.classList.add('selected');
    } else {
        selectedPeopleInterests.splice(idx, 1);
        tag.classList.remove('selected');
    }
    renderPeople();
}

// 👇 ВИПРАВЛЕНА ФУНКЦІЯ РЕНДЕРУ (ПРИБРАНО ДУБЛІ)
export async function renderPeople(customUsersList = null) {
    if (!dom.peopleGrid) return;
    
    // ВАЖЛИВО: Не очищаємо тут! Чекаємо дані.
    
    const currentUser = utils.getCurrentUser();
    if (!currentUser) {
        dom.peopleGrid.innerHTML = '<p>Увійдіть, щоб бачити людей.</p>';
        return;
    }

    let usersToRender = [];

    if (customUsersList) {
        usersToRender = customUsersList;
    } else {
        // Ось тут була затримка, через яку виникали дублі
        const users = await utils.getUsers();
        usersToRender = users;
    }

    // Фільтрація
    let filtered = usersToRender.filter(u => u.id !== currentUser.id);

    const cityQuery = dom.cityFilterInput?.value.toLowerCase().trim();
    if (cityQuery) {
        filtered = filtered.filter(u => u.location.toLowerCase().includes(cityQuery));
    }

    if (selectedPeopleInterests.length > 0) {
        filtered = filtered.filter(u => u.interests.some(i => selectedPeopleInterests.includes(i)));
    }

    // 👇 ОЧИЩАЄМО ТУТ (коли дані вже готові і відфільтровані)
    dom.peopleGrid.innerHTML = '';

    if (filtered.length === 0) {
        dom.peopleGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">Нікого не знайдено.</p>';
        return;
    }

    filtered.forEach(person => {
        const card = document.createElement('div');
        card.className = 'card people-card';
        card.dataset.userId = person.id;
        
        const interestsHtml = person.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');
        
        card.innerHTML = `
            <div class="people-card-header">
                <img src="${person.avatarBase64 || 'https://via.placeholder.com/60'}" alt="${person.name}">
                <div>
                    <h3>@${person.username}</h3>
                    <p style="font-size: 0.8em; color: #666;">${person.name}, ${person.age} років</p>
                    <p style="font-size: 0.8em; color: #666;">${person.location}</p>
                </div>
            </div>
            <div class="interests">${interestsHtml}</div>
            <button class="btn btn-outline btn-sm message-btn">Написати</button>
        `;
        dom.peopleGrid.appendChild(card);
    });
}

// Пошук
let searchTimeout;
export function handleUserSearch(e) {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    if (query.length === 0) {
        renderPeople(null);
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const users = await res.json();
                renderPeople(users);
            }
        } catch (e) { console.error(e); }
    }, 300);
}

// Профіль іншого юзера
export async function openOtherUserProfile(userId) {
    const users = await utils.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (dom.otherUserProfileAvatar) dom.otherUserProfileAvatar.src = user.avatarBase64 || 'https://via.placeholder.com/100';
    if (dom.otherUserProfileName) dom.otherUserProfileName.textContent = user.name;
    if (dom.otherUserProfileUsername) dom.otherUserProfileUsername.textContent = '@' + user.username;
    if (dom.otherUserProfileInterests) dom.otherUserProfileInterests.innerHTML = user.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');
    
    const currentUser = utils.getCurrentUser();
    if (dom.otherUserMessageBtn) {
        dom.otherUserMessageBtn.dataset.userId = user.id;
        if (currentUser && currentUser.id === user.id) {
            dom.otherUserMessageBtn.disabled = true;
            dom.otherUserMessageBtn.textContent = 'Це ви';
        } else {
            dom.otherUserMessageBtn.disabled = false;
            dom.otherUserMessageBtn.textContent = 'Написати';
        }
    }

    const allEvents = await utils.getEvents();
    const userEvents = allEvents.filter(e => e.creatorId === userId);
    
    if (dom.otherUserProfileEvents) {
        dom.otherUserProfileEvents.innerHTML = userEvents.length ? '' : '<p>Немає подій</p>';
        userEvents.forEach(e => {
            const div = document.createElement('div');
            div.className = 'event-item';
            div.textContent = `${e.title} (${utils.formatEventDate(e.date)})`;
            dom.otherUserProfileEvents.appendChild(div);
        });
    }

    utils.openModal(dom.otherUserProfileModal);
}

// Власний профіль
export async function openUserProfile() {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) return;
    
    try {
        const users = await utils.getUsers();
        const freshUser = users.find(u => u.id === currentUser.id);
        if (!freshUser) return utils.showToast('Не вдалося завантажити профіль', 'error');

        if(dom.profileModalAvatar) dom.profileModalAvatar.src = freshUser.avatarBase64 || 'https://via.placeholder.com/100';
        if(dom.profileModalName) dom.profileModalName.textContent = freshUser.name;
        if(dom.profileModalUsername) dom.profileModalUsername.textContent = `@${freshUser.username}`;
        if(dom.profileModalInterests) dom.profileModalInterests.innerHTML = freshUser.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');

        const allEvents = await utils.getEvents('active');
        const myEvents = allEvents.filter(e => e.creatorId === freshUser.id);
        if (dom.userEventsList) {
            dom.userEventsList.innerHTML = myEvents.length ? '' : '<p style="color:#888;">Поки немає подій</p>';
            myEvents.forEach(e => {
                const div = document.createElement('div');
                div.style.padding = '8px';
                div.style.borderBottom = '1px solid #eee';
                div.innerHTML = `<b>${e.title}</b> <span style="color:#666; font-size:0.8em;">(${utils.formatEventDate(e.date)})</span>`;
                dom.userEventsList.appendChild(div);
            });
        }
        utils.openModal(dom.profileModal);
    } catch (e) { console.error(e); }
}

export const editProfileValidations = [{ inputId: 'editProfileName', errorId: 'editProfileNameError', validationFn: v => v.length >= 2, errorMessage: 'Ім’я: від 2 символів' }];

export async function openEditProfileModal() {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) return;
    const users = await utils.getUsers();
    const user = users.find(u => u.id === currentUser.id);
    if (!user) return;

    if(dom.editProfileName) dom.editProfileName.value = user.name;
    if(dom.editProfileUsername) dom.editProfileUsername.value = user.username;
    if(dom.editProfileAge) dom.editProfileAge.value = user.age;
    if(dom.editProfileLocation) dom.editProfileLocation.value = user.location;
    if(dom.editProfileInterestsContainer) renderInterests(dom.editProfileInterestsContainer, user.interests, () => {});
    utils.closeModal(dom.profileModal);
    utils.openModal(dom.editProfileModal);
}

export async function handleEditProfileSubmit(e) {
    e.preventDefault();
    const user = utils.getCurrentUser();
    if (!user) return;
    const updatedData = {
        name: dom.editProfileName.value,
        username: dom.editProfileUsername.value,
        age: parseInt(dom.editProfileAge.value),
        location: dom.editProfileLocation.value,
        interests: Array.from(dom.editProfileInterestsContainer.querySelectorAll('.selected')).map(el => el.dataset.interest),
        avatarBase64: user.avatarBase64
    };
    const photo = dom.editProfilePhoto?.files[0];
    if (photo) updatedData.avatarBase64 = await utils.fileToBase64(photo);

    try {
        const res = await fetch(`http://localhost:5000/api/users/${user.id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updatedData) });
        if (res.ok) {
            utils.showToast('Оновлено', 'success');
            utils.closeModal(dom.editProfileModal);
            setTimeout(() => location.reload(), 500);
        } else { utils.showToast('Помилка оновлення', 'error'); }
    } catch (e) { utils.showToast('Помилка сервера', 'error'); }
}

export function handleAddEditCustomInterest() {
    const input = dom.editCustomInterestInput;
    const interest = input.value.trim();
    if(interest) {
        const container = dom.editProfileInterestsContainer;
        const span = document.createElement('span');
        span.className = 'interest-tag selected';
        span.dataset.interest = interest;
        span.textContent = interest;
        container.appendChild(span);
        input.value = '';
    }
}