import * as dom from './dom.js';
import * as utils from './utils.js';
import { renderInterests } from './ui.js';
import { loadEventChat } from './chat.js';

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export async function handleJoinEvent(event, callback) {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Будь ласка, увійдіть', 'info');
        return false;
    }
    try {
        const res = await fetch('http://localhost:5000/api/events/join', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ userId: user.id, eventId: event.eventId })
        });
        if (res.ok) {
            if (callback) callback();
            return true;
        } else {
            utils.showToast('Помилка приєднання', 'error');
            return false;
        }
    } catch (e) { return false; }
}

export async function handleLeaveEvent(event, callback) {
    const user = utils.getCurrentUser();
    if (!user) return;
    try {
        const res = await fetch('http://localhost:5000/api/events/leave', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ userId: user.id, eventId: event.eventId })
        });
        if (res.ok) {
            utils.showToast('Ви покинули подію', 'info');
            if (callback) callback();
        }
    } catch (e) { console.error(e); }
}

export async function handleDeleteEvent(eventId) {
    if(!confirm('Видалити цю подію?')) return;
    try {
        const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            utils.showToast('Подію видалено', 'success');
            utils.closeModal(dom.eventDetailModal);
            const updatedEvents = await utils.getEvents();
            renderEvents(updatedEvents);
        }
    } catch (e) { utils.showToast('Помилка видалення', 'error'); }
}

export const createEventValidations = [
    { inputId: 'eventTitle', errorId: 'eventTitleError', validationFn: v => v.length >= 3, errorMessage: 'Назва: від 3 символів' }
];

export async function handleCreateEventSubmit(e) {
    e.preventDefault();
    const user = utils.getCurrentUser();
    if (!user) return;

    const selectedInterests = Array.from(dom.eventInterestsContainer?.querySelectorAll('.interest-tag.selected') || []).map(tag => tag.dataset.interest);
    
    const newEvent = {
        title: dom.eventTitle?.value.trim(),
        description: dom.eventDescription?.value.trim(),
        category: dom.eventCategory?.value,
        location: dom.eventLocation?.value.trim(),
        date: dom.eventDate?.value,
        participants: parseInt(dom.eventParticipants?.value),
        minParticipants: parseInt(document.getElementById('eventMinParticipants')?.value) || 0,
        creatorId: user.id,
        interests: selectedInterests
    };

    try {
        const res = await fetch('http://localhost:5000/api/events', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newEvent)
        });

        if (res.ok) {
            utils.closeModal(dom.createEventModal);
            dom.createEventForm.reset();
            const updatedEvents = await utils.getEvents();
            renderEvents(updatedEvents);
            utils.showToast('Подію створено!', 'success');
        } else {
            utils.showToast('Помилка створення', 'error');
        }
    } catch (e) { utils.showToast('Помилка з\'єднання', 'error'); }
}

export const editEventValidations = [
    { inputId: 'editEventTitle', errorId: 'editEventTitleError', validationFn: v => v.length >= 3, errorMessage: 'Назва: від 3 символів' }
];

export function openEditEventModal(event) {
    const user = utils.getCurrentUser();
    if (!user || user.id !== event.creatorId) return;

    document.getElementById('editEventTitle').value = event.title;
    document.getElementById('editEventDescription').value = event.description;
    document.getElementById('editEventCategory').value = event.category;
    document.getElementById('editEventLocation').value = event.location;
    document.getElementById('editEventDate').value = event.date; 
    document.getElementById('editEventParticipants').value = event.participants;
    
    const container = document.getElementById('editEventInterestsContainer');
    renderInterests(container, event.interests, () => {});
    
    dom.editEventForm.dataset.eventId = event.eventId;
    utils.closeModal(dom.eventDetailModal);
    utils.openModal(dom.editEventModal);
}

export async function handleEditEventSubmit(e) {
    e.preventDefault();
    const eventId = dom.editEventForm.dataset.eventId;
    
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
        const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            utils.showToast('Подію оновлено', 'success');
            utils.closeModal(dom.editEventModal);
            const updatedEvents = await utils.getEvents();
            renderEvents(updatedEvents);
        } else {
            utils.showToast('Помилка оновлення', 'error');
        }
    } catch (error) {
        utils.showToast('Помилка сервера', 'error');
    }
}

export function handleAddEditEventInterest() {
    const input = document.getElementById('editEventCustomInterestInput');
    const interest = input.value.trim();
    if(interest) {
        const container = document.getElementById('editEventInterestsContainer');
        const span = document.createElement('span');
        span.className = 'interest-tag selected';
        span.dataset.interest = interest;
        span.textContent = interest;
        container.appendChild(span);
        input.value = '';
    }
}

// === RENDER ===
export function filterEvents(events) {
    const query = dom.searchQueryInput?.value.toLowerCase().trim() || '';
    const loc = dom.locationInput?.value.toLowerCase().trim() || '';
    const cat = dom.categorySelect?.value || '';
    
    return events.filter(e => {
        const matchesQuery = !query || e.title.toLowerCase().includes(query);
        const matchesLoc = !loc || e.location.toLowerCase().includes(loc);
        const matchesCat = !cat || e.category === cat;
        return matchesQuery && matchesLoc && matchesCat;
    });
}

export function renderEvents(events, isArchive = false) {
    const track = dom.eventsHorizontalTrack;
    const eventCount = dom.eventCount;
    if (!track) return;

    track.innerHTML = '';
    const filteredEvents = filterEvents(events).sort((a, b) => b.eventId - a.eventId);
    if (eventCount) eventCount.textContent = `(${filteredEvents.length})`;

    if (filteredEvents.length === 0) {
        track.innerHTML = isArchive 
            ? '<p style="color: #888; width: 100%; text-align: center; padding: 20px;">Архів порожній.</p>' 
            : '<p style="color: #888; width: 100%; text-align: center; padding: 20px;">Подій немає.</p>';
        return;
    }

    const currentUser = utils.getCurrentUser();

    filteredEvents.forEach(event => {
        let statusBadge = '';
        if (isArchive) {
            statusBadge = '<span style="color: #64748b; font-size: 0.7em; margin-left: 8px; border: 1px solid #ccc; padding: 2px 6px; border-radius: 4px;">Завершено</span>';
        } else if (event.minParticipants > 0) {
            if (event.currentParticipants >= event.minParticipants) {
                statusBadge = '<span style="color: #10b981; font-size: 0.7em; margin-left: 8px; font-weight: bold;">✓ Відбудеться</span>';
            } else {
                const needed = event.minParticipants - event.currentParticipants;
                statusBadge = `<span style="color: #f59e0b; font-size: 0.7em; margin-left: 8px;">Ще ${needed} до підтвердження</span>`;
            }
        }

        const card = document.createElement('div');
        card.className = 'event-card-horizontal';
        card.dataset.eventId = event.eventId;
        if (isArchive) card.style.opacity = '0.7';
        
        const interestsHtml = event.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');
        
        let buttonHtml = '';
        if (currentUser && currentUser.id === event.creatorId) {
            buttonHtml = `<button class="card-action-button card-action-organizer" disabled style="background: #f1f5f9; color: #6b21a8; cursor: default;"><i class="fas fa-crown"></i> Ви організатор</button>`;
        } else if (!isArchive) {
            buttonHtml = `<button class="card-action-button join-btn-v4" data-event-id="${event.eventId}"><i class="fas fa-plus"></i> Приєднатися</button>`;
        }

        card.innerHTML = `
            <div class="card-content-v4">
                <h3 class="card-title-v4">${event.title} ${statusBadge}</h3>
                <ul class="card-meta-list-v4">
                    <li class="meta-item-v4"><i class="fas fa-calendar-alt"></i><span>${utils.formatEventDate(event.date)}</span></li>
                    <li class="meta-item-v4"><i class="fas fa-map-marker-alt"></i><span>${event.location}</span></li>
                </ul>
                <div class="card-interests-v4">${interestsHtml}</div>
                <div class="card-footer-v4">
                    <div class="creator-info-v4" data-user-id="${event.creatorId}">
                        <span>ID організатора: ${event.creatorId}</span>
                    </div>
                    <span class="card-participants-v4">
                        <i class="fas fa-users"></i> ${event.currentParticipants}/${event.participants}
                    </span>
                </div>
            </div>
            ${buttonHtml}
        `;
        track.appendChild(card);
    });
}

export function updateScrollButtons() {
    const track = dom.eventsHorizontalTrack;
    if (!track || !dom.scrollLeftBtn) return;
    dom.scrollLeftBtn.disabled = track.scrollLeft <= 10;
}

export async function openEventDetail(event) {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб переглянути деталі', 'error');
        return;
    }
    
    dom.eventDetailModal.dataset.currentEventId = event.eventId;
    localStorage.setItem('currentEvent', JSON.stringify(event));
    
    document.getElementById('eventDetailTitle').textContent = event.title;
    document.getElementById('eventDetailDescription').textContent = event.description;
    document.getElementById('eventDetailInterests').innerHTML = event.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');
    document.getElementById('eventDetailParticipantsCount').textContent = `${event.currentParticipants}/${event.participants} учасників`;

    // --- УЧАСНИКИ ---
    const participantsContainer = document.getElementById('eventDetailParticipants');
    if (participantsContainer) {
        participantsContainer.innerHTML = '<p style="color:#888; font-size:0.9em;">Завантаження...</p>';
        try {
            const res = await fetch(`http://localhost:5000/api/events/${event.eventId}/participants`);
            const participants = await res.json();
            
            if (participants.length === 0) {
                participantsContainer.innerHTML = '<p style="color:#888;">Поки ніхто не приєднався</p>';
            } else {
                participantsContainer.innerHTML = '';
                participants.forEach(p => {
                    const pEl = document.createElement('div');
                    pEl.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 5px; cursor: pointer;';
                    pEl.innerHTML = `
                        <img src="${p.avatarBase64 || 'https://via.placeholder.com/40'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                        <span style="font-size: 0.9em; font-weight: 500;">${p.name} (@${p.username})</span>
                    `;
                    pEl.addEventListener('click', () => {
                        utils.closeModal(dom.eventDetailModal);
                        import('./user.js').then(module => module.openOtherUserProfile(p.id));
                    });
                    participantsContainer.appendChild(pEl);
                });
            }
        } catch (e) {
            participantsContainer.innerHTML = '<p style="color:red;">Помилка завантаження</p>';
        }
    }

    // --- КАРТА ---
    const mapContainer = document.getElementById('eventMap');
    if (mapContainer) {
        mapContainer.innerHTML = '';
        if (utils.map) { utils.map.off(); utils.map.remove(); utils.setMap(null); }

        const address = encodeURIComponent(event.location);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${address}&format=json&limit=1`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newMap = L.map(mapContainer).setView([lat, lon], 15);
                utils.setMap(newMap);
                const isDark = document.body.classList.contains('dark-theme');
                const tileUrl = isDark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                L.tileLayer(tileUrl, { attribution: '© OpenStreetMap' }).addTo(newMap);
                L.marker([lat, lon]).addTo(newMap).bindPopup(event.location).openPopup();
                setTimeout(() => newMap.invalidateSize(), 300);
            } else {
                mapContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#888;">Не вдалося знайти місце</div>';
            }
        } catch (e) {
            mapContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#888;">Помилка карти</div>';
        }
    }

    // --- КНОПКИ ---
    const joinBtn = document.getElementById('joinEventBtn');
    const leaveBtn = document.getElementById('leaveEventBtn');
    const deleteBtn = document.getElementById('deleteEventBtn');
    const editBtn = document.getElementById('editEventBtn');
    
    const joinedEvents = await utils.getJoinedEvents();
    const isJoined = joinedEvents[user.id] && joinedEvents[user.id].includes(event.eventId);

    if (user.id === event.creatorId) {
        joinBtn.style.display = 'none';
        leaveBtn.style.display = 'none';
        deleteBtn.style.display = 'inline-block';
        editBtn.style.display = 'inline-block';
        
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        newDeleteBtn.addEventListener('click', () => handleDeleteEvent(event.eventId));

        const newEditBtn = editBtn.cloneNode(true);
        editBtn.parentNode.replaceChild(newEditBtn, editBtn);
        newEditBtn.addEventListener('click', () => openEditEventModal(event));

    } else {
        deleteBtn.style.display = 'none';
        editBtn.style.display = 'none';
        
        if (isJoined) {
            joinBtn.style.display = 'none';
            leaveBtn.style.display = 'inline-block';
            
            const newLeaveBtn = leaveBtn.cloneNode(true);
            leaveBtn.parentNode.replaceChild(newLeaveBtn, leaveBtn);
            newLeaveBtn.addEventListener('click', () => handleLeaveEvent(event, () => openEventDetail(event)));
        } else {
            joinBtn.style.display = 'inline-block';
            leaveBtn.style.display = 'none';
            
            const newJoinBtn = joinBtn.cloneNode(true);
            joinBtn.parentNode.replaceChild(newJoinBtn, joinBtn);
            newJoinBtn.addEventListener('click', () => handleJoinEvent(event, () => openEventDetail(event)));
        }
    }

    loadEventChat(event.eventId);
    utils.openModal(dom.eventDetailModal);
}