let map;
let globalCustomInterests = JSON.parse(localStorage.getItem('globalCustomInterests') || '[]');

function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
    try {
        localStorage.setItem('users', JSON.stringify(users));
    } catch (error) {
        console.error('Помилка збереження користувачів:', error);
        showToast('Помилка збереження даних', 'error');
    }
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser'));
    } catch (error) {
        console.error('Помилка отримання поточного користувача:', error);
        return null;
    }
}

function getPrivateChats() {
    return JSON.parse(localStorage.getItem('privateChats') || '{}');
}

function savePrivateChats(chats) {
    try {
        localStorage.setItem('privateChats', JSON.stringify(chats));
    } catch (error) {
        console.error('Помилка збереження чатів:', error);
        showToast('Помилка збереження чатів', 'error');
    }
}

const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');
const loginFormInitial = document.getElementById('loginFormInitial');
const showRegisterFormLink = document.getElementById('showRegisterFormLink');
const eventsGrid = document.getElementById('eventsGrid');
const peopleGrid = document.getElementById('peopleGrid');
const createEventBtn = document.getElementById('createEventBtn');
const createEventModal = document.getElementById('createEventModal');
const closeEventModal = document.getElementById('closeEventModal');
const createEventForm = document.getElementById('createEventForm');
const registerModal = document.getElementById('registerModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');
const registerForm = document.getElementById('registerForm');
const registerInterestsContainer = document.getElementById('registerInterestsContainer');
const customInterestInput = document.getElementById('customInterestInput');
const addCustomInterestBtn = document.getElementById('addCustomInterestBtn');
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const profileModalAvatar = document.getElementById('profileModalAvatar');
const profileModalName = document.getElementById('profileModalName');
const profileModalUsername = document.getElementById('profileModalUsername');
const profileModalMeta = document.getElementById('profileModalMeta');
const profileModalInterests = document.getElementById('profileModalInterests');
const profileLogoutBtn = document.getElementById('profileLogoutBtn');
const eventDetailModal = document.getElementById('eventDetailModal');
const closeEventDetailModal = document.getElementById('closeEventDetailModal');
const themeToggle = document.querySelector('.theme-toggle');
const backToTopBtn = document.querySelector('.back-to-top');
const editProfileModal = document.getElementById('editProfileModal');
const closeEditProfileModal = document.getElementById('closeEditProfileModal');
const editProfileForm = document.getElementById('editProfileForm');
const editProfileAvatarPreview = document.getElementById('editProfileAvatarPreview');
const editProfilePhoto = document.getElementById('editProfilePhoto');
const editProfileName = document.getElementById('editProfileName');
const editProfileUsername = document.getElementById('editProfileUsername');
const editProfileAge = document.getElementById('editProfileAge');
const editProfileLocation = document.getElementById('editProfileLocation');
const editProfileInterestsContainer = document.getElementById('editProfileInterestsContainer');
const addEditCustomInterestBtn = document.getElementById('addEditCustomInterestBtn');
const editCustomInterestInput = document.getElementById('editCustomInterestInput');
const editEventModal = document.getElementById('editEventModal');
const closeEditEventModal = document.getElementById('closeEditEventModal');
const editEventForm = document.getElementById('editEventForm');
const editEventTitle = document.getElementById('editEventTitle');
const editEventDescription = document.getElementById('editEventDescription');
const editEventCategory = document.getElementById('editEventCategory');
const editEventLocation = document.getElementById('editEventLocation');
const editEventDate = document.getElementById('editEventDate');
const editEventParticipants = document.getElementById('editEventParticipants');
const editEventInterestsContainer = document.getElementById('editEventInterestsContainer');
const addEditEventCustomInterestBtn = document.getElementById('addEditEventCustomInterestBtn');
const editEventCustomInterestInput = document.getElementById('editEventCustomInterestInput');
const chatListModal = document.getElementById('chatListModal');
const closeChatListModal = document.getElementById('closeChatListModal');
const chatListBtn = document.querySelector('.chat-list-btn');
const privateChatModal = document.getElementById('privateChatModal');
const closePrivateChatModal = document.getElementById('closePrivateChatModal');
const privateChatMessages = document.getElementById('privateChatMessages');
const privateChatInput = document.getElementById('privateChatInput');
const sendPrivateMessageBtn = document.getElementById('sendPrivateMessage');
const otherUserProfileModal = document.getElementById('otherUserProfileModal');
const closeOtherUserProfileModal = document.getElementById('closeOtherUserProfileModal');
const otherUserProfileAvatar = document.getElementById('otherUserProfileAvatar');
const otherUserProfileName = document.getElementById('otherUserProfileName');
const otherUserProfileUsername = document.getElementById('otherUserProfileUsername');
const otherUserProfileMeta = document.getElementById('otherUserProfileMeta');
const otherUserProfileInterests = document.getElementById('otherUserProfileInterests');
const otherUserProfileEvents = document.getElementById('otherUserProfileEvents');
const otherUserMessageBtn = document.getElementById('otherUserMessageBtn');

let nextEventId = JSON.parse(localStorage.getItem('nextEventId') || '1');
let nextChatId = JSON.parse(localStorage.getItem('nextChatId') || '1');

function toggleTheme() {
    console.log('Toggle theme function called');
    
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    console.log('Theme toggled to:', isDark ? 'dark' : 'light');
}
function addGlobalInterest(interest) {
    interest = interest.trim();
    if (!interest || interest.length > 20) return false;
    
    const allInterests = [...defaultInterests, ...globalCustomInterests];
    if (!allInterests.includes(interest)) {
        globalCustomInterests.push(interest);
        try {
            localStorage.setItem('globalCustomInterests', JSON.stringify(globalCustomInterests));
            return true;
        } catch (error) {
            console.error('Помилка збереження інтересу:', error);
            return false;
        }
    }
    return false;
}

function loadTheme() {
    try {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    } catch (error) {
        console.error('Помилка завантаження теми:', error);
    }
}

function handleBackToTop() {
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.classList.toggle('visible', window.scrollY > 300);
            document.querySelector('header').classList.toggle('scrolled', window.scrollY > 0);
        });
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        backToTopBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offset = 80;
        const sectionPosition = section.getBoundingClientRect().top + window.pageYOffset - offset;
        
        window.scrollTo({
            top: sectionPosition,
            behavior: 'smooth'
        });
    }
}

function setupNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
        });
        menuToggle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            navLinks.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
        });
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            scrollToSection(sectionId);
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
        link.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            scrollToSection(sectionId);
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    if (chatListBtn) {
        chatListBtn.addEventListener('click', () => {
            renderChatList();
            openModal(chatListModal);
        });
        chatListBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            renderChatList();
            openModal(chatListModal);
        });
    }
}

function showMainApp(user) {
    if (authScreen && mainApp) {
        authScreen.style.display = 'none';
        mainApp.style.display = 'block';
    }
    const profileUsername = document.getElementById('profileUsername');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileDisplay = document.getElementById('profileDisplay');
    const profileLink = document.getElementById('profileLink');
    if (profileUsername) profileUsername.textContent = `@${user.username}`;
    if (profileAvatar) profileAvatar.src = user.avatarBase64 || 'https://via.placeholder.com/48?text=@';
    if (profileDisplay) profileDisplay.style.display = 'flex';
    if (profileLink) profileLink.classList.add('hidden');
    renderEvents(JSON.parse(localStorage.getItem('events') || '[]'));
    renderPeople();
    renderPeopleInterestFilter();
}

function showAuthScreen() {
    if (mainApp && authScreen) {
        mainApp.style.display = 'none';
        authScreen.style.display = 'flex';
    }
    const profileDisplay = document.getElementById('profileDisplay');
    const profileLink = document.getElementById('profileLink');
    if (profileDisplay) profileDisplay.style.display = 'none';
    if (profileLink) profileLink.classList.remove('hidden');
}

function formatEventDate(dateTime) {
    const date = new Date(dateTime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const options = isToday 
        ? { hour: '2-digit', minute: '2-digit', hour12: false }
        : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
    return date.toLocaleString('uk-UA', options) + (isToday ? ' (сьогодні)' : '');
}

function formatTime() {
    return new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

async function fileToBase64(file) {
    try {
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('Помилка конвертації файлу:', error);
        showToast('Помилка завантаження зображення', 'error');
        return null;
    }
}

function validateInput(input, errorElement, validationFn, errorMessage) {
    if (!input || !errorElement) return false;
    const isValid = validationFn(input.value);
    input.classList.toggle('invalid', !isValid);
    errorElement.style.display = isValid ? 'none' : 'block';
    errorElement.textContent = isValid ? '' : errorMessage;
    return isValid;
}

function setupFormValidation(form, fields) {
    if (!form) return;
    fields.forEach(({ inputId, errorId, validationFn, errorMessage }) => {
        const input = form.querySelector(`#${inputId}`);
        const error = form.querySelector(`#${errorId}`);
        if (input && error) {
            input.addEventListener('input', () => validateInput(input, error, validationFn, errorMessage));
        }
    });
}

function handleJoinEvent(event, callback) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Будь ласка, увійдіть у систему', 'info');
        return false;
    }

    let joinedEvents = JSON.parse(localStorage.getItem('joinedEvents') || '{}');
    if (!joinedEvents[user.id]) joinedEvents[user.id] = [];

    if (joinedEvents[user.id].includes(event.eventId)) {
        showToast('Ви вже приєдналися до події', 'info');
        return false;
    }
    if (event.currentParticipants >= event.participants) {
        showToast('Подія вже заповнена', 'error');
        return false;
    }

    event.currentParticipants++;
    joinedEvents[user.id].push(event.eventId);
    localStorage.setItem('joinedEvents', JSON.stringify(joinedEvents));

    const allEvents = JSON.parse(localStorage.getItem('events') || '[]');
    const idx = allEvents.findIndex(e => e.eventId === event.eventId);
    if (idx !== -1) {
        allEvents[idx] = event;
        localStorage.setItem('events', JSON.stringify(allEvents));
    }

    if (callback) callback();
    return true;
}

function handleLeaveEvent(event, callback) {
    const user = getCurrentUser();
    if (!user || user.id === event.creatorId) {
        showToast('Організатор не може покинути подію', 'error');
        return;
    }

    let joinedEvents = JSON.parse(localStorage.getItem('joinedEvents') || '{}');
    if (!joinedEvents[user.id]?.includes(event.eventId)) {
        showToast('Ви не є учасником цієї події', 'info');
        return;
    }

    event.currentParticipants = Math.max(1, event.currentParticipants - 1);
    joinedEvents[user.id] = joinedEvents[user.id].filter(id => id !== event.eventId);
    if (joinedEvents[user.id].length === 0) delete joinedEvents[user.id];
    localStorage.setItem('joinedEvents', JSON.stringify(joinedEvents));

    const allEvents = JSON.parse(localStorage.getItem('events') || '[]');
    const idx = allEvents.findIndex(e => e.eventId === event.eventId);
    if (idx !== -1) {
        allEvents[idx] = event;
        localStorage.setItem('events', JSON.stringify(allEvents));
    }

    if (callback) callback();
    showToast('Ви покинули подію', 'info');
}

function handleDeleteEvent(eventId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Увійдіть, щоб видалити подію', 'error');
        return;
    }

    let events = JSON.parse(localStorage.getItem('events') || '[]');
    const event = events.find(e => e.eventId === eventId);
    if (!event || event.creatorId !== user.id) {
        showToast('Ви не можете видалити цю подію', 'error');
        return;
    }

    events = events.filter(e => e.eventId !== eventId);
    localStorage.setItem('events', JSON.stringify(events));

    let joinedEvents = JSON.parse(localStorage.getItem('joinedEvents') || '{}');
    Object.keys(joinedEvents).forEach(userId => {
        joinedEvents[userId] = joinedEvents[userId].filter(id => id !== eventId);
        if (joinedEvents[userId].length === 0) delete joinedEvents[userId];
    });
    localStorage.setItem('joinedEvents', JSON.stringify(joinedEvents));

    localStorage.removeItem(`eventChat_${eventId}`);
    showToast('Подію видалено', 'success');
    renderEvents(events);
    if (eventDetailModal) closeModal(eventDetailModal);
}

function filterEvents(events) {
    const query = document.getElementById('searchQueryInput')?.value.toLowerCase().trim() || '';
    const loc = document.getElementById('locationInput')?.value.toLowerCase().trim() || '';
    const cat = document.getElementById('categorySelect')?.value || '';
    const date = document.getElementById('dateInput')?.value || '';
    const range = document.getElementById('peopleSelect')?.value || '';
    const distance = parseInt(document.getElementById('distanceInput')?.value) || 0;
    const sort = document.getElementById('sortSelect')?.value || '';
    const status = document.getElementById('statusSelect')?.value || '';
    const interest = document.getElementById('interestSearchInput')?.value.toLowerCase().trim() || '';

    let filtered = events.filter(e => {
        const matchesQuery = !query || e.title.toLowerCase().includes(query) || e.description.toLowerCase().includes(query);
        const matchesLoc = !loc || e.location.toLowerCase().includes(loc);
        const matchesCat = !cat || e.category === cat;
        const matchesDate = !date || e.date.startsWith(date);
        const matchesRange = !range || {
            '1-5': e.participants >= 1 && e.participants <= 5,
            '5-10': e.participants >= 5 && e.participants <= 10,
            '10+': e.participants >= 10
        }[range];
        const matchesStatus = !status || (status === 'open' ? e.currentParticipants < e.participants : status === 'full' ? e.currentParticipants >= e.participants : true);
        const matchesInterest = !interest || e.interests.some(i => i.toLowerCase().includes(interest));
        const matchesDistance = distance === 0 || true;

        return matchesQuery && matchesLoc && matchesCat && matchesDate && matchesRange && matchesStatus && matchesInterest && matchesDistance;
    });

    filtered.sort((a, b) => {
        switch (sort) {
            case 'date-asc': return new Date(a.date) - new Date(b.date);
            case 'date-desc': return new Date(b.date) - new Date(a.date);
            case 'participants-asc': return a.participants - b.participants;
            case 'participants-desc': return b.participants - a.participants;
            case 'title': return a.title.localeCompare(b.title);
            default: return 0;
        }
    });

    return filtered;
}

function loadEventChat(eventId) {
    const chatData = JSON.parse(localStorage.getItem(`eventChat_${eventId}`) || '[]');
    const messagesContainer = document.getElementById('eventChatMessages');
    if (!messagesContainer) return;
    messagesContainer.innerHTML = '';
    chatData.forEach(msg => {
        if (!msg.sender || !msg.text || !msg.time) return;
        const div = document.createElement('div');
        div.className = 'chat-message';
        div.innerHTML = `
            <div><span class="sender">${msg.sender}</span> <span class="time">${msg.time}</span></div>
            <div class="text">${msg.text}</div>
        `;
        messagesContainer.appendChild(div);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const newMessageIndicator = document.getElementById('newMessageIndicator');
    if (newMessageIndicator) {
        messagesContainer.addEventListener('scroll', () => {
            const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 10;
            newMessageIndicator.style.display = isAtBottom ? 'none' : 'block';
        });
    }
}

function sendChatMessage(eventId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Увійдіть, щоб надіслати повідомлення', 'error');
        return;
    }
    
    const input = document.getElementById('contactInput');
    if (!input) {
        console.error('Поле вводу чату не знайдено');
        return;
    }
    
    const text = input.value.trim();
    if (!text) {
        showToast('Введіть повідомлення', 'error');
        return;
    }

    const chatData = JSON.parse(localStorage.getItem(`eventChat_${eventId}`) || '[]');
    chatData.push({
        sender: user.username,
        text: text,
        time: formatTime(),
        timestamp: Date.now()
    });
    
    try {
        localStorage.setItem(`eventChat_${eventId}`, JSON.stringify(chatData));
        input.value = '';
        loadEventChat(eventId);
        showToast('Повідомлення надіслано', 'success');
    } catch (error) {
        console.error('Помилка збереження повідомлення:', error);
        showToast('Помилка надсилання повідомлення', 'error');
    }
}

function getChatId(user1Id, user2Id) {
    return [user1Id, user2Id].sort().join('_');
}

function loadPrivateChat(otherUserId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Увійдіть, щоб переглядати чати', 'error');
        return;
    }

    const chatId = getChatId(user.id, otherUserId);
    const chats = getPrivateChats();
    const chatData = chats[chatId] || [];
    if (privateChatMessages) {
        privateChatMessages.innerHTML = '';

        chatData.forEach(msg => {
            if (!msg.senderId || !msg.text || !msg.time) return;
            const div = document.createElement('div');
            div.className = `chat-message ${msg.senderId === user.id ? 'sent' : 'received'}`;
            div.innerHTML = `
                <span class="text">${msg.text}</span>
                <span class="time">${msg.time}</span>
            `;
            privateChatMessages.appendChild(div);
        });
        privateChatMessages.scrollTop = privateChatMessages.scrollHeight;

        const otherUser = getUsers().find(u => u.id === otherUserId);
        const privateChatTitle = document.getElementById('privateChatTitle');
        if (privateChatTitle) {
            privateChatTitle.textContent = otherUser ? `@${otherUser.username}` : 'Чат';
        }

        if (privateChatModal) privateChatModal.dataset.otherUserId = otherUserId;
    }
}

function sendPrivateMessage() {
    const user = getCurrentUser();
    if (!user) {
        showToast('Увійдіть, щоб надіслати повідомлення', 'error');
        return;
    }

    const otherUserId = parseInt(privateChatModal?.dataset.otherUserId);
    if (!otherUserId) {
        showToast('Помилка: користувача не вибрано', 'error');
        return;
    }

    const text = privateChatInput?.value.trim();
    if (!text) {
        showToast('Введіть повідомлення', 'error');
        return;
    }

    const chatId = getChatId(user.id, otherUserId);
    const chats = getPrivateChats();
    if (!chats[chatId]) chats[chatId] = [];

    chats[chatId].push({
        senderId: user.id,
        text,
        time: formatTime(),
        timestamp: Date.now()
    });

    try {
        savePrivateChats(chats);
        if (privateChatInput) privateChatInput.value = '';
        loadPrivateChat(otherUserId);
        showToast('Повідомлення надіслано', 'success');
    } catch (error) {
        console.error('Помилка надсилання повідомлення:', error);
        showToast('Помилка надсилання повідомлення', 'error');
    }
}

function renderChatList() {
    const user = getCurrentUser();
    if (!user) {
        showToast('Увійдіть, щоб переглядати чати', 'error');
        return;
    }

    const chatList = document.getElementById('chatList');
    if (!chatList) return;
    chatList.innerHTML = '';

    const chats = getPrivateChats();
    const users = getUsers();
    const userChats = Object.keys(chats)
        .filter(chatId => chatId.includes(user.id))
        .map(chatId => {
            const [user1Id, user2Id] = chatId.split('_').map(Number);
            const otherUserId = user1Id === user.id ? user2Id : user1Id;
            const otherUser = users.find(u => u.id === otherUserId);
            if (!otherUser) return null;

            const messages = chats[chatId] || [];
            const lastMessage = messages[messages.length - 1] || { text: 'Немає повідомлень', time: '' };
            return { chatId, otherUser, lastMessage };
        })
        .filter(chat => chat !== null)
        .sort((a, b) => (b.lastMessage.timestamp || 0) - (a.lastMessage.timestamp || 0));

    if (userChats.length === 0) {
        chatList.innerHTML = '<p style="text-align: center; color: #888;">У вас ще немає чатів.</p>';
        return;
    }

    userChats.forEach(({ chatId, otherUser, lastMessage }) => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.dataset.userId = otherUser.id;
        chatItem.innerHTML = `
            <img src="${otherUser.avatarBase64 || 'https://via.placeholder.com/40?text=' + otherUser.username[0]}" 
                alt="${otherUser.name}" 
                loading="lazy">
            <div class="chat-info">
                <div class="username">@${otherUser.username}</div>
                <div class="last-message">${lastMessage.text}</div>
            </div>
            <div class="time">${lastMessage.time}</div>
        `;
        chatList.appendChild(chatItem);
    });

    chatList.addEventListener('click', (e) => {
        const chatItem = e.target.closest('.chat-item');
        if (!chatItem) return;
        const userId = parseInt(chatItem.dataset.userId);
        closeModal(chatListModal);
        loadPrivateChat(userId);
        openModal(privateChatModal);
    });

    chatList.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const chatItem = e.target.closest('.chat-item');
        if (!chatItem) return;
        const userId = parseInt(chatItem.dataset.userId);
        closeModal(chatListModal);
        loadPrivateChat(userId);
        openModal(privateChatModal);
    });
}

function openOtherUserProfile(userId) {
    const user = getCurrentUser();
    const otherUser = getUsers().find(u => u.id === userId);
    if (!otherUser) {
        showToast('Користувача не знайдено', 'error');
        return;
    }

    if (otherUserProfileAvatar) otherUserProfileAvatar.src = otherUser.avatarBase64 || 'https://via.placeholder.com/100?text=@';
    if (otherUserProfileName) otherUserProfileName.textContent = otherUser.name;
    if (otherUserProfileUsername) otherUserProfileUsername.textContent = `@${otherUser.username}`;
    if (otherUserProfileMeta) otherUserProfileMeta.textContent = `${otherUser.location} · ${otherUser.age} років`;
    if (otherUserProfileInterests) otherUserProfileInterests.innerHTML = otherUser.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');

    if (otherUserProfileEvents) {
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        const joinedEvents = JSON.parse(localStorage.getItem('joinedEvents') || '{}');
        const userEvents = events.filter(e => e.creatorId === otherUser.id || (joinedEvents[otherUser.id] || []).includes(e.eventId));

        otherUserProfileEvents.innerHTML = userEvents.length === 0
            ? '<p style="color: #888; font-style: italic;">Користувач ще не приєднався до подій.</p>'
            : userEvents.map(event => `
                <div class="event-item" data-event-id="${event.eventId}" style="padding: 8px; border-bottom: 1px solid #e0e0e0; cursor: pointer;">
                    <div style="font-weight: 600; font-size: 0.9em;">${event.title}</div>
                    <div style="font-size: 0.75em; color: #666;">${formatEventDate(event.date)}</div>
                </div>
            `).join('');

        otherUserProfileEvents.querySelectorAll('.event-item').forEach(item => {
            item.addEventListener('click', () => {
                const eventId = parseInt(item.dataset.eventId);
                const event = events.find(e => e.eventId === eventId);
                if (event) {
                    closeModal(otherUserProfileModal);
                    openEventDetail(event);
                }
            });
            item.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const eventId = parseInt(item.dataset.eventId);
                const event = events.find(e => e.eventId === eventId);
                if (event) {
                    closeModal(otherUserProfileModal);
                    openEventDetail(event);
                }
            });
        });
    }

    if (otherUserMessageBtn) {
        otherUserMessageBtn.disabled = user && user.id === otherUser.id;
        otherUserMessageBtn.textContent = user && user.id === otherUser.id ? 'Це ви' : 'Написати';
        otherUserMessageBtn.onclick = () => {
            if (user && user.id !== otherUser.id) {
                closeModal(otherUserProfileModal);
                loadPrivateChat(otherUser.id);
                openModal(privateChatModal);
            }
        };
        otherUserMessageBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (user && user.id !== otherUser.id) {
                closeModal(otherUserProfileModal);
                loadPrivateChat(otherUser.id);
                openModal(privateChatModal);
            }
        });
    }

    openModal(otherUserProfileModal);
}

function renderEvents(events) {
    const track = document.getElementById('eventsHorizontalTrack');
    const eventCount = document.getElementById('eventCount');
    if (!track || !eventCount) return;

    track.innerHTML = '';
    const filteredEvents = filterEvents(events).sort((a, b) => b.eventId - a.eventId);
    eventCount.textContent = `(${filteredEvents.length})`;

    if (filteredEvents.length === 0) {
        track.innerHTML = '<p style="color: #888; padding: 15px; text-align: center; width: 100%;">Подій немає. Створіть першу!</p>';
        return;
    }

    const user = getCurrentUser();
    const joinedEvents = JSON.parse(localStorage.getItem('joinedEvents') || '{}');
    const userJoined = user ? (joinedEvents[user.id] || []) : [];
    const users = getUsers();

    filteredEvents.forEach(event => {
        const creator = users.find(u => u.id === event.creatorId) || { name: 'Невідомий', username: '?', avatarBase64: 'https://via.placeholder.com/40?text=?' };
        const isJoined = user && userJoined.includes(event.eventId);
        const isFull = event.currentParticipants >= event.participants;
        const isCreator = user && event.creatorId === user.id;

        const card = document.createElement('div');
        card.className = 'event-card-horizontal';
        card.dataset.eventId = event.eventId;
        const interestsHtml = event.interests
            .map(i => `<span class="interest-tag selected">${i}</span>`)
            .join('');
        let buttonHtml;
        if (isCreator) {
            buttonHtml = `
                <button class="card-action-button card-action-organizer" disabled>
                    <i class="fas fa-crown"></i> Ви організатор
                </button>
            `;
        } else if (isJoined) {
            buttonHtml = `
                <button class="card-action-button" disabled>
                    <i class="fas fa-check"></i> Приєднано
                </button>
            `;
        } else if (isFull) {
            buttonHtml = `
                <button class="card-action-button" disabled>
                    <i class="fas fa-times-circle"></i> Подія повна
                </button>
            `;
        } else {
            buttonHtml = `
                <button class="card-action-button join-btn-v4" data-event-id="${event.eventId}">
                    <i class="fas fa-plus"></i> Приєднатися
                </button>
            `;
        }
        card.innerHTML = `
            <div class="card-content-v4">
                <h3 class="card-title-v4">${event.title}</h3>
                
                <ul class="card-meta-list-v4">
                    <li class="meta-item-v4">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${formatEventDate(event.date)}</span>
                    </li>
                    <li class="meta-item-v4">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.location}</span>
                    </li>
                </ul>
                
                <div class="card-interests-v4">
                    ${interestsHtml || '<span class="interest-tag">немає тегів</span>'}
                </div>
                
                <div class="card-footer-v4">
                    <div class="creator-info-v4" data-user-id="${creator.id}">
                        <img src="${creator.avatarBase64}" alt="${creator.name}" loading="lazy">
                        <span>@${creator.username}</span>
                    </div>
                    <span class="card-participants-v4">
                        <i class="fas fa-users"></i>
                        ${event.currentParticipants}/${event.participants}
                    </span>
                </div>
            </div>
            
            ${buttonHtml}
        `;

        track.appendChild(card);
    });


    track.addEventListener('click', (e) => {
        const card = e.target.closest('.event-card-horizontal');
        if (!card || e.target.closest('.join-btn-v4') || e.target.closest('.creator-info-v4')) return;
        
        const eventId = parseInt(card.dataset.eventId);
        const event = events.find(e => e.eventId === eventId);
        if (event) openEventDetail(event);
    });

    track.addEventListener('click', (e) => {
        const joinBtn = e.target.closest('.join-btn-v4');
        if (joinBtn) {
            const eventId = parseInt(joinBtn.dataset.eventId);
            const event = events.find(e => e.eventId === eventId);
            if (event) {
                const success = handleJoinEvent(event, () => {
                    renderEvents(events); 
                    if (eventDetailModal.style.display === 'flex') {
                        openEventDetail(event);
                    }
                });
                if (success) {
                    showToast('Ви приєдналися до події!', 'success');
                }
            }
        }
        const creatorProfile = e.target.closest('.creator-info-v4');
        if (creatorProfile) {
            const userId = parseInt(creatorProfile.dataset.userId);
            if (userId) {
                openOtherUserProfile(userId);
            }
        }
        const deleteBtn = e.target.closest('.delete-btn-v4'); 
        if (deleteBtn) {
            const eventId = parseInt(deleteBtn.dataset.eventId);
            if (confirm('Ви впевнені, що хочете видалити цю подію?')) {
                handleDeleteEvent(eventId);
            }
        }
    });
    const leftBtn = document.getElementById('scrollLeftBtn');
    const rightBtn = document.getElementById('scrollRightBtn');
    if (leftBtn && rightBtn) {
        
        const updateScrollButtons = () => {
            const canScrollLeft = track.scrollLeft > 10;
            const canScrollRight = track.scrollLeft < (track.scrollWidth - track.clientWidth - 10);

            leftBtn.disabled = !canScrollLeft;
            rightBtn.disabled = !canScrollRight;
        };

        leftBtn.addEventListener('click', () => {
            track.scrollBy({ left: -420, behavior: 'smooth' }); 
        });
        rightBtn.addEventListener('click', () => {
            track.scrollBy({ left: 420, behavior: 'smooth' });
        });

        track.addEventListener('scroll', updateScrollButtons);
        setTimeout(updateScrollButtons, 500); 
    }
}

let selectedPeopleInterests = [];

function renderPeopleInterestFilter() {
    const users = getUsers();
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const sameCityUsers = users.filter(u => 
        u.location.toLowerCase() === currentUser.location.toLowerCase() && u.id !== currentUser.id
    );

    const allInterests = [...new Set(sameCityUsers.flatMap(u => u.interests))].sort();
    const container = document.getElementById('peopleInterestFilter');
    const clearBtn = document.getElementById('clearPeopleFilter');

    if (!container) return;

    if (clearBtn) {
        clearBtn.classList.toggle('hidden', selectedPeopleInterests.length === 0);
    }

    container.innerHTML = allInterests.map(interest => `
        <span class="interest-tag ${selectedPeopleInterests.includes(interest) ? 'selected' : ''}" 
        data-interest="${interest}">${interest}</span>
    `).join('');

    container.onclick = (e) => {
        const tag = e.target.closest('.interest-tag');
        if (!tag) return;

        const interest = tag.dataset.interest;
        const index = selectedPeopleInterests.indexOf(interest);

        if (index === -1) {
            selectedPeopleInterests.push(interest);
        } else {
            selectedPeopleInterests.splice(index, 1);
        }

        renderPeopleInterestFilter();
        renderPeople();
    };

    if (clearBtn) {
        clearBtn.onclick = () => {
            selectedPeopleInterests = [];
            renderPeopleInterestFilter();
            renderPeople();
        };
    }
}

function renderPeople() {
    const peopleGrid = document.getElementById('peopleGrid');
    if (!peopleGrid) return;

    peopleGrid.innerHTML = '';
    const users = getUsers();
    const currentUser = getCurrentUser();

    if (!currentUser) {
        peopleGrid.innerHTML = '<p>Увійдіть, щоб бачити людей з вашого міста.</p>';
        return;
    }

    let filtered = users.filter(u => 
        u.location.toLowerCase() === currentUser.location.toLowerCase() && u.id !== currentUser.id
    );

    if (selectedPeopleInterests.length > 0) {
        filtered = filtered.filter(u => 
            u.interests.some(i => selectedPeopleInterests.includes(i))
        );
    }

    if (filtered.length === 0) {
        const msg = selectedPeopleInterests.length > 0
            ? 'Нікого не знайдено за вибраними інтересами.'
            : 'У вашому місті ще немає інших користувачів.';
        peopleGrid.innerHTML = `<p>${msg}</p>`;
        return;
    }

    filtered.forEach(person => {
        const card = document.createElement('div');
        card.className = 'card people-card';
        card.dataset.userId = person.id;

        const interestsHtml = person.interests
            .map(i => `<span class="interest-tag selected">${i}</span>`)
            .join('');

        card.innerHTML = `
            <div class="people-card-header">
                <img src="${person.avatarBase64 || 'https://via.placeholder.com/60?text=' + person.username[0]}"
                    alt="${person.name}" loading="lazy">
                <div>
                    <h3>@${person.username}</h3>
                    <p>${person.age} років</p>
                </div>
            </div>
            <div class="interests">${interestsHtml}</div>
            <div class="card-actions">
                <button class="btn btn-outline btn-sm message-btn">Написати</button>
            </div>
        `;

        peopleGrid.appendChild(card);
    });
    peopleGrid.onclick = (e) => {
        if (e.target.closest('.message-btn')) return;
        const card = e.target.closest('.people-card');
        if (card) {
            openOtherUserProfile(parseInt(card.dataset.userId));
        }
    };
    peopleGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.message-btn');
        if (btn) {
            const card = btn.closest('.people-card');
            if (card) {
                loadPrivateChat(parseInt(card.dataset.userId));
                openModal(privateChatModal);
            }
        }
    });
}
function renderUserEvents(user) {
    const userEventsList = document.getElementById('userEventsList');
    if (!userEventsList) return;
    userEventsList.innerHTML = '';

    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const userEvents = events.filter(e => e.creatorId === user.id || (JSON.parse(localStorage.getItem('joinedEvents') || '{}')[user.id] || []).includes(e.eventId));

    if (userEvents.length === 0) {
        userEventsList.innerHTML = '<p style="color: #888; font-style: italic;">Ви ще не приєдналися до подій.</p>';
        return;
    }

    userEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        eventItem.dataset.eventId = event.eventId;
        eventItem.style.padding = '8px';
        eventItem.style.borderBottom = '1px solid #e0e0e0';
        eventItem.style.cursor = 'pointer';
        eventItem.innerHTML = `
            <div style="font-weight: 600; font-size: 0.9em;">${event.title}</div>
            <div style="font-size: 0.75em; color: #666;">${formatEventDate(event.date)}</div>
        `;
        userEventsList.appendChild(eventItem);
    });

    userEventsList.addEventListener('click', (e) => {
        const eventItem = e.target.closest('.event-item');
        if (!eventItem) return;
        const eventId = parseInt(eventItem.dataset.eventId);
        const event = events.find(e => e.eventId === eventId);
        if (event) {
            closeModal(profileModal);
            openEventDetail(event);
        }
    });

    userEventsList.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const eventItem = e.target.closest('.event-item');
        if (!eventItem) return;
        const eventId = parseInt(eventItem.dataset.eventId);
        const event = events.find(e => e.eventId === eventId);
        if (event) {
            closeModal(profileModal);
            openEventDetail(event);
        }
    });
}

function openEventDetail(event) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Увійдіть, щоб переглянути деталі', 'error');
        return;
    }

    eventDetailModal.dataset.currentEventId = event.eventId;
    localStorage.setItem('currentEvent', JSON.stringify(event));

    const users = getUsers();
    const creator = users.find(u => u.id === event.creatorId) || { name: 'Невідомий', avatarBase64: 'https://via.placeholder.com/40?text=?' };

    const eventDetailTitle = document.getElementById('eventDetailTitle');
    const eventDetailMeta = document.getElementById('eventDetailMeta');
    const eventDetailDescription = document.getElementById('eventDetailDescription');
    const eventDetailInterests = document.getElementById('eventDetailInterests');
    const eventDetailParticipantsCount = document.getElementById('eventDetailParticipantsCount');
    
    if (eventDetailTitle) eventDetailTitle.textContent = event.title;
    if (eventDetailMeta) {
        eventDetailMeta.innerHTML = `
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 0.85em;">
                <img src="${creator.avatarBase64}" alt="${creator.name}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" loading="lazy">
                <span>Створив: <strong>${creator.name}</strong></span>
            </div>
            <div style="font-size: 0.9em; color: #666;">
                ${event.location} | ${formatEventDate(event.date)}
            </div>
        `;
    }
    if (eventDetailDescription) eventDetailDescription.textContent = event.description;
    if (eventDetailInterests) eventDetailInterests.innerHTML = event.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');
    if (eventDetailParticipantsCount) eventDetailParticipantsCount.textContent = `${event.currentParticipants}/${event.participants} учасників`;

    const participantsContainer = document.getElementById('eventDetailParticipants');
    if (participantsContainer) {
        participantsContainer.innerHTML = '';

        const joinedEvents = JSON.parse(localStorage.getItem('joinedEvents') || '{}');
        const participantIds = Object.entries(joinedEvents)
            .filter(([_, events]) => events.includes(event.eventId))
            .map(([userId]) => parseInt(userId));

        if (!participantIds.includes(event.creatorId)) {
            participantIds.push(event.creatorId);
        }

        const participants = users.filter(u => participantIds.includes(u.id));
        if (participants.length === 0) {
            participantsContainer.innerHTML = '<p style="color: #888; font-style: italic;">Поки ніхто не приєднався.</p>';
        } else {
            participants.forEach(p => {
                const div = document.createElement('div');
                div.className = 'participant';
                div.dataset.userId = p.id;
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.gap = '8px';
                div.style.cursor = 'pointer';
                div.innerHTML = `
                    <img src="${p.avatarBase64 || 'https://via.placeholder.com/40?text=' + p.username[0]}" 
                        style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" loading="lazy">
                    <div>
                        <div style="font-weight: 600; font-size: 0.9em;">${p.name}</div>
                        <div style="font-size: 0.75em; color: #666;">${p.location}</div>
                    </div>
                `;
                participantsContainer.appendChild(div);
            });

            participantsContainer.addEventListener('click', (e) => {
                const participant = e.target.closest('.participant');
                if (!participant) return;
                const userId = parseInt(participant.dataset.userId);
                closeModal(eventDetailModal);
                openOtherUserProfile(userId);
            });

            participantsContainer.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const participant = e.target.closest('.participant');
                if (!participant) return;
                const userId = parseInt(participant.dataset.userId);
                closeModal(eventDetailModal);
                openOtherUserProfile(userId);
            });
        }
    }

    const mapContainer = document.getElementById('eventMap');
    if (mapContainer) {
        mapContainer.innerHTML = '';
        if (map) {
            map.off();
            map.remove();
            map = null;
        }

        const address = encodeURIComponent(event.location);
        fetch(`https://nominatim.openstreetmap.org/search?q=${address}&format=json&limit=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    map = L.map(mapContainer, { zoomControl: true }).setView([lat, lon], 15);
                    const tileUrl = document.body.classList.contains('dark-theme')
                        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                    const attribution = document.body.classList.contains('dark-theme')
                        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> & <a href="https://carto.com/attributions">CARTO</a>'
                        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
                    L.tileLayer(tileUrl, {
                        attribution: attribution,
                        maxZoom: 19,
                    }).addTo(map);
                    const marker = L.marker([lat, lon]).addTo(map)
                        .bindPopup(`<b>${event.title}</b><br>${event.location}`);
                    marker.openPopup();
                    setTimeout(() => {
                        if (map) {
                            map.invalidateSize();
                        }
                    }, 300);
                } else {
                    mapContainer.innerHTML = '<div style="height: 100%; display: flex; align-items: center; justify-content: center; color: #dc3545; font-size: 0.9rem;">Не вдалося знайти місце</div>';
                }
            })
            .catch(error => {
                console.error('Помилка геокодування:', error);
                mapContainer.innerHTML = '<div style="height: 100%; display: flex; align-items: center; justify-content: center; color: #dc3545; font-size: 0.9rem;">Помилка завантаження карти</div>';
            });
    }

    loadEventChat(event.eventId);

    const joinBtn = document.getElementById('joinEventBtn');
    const leaveBtn = document.getElementById('leaveEventBtn');
    const deleteBtn = document.getElementById('deleteEventBtn');
    const editBtn = document.getElementById('editEventBtn');
    const actionsContainer = document.getElementById('eventDetailActions');

    if (joinBtn && leaveBtn && deleteBtn && editBtn && actionsContainer) {
        if (user.id === event.creatorId) {
            joinBtn.style.display = 'none';
            leaveBtn.style.display = 'none';
            deleteBtn.style.display = 'inline-block';
            editBtn.style.display = 'inline-block';
            actionsContainer.innerHTML = `
                <p style="color: var(--main-accent-color); font-weight: 600; text-align: center; margin: 12px 0;">
                    Ви організатор цієї події
                </p>
            `;
        } else {
            const isJoined = (JSON.parse(localStorage.getItem('joinedEvents') || '{}')[user.id] || []).includes(event.eventId);
            const isFull = event.currentParticipants >= event.participants;

            if (isJoined) {
                joinBtn.style.display = 'none';
                leaveBtn.style.display = 'inline-block';
                deleteBtn.style.display = 'none';
                editBtn.style.display = 'none';
            } else if (isFull) {
                joinBtn.textContent = 'Повна';
                joinBtn.disabled = true;
                joinBtn.style.display = 'inline-block';
                leaveBtn.style.display = 'none';
                deleteBtn.style.display = 'none';
                editBtn.style.display = 'none';
            } else {
                joinBtn.textContent = 'Приєднатися';
                joinBtn.disabled = false;
                joinBtn.style.display = 'inline-block';
                leaveBtn.style.display = 'none';
                deleteBtn.style.display = 'none';
                editBtn.style.display = 'none';
            }

            actionsContainer.innerHTML = '';
            actionsContainer.appendChild(joinBtn);
            actionsContainer.appendChild(leaveBtn);
        }

        joinBtn.onclick = (e) => {
            e.stopPropagation();
            if (joinBtn.disabled) return;
            const success = handleJoinEvent(event, () => openEventDetail(event));
            if (success) {
                renderEvents(JSON.parse(localStorage.getItem('events') || '[]'));
                showToast('Ви успішно приєдналися!', 'success');
            }
        };
        joinBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (joinBtn.disabled) return;
            const success = handleJoinEvent(event, () => openEventDetail(event));
            if (success) {
                renderEvents(JSON.parse(localStorage.getItem('events') || '[]'));
                showToast('Ви успішно приєдналися!', 'success');
            }
        });

        leaveBtn.onclick = (e) => {
            e.stopPropagation();
            handleLeaveEvent(event, () => {
                openEventDetail(event);
                renderEvents(JSON.parse(localStorage.getItem('events') || '[]'));
            });
        };
        leaveBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleLeaveEvent(event, () => {
                openEventDetail(event);
                renderEvents(JSON.parse(localStorage.getItem('events') || '[]'));
            });
        });

        deleteBtn.onclick = () => {
            if (confirm('Ви впевнені, що хочете видалити цю подію?')) {
                handleDeleteEvent(event.eventId);
            }
        };
        deleteBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (confirm('Ви впевнені, що хочете видалити цю подію?')) {
                handleDeleteEvent(event.eventId);
            }
        });

        editBtn.onclick = () => {
            openEditEventModal(event);
        };
        editBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            openEditEventModal(event);
        });
    }

    const sendChatMessageBtn = document.getElementById('sendChatMessage');
    if (sendChatMessageBtn) {
        sendChatMessageBtn.replaceWith(sendChatMessageBtn.cloneNode(true));
        
        const newSendBtn = document.getElementById('sendChatMessage');
        newSendBtn.onclick = () => {
            const eventId = parseInt(eventDetailModal.dataset.currentEventId);
            if (eventId) {
                sendChatMessage(eventId);
            } else {
                showToast('Помилка: подія не визначена', 'error');
            }
        };
        
        newSendBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const eventId = parseInt(eventDetailModal.dataset.currentEventId);
            if (eventId) {
                sendChatMessage(eventId);
            }
        });
    }
    const chatInput = document.getElementById('contactInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const eventId = parseInt(eventDetailModal.dataset.currentEventId);
                if (eventId) {
                    sendChatMessage(eventId);
                }
            }
        });
    }

    openModal(eventDetailModal);
}

function openModal(modal) {
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('open');
        if (modal.id === 'eventDetailModal' && map) {
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 300);
        }
        if (modal.id === 'privateChatModal' && privateChatMessages) {
            privateChatMessages.scrollTop = privateChatMessages.scrollHeight;
        }
    }, 10);
    modal.focus();
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(() => {
        modal.style.display = 'none';
        if (modal.id === 'eventDetailModal' && map) {
            map.off();
            map.remove();
            map = null;
        }
    }, 300);
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type} show`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(-15px)';
    }, 10);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

const loginValidations = [
    { inputId: 'loginEmailInitial', errorId: 'loginEmailErrorInitial', validationFn: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), errorMessage: 'Введіть коректну пошту' },
    { inputId: 'loginPasswordInitial', errorId: 'loginPasswordErrorInitial', validationFn: v => v.length >= 6, errorMessage: 'Пароль: від 6 символів' }
];

if (loginFormInitial) setupFormValidation(loginFormInitial, loginValidations);

if (loginFormInitial) {
    loginFormInitial.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmailInitial')?.value.trim().toLowerCase();
        const password = document.getElementById('loginPasswordInitial')?.value;
        if (!email || !password) {
            showToast('Заповніть усі поля', 'error');
            return;
        }
        const user = getUsers().find(u => u.email === email && u.password === password);
        if (!user) {
            showToast('Невірна пошта або пароль', 'error');
            return;
        }
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainApp(user);
        loginFormInitial.reset();
    });
}

const registerValidations = [
    { inputId: 'registerName', errorId: 'registerNameError', validationFn: v => v.length >= 2, errorMessage: 'Ім’я: від 2 символів' },
    { inputId: 'registerEmail', errorId: 'registerEmailError', validationFn: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), errorMessage: 'Введіть коректну пошту' },
    { inputId: 'registerPassword', errorId: 'registerPasswordError', validationFn: v => v.length >= 6, errorMessage: 'Пароль: від 6 символів' },
    { inputId: 'registerUsername', errorId: 'registerUsernameError', validationFn: v => /^[a-zA-Z0-9_]{3,15}$/.test(v), errorMessage: 'Логін: 3-15 символів, лише літери, цифри, _' },
    { inputId: 'registerAge', errorId: 'registerAgeError', validationFn: v => v >= 16 && v <= 100, errorMessage: 'Вік: від 16 до 100' },
    { inputId: 'registerLocation', errorId: 'registerLocationError', validationFn: v => v.length >= 2, errorMessage: 'Місце: від 2 символів' }
];

if (registerForm) setupFormValidation(registerForm, registerValidations);

const defaultInterests = ['Спорт', 'Музика', 'Подорожі', 'Ігри', 'Технології', 'Книги', 'Кіно', 'Кулінарія'];

function renderInterests(container, selected = [], onToggle) {
    if (!container) return;
    const allInterests = [...defaultInterests, ...globalCustomInterests];
    
    container.innerHTML = allInterests.map(interest => `
        <span class="interest-tag ${selected.includes(interest) ? 'selected' : ''}" data-interest="${interest}">${interest}</span>
    `).join('');
    
    container.querySelectorAll('.interest-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('selected');
            if (onToggle) onToggle();
        });
        tag.addEventListener('touchstart', (e) => {
            e.preventDefault();
            tag.classList.toggle('selected');
            if (onToggle) onToggle();
        });
    });
}

if (registerInterestsContainer) renderInterests(registerInterestsContainer, [], () => {});

if (addCustomInterestBtn && customInterestInput) {
    addCustomInterestBtn.addEventListener('click', () => {
        const interest = customInterestInput.value.trim();
        if (interest && interest.length <= 20) {
            if (addGlobalInterest(interest)) {
                updateAllInterestContainers();
                customInterestInput.value = '';
                showToast('Інтерес додано', 'success');
            } else {
                showToast('Цей інтерес вже існує', 'error');
            }
        } else {
            showToast(interest.length > 20 ? 'Інтерес занадто довгий' : 'Введіть інтерес', 'error');
        }
    });
    
    addCustomInterestBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const interest = customInterestInput.value.trim();
        if (interest && interest.length <= 20) {
            if (addGlobalInterest(interest)) {
                updateAllInterestContainers();
                customInterestInput.value = '';
                showToast('Інтерес додано', 'success');
            } else {
                showToast('Цей інтерес вже існує', 'error');
            }
        } else {
            showToast(interest.length > 20 ? 'Інтерес занадто довгий' : 'Введіть інтерес', 'error');
        }
    });
}

if (customInterestInput) {
    customInterestInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && addCustomInterestBtn) addCustomInterestBtn.click();
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isValid = registerValidations.every(({ inputId, errorId, validationFn, errorMessage }) => 
            validateInput(document.getElementById(inputId), document.getElementById(errorId), validationFn, errorMessage));
        
        if (!isValid) {
            showToast('Заповніть усі поля коректно', 'error');
            return;
        }

        const consentCheckbox = document.getElementById('registerConsent');
        const consentError = document.getElementById('registerConsentError');
        
        if (!consentCheckbox.checked) {
            showToast('Ви повинні погодитися на обробку даних', 'error');
            if (consentError) {
                consentError.textContent = 'Це поле є обов\'язковим';
                consentError.style.display = 'block';
            }
            consentCheckbox.addEventListener('change', () => {
                if (consentCheckbox.checked && consentError) {
                    consentError.style.display = 'none';
                }
            }, { once: true }); 
            return; 
        } else {
            if (consentError) {
                consentError.style.display = 'none';
            }
        }

        const selectedInterests = Array.from(registerInterestsContainer?.querySelectorAll('.interest-tag.selected') || []).map(tag => tag.dataset.interest);
        if (selectedInterests.length < 1) {
            showToast('Виберіть хоча б один інтерес', 'error');
            return;
        }

        const users = getUsers();
        const email = document.getElementById('registerEmail')?.value.trim().toLowerCase();
        const username = document.getElementById('registerUsername')?.value.trim();
        if (email && users.some(u => u.email === email)) {
            showToast('Ця пошта вже зареєстрована', 'error');
            return;
        }
        if (username && users.some(u => u.username === username)) {
            showToast('Цей логін вже зайнятий', 'error');
            return;
        }

        let avatarBase64 = '';
        const photo = document.getElementById('registerPhoto')?.files[0];
        if (photo) {
            avatarBase64 = await fileToBase64(photo);
            if (!avatarBase64) return;
        }

        const newUser = {
            id: users.length + 1,
            name: document.getElementById('registerName')?.value.trim(),
            email,
            username,
            password: document.getElementById('registerPassword')?.value,
            age: parseInt(document.getElementById('registerAge')?.value),
            location: document.getElementById('registerLocation')?.value.trim(),
            interests: selectedInterests,
            avatarBase64
        };

        users.push(newUser);
        saveUsers(users);
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        showMainApp(newUser);
        closeModal(registerModal);
        registerForm.reset();
        showToast('Реєстрація успішна!', 'success');
    });
}

const createEventValidations = [
    { inputId: 'eventTitle', errorId: 'eventTitleError', validationFn: v => v.length >= 3, errorMessage: 'Назва: від 3 символів' },
    { inputId: 'eventDescription', errorId: 'eventDescriptionError', validationFn: v => v.length >= 10, errorMessage: 'Опис: від 10 символів' },
    { inputId: 'eventLocation', errorId: 'eventLocationError', validationFn: v => v.length >= 2, errorMessage: 'Місце: від 2 символів' },
    { inputId: 'eventDate', errorId: 'eventDateError', validationFn: v => new Date(v) > new Date(), errorMessage: 'Дата: у майбутньому' },
    { inputId: 'eventParticipants', errorId: 'eventParticipantsError', validationFn: v => v >= 2 && v <= 100, errorMessage: 'Учасники: від 2 до 100' }
];

if (createEventForm) setupFormValidation(createEventForm, createEventValidations);

if (document.getElementById('eventInterestsContainer')) {
    renderInterests(document.getElementById('eventInterestsContainer'), [], () => {});
}

if (addEditEventCustomInterestBtn && editEventCustomInterestInput) {
    addEditEventCustomInterestBtn.addEventListener('click', () => {
        const interest = editEventCustomInterestInput.value.trim();
        if (interest && interest.length <= 20) {
            if (addGlobalInterest(interest)) {
                updateAllInterestContainers();
                editEventCustomInterestInput.value = '';
                showToast('Інтерес додано', 'success');
            } else {
                showToast('Цей інтерес вже існує', 'error');
            }
        } else {
            showToast(interest.length > 20 ? 'Інтерес занадто довгий' : 'Введіть інтерес', 'error');
        }
    });
    
    addEditEventCustomInterestBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    addEditEventCustomInterestBtn.click(); 
    });
    
}

if (editEventCustomInterestInput) {
    editEventCustomInterestInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && addEditEventCustomInterestBtn) {
            e.preventDefault();
            addEditEventCustomInterestBtn.click();
        }
    });
}
    addEditEventCustomInterestBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const interest = editEventCustomInterestInput.value.trim();
        if (interest && !defaultInterests.includes(interest) && interest.length <= 20) {
            defaultInterests.push(interest);
            renderInterests(document.getElementById('eventInterestsContainer'), [], () => {});
            editEventCustomInterestInput.value = '';
        } else {
            showToast(interest.length > 20 ? 'Інтерес занадто довгий' : 'Введіть унікальний інтерес', 'error');
        }
    });

if (editEventCustomInterestInput) {
    editEventCustomInterestInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && addEditEventCustomInterestBtn) addEditEventCustomInterestBtn.click();
    });
}

if (createEventForm) {
    createEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (!user) {
            showToast('Увійдіть, щоб створити подію', 'error');
            return;
        }
        const selectedInterests = Array.from(document.getElementById('eventInterestsContainer')?.querySelectorAll('.interest-tag.selected') || []).map(tag => tag.dataset.interest);
        if (selectedInterests.length < 1) {
            showToast('Виберіть хоча б один інтерес', 'error');
            const errorEl = document.getElementById('eventInterestsError');
            if (errorEl) {
                errorEl.textContent = 'Виберіть хоча б один інтерес';
                errorEl.style.display = 'block';
            }
            return;
        } else {
            const errorEl = document.getElementById('eventInterestsError');
            if (errorEl) errorEl.style.display = 'none';
        }

        const titleValid = validateInput(document.getElementById('eventTitle'), document.getElementById('eventTitleError'), v => v.length >= 3, 'Назва: від 3 символів');
        const descValid = validateInput(document.getElementById('eventDescription'), document.getElementById('eventDescriptionError'), v => v.length >= 10, 'Опис: від 10 символів');
        const catValid = validateInput(document.getElementById('eventCategory'), document.getElementById('eventCategoryError'), v => v !== "", 'Оберіть категорію');
        const locValid = validateInput(document.getElementById('eventLocation'), document.getElementById('eventLocationError'), v => v.length >= 2, 'Місце: від 2 символів');
        const dateValid = validateInput(document.getElementById('eventDate'), document.getElementById('eventDateError'), v => new Date(v) > new Date(), 'Дата: у майбутньому');
        const partValid = validateInput(document.getElementById('eventParticipants'), document.getElementById('eventParticipantsError'), v => v >= 2 && v <= 100, 'Учасники: від 2 до 100');

        if (!titleValid || !descValid || !catValid || !locValid || !dateValid || !partValid) {
            showToast('Заповніть усі поля коректно', 'error');
            if (!titleValid || !descValid || !catValid) {
                showEventStep(1);
            } else if (!locValid || !dateValid || !partValid) {
                showEventStep(2);
            }
            return;
        }


        const newEvent = {
            eventId: nextEventId++,
            title: document.getElementById('eventTitle')?.value.trim(),
            description: document.getElementById('eventDescription')?.value.trim(),
            category: document.getElementById('eventCategory')?.value,
            location: document.getElementById('eventLocation')?.value.trim(),
            date: document.getElementById('eventDate')?.value,
            participants: parseInt(document.getElementById('eventParticipants')?.value),
            currentParticipants: 1,
            creatorId: user.id,
            interests: selectedInterests
        };

        const events = JSON.parse(localStorage.getItem('events') || '[]');
        events.unshift(newEvent);
        localStorage.setItem('events', JSON.stringify(events));
        localStorage.setItem('nextEventId', JSON.stringify(nextEventId));

        let joinedEvents = JSON.parse(localStorage.getItem('joinedEvents') || '{}');
        if (!joinedEvents[user.id]) joinedEvents[user.id] = [];
        joinedEvents[user.id].push(newEvent.eventId);
        localStorage.setItem('joinedEvents', JSON.stringify(joinedEvents));

        closeModal(createEventModal);
        createEventForm.reset();
        renderEvents(events);
        showToast('Подію створено!', 'success');
    });
}

const editProfileValidations = [
    { inputId: 'editProfileName', errorId: 'editProfileNameError', validationFn: v => v.length >= 2, errorMessage: 'Ім’я: від 2 символів' },
    { inputId: 'editProfileUsername', errorId: 'editProfileUsernameError', validationFn: v => /^[a-zA-Z0-9_]{3,15}$/.test(v), errorMessage: 'Логін: 3-15 символів, лише літери, цифри, _' },
    { inputId: 'editProfileAge', errorId: 'editProfileAgeError', validationFn: v => v >= 16 && v <= 100, errorMessage: 'Вік: від 16 до 100' },
    { inputId: 'editProfileLocation', errorId: 'editProfileLocationError', validationFn: v => v.length >= 2, errorMessage: 'Місце: від 2 символів' }
];

if (editProfileForm) setupFormValidation(editProfileForm, editProfileValidations);

function openEditProfileModal() {
    const user = getCurrentUser();
    if (!user) {
        showToast('Увійдіть, щоб редагувати профіль', 'error');
        return;
    }

    if (editProfileName) editProfileName.value = user.name;
    if (editProfileUsername) editProfileUsername.value = user.username;
    if (editProfileAge) editProfileAge.value = user.age;
    if (editProfileLocation) editProfileLocation.value = user.location;
    if (editProfileAvatarPreview) editProfileAvatarPreview.src = user.avatarBase64 || 'https://via.placeholder.com/100?text=@';
    if (editProfileInterestsContainer) renderInterests(editProfileInterestsContainer, user.interests, () => {});

    openModal(editProfileModal);
}

if (editProfilePhoto && editProfileAvatarPreview) {
    editProfilePhoto.addEventListener('change', async () => {
        const file = editProfilePhoto.files[0];
        if (file) {
            const base64 = await fileToBase64(file);
            if (base64) {
                editProfileAvatarPreview.src = base64;
            }
        }
    });
}

if (addEditCustomInterestBtn && editCustomInterestInput)
    {
    addEditCustomInterestBtn.addEventListener('click', () => {
        const interest = editCustomInterestInput.value.trim();
        if (interest && !defaultInterests.includes(interest) && interest.length <= 20) {
            defaultInterests.push(interest);
            const user = getCurrentUser();
            if (user && editProfileInterestsContainer) {
                renderInterests(editProfileInterestsContainer, user.interests, () => {});
            }
            editCustomInterestInput.value = '';
        } else {
            showToast(interest.length > 20 ? 'Інтерес занадто довгий' : 'Введіть унікальний інтерес', 'error');
        }
    });
    addEditCustomInterestBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const interest = editCustomInterestInput.value.trim();
        if (interest && !defaultInterests.includes(interest) && interest.length <= 20) {
            defaultInterests.push(interest);
            const user = getCurrentUser();
            if (user && editProfileInterestsContainer) {
                renderInterests(editProfileInterestsContainer, user.interests, () => {});
            }
            editCustomInterestInput.value = '';
        } else {
            showToast(interest.length > 20 ? 'Інтерес занадто довгий' : 'Введіть унікальний інтерес', 'error');
        }
    });
}

if (editCustomInterestInput) {
    editCustomInterestInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && addEditCustomInterestBtn) addEditCustomInterestBtn.click();
    });
}

if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (!user) {
            showToast('Увійдіть, щоб редагувати профіль', 'error');
            return;
        }

        const isValid = editProfileValidations.every(({ inputId, errorId, validationFn, errorMessage }) => 
            validateInput(document.getElementById(inputId), document.getElementById(errorId), validationFn, errorMessage));
        
        if (!isValid) {
            showToast('Заповніть усі поля коректно', 'error');
            return;
        }

        const selectedInterests = Array.from(editProfileInterestsContainer?.querySelectorAll('.interest-tag.selected') || []).map(tag => tag.dataset.interest);
        if (selectedInterests.length < 1) {
            showToast('Виберіть хоча б один інтерес', 'error');
            return;
        }

        const users = getUsers();
        const username = editProfileUsername?.value.trim();
        if (username && username !== user.username && users.some(u => u.username === username)) {
            showToast('Цей логін вже зайнятий', 'error');
            return;
        }

        let avatarBase64 = user.avatarBase64;
        const photo = editProfilePhoto?.files[0];
        if (photo) {
            avatarBase64 = await fileToBase64(photo);
            if (!avatarBase64) return;
        }

        const updatedUser = {
            ...user,
            name: editProfileName?.value.trim(),
            username: username,
            age: parseInt(editProfileAge?.value),
            location: editProfileLocation?.value.trim(),
            interests: selectedInterests,
            avatarBase64
        };

        const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
        saveUsers(updatedUsers);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        closeModal(editProfileModal);
        showMainApp(updatedUser);
        showToast('Профіль оновлено!', 'success');
    });
}

const editEventValidations = [
    { inputId: 'editEventTitle', errorId: 'editEventTitleError', validationFn: v => v.length >= 3, errorMessage: 'Назва: від 3 символів' },
    { inputId: 'editEventDescription', errorId: 'editEventDescriptionError', validationFn: v => v.length >= 10, errorMessage: 'Опис: від 10 символів' },
    { inputId: 'editEventLocation', errorId: 'editEventLocationError', validationFn: v => v.length >= 2, errorMessage: 'Місце: від 2 символів' },
    { inputId: 'editEventDate', errorId: 'editEventDateError', validationFn: v => new Date(v) > new Date(), errorMessage: 'Дата: у майбутньому' },
    { inputId: 'editEventParticipants', errorId: 'editEventParticipantsError', validationFn: v => v >= 2 && v <= 100, errorMessage: 'Учасники: від 2 до 100' }
];

if (editEventForm) setupFormValidation(editEventForm, editEventValidations);

function openEditEventModal(event) {
    const user = getCurrentUser();
    if (!user || user.id !== event.creatorId) {
        showToast('Ви не можете редагувати цю подію', 'error');
        return;
    }

    if (editEventTitle) editEventTitle.value = event.title;
    if (editEventDescription) editEventDescription.value = event.description;
    if (editEventCategory) editEventCategory.value = event.category;
    if (editEventLocation) editEventLocation.value = event.location;
    if (editEventDate) editEventDate.value = event.date;
    if (editEventParticipants) editEventParticipants.value = event.participants;
    if (editEventInterestsContainer) renderInterests(editEventInterestsContainer, event.interests, () => {});

    if (editEventForm) editEventForm.dataset.eventId = event.eventId;
    openModal(editEventModal);
}

if (editEventForm) {
    editEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (!user) {
            showToast('Увійдіть, щоб редагувати подію', 'error');
            return;
        }

        const isValid = editEventValidations.every(({ inputId, errorId, validationFn, errorMessage }) => 
            validateInput(document.getElementById(inputId), document.getElementById(errorId), validationFn, errorMessage));
        
        if (!isValid) {
            showToast('Заповніть усі поля коректно', 'error');
            return;
        }

        const selectedInterests = Array.from(editEventInterestsContainer?.querySelectorAll('.interest-tag.selected') || []).map(tag => tag.dataset.interest);
        if (selectedInterests.length < 1) {
            showToast('Виберіть хоча б один інтерес', 'error');
            return;
        }

        const events = JSON.parse(localStorage.getItem('events') || '[]');
        const eventId = parseInt(editEventForm.dataset.eventId);
        const event = events.find(e => e.eventId === eventId);
        if (!event || event.creatorId !== user.id) {
            showToast('Ви не можете редагувати цю подію', 'error');
            return;
        }

        const updatedEvent = {
            ...event,
            title: editEventTitle?.value.trim(),
            description: editEventDescription?.value.trim(),
            category: editEventCategory?.value,
            location: editEventLocation?.value.trim(),
            date: editEventDate?.value,
            participants: parseInt(editEventParticipants?.value),
            interests: selectedInterests
        };

        const updatedEvents = events.map(e => e.eventId === eventId ? updatedEvent : e);
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        closeModal(editEventModal);
        renderEvents(updatedEvents);
        openEventDetail(updatedEvent);
        showToast('Подію оновлено!', 'success');
    });
}

function initAuthTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab + 'Tab';
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    globalCustomInterests = JSON.parse(localStorage.getItem('globalCustomInterests') || '[]');
    updateAllInterestContainers();
    
    loadTheme();
    handleBackToTop();
    setupNavigation();

    document.body.addEventListener('click', (e) => {
        const tag = e.target.closest('.interest-tag');
        
        if (!tag) return;

        const selectionContainer = e.target.closest('#registerForm, #createEventModal, #editEventModal, #editProfileModal, #peopleInterestFilter');
        if (selectionContainer) return;

        const interest = tag.dataset.interest || tag.textContent;
        if (interest) {
            e.preventDefault(); 
            openInterestSearchModal(interest);
        }
    });

    const interestModal = document.getElementById('interestSearchModal');
    if (interestModal) {
        interestModal.addEventListener('click', (e) => {
            const eventItem = e.target.closest('.interest-modal-event-item');
            if (eventItem) {
                const eventId = parseInt(eventItem.dataset.eventId);
                const allEvents = JSON.parse(localStorage.getItem('events') || '[]');
                const event = allEvents.find(e => e.eventId === eventId);
                if (event) {
                    closeModal(interestModal);
                    openEventDetail(event);
                }
                return;
            }

            const personItem = e.target.closest('.interest-modal-person-item');
            if (personItem) {
                const userId = parseInt(personItem.dataset.userId);
                if (userId) {
                    closeModal(interestModal);
                    openOtherUserProfile(userId);
                }
                return;
            }
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        themeToggle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleTheme();
        });
        console.log('Theme toggle handler added');
    } else {
        console.log('Theme toggle button not found');
    }

    const user = getCurrentUser();
    if (user) {
        showMainApp(user);
    } else {
        showAuthScreen();
        initAuthTabs();
    }

    const modalHandlers = [
        { btn: showRegisterFormLink, modal: registerModal },
        { btn: createEventBtn, modal: createEventModal },
        { btn: document.getElementById('editProfileBtn'), action: openEditProfileModal },
        { btn: document.getElementById('profileDisplay'), action: openUserProfile },
        { btn: document.getElementById('createEventBtn'), modal: createEventModal },
        {  btn: document.getElementById('searchEventsBtn'), action: () => scrollToSection('search') },
    ];

    modalHandlers.forEach(({ btn, modal, action }) => {
        if (!btn) return;
        const open = modal ? () => openModal(modal) : action;
        btn.addEventListener('click', open);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); open(); });
    });

    const closeButtons = [
        closeRegisterModal, closeEventModal, closeProfileModal,
        closeEditProfileModal, closeEventDetailModal, closeEditEventModal,
        closeChatListModal, closePrivateChatModal, closeOtherUserProfileModal,
        document.getElementById('closeInterestSearchModal') 
    ];

    closeButtons.forEach(btn => {
        if (!btn) return;
        const close = () => closeModal(btn.closest('.modal'));
        btn.addEventListener('click', close);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); close(); });
    });

    if (profileLogoutBtn) {
        const logout = () => {
            localStorage.removeItem('currentUser');
            showAuthScreen();
            closeModal(profileModal);
            showToast('Ви вийшли з системи', 'info');
        };
        profileLogoutBtn.addEventListener('click', logout);
        profileLogoutBtn.addEventListener('touchstart', (e) => { e.preventDefault(); logout(); });
    }

    if (sendPrivateMessageBtn) {
        sendPrivateMessageBtn.addEventListener('click', sendPrivateMessage);
        sendPrivateMessageBtn.addEventListener('touchstart', (e) => { e.preventDefault(); sendPrivateMessage(); });
    }

    if (privateChatInput) {
        privateChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendPrivateMessage();
        });
    }

    const filterIds = [
        'searchQueryInput', 'locationInput', 'categorySelect', 'dateInput',
        'peopleSelect', 'distanceInput', 'sortSelect', 'statusSelect', 'interestSearchInput'
    ];

    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => renderEvents(getAllEvents()));
    });

    function openUserProfile() {
        const user = getCurrentUser();
        if (!user) return;
        profileModalAvatar.src = user.avatarBase64 || 'https://via.placeholder.com/100?text=@';
        profileModalName.textContent = user.name;
        profileModalUsername.textContent = `@${user.username}`;
        profileModalMeta.textContent = `${user.location} · ${user.age} років`;
        profileModalInterests.innerHTML = user.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');
        renderUserEvents(user);
        openModal(profileModal);
    }

    function scrollToEventsFilter() {
        const filter = document.getElementById('eventsFilterSection');
        if (filter) {
            filter.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => filter.querySelector('input, select')?.focus(), 400);
        }
    }

    function getAllEvents() {
        return JSON.parse(localStorage.getItem('events') || '[]');
    }

    function openInterestSearchModal(interest) {
        const user = getCurrentUser();
        if (!user) {
            showToast('Будь ласка, увійдіть, щоб шукати за інтересами', 'info');
            return;
        }

        const modal = document.getElementById('interestSearchModal');
        const titleEl = document.getElementById('interestModalTitle');
        const eventsGrid = document.getElementById('interestModalEventsGrid');
        const peopleGrid = document.getElementById('interestModalPeopleGrid');

        if (!modal || !titleEl || !eventsGrid || !peopleGrid) return;

        titleEl.innerHTML = `Результати для: <span class="interest-tag selected" style="font-size: 0.8em; cursor: default;">${interest}</span>`;

        const allEvents = JSON.parse(localStorage.getItem('events') || '[]');
        const filteredEvents = allEvents.filter(e => 
            e.interests.includes(interest) && 
            e.location.toLowerCase() === user.location.toLowerCase()
        );
        
        if (filteredEvents.length === 0) {
            eventsGrid.innerHTML = '<p style="color: #888; font-size: 0.9em;">У вашому місті немає подій з цим інтересом.</p>';
        } else {
            eventsGrid.innerHTML = filteredEvents.map(event => `
                <div class="interest-modal-event-item" data-event-id="${event.eventId}">
                    <div class="item-title">${event.title}</div>
                    <div class="item-meta">${formatEventDate(event.date)}</div>
                </div>
            `).join('');
        }

        const allUsers = getUsers();
        const filteredPeople = allUsers.filter(p => 
            p.interests.includes(interest) && 
            p.location.toLowerCase() === user.location.toLowerCase() &&
            p.id !== user.id
        );

        if (filteredPeople.length === 0) {
            peopleGrid.innerHTML = '<p style="color: #888; font-size: 0.9em;">У вашому місті немає людей з цим інтересом.</p>';
        } else {
            peopleGrid.innerHTML = filteredPeople.map(person => `
                <div class="interest-modal-person-item" data-user-id="${person.id}">
                    <img src="${person.avatarBase64 || 'https://via.placeholder.com/40?text=' + person.username[0]}" alt="${person.name}" loading="lazy">
                    <div>
                        <div class="item-title">@${person.username}</div>
                        <div class="item-meta">${person.name}, ${person.age} років</div>
                    </div>
                </div>
            `).join('');
        }

        openModal(modal);
    }
    
    let currentEventStep = 1;
    const eventSteps = document.querySelectorAll('#createEventModal .modal-step');
    const stepIndicator = document.getElementById('eventStepIndicator');
    const modalTitle = document.getElementById('createEventTitle');
    const stepTitles = ["Основна інформація", "Логістика", "Інтереси"];

    const eventStepNext1 = document.getElementById('eventStepNext1');
    const eventStepNext2 = document.getElementById('eventStepNext2');
    const eventStepBack2 = document.getElementById('eventStepBack2');
    const eventStepBack3 = document.getElementById('eventStepBack3');

    function showEventStep(step) {
        if (step > currentEventStep) {
            if (currentEventStep === 1) {
                const titleValid = validateInput(document.getElementById('eventTitle'), document.getElementById('eventTitleError'), v => v.length >= 3, 'Назва: від 3 символів');
                const descValid = validateInput(document.getElementById('eventDescription'), document.getElementById('eventDescriptionError'), v => v.length >= 10, 'Опис: від 10 символів');
                const catValid = validateInput(document.getElementById('eventCategory'), document.getElementById('eventCategoryError'), v => v !== "", 'Оберіть категорію');
                if (!titleValid || !descValid || !catValid) {
                    showToast('Заповніть усі поля коректно', 'error');
                    return; 
                }
            }
            if (currentEventStep === 2) {
                const locValid = validateInput(document.getElementById('eventLocation'), document.getElementById('eventLocationError'), v => v.length >= 2, 'Місце: від 2 символів');
                const dateValid = validateInput(document.getElementById('eventDate'), document.getElementById('eventDateError'), v => new Date(v) > new Date(), 'Дата: у майбутньому');
                const partValid = validateInput(document.getElementById('eventParticipants'), document.getElementById('eventParticipantsError'), v => v >= 2 && v <= 100, 'Учасники: від 2 до 100');
                if (!locValid || !dateValid || !partValid) {
                    showToast('Заповніть усі поля коректно', 'error');
                    return; 
                }
            }
        }

        currentEventStep = step;
        eventSteps.forEach((stepEl, index) => {
            stepEl.classList.toggle('active', (index + 1) === currentEventStep);
        });
        if (stepIndicator) stepIndicator.textContent = `Крок ${currentEventStep} з ${eventSteps.length}`;
        if (modalTitle) modalTitle.textContent = stepTitles[currentEventStep - 1];
    }

    if (eventStepNext1) eventStepNext1.addEventListener('click', () => showEventStep(2));
    if (eventStepNext2) eventStepNext2.addEventListener('click', () => showEventStep(3));
    if (eventStepBack2) eventStepBack2.addEventListener('click', () => showEventStep(1));
    if (eventStepBack3) eventStepBack3.addEventListener('click', () => showEventStep(2));

    if (createEventBtn) {
        createEventBtn.addEventListener('click', () => {
            
            updateAllInterestContainers(); 
            showEventStep(1); 
        });
    }    
    const addEventInterestBtn = document.getElementById('addEventCustomInterestBtn');
    const eventInterestInput = document.getElementById('eventCustomInterestInput');

    if (addEventInterestBtn && eventInterestInput) {
        const addInterest = () => {
            const interest = eventInterestInput.value.trim();
            if (interest && interest.length <= 20) {
                if (addGlobalInterest(interest)) {
                    updateAllInterestContainers(); 
                    const newTag = document.querySelector(`#eventInterestsContainer .interest-tag[data-interest="${interest}"]`);
                    if (newTag) {
                        newTag.classList.add('selected');
                    }
                    eventInterestInput.value = '';
                    showToast('Інтерес додано та обрано', 'success');
                } else {
                    showToast('Цей інтерес вже існує', 'info');
                }
            } else {
                showToast(interest.length > 20 ? 'Інтерес занадто довгий' : 'Введіть інтерес', 'error');
            }
        };

        addEventInterestBtn.addEventListener('click', addInterest);
        addEventInterestBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            addInterest();
        });

        eventInterestInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addInterest();
            }
        });
    }

});

function handleGeocodingError(error) {
    console.error('Помилка геокодування:', error);
    showToast('Помилка завантаження карти. Спробуйте пізніше.', 'error');
}

function safeFetch(url, options) {
    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            handleGeocodingError(error);
            throw error;
        });
}

function updateAllInterestContainers() {
    const allInterests = [...defaultInterests, ...globalCustomInterests]
    const containers = [
        'registerInterestsContainer',
        'editProfileInterestsContainer', 
        'eventInterestsContainer',
        'editEventInterestsContainer',
        'peopleInterestFilter'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            const selected = Array.from(container.querySelectorAll('.interest-tag.selected'))
                .map(tag => tag.dataset.interest);
            renderInterests(container, selected, () => {});
        }
    });
}

if (document.getElementById('registerPhoto')) {
    const fileInput = document.getElementById('registerPhoto');
    const uploadArea = fileInput.closest('.file-upload-area');
    const placeholder = uploadArea.querySelector('.upload-placeholder');
    
    fileInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            placeholder.innerHTML = `<i class="fas fa-check-circle"></i> Файл вибрано: ${this.files[0].name}`;
            uploadArea.style.borderColor = 'var(--auth-accent-color)';
            uploadArea.style.background = 'rgba(107, 33, 168, 0.05)';
        }
    });
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = 'var(--auth-accent-color)';
        this.style.background = 'rgba(107, 33, 168, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.borderColor = '#e2e8f0';
        this.style.background = 'transparent';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        fileInput.files = e.dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
    });
}