import * as utils from '../utils.js';
import { initSharedComponents } from '../shared.js';

const socket = io('http://localhost:5000');
const urlParams = new URLSearchParams(window.location.search);
let startChatUserId = urlParams.get('userId'); // ID користувача з URL, якщо перейшли по кнопці "Написати"

let currentUser = null;
let currentChatPartnerId = null;
let lastMessageDate = null;
let allChatsCache = [];
let usersCache = []; // Кеш користувачів для пошуку/відкриття нових чатів

// Елементи DOM
const els = {
    sidebar: document.getElementById('chatSidebar'),
    main: document.getElementById('chatMain'),
    listContainer: document.getElementById('chatListContainer'),
    searchInput: document.getElementById('chatSearchInput'),
    emptyState: document.getElementById('chatEmptyState'),
    activeView: document.getElementById('chatActiveView'),
    backBtn: document.getElementById('backToChatListBtn'),
    
    // Елементи активного чату
    partnerAvatar: document.getElementById('currentChatAvatar'),
    partnerName: document.getElementById('currentChatName'),
    partnerStatus: document.getElementById('currentChatStatus'),
    messagesArea: document.getElementById('messagesArea'),
    input: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendMessageBtn')
};

document.addEventListener('DOMContentLoaded', async () => {
    // Ініціалізація спільних компонентів (хедер, auth check)
    await initSharedComponents(socket);
    
    currentUser = utils.getCurrentUser();
    if (!currentUser) {
        window.location.href = '/';
        return;
    }

    // Завантажуємо список чатів
    await loadChatList();
    
    // Якщо перейшли за посиланням ?userId=..., відкриваємо цей чат
    if (startChatUserId) {
        startChatUserId = parseInt(startChatUserId);
        await openChatWithUser(startChatUserId);
    }

    setupEventListeners();
    setupSocketListeners();
});

async function loadChatList() {
    try {
        const res = await fetch(`http://localhost:5000/api/my-chats/${currentUser.id}`);
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
        const time = formatTimeShort(c.lastMessage.timestamp); // Функція форматування часу
        
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

    // Додаємо слухачі кліків
    els.listContainer.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => {
            const userId = parseInt(item.dataset.userId);
            openChatWithUser(userId);
        });
    });
}

// Головна функція відкриття чату
async function openChatWithUser(userId) {
    currentChatPartnerId = userId;
    
    // 1. Оновлюємо UI списку (виділяємо активний)
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector(`.chat-item[data-user-id="${userId}"]`);
    if (activeItem) activeItem.classList.add('active');

    // 2. Отримуємо дані користувача (з кешу чатів або з сервера, якщо це новий чат)
    let partner = null;
    const existingChat = allChatsCache.find(c => c.otherUser.id === userId);
    
    if (existingChat) {
        partner = existingChat.otherUser;
    } else {
        // Якщо це новий чат, якого немає в списку
        try {
            if (usersCache.length === 0) usersCache = await utils.getUsers();
            partner = usersCache.find(u => u.id === userId);
        } catch (e) { console.error(e); }
    }

    if (!partner) return; // Не знайшли користувача

    // 3. Оновлюємо UI активного чату
    els.partnerName.textContent = partner.username;
    els.partnerAvatar.src = partner.avatarBase64 || 'https://via.placeholder.com/50';
    els.emptyState.style.display = 'none';
    els.activeView.style.display = 'flex';

    // Адаптивність: на мобільних ховаємо список, показуємо чат
    if (window.innerWidth <= 768) {
        els.sidebar.classList.add('hidden');
        els.main.classList.add('active');
    }

    // 4. Завантажуємо повідомлення
    loadMessages(userId);

    // 5. Socket: приєднуємося до кімнати
    const roomName = getPrivateRoomName(currentUser.id, userId);
    socket.emit('join', { room: roomName });
}

async function loadMessages(userId) {
    lastMessageDate = null;
    els.messagesArea.innerHTML = '<div style="text-align:center; padding:20px;">Завантаження...</div>';
    
    try {
        const res = await fetch(`http://localhost:5000/api/messages/private?user1=${currentUser.id}&user2=${userId}`);
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
    
    // 1. Перевірка на розділювач дати
    // Якщо це перше повідомлення або дата змінилася відносно попереднього
    const dateString = msgDate.toDateString();
    if (lastMessageDate !== dateString) {
        renderDateDivider(msgDate);
        lastMessageDate = dateString;
    }

    // 2. Рендер самого повідомлення
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

function sendMessage() {
    const text = els.input.value.trim();
    if (!text || !currentChatPartnerId) return;

    socket.emit('send_private_message', {
        senderId: currentUser.id,
        receiverId: currentChatPartnerId,
        text: text
    });

    els.input.value = '';
    // Повідомлення додасться через socket.on('receive_private_message')
}

function setupSocketListeners() {
    socket.on('receive_private_message', (msg) => {
        // 1. Якщо відкритий цей чат — додаємо повідомлення
        if (
            (msg.senderId === currentChatPartnerId && msg.receiverId === currentUser.id) ||
            (msg.senderId === currentUser.id && msg.receiverId === currentChatPartnerId)
        ) {
            appendMessageToUI(msg);
            scrollToBottom();
        }

        // 2. Оновлюємо список чатів (переміщаємо активний вгору або оновлюємо текст)
        updateChatListOnMessage(msg);
    });
}

function updateChatListOnMessage(msg) {
    // Знаходимо, з ким це повідомлення (якщо я відправив - то з receiver, якщо мені - то з sender)
    const partnerId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
    
    // Оновлюємо кеш (простий спосіб - перезавантажити список або маніпулювати DOM)
    // Для плавності краще маніпулювати даними, але для надійності поки перезавантажимо,
    // в ідеалі тут треба оновити allChatsCache і перерендерти.
    loadChatList(); 
}

function setupEventListeners() {
    // Send Message
    els.sendBtn.addEventListener('click', sendMessage);
    els.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Back Button (Mobile)
    els.backBtn.addEventListener('click', () => {
        els.sidebar.classList.remove('hidden');
        els.main.classList.remove('active');
        currentChatPartnerId = null; // Скидаємо вибір
        
        // Знімаємо виділення в списку
        document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    });

    // Search
    els.searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allChatsCache.filter(c => c.otherUser.username.toLowerCase().includes(query));
        renderChatList(filtered);
    });
}

// Helpers
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

    // Перевірка на "Сьогодні" / "Вчора"
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