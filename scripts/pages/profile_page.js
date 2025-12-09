import * as utils from '../utils.js';
import * as ui from '../ui.js';
import * as userLib from '../user.js';
import { initSharedComponents } from '../shared.js';

const socket = io('http://localhost:5000');

// Елементи DOM
const els = {
    // Sidebar
    avatar: document.getElementById('pageProfileAvatar'),
    name: document.getElementById('pageProfileName'),
    username: document.getElementById('pageProfileUsername'),
    meta: document.getElementById('pageProfileMeta'),
    followersCount: document.getElementById('pageFollowersCount'),
    followingCount: document.getElementById('pageFollowingCount'),
    interestsCloud: document.getElementById('pageProfileInterests'),
    logoutBtn: document.getElementById('pageLogoutBtn'),
    
    // Avatar Upload
    triggerAvatarBtn: document.getElementById('triggerAvatarUpload'),
    hiddenAvatarInput: document.getElementById('hiddenAvatarInput'),

    // Tabs
    tabs: document.querySelectorAll('.tab-button'),
    panes: document.querySelectorAll('.tab-pane'),

    // Events Tab
    eventsList: document.getElementById('pageUserEventsList'),

    // Edit Tab (Form)
    editForm: document.getElementById('fullPageEditProfileForm'),
    inputName: document.getElementById('editProfileName'),
    inputUsername: document.getElementById('editProfileUsername'),
    inputAge: document.getElementById('editProfileAge'),
    inputLocation: document.getElementById('editProfileLocation'),
    interestsContainer: document.getElementById('editProfileInterestsContainer'),
    customInterestInput: document.getElementById('editCustomInterestInput'),
    addInterestBtn: document.getElementById('addEditCustomInterestBtn'),
    
    // Social buttons
    followersBtn: document.getElementById('pageMyFollowersBtn'),
    followingBtn: document.getElementById('pageMyFollowingBtn')
};

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initSharedComponents(socket);
    
    currentUser = utils.getCurrentUser();
    if (!currentUser) {
        window.location.href = '/';
        return;
    }

    // --- ВАЖЛИВО: Завантажуємо список інтересів, щоб вони відобразилися в формі ---
    await utils.fetchGlobalInterests();

    // 1. Заповнення даних
    renderProfileSidebar(currentUser);
    populateEditForm(currentUser);
    
    // 2. Завантаження динамічних даних
    loadUserEvents();
    loadSocialStats(); 

    // 3. Слухачі подій
    setupEventListeners();
});

function setupEventListeners() {
    // Таби
    els.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            els.tabs.forEach(b => b.classList.remove('active'));
            els.panes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = `tab-${btn.dataset.tab}`;
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Аватар
    els.triggerAvatarBtn.addEventListener('click', () => els.hiddenAvatarInput.click());
    els.hiddenAvatarInput.addEventListener('change', handleAvatarPreview);

    // Інтереси (додавання)
    els.addInterestBtn.addEventListener('click', handleAddInterest);
    
    // Форма редагування
    els.editForm.addEventListener('submit', handleProfileUpdate);

    // Вихід
    els.logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        window.location.href = '/';
    });

    // Списки підписників
    els.followersBtn.addEventListener('click', () => userLib.openSocialList('followers', currentUser.id));
    els.followingBtn.addEventListener('click', () => userLib.openSocialList('following', currentUser.id));
}

// --- RENDER LOGIC ---

function renderProfileSidebar(user) {
    els.avatar.src = user.avatarBase64 || 'https://via.placeholder.com/150';
    els.name.textContent = user.name;
    els.username.textContent = `@${user.username}`;
    
    els.meta.innerHTML = `
        <span><i class="fas fa-birthday-cake"></i> ${user.age} років</span>
        <span><i class="fas fa-map-marker-alt"></i> ${user.location}</span>
    `;

    els.interestsCloud.innerHTML = user.interests.map(i => 
        `<span class="interest-tag selected" style="cursor:default">${i}</span>`
    ).join('');
}

function populateEditForm(user) {
    els.inputName.value = user.name;
    els.inputUsername.value = user.username;
    els.inputAge.value = user.age;
    els.inputLocation.value = user.location;
    
    // Рендер інтересів для редагування
    ui.renderInterests(els.interestsContainer, user.interests, () => {});
}

async function loadSocialStats() {
    await userLib.fetchMySocials(); 
    try {
        const res = await fetch(`http://localhost:5000/api/users/${currentUser.id}/social`);
        const data = await res.json();
        els.followersCount.textContent = data.followers.length;
        els.followingCount.textContent = data.following.length;
    } catch(e) { console.error(e); }
}

async function loadUserEvents() {
    els.eventsList.innerHTML = '<div style="text-align:center; padding:30px; color:#888;"><i class="fas fa-circle-notch fa-spin"></i> Завантаження подій...</div>';
    
    try {
        const allEvents = await utils.getEvents('active'); 
        const joinedEvents = await utils.getJoinedEvents();
        const myJoinedIds = joinedEvents[currentUser.id] || [];

        // Фільтруємо і сортуємо
        const myEvents = allEvents
            .filter(e => e.creatorId === currentUser.id || myJoinedIds.includes(e.eventId))
            .sort((a, b) => {
                const aIsCreator = a.creatorId === currentUser.id;
                const bIsCreator = b.creatorId === currentUser.id;
                if (aIsCreator && !bIsCreator) return -1;
                if (!aIsCreator && bIsCreator) return 1;
                return new Date(a.date) - new Date(b.date);
            });
        
        els.eventsList.innerHTML = '';
        
        if (myEvents.length === 0) {
            els.eventsList.innerHTML = `
                <div class="empty-state-placeholder" style="grid-column: 1/-1;">
                    <i class="far fa-calendar-times"></i>
                    <p>Ви ще не створили і не приєдналися до жодної події.</p>
                    <a href="/create_event.html" class="btn btn-sm btn-accent" style="margin-top:10px;">Створити подію</a>
                </div>
            `;
            return;
        }

        myEvents.forEach(event => {
            const isCreator = event.creatorId === currentUser.id;
            const dateObj = new Date(event.date);
            
            let catIcon = 'fa-calendar-alt';
            if (event.category === 'sports') catIcon = 'fa-running';
            else if (event.category === 'music') catIcon = 'fa-music';
            else if (event.category === 'food') catIcon = 'fa-utensils';
            else if (event.category === 'games') catIcon = 'fa-gamepad';
            else if (event.category === 'arts') catIcon = 'fa-palette';

            const card = document.createElement('div');
            card.className = 'profile-event-card';
            
            card.innerHTML = `
                <div class="pec-header">
                    <div class="pec-date">
                        <span class="day">${dateObj.getDate()}</span>
                        <span class="month">${dateObj.toLocaleDateString('uk-UA', { month: 'short' })}</span>
                    </div>
                    ${isCreator 
                        ? `<span class="role-badge organizer"><i class="fas fa-crown"></i> Організатор</span>` 
                        : `<span class="role-badge participant"><i class="fas fa-check"></i> Учасник</span>`
                    }
                </div>
                
                <div class="pec-body">
                    <div class="pec-category"><i class="fas ${catIcon}"></i> ${event.category}</div>
                    <h3 class="pec-title">${event.title}</h3>
                    <div class="pec-meta">
                        <span><i class="far fa-clock"></i> ${dateObj.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                    </div>
                </div>

                <div class="pec-footer">
                    <div class="pec-users">
                        <i class="fas fa-users"></i> ${event.currentParticipants}/${event.participants}
                    </div>
                    <span class="pec-arrow"><i class="fas fa-arrow-right"></i></span>
                </div>
            `;
            
            card.addEventListener('click', () => {
                window.location.href = `/event.html?id=${event.eventId}`;
            });
            
            els.eventsList.appendChild(card);
        });

    } catch (e) {
        console.error(e);
        els.eventsList.innerHTML = '<p style="color:red; text-align:center;">Помилка завантаження подій</p>';
    }
}

// --- EDIT LOGIC ---

async function handleAvatarPreview(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const base64 = await utils.fileToBase64(file);
        els.avatar.src = base64;
    } catch (err) {
        utils.showToast('Помилка завантаження фото', 'error');
    }
}

function handleAddInterest() {
    const val = els.customInterestInput.value.trim();
    if (val) {
        if(val.length > 20) return utils.showToast('Задовга назва', 'error');
        
        utils.addGlobalInterest(val);
        
        // Оновлюємо контейнер (щоб зберегти стан вже вибраних)
        const container = els.interestsContainer;
        // Додаємо новий тег вручну або перерендерюємо все
        // Найпростіше: додати в DOM, бо ui.renderInterests перезапише все
        const span = document.createElement('span');
        span.className = 'interest-tag selected';
        span.dataset.interest = val;
        span.textContent = val;
        span.onclick = () => span.classList.toggle('selected');
        container.appendChild(span);
        
        els.customInterestInput.value = '';
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const selectedInterests = Array.from(els.interestsContainer.querySelectorAll('.interest-tag.selected'))
        .map(tag => tag.dataset.interest);

    const updatedData = {
        name: els.inputName.value.trim(),
        username: els.inputUsername.value.trim(),
        age: parseInt(els.inputAge.value),
        location: els.inputLocation.value.trim(),
        interests: selectedInterests,
        avatarBase64: els.avatar.src
    };

    if (updatedData.name.length < 2) return utils.showToast('Ім\'я надто коротке', 'error');

    try {
        const res = await fetch(`http://localhost:5000/api/users/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            const newUser = await res.json();
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            utils.showToast('Профіль оновлено!', 'success');
            
            renderProfileSidebar(newUser);
            // Оновлюємо хедер
            const headerName = document.getElementById('profileUsername');
            const headerAvatar = document.getElementById('profileAvatar');
            if(headerName) headerName.textContent = newUser.username;
            if(headerAvatar) headerAvatar.src = newUser.avatarBase64;

        } else {
            utils.showToast('Помилка оновлення', 'error');
        }
    } catch (e) {
        console.error(e);
        utils.showToast('Помилка сервера', 'error');
    }
}