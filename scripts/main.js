import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';
import * as auth from './auth.js';
import * as events from './events.js';
import * as user from './user.js';
import * as chat from './chat.js';

// Підключення до Socket.IO
const socket = io('http://localhost:5000');

document.addEventListener('DOMContentLoaded', async () => {
    // Завантажуємо глобальні інтереси при старті
    await utils.fetchGlobalInterests();
    
    // Ініціалізація фільтрів та UI
    events.initEventFilters();
    ui.updateAllInterestContainers();
    ui.loadTheme();
    ui.handleBackToTop();
    ui.setupNavigation();
    ui.initEventSteps();

    const currentUser = utils.getCurrentUser();
    
    if (currentUser) {
        ui.showMainApp(currentUser);
        
        // Оновлюємо дані користувача в localStorage, щоб вони були актуальні
        utils.getUsers().then(users => {
            const freshUser = users.find(u => u.id === currentUser.id);
            if (freshUser) {
                localStorage.setItem('currentUser', JSON.stringify(freshUser));
                ui.showMainApp(freshUser);
            }
        });

        // ЗАПУСК ПОЛІНГУ (АВТООНОВЛЕННЯ)
        // Це забезпечить миттєве відображення подій та людей з кешу
        events.startEventPolling();
        user.startUserPolling();
        
        // Завантажуємо соціальні зв'язки та сповіщення
        await user.fetchMySocials();
        setupNotifications(currentUser.id);
        
        // Ініціалізація списку людей (хоча startUserPolling це теж зробить, це для певності)
        user.renderPeople();
        user.renderPeopleInterestFilter();
    } else {
        ui.showAuthScreen();
        auth.initAuthTabs();
        auth.initForgotPassword();
        utils.setupFormValidation(dom.loginFormInitial, auth.loginValidations);
        utils.setupFormValidation(dom.registerForm, auth.registerValidations);
    }

    // Налаштування валідації форм
    utils.setupFormValidation(dom.createEventForm, events.createEventValidations);
    utils.setupFormValidation(dom.editProfileForm, user.editProfileValidations);
    utils.setupFormValidation(dom.editEventForm, events.editEventValidations);
    
    // --- ГЛОБАЛЬНІ СЛУХАЧІ ПОДІЙ ---

    // Клік по тегу інтересу (пошук)
    document.body.addEventListener('click', (e) => {
        const tag = e.target.closest('.interest-tag');
        if (tag) {
            // Перевіряємо, чи цей тег не в контейнері вибору (де він просто виділяється)
            const selectionContainer = e.target.closest('#registerForm, #createEventModal, #editEventModal, #editProfileModal, #peopleInterestFilter');
            if (!selectionContainer) {
                const interest = tag.dataset.interest || tag.textContent;
                if (interest) {
                    e.preventDefault(); 
                    ui.openInterestSearchModal(interest);
                }
            }
        }

        // Закриття дропдауну сповіщень при кліку поза ним
        if (dom.notificationDropdown && dom.notificationDropdown.style.display === 'block') {
            if (!e.target.closest('.notification-wrapper')) {
                dom.notificationDropdown.style.display = 'none';
                dom.notificationBtn?.classList.remove('active');
            }
        }
    });

    // Тема, Авторизація, Інтереси
    if (dom.themeToggle) dom.themeToggle.addEventListener('click', ui.toggleTheme);
    if (dom.loginFormInitial) dom.loginFormInitial.addEventListener('submit', auth.handleLoginSubmit);
    if (dom.registerForm) dom.registerForm.addEventListener('submit', auth.handleRegisterSubmit);
    if (dom.addCustomInterestBtn) dom.addCustomInterestBtn.addEventListener('click', auth.handleAddCustomInterest);
    if (dom.verifyBtn) dom.verifyBtn.addEventListener('click', auth.handleVerifySubmit);
    
    // Профіль
    if (dom.profileDisplay) dom.profileDisplay.addEventListener('click', user.openUserProfile);
    if (dom.profileLogoutBtn) {
        dom.profileLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            location.reload();
        });
    }

    // Редагування профілю
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) editProfileBtn.addEventListener('click', user.openEditProfileModal);
    if (dom.editProfileForm) dom.editProfileForm.addEventListener('submit', user.handleEditProfileSubmit);
    if (dom.addEditCustomInterestBtn) dom.addEditCustomInterestBtn.addEventListener('click', user.handleAddEditCustomInterest);

    // Створення події
    if (dom.createEventBtn) {
        dom.createEventBtn.addEventListener('click', () => {
            ui.updateAllInterestContainers(); 
            ui.showEventStep(1);
            utils.openModal(dom.createEventModal);
        });
    }
    
    // Пошук подій (скрол до секції)
    if (dom.searchEventsBtn) dom.searchEventsBtn.addEventListener('click', () => utils.scrollToSection('events'));
    
    // Сабміт форми створення події
    if (dom.createEventForm) dom.createEventForm.addEventListener('submit', async (e) => { events.handleCreateEventSubmit(e); });
    
    // Редагування події
    if (dom.editEventForm) dom.editEventForm.addEventListener('submit', events.handleEditEventSubmit);
    if (dom.addEditEventCustomInterestBtn) dom.addEditEventCustomInterestBtn.addEventListener('click', events.handleAddEditEventInterest);
    if (dom.addEventCustomInterestBtn) dom.addEventCustomInterestBtn.addEventListener('click', ui.handleAddEventInterest);

    // --- КНОПКА АРХІВУ (Оновлена логіка) ---
    if (dom.toggleArchiveBtn) {
        let showingArchive = false;
        dom.toggleArchiveBtn.addEventListener('click', () => {
            showingArchive = !showingArchive;
            dom.toggleArchiveBtn.innerHTML = showingArchive ? '<i class="fas fa-calendar-alt"></i> Актуальні' : '<i class="fas fa-history"></i> Архів';
            
            const title = document.querySelector('.section-title-modern') || document.querySelector('.section-title');
            if (title && title.childNodes[0]) {
                title.childNodes[0].textContent = showingArchive ? 'Архів подій ' : 'Нові події ';
            }
            
            // Викликаємо функцію з events.js для перемикання режиму і оновлення кешу
            events.toggleArchiveMode(showingArchive);
        });
    }

    // Пошук людей
    if (dom.userSearchInput) dom.userSearchInput.addEventListener('input', user.handleUserSearch);
    if (dom.cityFilterInput) dom.cityFilterInput.addEventListener('input', () => user.renderPeople());
    if (dom.peopleInterestFilter) dom.peopleInterestFilter.addEventListener('click', user.handlePeopleInterestClick);

    // Кліки в сітці людей (Підписатися, Написати, Профіль)
    if (dom.peopleGrid) {
        dom.peopleGrid.addEventListener('click', (e) => {
            const followBtn = e.target.closest('.follow-btn');
            if (followBtn) {
                const card = e.target.closest('.people-card');
                if (card) user.toggleFollow(parseInt(card.dataset.userId), followBtn);
                return;
            }

            const messageBtn = e.target.closest('.message-btn');
            if (messageBtn) {
                const card = e.target.closest('.people-card');
                if (card) {
                    chat.loadPrivateChat(parseInt(card.dataset.userId));
                    utils.openModal(dom.privateChatModal);
                }
                return;
            }

            const card = e.target.closest('.people-card');
            if (card) {
                user.openOtherUserProfile(parseInt(card.dataset.userId));
            }
        });
    }

    // Списки підписників/підписок
    if (dom.myFollowersBtn) {
        dom.myFollowersBtn.addEventListener('click', () => {
            const u = utils.getCurrentUser();
            if(u) user.openSocialList('followers', u.id);
        });
    }
    if (dom.myFollowingBtn) {
        dom.myFollowingBtn.addEventListener('click', () => {
            const u = utils.getCurrentUser();
            if(u) user.openSocialList('following', u.id);
        });
    }
    if (dom.otherUserFollowersBtn) {
        dom.otherUserFollowersBtn.addEventListener('click', () => {
            const uid = dom.otherUserFollowersBtn.dataset.userId;
            if (uid) user.openSocialList('followers', uid);
        });
    }
    if (dom.otherUserFollowingBtn) {
        dom.otherUserFollowingBtn.addEventListener('click', () => {
            const uid = dom.otherUserFollowingBtn.dataset.userId;
            if (uid) user.openSocialList('following', uid);
        });
    }
    if (dom.closeSocialListModal) dom.closeSocialListModal.addEventListener('click', () => utils.closeModal(dom.socialListModal));

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

    // Чати
    if (dom.chatListBtn) {
        dom.chatListBtn.addEventListener('click', () => {
            chat.renderChatList();
            utils.openModal(dom.chatListModal);
            updateChatBadge(0);
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

    if (dom.otherUserMessageBtn) {
        dom.otherUserMessageBtn.addEventListener('click', () => {
            const userId = parseInt(dom.otherUserMessageBtn.dataset.userId);
            if (userId && !dom.otherUserMessageBtn.disabled) {
                utils.closeModal(dom.otherUserProfileModal);
                chat.loadPrivateChat(userId);
                utils.openModal(dom.privateChatModal);
            }
        });
    }

    // --- КЛІКИ НА КАРТКАХ ПОДІЙ (Карусель) ---
    if (dom.eventsHorizontalTrack) {
        dom.eventsHorizontalTrack.addEventListener('scroll', events.updateScrollButtons);
        dom.eventsHorizontalTrack.addEventListener('click', async (e) => {
            const card = e.target.closest('.event-card-horizontal');
            const joinBtn = e.target.closest('.join-btn-v4');
            const creatorInfo = e.target.closest('.creator-info-v4');
            
            if (joinBtn) {
                const eventId = parseInt(joinBtn.dataset.eventId);
                // Оскільки у нас тепер кеш в events.js, нам треба отримати подію.
                // Передаємо об'єкт з ID, а events.js розбереться (або оновимо кеш)
                await events.handleJoinEvent({ eventId: eventId });
            } else if (creatorInfo) {
                e.stopPropagation();
                const userId = parseInt(creatorInfo.dataset.userId);
                if (userId) user.openOtherUserProfile(userId);
            } else if (card) {
                const eventId = parseInt(card.dataset.eventId);
                // Шукаємо подію, щоб відкрити деталі.
                // Оскільки всі події зараз завантажені (для рендеру), ми можемо взяти їх з API або кешу.
                // Тут найпростіше взяти свіжий список (це швидко з localStorage/сервера)
                const allEvents = await utils.getEvents(); 
                const event = allEvents.find(e => e.eventId === eventId);
                if (event) events.openEventDetail(event);
            }
        });
    }
    
    // Стрілки каруселі
    if (dom.scrollLeftBtn) dom.scrollLeftBtn.addEventListener('click', () => dom.eventsHorizontalTrack.scrollBy({ left: 420, behavior: 'smooth' }));
    if (dom.scrollRightBtn) dom.scrollRightBtn.addEventListener('click', () => dom.eventsHorizontalTrack.scrollBy({ left: 420, behavior: 'smooth' }));

    // Список чатів
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

    // Закриття модалок
    const closeButtons = [
        dom.closeRegisterModal, dom.closeEventModal, dom.closeProfileModal,
        dom.closeEditProfileModal, dom.closeEventDetailModal, dom.closeEditEventModal,
        dom.closeChatListModal, dom.closePrivateChatModal, dom.closeOtherUserProfileModal,
        dom.closeInterestSearchModal
    ];
    closeButtons.forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', () => utils.closeModal(btn.closest('.modal')));
    });
});

// --- СИСТЕМА СПОВІЩЕНЬ ---

async function setupNotifications(userId) {
    socket.emit('join_notifications', { userId: userId });
    
    await loadNotifications(userId);
    
    socket.on('new_notification', async (notif) => {
        utils.showToast(notif.message, 'info');
        await addNotificationToUI(notif);
        updateBadgeCount(1);
        
        // --- ВАЖЛИВО: Оновлюємо список подій, якщо хтось створив нову ---
        if (notif.type === 'new_event') {
            events.refreshEventsCache();
        }
        // ----------------------------------------------------------------
    });

    socket.on('chat_alert', (msg) => {
        const isChatOpen = dom.privateChatModal && dom.privateChatModal.classList.contains('open');
        const talkingToSender = dom.privateChatModal && (dom.privateChatModal.dataset.otherUserId == msg.senderId);
        
        if (isChatOpen && talkingToSender) {
            return; // Не показуємо тост, якщо чат відкритий
        }
        utils.showToast(`Нове повідомлення від ${msg.senderName}`, 'info');
        updateChatBadge(1);
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
    const item = document.createElement('div');
    item.className = `notif-item ${notif.is_read ? '' : 'unread'}`;
    
    let iconHtml = '';
    
    if (notif.type === 'follow' && notif.related_id) {
        const users = await utils.getUsers(); 
        const follower = users.find(u => u.id === notif.related_id);
        
        if (follower && follower.avatarBase64) {
            iconHtml = `
                <div class="notif-icon-area">
                    <img src="${follower.avatarBase64}" alt="User">
                </div>
            `;
        } else {
            iconHtml = `
                <div class="notif-icon-area icon-only">
                    <i class="fas fa-user-plus"></i>
                </div>
            `;
        }
    } else if (notif.type === 'new_event') {
        iconHtml = `
            <div class="notif-icon-area icon-only" style="background: #e0f2fe; color: #0284c7;">
                <i class="fas fa-calendar-plus"></i>
            </div>
        `;
    } else if (notif.type === 'reminder') {
        iconHtml = `
            <div class="notif-icon-area icon-only" style="background: #fef3c7; color: #d97706;">
                <i class="fas fa-clock"></i>
            </div>
        `;
    } else {
        iconHtml = `
            <div class="notif-icon-area icon-only">
                <i class="fas fa-bell"></i>
            </div>
        `;
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
    const current = parseInt(dom.notificationBadge.textContent) || 0;
    updateBadgeDisplay(Math.max(0, current + change));
}

function updateBadgeDisplay(count) {
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