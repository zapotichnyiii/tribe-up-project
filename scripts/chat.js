import * as utils from './utils.js';

export function renderChatList() {
    window.location.href = '/chat.html';
}

export function loadPrivateChat(userId) {
    if (!userId) return;
    window.location.href = `/chat.html?userId=${userId}`;
}

export function sendChatMessage(eventId) {
    console.warn('Use event_page.js logic instead');
}

export function sendPrivateMessage() {
    console.warn('Use chat_page.js logic instead');
}