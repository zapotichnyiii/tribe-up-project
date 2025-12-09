import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';
import * as auth from './auth.js';
import * as events from './events.js';
import * as user from './user.js';

// Підключення до Socket.IO
const socket = io(utils.API_URL); 

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ініціалізація базових компонентів
    await utils.fetchGlobalInterests();
    
    events.initEventFilters();
    ui.updateAllInterestContainers();
    ui.loadTheme();
    ui.handleBackToTop();
    ui.setupNavigation();

    const currentUser = utils.getCurrentUser();
    
    // 2. Перевірка авторизації
    if (currentUser) {
        ui.showMainApp(currentUser);
        
        // Оновлюємо дані користувача (актуалізуємо аватар/ім'я)
        utils.getUsers().then(users => {
            const freshUser = users.find(u => u.id === currentUser.id);
            if (freshUser) {
                localStorage.setItem('currentUser', JSON.stringify(freshUser));
                ui.showMainApp(freshUser);
            }
        });

        // Запуск оновлення даних (polling)
        events.startEventPolling();
        user.startUserPolling();
        
        // Завантаження соціальних зв'язків та сповіщень
        await user.fetchMySocials();
        setupNotifications(currentUser.id);
        
        // Рендер контенту головної сторінки
        user.renderPeople();
        user.renderPeopleInterestFilter();

    } else {
        // Якщо не авторизований - показуємо екран входу
        ui.showAuthScreen();
        auth.initAuthTabs();
        auth.initForgotPassword();
        utils.setupFormValidation(dom.loginFormInitial, auth.loginValidations);
        utils.setupFormValidation(dom.registerForm, auth.registerValidations);
    }

    // --- ГЛОБАЛЬНІ СЛУХАЧІ ПОДІЙ ---

    // Клік по тегам інтересів (глобальний пошук)
    document.body.addEventListener('click', (e) => {
        const tag = e.target.closest('.interest-tag');
        if (tag) {
            // Ігноруємо кліки в контейнерах вибору (реєстрація, фільтри)
            const selectionContainer = e.target.closest('#registerForm, #peopleInterestFilter');
            if (!selectionContainer) {
                const interest = tag.dataset.interest || tag.textContent;
                if (interest) {
                    e.preventDefault(); 
                    ui.openInterestSearchModal(interest);
                }
            }
        }

        // Закриття дропдауна сповіщень при кліку поза ним
        if (dom.notificationDropdown && dom.notificationDropdown.style.display === 'block') {
            if (!e.target.closest('.notification-wrapper')) {
                dom.notificationDropdown.style.display = 'none';
                dom.notificationBtn?.classList.remove('active');
            }
        }
    });

    // Перемикання теми
    if (dom.themeToggle) dom.themeToggle.addEventListener('click', ui.toggleTheme);
    
    // Форми авторизації
    if (dom.loginFormInitial) dom.loginFormInitial.addEventListener('submit', auth.handleLoginSubmit);
    if (dom.registerForm) dom.registerForm.addEventListener('submit', auth.handleRegisterSubmit);
    if (dom.addCustomInterestBtn) dom.addCustomInterestBtn.addEventListener('click', auth.handleAddCustomInterest);
    if (dom.verifyBtn) dom.verifyBtn.addEventListener('click', auth.handleVerifySubmit);
    
    // === НАВІГАЦІЯ (РЕДІРЕКТИ НА ОКРЕМІ СТОРІНКИ) ===

    // 1. Профіль (Клік по аватарці в хедері)
    if (dom.profileDisplay) {
        dom.profileDisplay.addEventListener('click', () => {
            window.location.href = '/profile.html';
        });
    }

    // 2. Чат (Клік по іконці повідомлень)
    if (dom.chatListBtn) {
        dom.chatListBtn.addEventListener('click', () => {
            window.location.href = '/chat.html';
        });
    }

    // 3. Кнопка "Створити подію" (на Hero секції) - вона має href, але можна додати логіку перевірки
    // (Стандартний <a href="/create_event.html"> працює сам по собі)

    // Кнопка "Знайти події" (скрол до секції)
    if (dom.searchEventsBtn) dom.searchEventsBtn.addEventListener('click', () => utils.scrollToSection('events'));

    // Перемикач Архів/Актуальні події
    if (dom.toggleArchiveBtn) {
        let showingArchive = false;
        dom.toggleArchiveBtn.addEventListener('click', () => {
            showingArchive = !showingArchive;
            dom.toggleArchiveBtn.innerHTML = showingArchive ? '<i class="fas fa-calendar-alt"></i> Актуальні' : '<i class="fas fa-history"></i> Архів';
            
            const title = document.querySelector('.section-title'); // Використовуємо стандартний селектор
            if (title) {
                // Якщо заголовок має текст, змінюємо його
                const textNode = Array.from(title.childNodes).find(node => node.nodeType === 3 && node.textContent.trim().length > 0);
                if(textNode) textNode.textContent = showingArchive ? 'Архів подій ' : 'Події ';
            }
            events.toggleArchiveMode(showingArchive);
        });
    }

    // Пошук та фільтрація людей
    if (dom.userSearchInput) dom.userSearchInput.addEventListener('input', user.handleUserSearch);
    if (dom.cityFilterInput) dom.cityFilterInput.addEventListener('input', () => user.renderPeople());
    if (dom.peopleInterestFilter) dom.peopleInterestFilter.addEventListener('click', user.handlePeopleInterestClick);

    // === ОБРОБКА КЛІКІВ У КАРУСЕЛЯХ (Event Delegation) ===

    // 1. Карусель ЛЮДЕЙ
    if (dom.peopleHorizontalTrack) {
        dom.peopleHorizontalTrack.addEventListener('click', (e) => {
            const followBtn = e.target.closest('.follow-btn');
            // Підписатися/Відписатися (залишається API виклик без переходу)
            if (followBtn) {
                const card = e.target.closest('.people-card');
                if (card) user.toggleFollow(parseInt(card.dataset.userId), followBtn);
                return;
            }

            const messageBtn = e.target.closest('.message-btn');
            // Написати -> Перехід на chat.html з ID користувача
            if (messageBtn) {
                const card = e.target.closest('.people-card');
                if (card) {
                    const userId = parseInt(card.dataset.userId);
                    window.location.href = `/chat.html?userId=${userId}`;
                }
                return;
            }

            // Клік по картці -> Перехід на user.html
            const card = e.target.closest('.people-card');
            if (card) {
                const userId = parseInt(card.dataset.userId);
                user.openOtherUserProfile(userId); // Ця функція в user.js тепер робить window.location.href
            }
        });
    }

    // 2. Карусель ПОДІЙ
    if (dom.eventsHorizontalTrack) {
        dom.eventsHorizontalTrack.addEventListener('scroll', events.updateScrollButtons);
        dom.eventsHorizontalTrack.addEventListener('click', async (e) => {
            const card = e.target.closest('.event-card-horizontal');
            const joinBtn = e.target.closest('.join-btn-v4');
            const leaveBtn = e.target.closest('.leave-btn-v4'); 
            const creatorInfo = e.target.closest('.creator-info-v4');
            
            // Дії кнопок (залишаються на сторінці)
            if (joinBtn) {
                e.stopPropagation();
                const eventId = parseInt(joinBtn.dataset.eventId);
                await events.handleJoinEvent({ eventId: eventId });
            } else if (leaveBtn) {
                e.stopPropagation();
                const eventId = parseInt(leaveBtn.dataset.eventId);
                await events.handleLeaveEvent({ eventId: eventId });
            } else if (creatorInfo) {
                // Клік по автору -> Перехід на user.html
                e.stopPropagation();
                const userId = parseInt(creatorInfo.dataset.userId);
                if (userId) user.openOtherUserProfile(userId); 
            } else if (card) {
                // Клік по картці -> Перехід на event.html
                const eventId = parseInt(card.dataset.eventId);
                if (eventId) {
                    window.location.href = `/event.html?id=${eventId}`;
                }
            }
        });
    }
    
    // Кнопки скролу каруселей
    if (dom.scrollLeftBtn) dom.scrollLeftBtn.addEventListener('click', () => dom.eventsHorizontalTrack.scrollBy({ left: 420, behavior: 'smooth' }));
    if (dom.scrollRightBtn) dom.scrollRightBtn.addEventListener('click', () => dom.eventsHorizontalTrack.scrollBy({ left: 420, behavior: 'smooth' }));
    if (dom.peopleScrollLeftBtn) dom.peopleScrollLeftBtn.addEventListener('click', () => dom.peopleHorizontalTrack.scrollBy({ left: 320, behavior: 'smooth' }));
    if (dom.peopleScrollRightBtn) dom.peopleScrollRightBtn.addEventListener('click', () => dom.peopleHorizontalTrack.scrollBy({ left: 320, behavior: 'smooth' }));

    // Сповіщення (Dropdown)
    if (dom.notificationBtn) {
        dom.notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dom.notificationDropdown.style.display === 'block';
            dom.notificationDropdown.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) dom.notificationBtn.classList.add('active');
            else dom.notificationBtn.classList.remove('active');
        });
    }
    if (dom.markAllReadBtn) {
        dom.markAllReadBtn.addEventListener('click', markAllNotificationsRead);
    }

    // Закриття залишкових технічних модалок (які не мають власних сторінок)
    const closeButtons = [
        dom.closeRegisterModal, dom.closeForgotPasswordModal,
        dom.closeInterestSearchModal, dom.closeSocialListModal
    ];
    closeButtons.forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', () => utils.closeModal(btn.closest('.modal')));
    });
});

// --- ЛОГІКА СПОВІЩЕНЬ (SOCKETS) ---

async function setupNotifications(userId) {
    socket.emit('join_notifications', { userId: userId });
    
    await loadNotifications(userId);
    
    socket.on('new_notification', async (notif) => {
        utils.showToast(notif.message, 'info');
        await addNotificationToUI(notif);
        updateBadgeCount(1);
        
        // Якщо нова подія - оновлюємо список подій на головній
        if (notif.type === 'new_event') {
            events.refreshEventsCache();
        }
    });

    socket.on('chat_alert', (msg) => {
        // Показуємо тост про повідомлення, бо ми на головній сторінці (не в чаті)
        utils.showToast(`Нове повідомлення від ${msg.senderName}`, 'info');
        updateChatBadge(1);
    });
}

async function loadNotifications(userId) {
    if(!userId) userId = utils.getCurrentUser()?.id;
    if(!userId) return;

    try {
        const res = await fetch(`${utils.API_URL}/api/notifications/${userId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const notifs = await res.json();
        
        const unreadCount = notifs.filter(n => !n.is_read).length;
        updateBadgeDisplay(unreadCount);
        
        if(dom.notificationList) {
            dom.notificationList.innerHTML = '';
            if (notifs.length === 0) {
                dom.notificationList.innerHTML = '<p class="empty-notif" style="padding:20px; text-align:center; color:#888;">Немає сповіщень</p>';
            } else {
                for (const n of notifs) {
                    await addNotificationToUI(n, false);
                }
            }
        }
    } catch (e) { console.error(e); }
}

async function addNotificationToUI(notif, prepend = true) {
    if(!dom.notificationList) return;

    const item = document.createElement('div');
    item.className = `notif-item ${notif.is_read ? '' : 'unread'}`;
    
    let iconHtml = '';
    
    if (notif.type === 'follow') {
        iconHtml = `<div class="notif-icon-area icon-only"><i class="fas fa-user-plus"></i></div>`;
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
        
        // Редіректи при кліку на сповіщення
        if (notif.type === 'new_event' || notif.type === 'join' || notif.type === 'reminder') {
            if (notif.related_id) {
                window.location.href = `/event.html?id=${notif.related_id}`;
            }
        } else if (notif.type === 'follow') {
            if (notif.related_id) {
                window.location.href = `/user.html?id=${notif.related_id}`;
            }
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
    await fetch(`${utils.API_URL}/api/notifications/read`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ id: id })
    });
}

async function markAllNotificationsRead() {
    const user = utils.getCurrentUser();
    if(!user) return;
    
    await fetch(`${utils.API_URL}/api/notifications/read`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ userId: user.id })
    });
    
    document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    updateBadgeDisplay(0);
}

function updateBadgeCount(change) {
    if(!dom.notificationBadge) return;
    const current = parseInt(dom.notificationBadge.textContent) || 0;
    updateBadgeDisplay(Math.max(0, current + change));
}

function updateBadgeDisplay(count) {
    if(!dom.notificationBadge) return;
    dom.notificationBadge.textContent = count;
    dom.notificationBadge.style.display = count > 0 ? 'block' : 'none';
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