import * as dom from './dom.js';
import * as utils from './utils.js';

export function loadEventChat(eventId) {
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

export function sendChatMessage(eventId) {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб надіслати повідомлення', 'error');
        return;
    }
    
    const input = document.getElementById('contactInput');
    if (!input) {
        console.error('Поле вводу чату не знайдено');
        return;
    }
    
    const text = input.value.trim();
    if (!text) {
        utils.showToast('Введіть повідомлення', 'error');
        return;
    }

    const chatData = JSON.parse(localStorage.getItem(`eventChat_${eventId}`) || '[]');
    chatData.push({
        sender: user.username,
        text: text,
        time: utils.formatTime(),
        timestamp: Date.now()
    });
    
    try {
        localStorage.setItem(`eventChat_${eventId}`, JSON.stringify(chatData));
        input.value = '';
        loadEventChat(eventId);
        utils.showToast('Повідомлення надіслано', 'success');
    } catch (error) {
        console.error('Помилка збереження повідомлення:', error);
        utils.showToast('Помилка надсилання повідомлення', 'error');
    }
}

export function loadPrivateChat(otherUserId) {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб переглядати чати', 'error');
        return;
    }

    const chatId = utils.getChatId(user.id, otherUserId);
    const chats = utils.getPrivateChats();
    const chatData = chats[chatId] || [];
    if (dom.privateChatMessages) {
        dom.privateChatMessages.innerHTML = '';

        chatData.forEach(msg => {
            if (!msg.senderId || !msg.text || !msg.time) return;
            const div = document.createElement('div');
            div.className = `chat-message ${msg.senderId === user.id ? 'sent' : 'received'}`;
            div.innerHTML = `
                <span class="text">${msg.text}</span>
                <span class="time">${msg.time}</span>
            `;
            dom.privateChatMessages.appendChild(div);
        });
        dom.privateChatMessages.scrollTop = dom.privateChatMessages.scrollHeight;

        const otherUser = utils.getUsers().find(u => u.id === otherUserId);
        const privateChatTitle = document.getElementById('privateChatTitle');
        if (privateChatTitle) {
            privateChatTitle.textContent = otherUser ? `@${otherUser.username}` : 'Чат';
        }

        if (dom.privateChatModal) dom.privateChatModal.dataset.otherUserId = otherUserId;
    }
}

export function sendPrivateMessage() {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб надіслати повідомлення', 'error');
        return;
    }

    const otherUserId = parseInt(dom.privateChatModal?.dataset.otherUserId);
    if (!otherUserId) {
        utils.showToast('Помилка: користувача не вибрано', 'error');
        return;
    }

    const text = dom.privateChatInput?.value.trim();
    if (!text) {
        utils.showToast('Введіть повідомлення', 'error');
        return;
    }

    const chatId = utils.getChatId(user.id, otherUserId);
    const chats = utils.getPrivateChats();
    if (!chats[chatId]) chats[chatId] = [];

    chats[chatId].push({
        senderId: user.id,
        text,
        time: utils.formatTime(),
        timestamp: Date.now()
    });

    try {
        utils.savePrivateChats(chats);
        if (dom.privateChatInput) dom.privateChatInput.value = '';
        loadPrivateChat(otherUserId);
        utils.showToast('Повідомлення надіслано', 'success');
    } catch (error) {
        console.error('Помилка надсилання повідомлення:', error);
        utils.showToast('Помилка надсилання повідомлення', 'error');
    }
}

export function renderChatList() {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб переглядати чати', 'error');
        return;
    }

    const chatList = document.getElementById('chatList');
    if (!chatList) return;
    chatList.innerHTML = '';

    const chats = utils.getPrivateChats();
    const users = utils.getUsers();
    const userChats = Object.keys(chats)
        .filter(chatId => chatId.split('_').includes(user.id.toString()))
        .map(chatId => {
            const [user1Id, user2Id] = chatId.split('_').map(Number);
            const otherUserId = user1Id === user.id ? user2Id : user1Id;
            const otherUser = users.find(u => u.id === otherUserId);
            if (!otherUser) return null;

            const messages = chats[chatId] || [];
            const lastMessage = messages[messages.length - 1] || { text: 'Немає повідомлень', time: '', timestamp: 0 };
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
}