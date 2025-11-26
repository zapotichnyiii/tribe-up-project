// Імпортуємо всі DOM-елементи
import * as dom from './dom.js';

// Імпортуємо всі утиліти
import * as utils from './utils.js';

// Імпортуємо логіку з модулів
import * as ui from './ui.js';
import * as auth from './auth.js';
import * as events from './events.js';
import * as user from './user.js';
import * as chat from './chat.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Ініціалізація стану та UI
    ui.updateAllInterestContainers();
    ui.loadTheme();
    ui.handleBackToTop();
    ui.setupNavigation();
    ui.initEventSteps();

    // 2. Перевірка поточного користувача
    const currentUser = utils.getCurrentUser();
    if (currentUser) {
        ui.showMainApp(currentUser);
        events.renderEvents(utils.getEvents());
        user.renderPeople();
        user.renderPeopleInterestFilter();
    } else {
        ui.showAuthScreen();
        auth.initAuthTabs();
        utils.setupFormValidation(dom.loginFormInitial, auth.loginValidations);
        utils.setupFormValidation(dom.registerForm, auth.registerValidations);
    }

    // 3. Налаштування валідації форм
    utils.setupFormValidation(dom.createEventForm, events.createEventValidations);
    utils.setupFormValidation(dom.editProfileForm, user.editProfileValidations);
    utils.setupFormValidation(dom.editEventForm, events.editEventValidations);
    
    // 4. Глобальні обробники подій (клік по тілу)
    document.body.addEventListener('click', (e) => {
        const tag = e.target.closest('.interest-tag');
        if (!tag) return;

        // Ігнорувати кліки в контейнерах вибору інтересів
        const selectionContainer = e.target.closest('#registerForm, #createEventModal, #editEventModal, #editProfileModal, #peopleInterestFilter');
        if (selectionContainer) return;

        const interest = tag.dataset.interest || tag.textContent;
        if (interest) {
            e.preventDefault(); 
            ui.openInterestSearchModal(interest);
        }
    });

    // 5. Обробники для кнопок та форм
    
    // Тема
    if (dom.themeToggle) {
        dom.themeToggle.addEventListener('click', ui.toggleTheme);
        dom.themeToggle.addEventListener('touchstart', (e) => { e.preventDefault(); ui.toggleTheme(); });
    }

    // Автентифікація
    if (dom.loginFormInitial) dom.loginFormInitial.addEventListener('submit', auth.handleLoginSubmit);
    if (dom.registerForm) dom.registerForm.addEventListener('submit', auth.handleRegisterSubmit);
    if (dom.addCustomInterestBtn) {
        dom.addCustomInterestBtn.addEventListener('click', auth.handleAddCustomInterest);
        dom.addCustomInterestBtn.addEventListener('touchstart', (e) => { e.preventDefault(); auth.handleAddCustomInterest(); });
    }
    if (dom.customInterestInput) {
        dom.customInterestInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') auth.handleAddCustomInterest();
        });
    }

    // Профіль
    if (dom.profileDisplay) {
        dom.profileDisplay.addEventListener('click', user.openUserProfile);
        dom.profileDisplay.addEventListener('touchstart', (e) => { e.preventDefault(); user.openUserProfile(); });
    }
    if (dom.profileLogoutBtn) {
        const logout = () => {
            localStorage.removeItem('currentUser');
            ui.showAuthScreen();
            auth.initAuthTabs();
            utils.closeModal(dom.profileModal);
            utils.showToast('Ви вийшли з системи', 'info');
        };
        dom.profileLogoutBtn.addEventListener('click', logout);
        dom.profileLogoutBtn.addEventListener('touchstart', (e) => { e.preventDefault(); logout(); });
    }

    // Редагування профілю
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', user.openEditProfileModal);
        editProfileBtn.addEventListener('touchstart', (e) => { e.preventDefault(); user.openEditProfileModal(); });
    }
    if (dom.editProfileForm) dom.editProfileForm.addEventListener('submit', async (e) => {
        await user.handleEditProfileSubmit(e);
        // Оновити UI після збереження
        const updatedUser = utils.getCurrentUser();
        if (updatedUser) {
            ui.showMainApp(updatedUser);
            user.renderPeople();
            user.renderPeopleInterestFilter();
        }
    });
    if (dom.editProfilePhoto) {
        dom.editProfilePhoto.addEventListener('change', async () => {
            const file = dom.editProfilePhoto.files[0];
            if (file) {
                const base64 = await utils.fileToBase64(file);
                if (base64) dom.editProfileAvatarPreview.src = base64;
            }
        });
    }
    if (dom.addEditCustomInterestBtn) {
        dom.addEditCustomInterestBtn.addEventListener('click', () => {
            user.handleAddEditCustomInterest();
            ui.updateAllInterestContainers();
            const currentUser = utils.getCurrentUser();
            if(currentUser) ui.renderInterests(dom.editProfileInterestsContainer, currentUser.interests, () => {});
        });
    }

    // Події
    if (dom.createEventBtn) {
        dom.createEventBtn.addEventListener('click', () => {
            ui.updateAllInterestContainers(); 
            ui.showEventStep(1);
            utils.openModal(dom.createEventModal);
        });
        dom.createEventBtn.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            ui.updateAllInterestContainers(); 
            ui.showEventStep(1);
            utils.openModal(dom.createEventModal);
        });
    }
    if (dom.searchEventsBtn) {
        dom.searchEventsBtn.addEventListener('click', () => utils.scrollToSection('search'));
        dom.searchEventsBtn.addEventListener('touchstart', (e) => { e.preventDefault(); utils.scrollToSection('search'); });
    }
    if (dom.createEventForm) dom.createEventForm.addEventListener('submit', events.handleCreateEventSubmit);
    if (dom.editEventForm) dom.editEventForm.addEventListener('submit', events.handleEditEventSubmit);

    if (dom.addEventCustomInterestBtn) {
        dom.addEventCustomInterestBtn.addEventListener('click', ui.handleAddEventInterest);
        dom.addEventCustomInterestBtn.addEventListener('touchstart', (e) => { e.preventDefault(); ui.handleAddEventInterest(); });
    }
    if (dom.eventCustomInterestInput) {
        dom.eventCustomInterestInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); ui.handleAddEventInterest(); }
        });
    }
    
    if (dom.addEditEventCustomInterestBtn) {
        dom.addEditEventCustomInterestBtn.addEventListener('click', events.handleAddEditEventInterest);
    }
    
    // Карусель подій
    if (dom.eventsHorizontalTrack) {
        dom.eventsHorizontalTrack.addEventListener('scroll', events.updateScrollButtons);
        dom.eventsHorizontalTrack.addEventListener('click', (e) => {
            const card = e.target.closest('.event-card-horizontal');
            const joinBtn = e.target.closest('.join-btn-v4');
            const creatorProfile = e.target.closest('.creator-info-v4');
            
            if (joinBtn) {
                const eventId = parseInt(joinBtn.dataset.eventId);
                const event = utils.getEvents().find(e => e.eventId === eventId);
                if (event) {
                    const success = events.handleJoinEvent(event, () => {
                        events.renderEvents(utils.getEvents()); 
                        if (dom.eventDetailModal.style.display === 'flex') {
                            events.openEventDetail(event);
                        }
                    });
                    if (success) utils.showToast('Ви приєдналися до події!', 'success');
                }
            } else if (creatorProfile) {
                const userId = parseInt(creatorProfile.dataset.userId);
                if (userId) user.openOtherUserProfile(userId);
            } else if (card) {
                const eventId = parseInt(card.dataset.eventId);
                const event = utils.getEvents().find(e => e.eventId === eventId);
                if (event) events.openEventDetail(event);
            }
        });
    }
    if (dom.scrollLeftBtn) dom.scrollLeftBtn.addEventListener('click', () => dom.eventsHorizontalTrack.scrollBy({ left: -420, behavior: 'smooth' }));
    if (dom.scrollRightBtn) dom.scrollRightBtn.addEventListener('click', () => dom.eventsHorizontalTrack.scrollBy({ left: 420, behavior: 'smooth' }));

    // Фільтри подій
    const filterInputs = [dom.searchQueryInput, dom.locationInput, dom.categorySelect, dom.dateInput, dom.peopleSelect, dom.distanceInput, dom.sortSelect, dom.statusSelect, dom.interestSearchInput];
    filterInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => events.renderEvents(utils.getEvents()));
        }
    });
    if (dom.clearFiltersBtn) {
        dom.clearFiltersBtn.addEventListener('click', () => {
            filterInputs.forEach(input => { if(input) input.value = ''; });
            events.renderEvents(utils.getEvents());
        });
    }

    // Список людей (People)
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
    if (dom.peopleInterestFilter) {
        dom.peopleInterestFilter.addEventListener('click', (e) => {
            const tag = e.target.closest('.interest-tag');
            if (!tag) return;

            const interest = tag.dataset.interest;
            const index = user.selectedPeopleInterests.indexOf(interest);

            if (index === -1) {
                user.selectedPeopleInterests.push(interest);
            } else {
                user.selectedPeopleInterests.splice(index, 1);
            }
            user.renderPeopleInterestFilter();
            user.renderPeople();
        });
    }

    // Чат
    if (dom.chatListBtn) {
        dom.chatListBtn.addEventListener('click', () => {
            chat.renderChatList();
            utils.openModal(dom.chatListModal);
        });
    }
    if (dom.sendPrivateMessageBtn) {
        dom.sendPrivateMessageBtn.addEventListener('click', chat.sendPrivateMessage);
        dom.sendPrivateMessageBtn.addEventListener('touchstart', (e) => { e.preventDefault(); chat.sendPrivateMessage(); });
    }
    if (dom.privateChatInput) {
        dom.privateChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') chat.sendPrivateMessage();
        });
    }
    
    // Обробники для динамічних кнопок в модалках (деталі події, профіль іншого юзера)
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
    
    // Кнопки в модалці деталей події
    const joinEventBtn = document.getElementById('joinEventBtn');
    if(joinEventBtn) {
        joinEventBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (joinEventBtn.disabled) return;
            const event = JSON.parse(localStorage.getItem('currentEvent'));
            const success = events.handleJoinEvent(event, () => events.openEventDetail(event));
            if (success) {
                events.renderEvents(utils.getEvents());
                utils.showToast('Ви успішно приєдналися!', 'success');
            }
        });
    }
    
    const leaveEventBtn = document.getElementById('leaveEventBtn');
    if(leaveEventBtn) {
        leaveEventBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const event = JSON.parse(localStorage.getItem('currentEvent'));
            events.handleLeaveEvent(event, () => {
                events.openEventDetail(event);
                events.renderEvents(utils.getEvents());
            });
        });
    }

    const deleteEventBtn = document.getElementById('deleteEventBtn');
    if(deleteEventBtn) {
        deleteEventBtn.addEventListener('click', () => {
            if (confirm('Ви впевнені, що хочете видалити цю подію?')) {
                const event = JSON.parse(localStorage.getItem('currentEvent'));
                events.handleDeleteEvent(event.eventId);
            }
        });
    }

    const editEventBtn = document.getElementById('editEventBtn');
    if(editEventBtn) {
        editEventBtn.addEventListener('click', () => {
            const event = JSON.parse(localStorage.getItem('currentEvent'));
            events.openEditEventModal(event);
        });
    }

    // Модалка профілю іншого юзера
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
    
    if (dom.otherUserProfileEvents) {
        dom.otherUserProfileEvents.addEventListener('click', (e) => {
            const item = e.target.closest('.event-item');
            if (item) {
                const eventId = parseInt(item.dataset.eventId);
                const event = utils.getEvents().find(e => e.eventId === eventId);
                if (event) {
                    utils.closeModal(dom.otherUserProfileModal);
                    events.openEventDetail(event);
                }
            }
        });
    }

    // Модалка списку чатів
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

    // Модалка списку подій юзера (у власному профілі)
    if (dom.userEventsList) {
        dom.userEventsList.addEventListener('click', (e) => {
            const eventItem = e.target.closest('.event-item');
            if (!eventItem) return;
            const eventId = parseInt(eventItem.dataset.eventId);
            const event = utils.getEvents().find(e => e.eventId === eventId);
            if (event) {
                utils.closeModal(dom.profileModal);
                events.openEventDetail(event);
            }
        });
    }

    // Модалка пошуку за інтересами
    if (dom.interestSearchModal) {
        dom.interestSearchModal.addEventListener('click', (e) => {
            const eventItem = e.target.closest('.interest-modal-event-item');
            if (eventItem) {
                const eventId = parseInt(eventItem.dataset.eventId);
                const event = utils.getEvents().find(e => e.eventId === eventId);
                if (event) {
                    utils.closeModal(dom.interestSearchModal);
                    events.openEventDetail(event);
                }
                return;
            }

            const personItem = e.target.closest('.interest-modal-person-item');
            if (personItem) {
                const userId = parseInt(personItem.dataset.userId);
                if (userId) {
                    utils.closeModal(dom.interestSearchModal);
                    user.openOtherUserProfile(userId);
                }
                return;
            }
        });
    }

    // 6. Обробники закриття модалок
    const closeButtons = [
        dom.closeRegisterModal, dom.closeEventModal, dom.closeProfileModal,
        dom.closeEditProfileModal, dom.closeEventDetailModal, dom.closeEditEventModal,
        dom.closeChatListModal, dom.closePrivateChatModal, dom.closeOtherUserProfileModal,
        dom.closeInterestSearchModal
    ];

    closeButtons.forEach(btn => {
        if (!btn) return;
        const close = () => utils.closeModal(btn.closest('.modal'));
        btn.addEventListener('click', close);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); close(); });
    });

    // 7. Форма "Зв'яжіться з нами"
    if (dom.contactForm) {
        dom.contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Тут може бути логіка відправки, поки просто покажемо сповіщення
            utils.showToast('Дякуємо! Ваше повідомлення надіслано.', 'success');
            dom.contactForm.reset();
        });
    }
});