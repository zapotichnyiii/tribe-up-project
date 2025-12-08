import * as utils from './utils.js';
import * as ui from './ui.js';
import * as user from './user.js';
import * as chat from './chat.js';
import * as events from './events.js';
import * as dom from './dom.js'; 
import { HEADER_HTML, ALL_MODALS_HTML } from './components.js';

let socket = null;

export async function initSharedComponents(socketInstance) {
    socket = socketInstance;
    
    // Вставка HTML
    let htmlInserted = false;
    if (!document.querySelector('header')) {
        document.body.insertAdjacentHTML('afterbegin', HEADER_HTML);
        htmlInserted = true;
    }
    if (!document.getElementById('profileModal')) {
        document.body.insertAdjacentHTML('beforeend', ALL_MODALS_HTML);
        htmlInserted = true;
    }

    if (htmlInserted) {
        dom.refreshElements();
    }

    const currentUser = utils.getCurrentUser();

    ui.loadTheme();
    setupGlobalListeners();
    
    if (currentUser) {
        updateHeaderUser(currentUser);
        
        // --- ЗАПУСК ПОЛІНГУ (Щоб дані оновлювалися) ---
        user.startUserPolling();
        events.startEventPolling();
        
        setupNotifications(currentUser.id);
        setupAuthenticatedListeners(currentUser);
    } else {
        if(dom.profileDisplay) dom.profileDisplay.style.display = 'none';
    }
}

function updateHeaderUser(user) {
    if(dom.profileAvatar) dom.profileAvatar.src = user.avatarBase64 || 'https://via.placeholder.com/48';
    if(dom.profileUsername) dom.profileUsername.textContent = user.username;
    if(dom.profileDisplay) dom.profileDisplay.style.display = 'flex';
}

function setupGlobalListeners() {
    if (dom.themeToggle) dom.themeToggle.addEventListener('click', ui.toggleTheme);

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close')) {
            utils.closeModal(e.target.closest('.modal'));
        }
    });

    if (dom.notificationBtn && dom.notificationDropdown) {
        dom.notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dom.notificationDropdown.style.display === 'block';
            dom.notificationDropdown.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) dom.notificationBtn.classList.add('active');
            else dom.notificationBtn.classList.remove('active');
        });

        document.body.addEventListener('click', (e) => {
             if (dom.notificationDropdown.style.display === 'block' && !e.target.closest('.notification-wrapper')) {
                dom.notificationDropdown.style.display = 'none';
                dom.notificationBtn.classList.remove('active');
            }
        });
    }
}

function setupAuthenticatedListeners(currentUser) {
    if (dom.profileArea) dom.profileArea.addEventListener('click', user.openUserProfile);

    if (dom.profileLogoutBtn) {
        dom.profileLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    }

    if (dom.editProfileBtn) dom.editProfileBtn.addEventListener('click', user.openEditProfileModal);
    if (dom.editProfileForm) dom.editProfileForm.addEventListener('submit', user.handleEditProfileSubmit);
    if (dom.addEditCustomInterestBtn) dom.addEditCustomInterestBtn.addEventListener('click', user.handleAddEditCustomInterest);

    if (dom.chatListBtn) {
        dom.chatListBtn.addEventListener('click', () => {
            chat.renderChatList();
            utils.openModal(dom.chatListModal);
            updateChatBadge(0);
        });
    }

    const chatListEl = document.getElementById('chatList');
    if (chatListEl) {
        chatListEl.addEventListener('click', (e) => {
            const chatItem = e.target.closest('.chat-item');
            if (!chatItem) return;
            const userId = parseInt(chatItem.dataset.userId);
            utils.closeModal(dom.chatListModal);
            chat.loadPrivateChat(userId);
            utils.openModal(dom.privateChatModal);
        });
    }

    if (dom.sendPrivateMessageBtn) dom.sendPrivateMessageBtn.addEventListener('click', chat.sendPrivateMessage);
    if (dom.privateChatInput) {
        dom.privateChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') chat.sendPrivateMessage();
        });
    }

    const sendChatMessageBtn = document.getElementById('sendChatMessage');
    if (sendChatMessageBtn) {
        sendChatMessageBtn.addEventListener('click', () => {
            const eventId = parseInt(dom.eventDetailModal.dataset.currentEventId);
            if (eventId) chat.sendChatMessage(eventId);
        });
    }
    const eventChatInput = document.getElementById('contactInput');
    if (eventChatInput) {
        eventChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const eventId = parseInt(dom.eventDetailModal.dataset.currentEventId);
                if (eventId) chat.sendChatMessage(eventId);
            }
        });
    }

    // Слухачі для модалок подій (редагування/видалення)
    if (dom.editEventForm) dom.editEventForm.addEventListener('submit', events.handleEditEventSubmit);
    if (dom.addEditEventCustomInterestBtn) dom.addEditEventCustomInterestBtn.addEventListener('click', events.handleAddEditEventInterest);

    if (dom.myFollowersBtn) dom.myFollowersBtn.addEventListener('click', () => user.openSocialList('followers', currentUser.id));
    if (dom.myFollowingBtn) dom.myFollowingBtn.addEventListener('click', () => user.openSocialList('following', currentUser.id));
    if (dom.closeSocialListModal) dom.closeSocialListModal.addEventListener('click', () => utils.closeModal(dom.socialListModal));
    if (dom.markAllReadBtn) dom.markAllReadBtn.addEventListener('click', () => markAllNotificationsRead(currentUser.id));

    // Інші дії (наприклад, клік по інтересу в модалці)
    document.body.addEventListener('click', (e) => {
        const tag = e.target.closest('.interest-tag');
        if (tag) {
            // Ігноруємо кліки в контейнерах вибору
            const selectionContainer = e.target.closest('#registerForm, #createEventModal, #editEventModal, #editProfileModal, #peopleInterestFilter, #fullPageCreateEventForm');
            if (!selectionContainer) {
                const interest = tag.dataset.interest || tag.textContent;
                if (interest) {
                    e.preventDefault(); 
                    ui.openInterestSearchModal(interest);
                }
            }
        }
    });
}

// --- СПОВІЩЕННЯ ---
async function setupNotifications(userId) {
    if (!socket) return;
    socket.emit('join_notifications', { userId: userId });
    
    await loadNotifications(userId);
    
    socket.on('new_notification', async (notif) => {
        utils.showToast(notif.message, 'info');
        await addNotificationToUI(notif);
        updateBadgeCount(1);
        if (notif.type === 'new_event') events.refreshEventsCache();
    });

    socket.on('chat_alert', (msg) => {
        const isOpen = dom.privateChatModal && dom.privateChatModal.classList.contains('open') && dom.privateChatModal.dataset.otherUserId == msg.senderId;
        if (!isOpen) {
            utils.showToast(`Нове повідомлення від ${msg.senderName}`, 'info');
            updateChatBadge(1);
        }
    });
}

async function loadNotifications(userId) {
    try {
        const res = await fetch(`http://localhost:5000/api/notifications/${userId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const notifs = await res.json();
        
        if(!dom.notificationList) return;

        const unreadCount = notifs.filter(n => !n.is_read).length;
        updateBadgeDisplay(unreadCount);
        
        dom.notificationList.innerHTML = '';
        if (notifs.length === 0) {
            dom.notificationList.innerHTML = '<p class="empty-notif" style="padding:20px; text-align:center; color:#888;">Немає сповіщень</p>';
        } else {
            const allUsers = await utils.getUsers(); 
            for (const n of notifs) {
                await addNotificationToUI(n, false, allUsers);
            }
        }
    } catch (e) { console.error(e); }
}

async function addNotificationToUI(notif, prepend = true, allUsersCache = null) {
    if(!dom.notificationList) return;

    const item = document.createElement('div');
    item.className = `notif-item ${notif.is_read ? '' : 'unread'}`;
    
    let iconHtml = '';

    if (notif.type === 'follow' && notif.related_id) {
        let follower = null;
        if (allUsersCache) {
            follower = allUsersCache.find(u => u.id == notif.related_id);
        } else {
            const users = await utils.getUsers();
            follower = users.find(u => u.id == notif.related_id);
        }
        
        if (follower && follower.avatarBase64) {
            iconHtml = `
                <div class="notif-icon-area">
                    <img src="${follower.avatarBase64}" alt="User">
                </div>
            `;
        } else {
            iconHtml = `<div class="notif-icon-area icon-only"><i class="fas fa-user-plus"></i></div>`;
        }
    } else if (notif.type === 'new_event') {
        iconHtml = `<div class="notif-icon-area icon-only" style="background: #e0f2fe; color: #0284c7;"><i class="fas fa-calendar-plus"></i></div>`;
    } else if (notif.type === 'reminder') {
        iconHtml = `<div class="notif-icon-area icon-only" style="background: #fef3c7; color: #d97706;"><i class="fas fa-clock"></i></div>`;
    } else {
        iconHtml = `<div class="notif-icon-area icon-only"><i class="fas fa-bell"></i></div>`;
    }
    
    item.innerHTML = `
        ${iconHtml}
        <div class="notif-info">
            <div class="notif-text">${notif.message.replace('@', '')}</div>
            <div class="notif-time">${utils.formatEventDate(notif.created_at)}</div>
        </div>
    `;
    
    item.addEventListener('click', async () => {
        if (!notif.is_read) {
            await markNotificationRead(notif.id);
            item.classList.remove('unread');
            updateBadgeCount(-1);
        }
        
        if (notif.type === 'new_event' || notif.type === 'join' || notif.type === 'reminder') {
            const allEvents = await utils.getEvents(); 
            const event = allEvents.find(e => e.eventId === notif.related_id);
            if (event) events.openEventDetail(event);
        } else if (notif.type === 'follow') {
            user.openOtherUserProfile(notif.related_id);
        }
    });

    if (prepend) {
        dom.notificationList.prepend(item);
        const empty = dom.notificationList.querySelector('.empty-notif');
        if(empty) empty.remove();
    } else {
        dom.notificationList.appendChild(item);
    }
}

async function markNotificationRead(id) {
    await fetch('http://localhost:5000/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ id: id })
    });
}

async function markAllNotificationsRead(userId) {
    await fetch('http://localhost:5000/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ userId: userId })
    });
    document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    updateBadgeDisplay(0);
}

function updateBadgeCount(change) {
    if(dom.notificationBadge) {
        const current = parseInt(dom.notificationBadge.textContent) || 0;
        updateBadgeDisplay(Math.max(0, current + change));
    }
}

function updateBadgeDisplay(count) {
    if(dom.notificationBadge) {
        dom.notificationBadge.textContent = count;
        dom.notificationBadge.style.display = count > 0 ? 'block' : 'none';
    }
}

function updateChatBadge(change) {
    if (!dom.chatBadge) return;
    if (change === 0) {
        dom.chatBadge.textContent = '0';
        dom.chatBadge.style.display = 'none';
        return;
    }
    const current = parseInt(dom.chatBadge.textContent) || 0;
    const newVal = current + change;
    dom.chatBadge.textContent = newVal;
    dom.chatBadge.style.display = newVal > 0 ? 'block' : 'none';
}