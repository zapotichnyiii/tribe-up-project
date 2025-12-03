import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';
import * as auth from './auth.js';
import * as events from './events.js';
import * as user from './user.js';
import * as chat from './chat.js';

// Підключаємо Socket.IO для сповіщень
const socket = io('http://localhost:5000');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Завантаження інтересів
    await utils.fetchGlobalInterests();
    
    // 2. Ініціалізація UI
    ui.updateAllInterestContainers();
    ui.loadTheme();
    ui.handleBackToTop();
    ui.setupNavigation();
    ui.initEventSteps();

    const currentUser = utils.getCurrentUser();
    let showingArchive = false;

    // 3. Завантаження подій
    const allEvents = await utils.getEvents('active');
    
    if (currentUser) {
        ui.showMainApp(currentUser);
        events.renderEvents(allEvents, false);
        
        // Авто-оновлення профілю та соціальних даних
        utils.getUsers().then(users => {
            const freshUser = users.find(u => u.id === currentUser.id);
            if (freshUser) {
                localStorage.setItem('currentUser', JSON.stringify(freshUser));
                ui.showMainApp(freshUser);
            }
        });

        // === НОВЕ: Завантаження соціальних даних та налаштування сповіщень ===
        await user.fetchMySocials();
        setupNotifications(currentUser.id);
        
        await user.renderPeople();
        await user.renderPeopleInterestFilter();
    } else {
        ui.showAuthScreen();
        auth.initAuthTabs();
        utils.setupFormValidation(dom.loginFormInitial, auth.loginValidations);
        utils.setupFormValidation(dom.registerForm, auth.registerValidations);
    }

    utils.setupFormValidation(dom.createEventForm, events.createEventValidations);
    utils.setupFormValidation(dom.editProfileForm, user.editProfileValidations);
    utils.setupFormValidation(dom.editEventForm, events.editEventValidations);
    
    // --- ГЛОБАЛЬНІ ОБРОБНИКИ ---

    document.body.addEventListener('click', (e) => {
        // Логіка кліку по тегу інтересу
        const tag = e.target.closest('.interest-tag');
        if (tag) {
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

    if (dom.themeToggle) dom.themeToggle.addEventListener('click', ui.toggleTheme);
    if (dom.loginFormInitial) dom.loginFormInitial.addEventListener('submit', auth.handleLoginSubmit);
    if (dom.registerForm) dom.registerForm.addEventListener('submit', auth.handleRegisterSubmit);
    if (dom.addCustomInterestBtn) dom.addCustomInterestBtn.addEventListener('click', auth.handleAddCustomInterest);
    if (dom.verifyBtn) dom.verifyBtn.addEventListener('click', auth.handleVerifySubmit);
    
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
    
    if (dom.searchEventsBtn) dom.searchEventsBtn.addEventListener('click', () => utils.scrollToSection('search'));
    if (dom.createEventForm) dom.createEventForm.addEventListener('submit', async (e) => { events.handleCreateEventSubmit(e); });
    
    if (dom.editEventForm) dom.editEventForm.addEventListener('submit', events.handleEditEventSubmit);
    if (dom.addEditEventCustomInterestBtn) dom.addEditEventCustomInterestBtn.addEventListener('click', events.handleAddEditEventInterest);
    if (dom.addEventCustomInterestBtn) dom.addEventCustomInterestBtn.addEventListener('click', ui.handleAddEventInterest);

    // Архів подій
    if (dom.toggleArchiveBtn) {
        dom.toggleArchiveBtn.addEventListener('click', async () => {
            showingArchive = !showingArchive;
            const status = showingArchive ? 'finished' : 'active';
            dom.toggleArchiveBtn.innerHTML = showingArchive ? '<i class="fas fa-calendar-alt"></i> Актуальні' : '<i class="fas fa-history"></i> Архів';
            const title = document.querySelector('.section-title-modern');
            if (title && title.firstChild) title.firstChild.textContent = showingArchive ? 'Архів подій ' : 'Нові події ';
            const eventsData = await utils.getEvents(status);
            events.renderEvents(eventsData, showingArchive);
        });
    }

    // --- ПОШУК ТА ФІЛЬТРИ ЛЮДЕЙ ---
    if (dom.userSearchInput) dom.userSearchInput.addEventListener('input', user.handleUserSearch);
    if (dom.cityFilterInput) dom.cityFilterInput.addEventListener('input', () => user.renderPeople());
    if (dom.peopleInterestFilter) dom.peopleInterestFilter.addEventListener('click', user.handlePeopleInterestClick);

    // === НОВЕ: ОБРОБНИКИ ДЛЯ СОЦІАЛЬНИХ ФУНКЦІЙ ===
    
    // 1. Делегування подій в сітці людей (кнопка підписатися)
    if (dom.peopleGrid) {
        dom.peopleGrid.addEventListener('click', (e) => {
            // Кнопка підписатися
            const followBtn = e.target.closest('.follow-btn');
            if (followBtn) {
                const card = e.target.closest('.people-card');
                if (card) user.toggleFollow(parseInt(card.dataset.userId), followBtn);
                return;
            }

            // Кнопка написати
            const messageBtn = e.target.closest('.message-btn');
            if (messageBtn) {
                const card = e.target.closest('.people-card');
                if (card) {
                    chat.loadPrivateChat(parseInt(card.dataset.userId));
                    utils.openModal(dom.privateChatModal);
                }
                return;
            }

            // Клік по картці (відкрити профіль)
            const card = e.target.closest('.people-card');
            if (card) {
                user.openOtherUserProfile(parseInt(card.dataset.userId));
            }
        });
    }

    // 2. Списки підписників у власному профілі
    if (dom.myFollowersBtn) dom.myFollowersBtn.addEventListener('click', () => user.openSocialList('followers'));
    if (dom.myFollowingBtn) dom.myFollowingBtn.addEventListener('click', () => user.openSocialList('following'));
    if (dom.closeSocialListModal) dom.closeSocialListModal.addEventListener('click', () => utils.closeModal(dom.socialListModal));

    // 3. Меню сповіщень
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
    // ============================================

    // --- ЧАТИ ---
    if (dom.chatListBtn) {
        dom.chatListBtn.addEventListener('click', () => {
            chat.renderChatList();
            utils.openModal(dom.chatListModal);
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
    const chatInput = document.getElementById('contactInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
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

    // --- КАРУСЕЛЬ ПОДІЙ ---
    if (dom.eventsHorizontalTrack) {
        dom.eventsHorizontalTrack.addEventListener('scroll', events.updateScrollButtons);
        dom.eventsHorizontalTrack.addEventListener('click', async (e) => {
            const card = e.target.closest('.event-card-horizontal');
            const joinBtn = e.target.closest('.join-btn-v4');
            const creatorInfo = e.target.closest('.creator-info-v4');
            
            if (joinBtn) {
                const eventId = parseInt(joinBtn.dataset.eventId);
                const status = showingArchive ? 'finished' : 'active';
                const freshEvents = await utils.getEvents(status);
                const event = freshEvents.find(e => e.eventId === eventId);
                
                if (event) {
                    await events.handleJoinEvent(event, async () => {
                        const updatedEvents = await utils.getEvents(status);
                        events.renderEvents(updatedEvents, showingArchive);
                        if (dom.eventDetailModal.style.display === 'flex') events.openEventDetail(event);
                    });
                }
            } else if (creatorInfo) {
                e.stopPropagation();
                const userId = parseInt(creatorInfo.dataset.userId);
                if (userId) user.openOtherUserProfile(userId);
            } else if (card) {
                const eventId = parseInt(card.dataset.eventId);
                const status = showingArchive ? 'finished' : 'active';
                const freshEvents = await utils.getEvents(status);
                const event = freshEvents.find(e => e.eventId === eventId);
                if (event) events.openEventDetail(event);
            }
        });
    }
    
    if (dom.scrollLeftBtn) dom.scrollLeftBtn.addEventListener('click', () => dom.eventsHorizontalTrack.scrollBy({ left: -420, behavior: 'smooth' }));
    if (dom.scrollRightBtn) dom.scrollRightBtn.addEventListener('click', () => dom.eventsHorizontalTrack.scrollBy({ left: 420, behavior: 'smooth' }));

    // Список чатів
    const chatList = document.getElementById('chatList');
    if (chatList) {
        chatList.addEventListener('click', (e) => {
            const chatItem = e.target.closest('.chat-item');
            if (!chatItem) return;
            const userId = parseInt(chatItem.dataset.userId);
            utils.closeModal(dom.chatListModal);
            chat.loadPrivateChat(userId);
            utils.openModal(dom.privateChatModal);
        });
    }

    // Кнопки закриття модалок
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

// === ФУНКЦІЇ ДЛЯ СПОВІЩЕНЬ ===

async function setupNotifications(userId) {
    // Входимо в кімнату Socket.IO
    socket.emit('join_notifications', { userId: userId });
    
    // Завантажуємо початковий список
    await loadNotifications(userId);
    
    // Слухаємо нові сповіщення
    socket.on('new_notification', (notif) => {
        utils.showToast(notif.message, 'info'); // Спливаюче повідомлення
        addNotificationToUI(notif); // Додаємо в список
        updateBadgeCount(1); // Оновлюємо лічильник
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
            dom.notificationList.innerHTML = '<p class="empty-notif">Немає сповіщень</p>';
        } else {
            notifs.forEach(n => addNotificationToUI(n, false));
        }
    } catch (e) { console.error(e); }
}

function addNotificationToUI(notif, prepend = true) {
    const item = document.createElement('div');
    item.className = `notif-item ${notif.is_read ? '' : 'unread'}`;
    item.innerHTML = `
        <div class="notif-text">${notif.message}</div>
        <div class="notif-time">${utils.formatEventDate(notif.created_at)}</div>
    `;
    
    // Клік по сповіщенню
    item.addEventListener('click', async () => {
        if (!notif.is_read) {
            await markNotificationRead(notif.id);
            item.classList.remove('unread');
            updateBadgeCount(-1);
        }
        
        // Перехід залежно від типу
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
    
    // Візуально оновлюємо
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