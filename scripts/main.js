import * as dom from './dom.js';
import * as utils from './utils.js';
import * as ui from './ui.js';
import * as auth from './auth.js';
import * as events from './events.js';
import * as user from './user.js';
import * as chat from './chat.js';

const socket = io('http://localhost:5000');

document.addEventListener('DOMContentLoaded', async () => {
    await utils.fetchGlobalInterests();
    
    events.initEventFilters()
    ui.updateAllInterestContainers();
    ui.loadTheme();
    ui.handleBackToTop();
    ui.setupNavigation();
    ui.initEventSteps();

    const currentUser = utils.getCurrentUser();
    let showingArchive = false;

    const allEvents = await utils.getEvents('active');
    
    if (currentUser) {
        ui.showMainApp(currentUser);
        events.renderEvents(allEvents, false);
        
        utils.getUsers().then(users => {
            const freshUser = users.find(u => u.id === currentUser.id);
            if (freshUser) {
                localStorage.setItem('currentUser', JSON.stringify(freshUser));
                ui.showMainApp(freshUser);
            }
        });

        await user.fetchMySocials();
        setupNotifications(currentUser.id);
        
        await user.renderPeople();
        await user.renderPeopleInterestFilter();
    } else {
        ui.showAuthScreen();
        auth.initAuthTabs();
        auth.initForgotPassword();
        utils.setupFormValidation(dom.loginFormInitial, auth.loginValidations);
        utils.setupFormValidation(dom.registerForm, auth.registerValidations);
    }

    utils.setupFormValidation(dom.createEventForm, events.createEventValidations);
    utils.setupFormValidation(dom.editProfileForm, user.editProfileValidations);
    utils.setupFormValidation(dom.editEventForm, events.editEventValidations);
    
    document.body.addEventListener('click', (e) => {
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

    if (dom.userSearchInput) dom.userSearchInput.addEventListener('input', user.handleUserSearch);
    if (dom.cityFilterInput) dom.cityFilterInput.addEventListener('input', () => user.renderPeople());
    if (dom.peopleInterestFilter) dom.peopleInterestFilter.addEventListener('click', user.handlePeopleInterestClick);

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

    if (dom.myFollowersBtn) {
        dom.myFollowersBtn.addEventListener('click', () => {
            const currentUser = utils.getCurrentUser();
            if(currentUser) user.openSocialList('followers', currentUser.id);
        });
    }
    if (dom.myFollowingBtn) {
        dom.myFollowingBtn.addEventListener('click', () => {
            const currentUser = utils.getCurrentUser();
            if(currentUser) user.openSocialList('following', currentUser.id);
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
    
    if (dom.scrollLeftBtn) dom.scrollLeftBtn.addEventListener('click', () => dom.eventsHorizontalTrack.scrollBy({ left: 420, behavior: 'smooth' }));
    if (dom.scrollRightBtn) dom.scrollRightBtn.addEventListener('click', () => dom.eventsHorizontalTrack.scrollBy({ left: 420, behavior: 'smooth' }));

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

async function setupNotifications(userId) {
    socket.emit('join_notifications', { userId: userId });
    
    await loadNotifications(userId);
    
    socket.on('new_notification', async (notif) => {
        utils.showToast(notif.message, 'info');
        await addNotificationToUI(notif);
        updateBadgeCount(1);
    });

    socket.on('chat_alert', (msg) => {
    const isChatOpen = dom.privateChatModal && dom.privateChatModal.classList.contains('open');
    const talkingToSender = dom.privateChatModal && (dom.privateChatModal.dataset.otherUserId == msg.senderId);
    if (isChatOpen && talkingToSender) {
        return;
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