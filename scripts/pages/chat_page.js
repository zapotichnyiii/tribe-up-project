import * as utils from '../utils.js';
import { initSharedComponents } from '../shared.js';

const socket = io(utils.API_URL);
const urlParams = new URLSearchParams(window.location.search);
let startChatUserId = urlParams.get('userId');

let currentUser = null;
let currentChatPartnerId = null;
let lastMessageDate = null;
let allChatsCache = [];
let usersCache = [];

const els = {
    sidebar: document.getElementById('chatSidebar'),
    main: document.getElementById('chatMain'),
    listContainer: document.getElementById('chatListContainer'),
    searchInput: document.getElementById('chatSearchInput'),
    emptyState: document.getElementById('chatEmptyState'),
    activeView: document.getElementById('chatActiveView'),
    backBtn: document.getElementById('backToChatListBtn'),
    
    partnerAvatar: document.getElementById('currentChatAvatar'),
    partnerName: document.getElementById('currentChatName'),
    partnerStatus: document.getElementById('currentChatStatus'),
    messagesArea: document.getElementById('messagesArea'),
    input: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendMessageBtn')
};

document.addEventListener('DOMContentLoaded', async () => {
    await initSharedComponents(socket);
    
    currentUser = utils.getCurrentUser();
    if (!currentUser) {
        window.location.href = '/';
        return;
    }

    await loadChatList();
    
    if (startChatUserId) {
        startChatUserId = parseInt(startChatUserId);
        await openChatWithUser(startChatUserId);
    }

    setupEventListeners();
    setupSocketListeners();
});

async function loadChatList() {
    try {
        const res = await fetch(`${utils.API_URL}/api/my-chats/${currentUser.id}`);
        allChatsCache = await res.json();
        renderChatList(allChatsCache);
    } catch (e) {
        console.error('Failed to load chats', e);
        els.listContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">Помилка завантаження</p>';
    }
}

function renderChatList(chats) {
    if (chats.length === 0) {
        els.listContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">У вас ще немає чатів.</p>';
        return;
    }

    els.listContainer.innerHTML = chats.map(c => {
        const isActive = currentChatPartnerId === c.otherUser.id ? 'active' : '';
        const lastMsg = c.lastMessage.text || 'Вкладення';
        const time = formatTimeShort(c.lastMessage.timestamp);
        
        return `
        <div class="chat-item ${isActive}" data-user-id="${c.otherUser.id}">
            <div class="avatar-wrapper">
                <img src="${c.otherUser.avatarBase64 || 'https://via.placeholder.com/50'}" alt="${c.otherUser.username}">
            </div>
            <div class="chat-item-content">
                <div class="chat-item-top">
                    <span class="chat-name">${c.otherUser.username}</span>
                    <span class="chat-time">${time}</span>
                </div>
                <div class="chat-item-bottom">
                    <p class="last-message">${lastMsg}</p>
                </div>
            </div>
        </div>
        `;
    }).join('');

    els.listContainer.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => {
            const userId = parseInt(item.dataset.userId);
            openChatWithUser(userId);
        });
    });
}

async function openChatWithUser(userId) {
    currentChatPartnerId = userId;
    
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector(`.chat-item[data-user-id="${userId}"]`);
    if (activeItem) activeItem.classList.add('active');

    let partner = null;
    const existingChat = allChatsCache.find(c => c.otherUser.id === userId);
    
    if (existingChat) {
        partner = existingChat.otherUser;
    } else {
        try {
            if (usersCache.length === 0) usersCache = await utils.getUsers();
            partner = usersCache.find(u => u.id === userId);
        } catch (e) { console.error(e); }
    }

    if (!partner) return;

    els.partnerName.textContent = partner.username;
    els.partnerAvatar.src = partner.avatarBase64 || 'https://via.placeholder.com/50';
    els.emptyState.style.display = 'none';
    els.activeView.style.display = 'flex';

    if (window.innerWidth <= 768) {
        els.sidebar.classList.add('hidden');
        els.main.classList.add('active');
    }

    loadMessages(userId);
    loadUserStatus(userId);

    const roomName = getPrivateRoomName(currentUser.id, userId);
    socket.emit('join', { room: roomName });
}

async function loadMessages(userId) {
    lastMessageDate = null;
    els.messagesArea.innerHTML = '<div style="text-align:center; padding:20px;">Завантаження...</div>';
    
    try {
        const res = await fetch(`${utils.API_URL}/api/messages/private?user1=${currentUser.id}&user2=${userId}`);
        const messages = await res.json();
        
        els.messagesArea.innerHTML = '';
        
        if (messages.length === 0) {
            els.messagesArea.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Це початок вашої історії повідомлень.</div>';
        }

        messages.forEach(appendMessageToUI);
        scrollToBottom();
        
    } catch (e) {
        console.error(e);
        els.messagesArea.innerHTML = '<div style="text-align:center; color:red;">Помилка.</div>';
    }
}

function appendMessageToUI(msg) {
    const msgDate = new Date(msg.timestamp || Date.now());
    
    const dateString = msgDate.toDateString();
    if (lastMessageDate !== dateString) {
        renderDateDivider(msgDate);
        lastMessageDate = dateString;
    }

    const isMe = msg.senderId === currentUser.id;
    const div = document.createElement('div');
    div.className = `message ${isMe ? 'sent' : 'received'}`;
    
    const timeStr = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
        <div class="message-bubble">
            ${msg.text}
            <span class="msg-meta">
                <span class="msg-time">${timeStr}</span>
                ${isMe ? '<i class="fas fa-check msg-status"></i>' : ''}
            </span>
        </div>
    `;
    els.messagesArea.appendChild(div);
}

// === ОНОВЛЕНА ФУНКЦІЯ: МИТТЄВА ВІДПРАВКА ===
function sendMessage() {
    const text = els.input.value.trim();
    if (!text || !currentChatPartnerId) return;

    // 1. Миттєво показуємо повідомлення в чаті (Optimistic Update)
    const tempMsg = {
        text: text,
        senderId: currentUser.id,
        receiverId: currentChatPartnerId,
        timestamp: Date.now()
    };
    appendMessageToUI(tempMsg);
    scrollToBottom();

    // 2. Відправляємо на сервер
    socket.emit('send_private_message', {
        senderId: currentUser.id,
        receiverId: currentChatPartnerId,
        text: text
    });

    els.input.value = '';
}

// === ОНОВЛЕНІ СЛУХАЧІ: УНИКНЕННЯ ДУБЛІКАТІВ ===
function setupSocketListeners() {
    socket.on('receive_private_message', (msg) => {
        // 1. Якщо це моє повідомлення, я його вже показав у sendMessage, тому ігноруємо
        if (msg.senderId === currentUser.id) {
            updateChatListOnMessage(msg); // Але список чатів зліва оновити треба
            return; 
        }

        // 2. Якщо повідомлення від співрозмовника і ми в цьому чаті - показуємо
        if (msg.senderId === currentChatPartnerId && msg.receiverId === currentUser.id) {
            appendMessageToUI(msg);
            scrollToBottom();
        }

        // 3. Оновлюємо список чатів
        updateChatListOnMessage(msg);
    });
}

function updateChatListOnMessage(msg) {
    loadChatList(); 
}

function setupEventListeners() {
    els.sendBtn.addEventListener('click', sendMessage);
    els.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    els.backBtn.addEventListener('click', () => {
        els.sidebar.classList.remove('hidden');
        els.main.classList.remove('active');
        currentChatPartnerId = null; 
        document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    });

    els.searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allChatsCache.filter(c => c.otherUser.username.toLowerCase().includes(query));
        renderChatList(filtered);
    });

    // --- ДОДАНО: ПЕРЕХІД НА ПРОФІЛЬ ---
    const openProfile = () => {
        if (currentChatPartnerId) {
            window.location.href = `/user.html?id=${currentChatPartnerId}`;
        }
    };

    // Додаємо слухачі на аватарку та ім'я в хедері активного чату
    els.partnerAvatar.addEventListener('click', openProfile);
    els.partnerName.addEventListener('click', openProfile);
    
    // Робимо курсор "рукою", щоб було видно, що це клікабельно
    els.partnerAvatar.style.cursor = 'pointer';
    els.partnerName.style.cursor = 'pointer';
}

function getPrivateRoomName(u1, u2) {
    const [a, b] = [u1, u2].sort((x, y) => x - y);
    return `private_${a}_${b}`;
}

function scrollToBottom() {
    els.messagesArea.scrollTop = els.messagesArea.scrollHeight;
}

function formatTimeShort(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth();
    
    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    }
}

function renderDateDivider(dateObj) {
    const now = new Date();
    let label = dateObj.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });

    if (dateObj.toDateString() === now.toDateString()) {
        label = 'Сьогодні';
    } else {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (dateObj.toDateString() === yesterday.toDateString()) {
            label = 'Вчора';
        }
    }

    const div = document.createElement('div');
    div.className = 'date-divider';
    div.innerHTML = `<span>${label}</span>`;
    els.messagesArea.appendChild(div);
}

// Завантаження та відображення статусу
async function loadUserStatus(userId) {
    // Спочатку ставимо заглушку або очищаємо
    els.partnerStatus.textContent = ''; 
    els.partnerStatus.style.color = 'var(--main-secondary-color)';

    try {
        const res = await fetch(`${utils.API_URL}/api/users/${userId}/status`);
        const data = await res.json();

        if (data.isOnline) {
            els.partnerStatus.textContent = 'в мережі';
            els.partnerStatus.style.color = '#10b981'; // Зелений колір
        } else if (data.lastSeen) {
            els.partnerStatus.textContent = formatLastSeen(data.lastSeen);
            els.partnerStatus.style.color = 'var(--main-secondary-color)';
        } else {
            els.partnerStatus.textContent = 'не в мережі';
        }
    } catch (e) {
        console.error('Error fetching status:', e);
    }
}

// Форматування часу "Був у мережі..."
function formatLastSeen(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    // Якщо менше хвилини
    if (diffMins < 1) return 'був(ла) щойно';

    // Форматування часу (HH:MM)
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Якщо сьогодні
    if (date.toDateString() === now.toDateString()) {
        return `був(ла) сьогодні о ${timeStr}`;
    }

    // Якщо вчора
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `був(ла) вчора о ${timeStr}`;
    }

    // Якщо давно - показуємо дату
    const dateStr = date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    return `був(ла) ${dateStr} о ${timeStr}`;
}