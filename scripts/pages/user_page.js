import * as utils from '../utils.js';
import * as userLib from '../user.js'; 
import { initSharedComponents } from '../shared.js';

const socket = io('http://localhost:5000');
const urlParams = new URLSearchParams(window.location.search);
const userId = parseInt(urlParams.get('id'));

const els = {
    avatar: document.getElementById('otherUserAvatar'),
    name: document.getElementById('otherUserName'),
    username: document.getElementById('otherUserUsername'),
    meta: document.getElementById('otherUserMeta'),
    
    followersBtn: document.getElementById('otherUserFollowersBtn'),
    followersCount: document.getElementById('otherUserFollowersCount'),
    followingBtn: document.getElementById('otherUserFollowingBtn'),
    followingCount: document.getElementById('otherUserFollowingCount'),
    
    followBtn: document.getElementById('otherUserFollowBtn'),
    messageBtn: document.getElementById('otherUserMessageBtn'),
    
    interestsCloud: document.getElementById('otherUserInterests'),
    eventsList: document.getElementById('otherUserEventsList')
};

let currentUser = null;
let targetUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initSharedComponents(socket);
    currentUser = utils.getCurrentUser();

    if (!userId) {
        window.location.href = '/'; 
        return;
    }

    if (currentUser && currentUser.id === userId) {
        window.location.href = '/profile.html';
        return;
    }

    await loadTargetUser();
    
    if (currentUser) {
        await userLib.fetchMySocials();
        updateFollowButtonState();
    } else {
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

// --- ОНОВЛЕНА ФУНКЦІЯ ЗАВАНТАЖЕННЯ ПОДІЙ ---
async function loadUserEvents(id) {
    els.eventsList.innerHTML = '<div style="text-align:center; padding:20px; color:#888;"><i class="fas fa-circle-notch fa-spin"></i></div>';
    
    try {
        // 1. Всі події
        const allEvents = await utils.getEvents('active');
        
        // 2. Події, де юзер є учасником (API дозволяє отримати для будь-якого ID)
        const resJoined = await fetch(`http://localhost:5000/api/my-joined-events/${id}`);
        const joinedIds = await resJoined.json();

        // 3. Фільтруємо: або творець, або учасник
        const userEvents = allEvents
            .filter(e => e.creatorId === id || joinedIds.includes(e.eventId))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        els.eventsList.innerHTML = '';

        if (userEvents.length === 0) {
            els.eventsList.innerHTML = `
                <div class="empty-events-placeholder">
                    <i class="far fa-calendar-times" style="font-size:3rem; opacity:0.3; margin-bottom:10px;"></i>
                    <p>Користувач поки не бере участі в подіях.</p>
                </div>
            `;
            return;
        }

        userEvents.forEach(event => {
            const isCreator = event.creatorId === id;
            const dateObj = new Date(event.date);
            
            let catIcon = 'fa-calendar-alt';
            if (event.category === 'sports') catIcon = 'fa-running';
            else if (event.category === 'music') catIcon = 'fa-music';
            else if (event.category === 'food') catIcon = 'fa-utensils';
            else if (event.category === 'games') catIcon = 'fa-gamepad';

            const card = document.createElement('div');
            card.className = 'profile-event-card'; // Використовуємо той самий клас, що і в профілі
            
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
    els.followBtn.addEventListener('click', async () => {
        if (!currentUser) {
            utils.showToast('Увійдіть, щоб підписатися', 'info');
            return;
        }
        await userLib.toggleFollow(userId, els.followBtn);
        updateFollowButtonState();
    });

    els.messageBtn.addEventListener('click', () => {
        if (!currentUser) return;
        window.location.href = `/chat.html?userId=${userId}`;
    });

    els.followersBtn.addEventListener('click', () => userLib.openSocialList('followers', userId));
    els.followingBtn.addEventListener('click', () => userLib.openSocialList('following', userId));
}