import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';
import * as auth from './auth.js';
import * as events from './events.js';
import * as user from './user.js';
import * as chat from './chat.js';

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
        
        // Авто-оновлення профілю
        utils.getUsers().then(users => {
            const freshUser = users.find(u => u.id === currentUser.id);
            if (freshUser) {
                localStorage.setItem('currentUser', JSON.stringify(freshUser));
                ui.showMainApp(freshUser);
            }
        });
        
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
        const tag = e.target.closest('.interest-tag');
        if (!tag) return;
        const selectionContainer = e.target.closest('#registerForm, #createEventModal, #editEventModal, #editProfileModal, #peopleInterestFilter');
        if (selectionContainer) return;
        
        const interest = tag.dataset.interest || tag.textContent;
        if (interest) {
            e.preventDefault(); 
            ui.openInterestSearchModal(interest);
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

    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) editProfileBtn.addEventListener('click', user.openEditProfileModal);
    if (dom.editProfileForm) dom.editProfileForm.addEventListener('submit', user.handleEditProfileSubmit);
    if (dom.addEditCustomInterestBtn) dom.addEditCustomInterestBtn.addEventListener('click', user.handleAddEditCustomInterest);

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

    // --- ПОШУК ТА ФІЛЬТРИ ЛЮДЕЙ (ПОВЕРНУТО) ---
    if (dom.userSearchInput) {
        dom.userSearchInput.addEventListener('input', user.handleUserSearch);
    }
    
    if (dom.cityFilterInput) {
        dom.cityFilterInput.addEventListener('input', () => user.renderPeople());
    }

    if (dom.peopleInterestFilter) {
        dom.peopleInterestFilter.addEventListener('click', user.handlePeopleInterestClick);
    }
    // ------------------------------------------

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

    if (dom.peopleGrid) {
        dom.peopleGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.message-btn');
            const card = e.target.closest('.people-card');
            if (btn && card) {
                chat.loadPrivateChat(parseInt(card.dataset.userId));
                utils.openModal(dom.privateChatModal);
            } else if (card) {
                user.openOtherUserProfile(parseInt(card.dataset.userId));
            }
        });
    }

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