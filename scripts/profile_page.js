import * as utils from '../utils.js';
import * as ui from '../ui.js';
import * as userLib from '../user.js'; // Для спільних функцій, як fetchMySocials
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
    
    // Social buttons (for opening lists)
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

    // 1. Заповнення даних
    renderProfileSidebar(currentUser);
    populateEditForm(currentUser);
    
    // 2. Завантаження динамічних даних
    loadUserEvents();
    loadSocialStats(); // Оновлення підписників

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
    
    // Meta: Age & Location
    els.meta.innerHTML = `
        <span><i class="fas fa-birthday-cake"></i> ${user.age} років</span>
        <span><i class="fas fa-map-marker-alt"></i> ${user.location}</span>
    `;

    // Static interests cloud
    els.interestsCloud.innerHTML = user.interests.map(i => 
        `<span class="interest-tag selected" style="cursor:default">${i}</span>`
    ).join('');
}

function populateEditForm(user) {
    els.inputName.value = user.name;
    els.inputUsername.value = user.username;
    els.inputAge.value = user.age;
    els.inputLocation.value = user.location;
    
    // Рендер інтересів для редагування (з можливістю видалення/вибору)
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
    els.eventsList.innerHTML = '<p style="text-align:center; padding:20px; width:100%;">Завантаження подій...</p>';
    
    try {
        const allEvents = await utils.getEvents('active'); 
        const joinedEvents = await utils.getJoinedEvents();
        const myJoinedIds = joinedEvents[currentUser.id] || [];

        const myEvents = allEvents.filter(e => e.creatorId === currentUser.id || myJoinedIds.includes(e.eventId));
        
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
            const card = document.createElement('div');
            card.className = 'event-card-horizontal'; 
            card.style.minHeight = 'auto';
            
            card.innerHTML = `
                <div class="card-content-v4" style="padding: 20px;">
                    <h3 class="card-title-v4" style="font-size: 1.2rem;">${event.title}</h3>
                    <div style="font-size: 0.9rem; color: var(--main-secondary-color); margin-bottom: 10px;">
                        <i class="fas fa-calendar"></i> ${utils.formatEventDate(event.date)}
                    </div>
                    <div style="font-size: 0.85rem; display:flex; gap:10px;">
                        ${isCreator ? '<span style="color:#6b21a8; font-weight:600;">Ви організатор</span>' : '<span style="color:#10b981; font-weight:600;">Ви учасник</span>'}
                    </div>
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
        
        const span = document.createElement('span');
        span.className = 'interest-tag selected';
        span.dataset.interest = val;
        span.textContent = val;
        span.onclick = () => span.classList.toggle('selected');
        els.interestsContainer.appendChild(span);
        
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