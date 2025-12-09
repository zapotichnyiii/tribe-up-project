import * as utils from '../utils.js';
import * as userLib from '../user.js'; // Використовуємо спільну логіку (follow, lists)
import { initSharedComponents } from '../shared.js';

const socket = io('http://localhost:5000');
const urlParams = new URLSearchParams(window.location.search);
const userId = parseInt(urlParams.get('id'));

// Елементи DOM
const els = {
    // Header Info
    avatar: document.getElementById('otherUserAvatar'),
    name: document.getElementById('otherUserName'),
    username: document.getElementById('otherUserUsername'),
    meta: document.getElementById('otherUserMeta'),
    
    // Stats & Buttons
    followersBtn: document.getElementById('otherUserFollowersBtn'),
    followersCount: document.getElementById('otherUserFollowersCount'),
    followingBtn: document.getElementById('otherUserFollowingBtn'),
    followingCount: document.getElementById('otherUserFollowingCount'),
    
    followBtn: document.getElementById('otherUserFollowBtn'),
    messageBtn: document.getElementById('otherUserMessageBtn'),
    
    // Interests
    interestsCloud: document.getElementById('otherUserInterests'),
    
    // Events
    eventsList: document.getElementById('otherUserEventsList')
};

let currentUser = null;
let targetUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ініціалізація
    await initSharedComponents(socket);
    currentUser = utils.getCurrentUser();

    if (!userId) {
        window.location.href = '/'; 
        return;
    }

    // Якщо користувач відкрив свій власний профіль через /user.html?id=MY_ID
    if (currentUser && currentUser.id === userId) {
        window.location.href = '/profile.html';
        return;
    }

    // 2. Завантаження даних
    await loadTargetUser();
    
    // 3. Перевірка статусу підписки (оновлюємо мої підписки)
    if (currentUser) {
        await userLib.fetchMySocials();
        updateFollowButtonState();
    } else {
        // Якщо не авторизований - ховаємо кнопку повідомлення або робимо неактивною
        els.messageBtn.style.display = 'none';
        els.followBtn.onclick = () => utils.showToast('Увійдіть, щоб підписатися', 'info');
    }

    setupEventListeners();
});

async function loadTargetUser() {
    try {
        const users = await utils.getUsers();
        targetUser = users.find(u => u.id === userId);

        if (!targetUser) {
            document.querySelector('.user-page-container').innerHTML = 
                '<div style="text-align:center; padding:50px;"><h2>Користувача не знайдено</h2><a href="/" class="btn btn-accent">На головну</a></div>';
            return;
        }

        renderUserProfile(targetUser);
        loadUserStats(targetUser.id);
        loadUserEvents(targetUser.id);

    } catch (e) {
        console.error('Error loading user:', e);
    }
}

function renderUserProfile(user) {
    els.avatar.src = user.avatarBase64 || 'https://via.placeholder.com/150';
    els.name.textContent = user.name;
    els.username.textContent = `@${user.username}`;
    
    els.meta.innerHTML = `
        <span><i class="fas fa-birthday-cake"></i> ${user.age} років</span>
        <span><i class="fas fa-map-marker-alt"></i> ${user.location}</span>
    `;

    if (user.interests && user.interests.length > 0) {
        els.interestsCloud.innerHTML = user.interests.map(i => 
            `<span class="interest-tag selected" style="cursor:default">${i}</span>`
        ).join('');
    } else {
        els.interestsCloud.innerHTML = '<span style="color:#888; font-size:0.9rem;">Немає інтересів</span>';
    }
}

async function loadUserStats(id) {
    try {
        const res = await fetch(`http://localhost:5000/api/users/${id}/social`);
        const data = await res.json();
        els.followersCount.textContent = data.followers.length;
        els.followingCount.textContent = data.following.length;
    } catch(e) {}
}

async function loadUserEvents(id) {
    els.eventsList.innerHTML = ''; 
    // Видаляємо скелетони
    
    try {
        const allEvents = await utils.getEvents('active');
        // Показуємо події, які створив користувач
        const userEvents = allEvents.filter(e => e.creatorId === id);

        if (userEvents.length === 0) {
            els.eventsList.innerHTML = `
                <div class="empty-events-placeholder">
                    <i class="far fa-calendar-times" style="font-size:3rem; opacity:0.3; margin-bottom:10px;"></i>
                    <p>Користувач поки не створив подій.</p>
                </div>
            `;
            return;
        }

        userEvents.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card-horizontal';
            card.style.minHeight = 'auto'; // Адаптація під грід
            
            card.innerHTML = `
                <div class="card-content-v4" style="padding: 20px;">
                    <h3 class="card-title-v4" style="font-size: 1.1rem;">${event.title}</h3>
                    <div style="font-size: 0.85rem; color: var(--main-secondary-color); margin-bottom: 10px;">
                        <i class="fas fa-calendar"></i> ${utils.formatEventDate(event.date)}
                    </div>
                    <div style="font-size: 0.85rem;">
                        <i class="fas fa-map-marker-alt" style="color:var(--auth-accent-color);"></i> ${event.location}
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
        els.eventsList.innerHTML = '<p>Не вдалося завантажити події.</p>';
    }
}

function updateFollowButtonState() {
    if (!currentUser) return;
    
    const isFollowing = userLib.myFollowingIds.includes(userId);
    
    if (isFollowing) {
        els.followBtn.innerHTML = '<i class="fas fa-user-check"></i> Ви підписані';
        els.followBtn.classList.remove('btn-accent');
        els.followBtn.classList.add('btn-outline');
    } else {
        els.followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Підписатися';
        els.followBtn.classList.remove('btn-outline');
        els.followBtn.classList.add('btn-accent');
    }
}

function setupEventListeners() {
    // Підписка
    els.followBtn.addEventListener('click', async () => {
        if (!currentUser) {
            utils.showToast('Увійдіть, щоб підписатися', 'info');
            return;
        }
        
        // Використовуємо функцію з user.js, яка оновлює API і масиви
        await userLib.toggleFollow(userId, els.followBtn);
        // Додатково оновлюємо вигляд кнопки (хоча toggleFollow теж це робить, але для надійності)
        updateFollowButtonState();
    });

    // Повідомлення -> Редірект на чат
    els.messageBtn.addEventListener('click', () => {
        if (!currentUser) return;
        window.location.href = `/chat.html?userId=${userId}`;
    });

    // Списки (відкриваємо модалку через user.js)
    els.followersBtn.addEventListener('click', () => userLib.openSocialList('followers', userId));
    els.followingBtn.addEventListener('click', () => userLib.openSocialList('following', userId));
}