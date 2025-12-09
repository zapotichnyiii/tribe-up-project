import * as utils from '../utils.js';
import * as ui from '../ui.js';
import { initSharedComponents } from '../shared.js';

const socket = io('http://localhost:5000');
const urlParams = new URLSearchParams(window.location.search);
const eventId = parseInt(urlParams.get('id'));

// Елементи сторінки
const els = {
    loadingState: document.getElementById('eventLoadingState'),
    content: document.getElementById('eventContent'),
    
    // Header & Meta
    title: document.getElementById('pageEventTitle'),
    date: document.getElementById('pageEventDate'),
    locationText: document.getElementById('pageEventLocationText'),
    categoryBadge: document.getElementById('eventCategoryBadge'),
    statusBadge: document.getElementById('eventStatusBadge'),
    statusText: document.getElementById('eventStatusText'),
    breadcrumbCategory: document.getElementById('breadcrumbCategory'),
    
    // Main Content
    description: document.getElementById('pageEventDescription'),
    interests: document.getElementById('pageEventInterests'),
    
    // Organizer
    organizerAvatar: document.getElementById('organizerAvatar'),
    organizerName: document.getElementById('organizerName'),
    organizerUsername: document.getElementById('organizerUsername'),
    organizerProfileBtn: document.getElementById('organizerProfileBtn'),
    
    // Sidebar & Actions
    actionArea: document.getElementById('actionArea'),
    spotsLeft: document.getElementById('spotsLeftText'),
    participantsCount: document.getElementById('pageParticipantsCount'),
    maxParticipants: document.getElementById('pageMaxParticipants'),
    participantsList: document.getElementById('pageParticipantsList'),
    
    // Chat Widget
    chatWidget: document.getElementById('eventChatWidget'),
    chatInputArea: document.getElementById('chatWidgetInputArea'),
    chatInput: document.getElementById('eventChatInput'),
    chatSendBtn: document.getElementById('eventChatSendBtn'),
    
    // Creator Controls
    creatorControls: document.getElementById('creatorControls'),
    editBtn: document.getElementById('editEventBtn'),
    deleteBtn: document.getElementById('deleteEventBtn')
};

let currentEvent = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ініціалізація
    await initSharedComponents(socket);
    currentUser = utils.getCurrentUser();

    if (!eventId) {
        window.location.href = '/'; // Якщо немає ID, на головну
        return;
    }

    // 2. Завантаження даних
    await loadEventData();
});

async function loadEventData() {
    try {
        // Оскільки у нас немає окремого endpoint для однієї події (поки що), 
        // беремо всі і шукаємо потрібну. В ідеалі backend має мати /api/events/:id
        const allEvents = await utils.getEvents('active'); 
        currentEvent = allEvents.find(e => e.eventId === eventId);

        // Якщо в активних не знайшли, спробуємо знайти в "завершених" (якщо є такий механізм)
        // або просто покажемо помилку, якщо API не повернув подію
        if (!currentEvent) {
            // Спробуємо отримати "всі", включаючи архівні, якщо API дозволяє, або просто виведемо помилку
            // Для демо припустимо, що подія є або показуємо заглушку
             document.querySelector('.event-page-container').innerHTML = 
                '<div style="text-align:center; padding:50px;"><h2>Подію не знайдено або вона завершена</h2><a href="/" class="btn btn-accent">На головну</a></div>';
             return;
        }

        renderEventPage(currentEvent);
        
        // Після рендеру прибираємо лоадер
        els.loadingState.style.display = 'none';
        els.content.style.display = 'block';

        // Ініціалізація карти (потрібно трохи часу, щоб контейнер став видимим)
        setTimeout(() => initMap(currentEvent.location), 100);

        // Підключаємо чат
        setupChat();

    } catch (e) {
        console.error('Error loading event:', e);
        utils.showToast('Помилка завантаження події', 'error');
    }
}

async function renderEventPage(event) {
    // 1. Basic Info
    els.title.textContent = event.title;
    els.date.textContent = utils.formatEventDate(event.date); // + час бажано
    els.locationText.textContent = event.location;
    els.description.textContent = event.description;
    
    // Category & Breadcrumbs
    const catName = getCategoryName(event.category);
    els.categoryBadge.textContent = catName;
    els.breadcrumbCategory.textContent = catName;

    // Status (проста логіка)
    const isFull = event.currentParticipants >= event.participants;
    if (isFull) {
        els.statusBadge.style.color = '#ef4444'; // Red
        els.statusText.textContent = 'Місць немає';
    } else {
        els.statusText.textContent = 'Реєстрація відкрита';
    }

    // Interests
    els.interests.innerHTML = event.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');

    // 2. Organizer Info (потрібно отримати дані юзера)
    const users = await utils.getUsers();
    const creator = users.find(u => u.id === event.creatorId);
    
    if (creator) {
        els.organizerName.textContent = creator.name;
        els.organizerUsername.textContent = creator.username;
        els.organizerAvatar.src = creator.avatarBase64 || 'https://via.placeholder.com/60';
        
        els.organizerProfileBtn.onclick = () => {
            // Перехід на профіль організатора
            window.location.href = `/user.html?id=${creator.id}`;
        };
    }

    // 3. Participants & Stats
    els.participantsCount.textContent = event.currentParticipants;
    els.maxParticipants.textContent = event.participants;
    
    const spotsLeft = event.participants - event.currentParticipants;
    els.spotsLeft.textContent = isFull ? 'На жаль, місць більше немає' : `Залишилось місць: ${spotsLeft}`;
    if(spotsLeft > 5) els.spotsLeft.style.color = 'var(--main-secondary-color)'; // Не червоний, якщо місць багато

    loadParticipants(event.eventId);

    // 4. Action Buttons (Join/Leave/Edit)
    renderActionButtons(event, isFull);
}

async function loadParticipants(id) {
    try {
        const res = await fetch(`http://localhost:5000/api/events/${id}/participants`);
        const participants = await res.json();
        
        els.participantsList.innerHTML = '';
        participants.forEach(p => {
            const img = document.createElement('img');
            img.src = p.avatarBase64 || 'https://via.placeholder.com/40';
            img.className = 'participant-avatar';
            img.title = p.username;
            img.onclick = () => window.location.href = `/user.html?id=${p.id}`;
            els.participantsList.appendChild(img);
        });
        
        // Якщо нікого немає
        if(participants.length === 0) {
            els.participantsList.innerHTML = '<span style="font-size:0.9em; color:#888;">Станьте першим!</span>';
        }

    } catch(e) { console.error(e); }
}

async function renderActionButtons(event, isFull) {
    const joinedData = await utils.getJoinedEvents();
    const isJoined = currentUser && joinedData[currentUser.id] && joinedData[currentUser.id].includes(event.eventId);
    const isCreator = currentUser && currentUser.id === event.creatorId;

    els.actionArea.innerHTML = '';

    if (!currentUser) {
        els.actionArea.innerHTML = `<button class="btn btn-accent" style="width:100%" onclick="window.location.href='/'">Увійдіть, щоб приєднатися</button>`;
        return;
    }

    if (isCreator) {
        // Автор бачить кнопки редагування
        els.creatorControls.style.display = 'flex';
        els.actionArea.innerHTML = `<button class="btn btn-outline" style="width:100%; cursor:default; background:#f8fafc;">Ви організатор цієї події</button>`;
        
        setupCreatorActions(event);
    } else if (isJoined) {
        // Вже учасник
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline';
        btn.style.width = '100%';
        btn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Скасувати участь';
        btn.onclick = async () => {
            if(confirm('Ви впевнені, що хочете покинути подію?')) {
                await handleLeave(event.eventId);
            }
        };
        els.actionArea.appendChild(btn);
        
        // Показуємо інпут чату тільки учасникам
        els.chatInputArea.style.display = 'flex';
    } else {
        // Гість (може приєднатися)
        const btn = document.createElement('button');
        btn.className = 'btn btn-accent';
        btn.style.width = '100%';
        
        if (isFull) {
            btn.disabled = true;
            btn.textContent = 'Місць немає';
        } else {
            btn.innerHTML = '<i class="fas fa-plus"></i> Приєднатися';
            btn.onclick = async () => {
                await handleJoin(event.eventId);
            };
        }
        els.actionArea.appendChild(btn);
        els.chatInputArea.style.display = 'none'; // Ховаємо чат від неучасників
    }
}

// --- Дії (Join/Leave) ---
async function handleJoin(eventId) {
    try {
        const res = await fetch('http://localhost:5000/api/events/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ userId: currentUser.id, eventId })
        });
        if (res.ok) {
            utils.showToast('Ви приєдналися!', 'success');
            setTimeout(() => location.reload(), 500);
        } else {
            utils.showToast('Помилка приєднання', 'error');
        }
    } catch(e) { console.error(e); }
}

async function handleLeave(eventId) {
    try {
        const res = await fetch('http://localhost:5000/api/events/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ userId: currentUser.id, eventId })
        });
        if (res.ok) {
            utils.showToast('Ви покинули подію', 'info');
            setTimeout(() => location.reload(), 500);
        }
    } catch(e) { console.error(e); }
}

function setupCreatorActions(event) {
    // Відкриття модалки редагування
    els.editBtn.onclick = () => {
        // Заповнюємо форму даними
        document.getElementById('editEventId').value = event.eventId; // або зберегти десь в dataset
        document.getElementById('editEventTitle').value = event.title;
        document.getElementById('editEventDescription').value = event.description;
        document.getElementById('editEventCategory').value = event.category;
        document.getElementById('editEventLocation').value = event.location;
        document.getElementById('editEventDate').value = event.date;
        document.getElementById('editEventParticipants').value = event.participants;
        
        const container = document.getElementById('editEventInterestsContainer');
        ui.renderInterests(container, event.interests, () => {});
        
        // Відкриваємо модалку (вона спільна, в HTML)
        const modal = document.getElementById('editEventModal');
        if(modal) utils.openModal(modal);
        
        // Додаємо ID події формі для обробника сабміту
        const form = document.getElementById('editEventForm');
        form.dataset.eventId = event.eventId;
    };

    els.deleteBtn.onclick = async () => {
        if(confirm('Видалити цю подію? Це незворотньо.')) {
            try {
                const res = await fetch(`http://localhost:5000/api/events/${event.eventId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    utils.showToast('Подію видалено', 'success');
                    setTimeout(() => window.location.href = '/', 1000);
                }
            } catch(e) { utils.showToast('Помилка видалення', 'error'); }
        }
    };
}

// --- Map Logic ---
function initMap(location) {
    const mapBox = document.getElementById('pageEventMap');
    if (!mapBox) return;
    
    // Очищаємо контейнер, якщо там щось було
    mapBox.innerHTML = ''; 

    // Використовуємо OpenStreetMap Nominatim для геокодування
    const address = encodeURIComponent(location);
    fetch(`https://nominatim.openstreetmap.org/search?q=${address}&format=json&limit=1`)
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const map = L.map(mapBox).setView([lat, lon], 15);
                
                const isDark = document.body.classList.contains('dark-theme');
                const tileUrl = isDark 
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
                    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                
                L.tileLayer(tileUrl, { attribution: '© OpenStreetMap' }).addTo(map);
                L.marker([lat, lon]).addTo(map).bindPopup(location).openPopup();
            } else {
                mapBox.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;">Локацію не знайдено на карті</div>';
            }
        })
        .catch(() => {
            mapBox.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;">Помилка карти</div>';
        });
}

// --- Chat Widget Logic ---
function setupChat() {
    if (!currentUser) return;

    // 1. Load History
    fetch(`http://localhost:5000/api/messages/event/${eventId}`)
        .then(res => res.json())
        .then(messages => {
            els.chatWidget.innerHTML = '';
            if(messages.length === 0) {
                els.chatWidget.innerHTML = '<div class="chat-placeholder">Поки що тихо...</div>';
            }
            messages.forEach(appendChatMessage);
            scrollToBottom();
        });

    // 2. Socket Join
    socket.emit('join', { room: `event_${eventId}` });

    // 3. Listen
    socket.on('receive_message', (msg) => {
        // Видаляємо плейсхолдер при першому повідомленні
        const placeholder = els.chatWidget.querySelector('.chat-placeholder');
        if(placeholder) placeholder.remove();
        
        appendChatMessage(msg);
        scrollToBottom();
    });

    // 4. Send
    els.chatSendBtn.onclick = sendMessage;
    els.chatInput.onkeypress = (e) => {
        if(e.key === 'Enter') sendMessage();
    };
}

function sendMessage() {
    const text = els.chatInput.value.trim();
    if(!text) return;
    
    socket.emit('send_event_message', {
        eventId: eventId,
        senderId: currentUser.id,
        text: text
    });
    
    els.chatInput.value = '';
}

function appendChatMessage(msg) {
    const div = document.createElement('div');
    // Стилізація повідомлення у віджеті (спрощена)
    div.style.cssText = "padding: 8px 10px; background: #f8fafc; border-radius: 8px; font-size: 0.9rem; border: 1px solid #eee;";
    
    const isMe = msg.senderId === currentUser.id;
    if(isMe) div.style.background = "#e0f2fe"; // Блакитний для мене

    div.innerHTML = `
        <div style="font-weight:600; font-size:0.8em; color:${isMe ? '#0284c7' : '#64748b'}; margin-bottom:2px;">
            ${msg.senderName} <span style="font-weight:400; opacity:0.7;">${msg.time}</span>
        </div>
        <div style="color:var(--main-dark-color);">${msg.text}</div>
    `;
    
    els.chatWidget.appendChild(div);
}

function scrollToBottom() {
    els.chatWidget.scrollTop = els.chatWidget.scrollHeight;
}

// Helpers
function getCategoryName(key) {
    const names = {
        'sports': 'Спорт', 'games': 'Ігри', 'arts': 'Мистецтво',
        'food': 'Їжа', 'outdoors': 'Природа', 'learning': 'Навчання',
        'social': 'Спілкування', 'music': 'Музика', 'travel': 'Подорожі',
        'boardgames': 'Настільні ігри'
    };
    return names[key] || 'Подія';
}

// Обробка форми редагування (вона тепер в модалці, але викликається з цієї сторінки)
const editForm = document.getElementById('editEventForm');
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Логіка збереження (повтор логіки з events.js, але адаптована)
        // Тут можна просто викликати API і перезавантажити сторінку
        const updatedData = {
            title: document.getElementById('editEventTitle').value,
            description: document.getElementById('editEventDescription').value,
            category: document.getElementById('editEventCategory').value,
            location: document.getElementById('editEventLocation').value,
            date: document.getElementById('editEventDate').value,
            participants: parseInt(document.getElementById('editEventParticipants').value),
            interests: Array.from(document.getElementById('editEventInterestsContainer').querySelectorAll('.selected')).map(el => el.dataset.interest)
        };

        try {
            const res = await fetch(`http://localhost:5000/api/events/${editForm.dataset.eventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(updatedData)
            });
            if (res.ok) {
                utils.showToast('Зміни збережено!', 'success');
                location.reload(); 
            }
        } catch(e) { console.error(e); }
    });
}

// Обробка додавання інтересу в формі редагування
const addIntBtn = document.getElementById('addEditEventCustomInterestBtn');
if(addIntBtn) {
    addIntBtn.addEventListener('click', () => {
        const input = document.getElementById('editEventCustomInterestInput');
        const val = input.value.trim();
        if(val) {
            const container = document.getElementById('editEventInterestsContainer');
            const span = document.createElement('span');
            span.className = 'interest-tag selected';
            span.dataset.interest = val;
            span.textContent = val;
            container.appendChild(span);
            input.value = '';
        }
    });
}