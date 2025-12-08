import * as dom from './dom.js';
import * as utils from './utils.js';

const API_URL = 'http://localhost:5000/api';
// Підключення до Socket.IO (це має бути глобально)
const socket = io('http://localhost:5000');

// Слухаємо вхідні повідомлення для подій
socket.on('receive_message', (msg) => {
    // Перевіряємо, чи ми зараз дивимось саме цей чат (щоб не плутати)
    // У простому варіанті ми просто додаємо в DOM, якщо модалка відкрита
    const container = document.getElementById('eventChatMessages');
    if (container && dom.eventDetailModal.classList.contains('open')) {
        appendEventMessage(msg);
        container.scrollTop = container.scrollHeight;
    }
});

// Слухаємо приватні повідомлення
socket.on('receive_private_message', (msg) => {
    const container = document.getElementById('privateChatMessages');
    // Перевіряємо, чи відкритий приватний чат і чи це чат саме з цим юзером
    if (container && dom.privateChatModal.classList.contains('open')) {
        const currentChatUser = parseInt(dom.privateChatModal.dataset.otherUserId);
        const myId = utils.getCurrentUser().id;
        
        // Повідомлення має бути або від співрозмовника, або моє власне (підтвердження)
        if (msg.senderId === currentChatUser || msg.senderId === myId) {
            appendPrivateMessage(msg);
            container.scrollTop = container.scrollHeight;
        }
    }
});

// === EVENT CHAT ===

let currentEventRoom = null;

export async function loadEventChat(eventId) {
    const messagesContainer = document.getElementById('eventChatMessages');
    if (!messagesContainer) return;
    
    // Завантажуємо історію через API
    try {
        const res = await fetch(`${API_URL}/messages/event/${eventId}`);
        const chatData = await res.json();
        
        messagesContainer.innerHTML = '';
        chatData.forEach(appendEventMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Входимо в кімнату WebSockets
        if (currentEventRoom) {
            socket.emit('leave', { room: currentEventRoom });
        }
        currentEventRoom = `event_${eventId}`;
        socket.emit('join', { room: currentEventRoom });

    } catch (e) {
        console.error('Failed to load event chat', e);
    }
}

function appendEventMessage(msg) {
    const messagesContainer = document.getElementById('eventChatMessages');
    if (!messagesContainer) return;
    
    const div = document.createElement('div');
    div.className = 'chat-message';
    div.innerHTML = `
        <div><span class="sender">${msg.senderName}</span> <span class="time">${msg.time}</span></div>
        <div class="text">${msg.text}</div>
    `;
    messagesContainer.appendChild(div);
}

export async function sendChatMessage(eventId) {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб надіслати повідомлення', 'error');
        return;
    }
    
    const input = document.getElementById('contactInput');
    const text = input?.value.trim();
    if (!text) {
        utils.showToast('Введіть повідомлення', 'error');
        return;
    }

    // ВІДПРАВЛЯЄМО ЧЕРЕЗ SOCKETS, А НЕ API
    socket.emit('send_event_message', {
        eventId: eventId,
        senderId: user.id,
        text: text
    });
    
    input.value = '';
    // Повідомлення з'явиться через socket.on('receive_message'), дублювати тут не треба
}

// === PRIVATE CHAT ===

let currentPrivateRoom = null;

export async function loadPrivateChat(otherUserId) {
    const user = utils.getCurrentUser();
    if (!user) return;

    try {
        const res = await fetch(`${API_URL}/messages/private?user1=${user.id}&user2=${otherUserId}`);
        const chatData = await res.json();

        if (dom.privateChatMessages) {
            dom.privateChatMessages.innerHTML = '';
            chatData.forEach(appendPrivateMessage);
            dom.privateChatMessages.scrollTop = dom.privateChatMessages.scrollHeight;
        }

        const users = await utils.getUsers();
        const otherUser = users.find(u => u.id === otherUserId);
        const privateChatTitle = document.getElementById('privateChatTitle');
        if (privateChatTitle) {
            privateChatTitle.textContent = otherUser ? `${otherUser.username}` : 'Чат';
        }
        
        if (dom.privateChatModal) dom.privateChatModal.dataset.otherUserId = otherUserId;

        // Входимо в кімнату WebSockets
        if (currentPrivateRoom) {
            socket.emit('leave', { room: currentPrivateRoom });
        }
        // Формуємо унікальну кімнату для пари (сортуємо ID, щоб 1-2 і 2-1 були однією кімнатою)
        const [u1, u2] = [user.id, otherUserId].sort((a, b) => a - b);
        currentPrivateRoom = `private_${u1}_${u2}`;
        socket.emit('join', { room: currentPrivateRoom });

    } catch (e) {
        console.error('Failed to load private chat', e);
    }
}

function appendPrivateMessage(msg) {
    const container = document.getElementById('privateChatMessages');
    const user = utils.getCurrentUser();
    if (!container || !user) return;

    const div = document.createElement('div');
    // Визначаємо, чи це моє повідомлення (sent) чи отримане (received)
    // У Socket.io ми отримуємо своє ж повідомлення назад, тому треба це врахувати
    div.className = `chat-message ${msg.senderId === user.id ? 'sent' : 'received'}`;
    div.innerHTML = `
        <span class="text">${msg.text}</span>
        <span class="time">${msg.time}</span>
    `;
    container.appendChild(div);
}

export async function sendPrivateMessage() {
    const user = utils.getCurrentUser();
    if (!user) return;

    const otherUserId = parseInt(dom.privateChatModal?.dataset.otherUserId);
    const text = dom.privateChatInput?.value.trim();
    
    if (!otherUserId || !text) return;

    // ВІДПРАВЛЯЄМО ЧЕРЕЗ SOCKETS
    socket.emit('send_private_message', {
        senderId: user.id,
        receiverId: otherUserId,
        text: text
    });

    if (dom.privateChatInput) dom.privateChatInput.value = '';
}

// === CHAT LIST ===

export async function renderChatList() {
    const user = utils.getCurrentUser();
    if (!user) return;

    const chatList = document.getElementById('chatList');
    if (!chatList) return;
    chatList.innerHTML = '<p style="text-align:center;">Завантаження...</p>';

    try {
        const res = await fetch(`${API_URL}/my-chats/${user.id}`);
        const userChats = await res.json();

        chatList.innerHTML = '';
        if (userChats.length === 0) {
            chatList.innerHTML = '<p style="text-align: center; color: #888;">У вас ще немає чатів.</p>';
            return;
        }

        userChats.forEach(({ otherUser, lastMessage }) => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.userId = otherUser.id;
            
            chatItem.innerHTML = `
                <img src="${otherUser.avatarBase64 || 'https://via.placeholder.com/40'}" alt="${otherUser.name}">
                <div class="chat-info">
                    <div class="username">${otherUser.username}</div>
                    <div class="last-message">${lastMessage.text}</div>
                </div>
                <div class="time">${lastMessage.time}</div>
            `;
            chatList.appendChild(chatItem);
        });

    } catch (e) {
        chatList.innerHTML = '<p>Помилка завантаження</p>';
    }
}