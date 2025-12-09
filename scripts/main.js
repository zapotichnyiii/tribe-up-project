import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';
import * as auth from './auth.js';
import * as events from './events.js';
import * as user from './user.js';
import * as chat from './chat.js'; // Тепер тут тільки функції редіректу

// Підключення до Socket.IO
const socket = io('http://localhost:5000');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ініціалізація даних
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
        
        // Оновлюємо дані користувача у сховищі
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
        
        await user.fetchMySocials();
        setupNotifications(currentUser.id);
        
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

    // Валідація форм редагування (якщо вони використовуються в інших місцях або на цій сторінці)
    // Якщо форми винесені на окремі сторінки, цей код тут можна прибрати, 
    // але залишаємо для сумісності, якщо модалка "Створити подію" ще десь є.
    // utils.setupFormValidation(dom.editProfileForm, user.editProfileValidations); // Видалено, бо це на profile.html
    // utils.setupFormValidation(dom.editEventForm, events.editEventValidations);   // Видалено, бо це на event.html

    // --- ГЛОБАЛЬНІ СЛУХАЧІ ПОДІЙ ---

    // Клік по тегам інтересів (пошук)
    document.body.addEventListener('click', (e) => {
        const tag = e.target.closest('.interest-tag');
        if (tag) {
            const selectionContainer = e.target.closest('#registerForm, #createEventModal, #peopleInterestFilter');
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

    if (dom.themeToggle) dom.themeToggle.addEventListener('click', ui.toggleTheme);
    
    // Авторизація
    if (dom.loginFormInitial) dom.loginFormInitial.addEventListener('submit', auth.handleLoginSubmit);
    if (dom.registerForm) dom.registerForm.addEventListener('submit', auth.handleRegisterSubmit);
    if (dom.addCustomInterestBtn) dom.addCustomInterestBtn.addEventListener('click', auth.handleAddCustomInterest);
    if (dom.verifyBtn) dom.verifyBtn.addEventListener('click', auth.handleVerifySubmit);
    
    // === НАВІГАЦІЯ (РЕДІРЕКТИ ЗАМІСТЬ МОДАЛОК) ===

    // 1. Профіль
    if (dom.profileDisplay) {
        dom.profileDisplay.addEventListener('click', () => {
            window.location.href = '/profile.html';
        });
    }
    // Кнопка виходу (якщо вона є в хедері або меню)
    if (dom.profileLogoutBtn) {
        dom.profileLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    }

    // 2. Чат (Перехід на chat.html)
    if (dom.chatListBtn) {
        dom.chatListBtn.addEventListener('click', () => {
            window.location.href = '/chat.html';
        });
    }

    // Кнопка скролу до подій
    if (dom.searchEventsBtn) dom.searchEventsBtn.addEventListener('click', () => utils.scrollToSection('events'));

    // Перемикач Архів/Актуальні події
    if (dom.toggleArchiveBtn) {
        let showingArchive = false;
        dom.toggleArchiveBtn.addEventListener('click', () => {
            showingArchive = !showingArchive;
            dom.toggleArchiveBtn.innerHTML = showingArchive ? '<i class="fas fa-calendar-alt"></i> Актуальні' : '<i class="fas fa-history"></i> Архів';
            
            const title = document.querySelector('.section-title-modern') || document.querySelector('.section-title');
            if (title && title.childNodes[0]) {
                title.childNodes[0].textContent = showingArchive ? 'Архів подій ' : 'Нові події ';
            }
            events.toggleArchiveMode(showingArchive);
        });
    }

    // Пошук людей
    if (dom.userSearchInput) dom.userSearchInput.addEventListener('input', user.handleUserSearch);
    if (dom.cityFilterInput) dom.cityFilterInput.addEventListener('input', () => user.renderPeople());
    if (dom.peopleInterestFilter) dom.peopleInterestFilter.addEventListener('click', user.handlePeopleInterestClick);

    // === ОБРОБКА КЛІКІВ У КАРУСЕЛЯХ ===

    // 1. Карусель ЛЮДЕЙ
    if (dom.peopleHorizontalTrack) {
        dom.peopleHorizontalTrack.addEventListener('click', (e) => {
            const followBtn = e.target.closest('.follow-btn');
            // Підписатися/Відписатися (залишається API виклик)
            if (followBtn) {
                const card = e.target.closest('.people-card');
                if (card) user.toggleFollow(parseInt(card.dataset.userId), followBtn);
                return;
            }

            const messageBtn = e.target.closest('.message-btn');
            // Написати -> Перехід в чат з цим юзером
            if (messageBtn) {
                const card = e.target.closest('.people-card');
                if (card) {
                    const userId = parseInt(card.dataset.userId);
                    window.location.href = `/chat.html?userId=${userId}`;
                }
                return;
            }

            // Клік по картці -> Перехід на профіль юзера
            const card = e.target.closest('.people-card');
            if (card) {
                const userId = parseInt(card.dataset.userId);
                user.openOtherUserProfile(userId); // Ця функція тепер робить redirect
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
            
            if (joinBtn) {
                e.stopPropagation();
                const eventId = parseInt(joinBtn.dataset.eventId);
                await events.handleJoinEvent({ eventId: eventId });
            } else if (leaveBtn) {
                e.stopPropagation();
                const eventId = parseInt(leaveBtn.dataset.eventId);
                await events.handleLeaveEvent({ eventId: eventId });
            } else if (creatorInfo) {
                e.stopPropagation();
                const userId = parseInt(creatorInfo.dataset.userId);
                if (userId) user.openOtherUserProfile(userId); // Redirect
            } else if (card) {
                // Клік по картці -> Перехід на сторінку події
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

    // Сповіщення
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

    // Закриття залишкових модалок (авторизація, пошук інтересів)
    const closeButtons = [
        dom.closeRegisterModal, dom.closeForgotPasswordModal,
        dom.closeInterestSearchModal, dom.closeSocialListModal
    ];
    closeButtons.forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', () => utils.closeModal(btn.closest('.modal')));
    });
});

// --- ЛОГІКА СПОВІЩЕНЬ ---

async function setupNotifications(userId) {
    socket.emit('join_notifications', { userId: userId });
    
    await loadNotifications(userId);
    
    socket.on('new_notification', async (notif) => {
        utils.showToast(notif.message, 'info');
        await addNotificationToUI(notif);
        updateBadgeCount(1);
        
        if (notif.type === 'new_event') {
            events.refreshEventsCache();
        }
    });

    socket.on('chat_alert', (msg) => {
        // Якщо ми не на сторінці чату, показуємо тост
        if (!window.location.pathname.includes('chat.html')) {
            utils.showToast(`Нове повідомлення від ${msg.senderName}`, 'info');
            updateChatBadge(1);
        }
    });
}

async function loadNotifications(userId) {
    if(!userId) userId = utils.getCurrentUser()?.id;
    if(!userId) return;

    try {
        const res = await fetch(`http://localhost:5000/api/notifications/${userId}`, {
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
    
    if (notif.type === 'follow' && notif.related_id) {
        // Оптимізація: завантажуємо аватар тільки якщо треба, або заглушку
        // Тут краще брати з кешу, але для простоти іконка
        iconHtml = `<div class="notif-icon-area icon-only"><i class="fas fa-user-plus"></i></div>`;
    } else if (notif.type === 'new_event') {
        iconHtml = `<div class="notif-icon-area icon-only" style="background: #e0f2fe; color: #0284c7;"><i class="fas fa-calendar-plus"></i></div>`;
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
    await fetch('http://localhost:5000/api/notifications/read', {
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
    
    await fetch('http://localhost:5000/api/notifications/read', {
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