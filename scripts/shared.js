import * as utils from './utils.js';
import * as ui from './ui.js';
import * as user from './user.js';
import * as dom from './dom.js'; 
import { HEADER_HTML, ALL_MODALS_HTML } from './components.js';

let socket = null;

export async function initSharedComponents(socketInstance) {
    socket = socketInstance;
    
    // 1. Вставка HTML Хедера та спільних модалок (якщо їх ще немає)
    // Перевіряємо, чи є placeholder для хедера (на нових сторінках)
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = HEADER_HTML;
    } else if (!document.querySelector('header')) {
        // Fallback для старих сторінок (index.html)
        document.body.insertAdjacentHTML('afterbegin', HEADER_HTML);
    }

    // Вставка спільних модалок (тільки якщо їх немає)
    if (!document.getElementById('socialListModal')) {
        document.body.insertAdjacentHTML('beforeend', ALL_MODALS_HTML);
    }

    // Оновлюємо посилання на DOM елементи після вставки HTML
    dom.refreshElements();

    const currentUser = utils.getCurrentUser();

    ui.loadTheme();
    setupGlobalListeners();
    
    if (currentUser) {
        updateHeaderUser(currentUser);
        // Запускаємо polling тільки якщо ми НЕ на сторінці чату (там своя логіка)
        // або можна залишити, якщо хочете оновлювати бейджі всюди
        if (!window.location.pathname.includes('chat.html')) {
            user.startUserPolling();
        }
        
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

    // Глобальне закриття модалок
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close')) {
            utils.closeModal(e.target.closest('.modal'));
        }
    });

    // Дропдаун сповіщень
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
    // 1. Клік на Профіль -> Перехід
    if (dom.profileArea) {
        dom.profileArea.addEventListener('click', () => {
            window.location.href = '/profile.html';
        });
    }

    // 2. Вихід
    if (dom.profileLogoutBtn) {
        dom.profileLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    }

    // 3. Чат -> Перехід
    if (dom.chatListBtn) {
        dom.chatListBtn.addEventListener('click', () => {
            window.location.href = '/chat.html';
        });
    }

    // Інші спільні дії (наприклад, списки підписників у модалці)
    if (dom.closeSocialListModal) dom.closeSocialListModal.addEventListener('click', () => utils.closeModal(dom.socialListModal));
    if (dom.markAllReadBtn) dom.markAllReadBtn.addEventListener('click', () => markAllNotificationsRead(currentUser.id));
}

// --- СПОВІЩЕННЯ (SOCKETS) ---
async function setupNotifications(userId) {
    if (!socket) return;
    // Приєднуємось до кімнати сповіщень
    socket.emit('join_notifications', { userId: userId });
    
    await loadNotifications(userId);
    
    socket.on('new_notification', async (notif) => {
        utils.showToast(notif.message, 'info');
        await addNotificationToUI(notif);
        updateBadgeCount(1);
    });

    socket.on('chat_alert', (msg) => {
        if (!window.location.pathname.includes('chat.html')) {
            utils.showToast(`Нове повідомлення від ${msg.senderName}`, 'info');
            updateChatBadge(1);
        }
    });
}

async function loadNotifications(userId) {
    try {
        const res = await utils.fetch(`/api/notifications/${userId}/`);
        const notifs = await res.json();
        
        if(!dom.notificationList) return;

        const unreadCount = notifs.filter(n => !n.is_read).length;
        updateBadgeDisplay(unreadCount);
        
        dom.notificationList.innerHTML = '';
        if (notifs.length === 0) {
            dom.notificationList.innerHTML = '<p class="empty-notif" style="padding:20px; text-align:center; color:#888;">Немає сповіщень</p>';
        } else {
            for (const n of notifs) {
                await addNotificationToUI(n, false);
            }
        }
    } catch (e) { console.error(e); }
}

async function addNotificationToUI(notif, prepend = true) {
    if(!dom.notificationList) return;

    const item = document.createElement('div');
    item.className = `notif-item ${notif.is_read ? '' : 'unread'}`;
    
    // Іконки для різних типів сповіщень
    let iconHtml = `<div class="notif-icon-area icon-only"><i class="fas fa-bell"></i></div>`;
    if (notif.type === 'follow') iconHtml = `<div class="notif-icon-area icon-only"><i class="fas fa-user-plus"></i></div>`;
    else if (notif.type === 'new_event') iconHtml = `<div class="notif-icon-area icon-only" style="background: #e0f2fe; color: #0284c7;"><i class="fas fa-calendar-plus"></i></div>`;
    
    item.innerHTML = `
        ${iconHtml}
        <div class="notif-info">
            <div class="notif-text">${notif.message.replace('@', '')}</div>
            <div class="notif-time">${utils.formatEventDate(notif.created_at)}</div>
        </div>
    `;
    
    // Обробка кліку по сповіщенню
    item.addEventListener('click', async () => {
        if (!notif.is_read) {
            await markNotificationRead(notif.id);
            item.classList.remove('unread');
            updateBadgeCount(-1);
        }
        
        // РЕДІРЕКТИ
        if (notif.type === 'new_event' || notif.type === 'join' || notif.type === 'reminder') {
            if(notif.related_id) window.location.href = `/event.html?id=${notif.related_id}`;
        } else if (notif.type === 'follow') {
            if(notif.related_id) window.location.href = `/user.html?id=${notif.related_id}`;
        }
    });

    if (prepend) {
        dom.notificationList.prepend(item);
        // Видаляємо повідомлення "пусто", якщо воно є
        const empty = dom.notificationList.querySelector('.empty-notif');
        if(empty) empty.remove();
    } else {
        dom.notificationList.appendChild(item);
    }
}

async function markNotificationRead(id) {
    await utils.fetch(`$/api/notifications/read/`, {
        method: 'POST',
        body: JSON.stringify({ id: id })
    });
}

async function markAllNotificationsRead(userId) {
    await utils.fetch(`/api/notifications/read/`, {
        method: 'POST',
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
    const current = parseInt(dom.chatBadge.textContent) || 0;
    const newVal = Math.max(0, current + change); // Захист від від'ємних чисел
    dom.chatBadge.textContent = newVal;
    dom.chatBadge.style.display = newVal > 0 ? 'block' : 'none';
}