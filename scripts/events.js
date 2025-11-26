import * as dom from './dom.js';
import * as utils from './utils.js';
import { openOtherUserProfile } from './user.js';
import { loadEventChat, sendChatMessage } from './chat.js';
import { updateAllInterestContainers, renderInterests } from './ui.js';

export function handleJoinEvent(event, callback) {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Будь ласка, увійдіть у систему', 'info');
        return false;
    }

    let joinedEvents = utils.getJoinedEvents();
    if (!joinedEvents[user.id]) joinedEvents[user.id] = [];

    if (joinedEvents[user.id].includes(event.eventId)) {
        utils.showToast('Ви вже приєдналися до події', 'info');
        return false;
    }
    if (event.currentParticipants >= event.participants) {
        utils.showToast('Подія вже заповнена', 'error');
        return false;
    }

    event.currentParticipants++;
    joinedEvents[user.id].push(event.eventId);
    utils.saveJoinedEvents(joinedEvents);

    const allEvents = utils.getEvents();
    const idx = allEvents.findIndex(e => e.eventId === event.eventId);
    if (idx !== -1) {
        allEvents[idx] = event;
        utils.saveEvents(allEvents);
    }

    if (callback) callback();
    return true;
}

export function handleLeaveEvent(event, callback) {
    const user = utils.getCurrentUser();
    if (!user || user.id === event.creatorId) {
        utils.showToast('Організатор не може покинути подію', 'error');
        return;
    }

    let joinedEvents = utils.getJoinedEvents();
    if (!joinedEvents[user.id]?.includes(event.eventId)) {
        utils.showToast('Ви не є учасником цієї події', 'info');
        return;
    }

    event.currentParticipants = Math.max(1, event.currentParticipants - 1);
    joinedEvents[user.id] = joinedEvents[user.id].filter(id => id !== event.eventId);
    if (joinedEvents[user.id].length === 0) delete joinedEvents[user.id];
    utils.saveJoinedEvents(joinedEvents);

    const allEvents = utils.getEvents();
    const idx = allEvents.findIndex(e => e.eventId === event.eventId);
    if (idx !== -1) {
        allEvents[idx] = event;
        utils.saveEvents(allEvents);
    }

    if (callback) callback();
    utils.showToast('Ви покинули подію', 'info');
}

export function handleDeleteEvent(eventId) {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб видалити подію', 'error');
        return;
    }

    let events = utils.getEvents();
    const event = events.find(e => e.eventId === eventId);
    if (!event || event.creatorId !== user.id) {
        utils.showToast('Ви не можете видалити цю подію', 'error');
        return;
    }

    events = events.filter(e => e.eventId !== eventId);
    utils.saveEvents(events);

    let joinedEvents = utils.getJoinedEvents();
    Object.keys(joinedEvents).forEach(userId => {
        joinedEvents[userId] = joinedEvents[userId].filter(id => id !== eventId);
        if (joinedEvents[userId].length === 0) delete joinedEvents[userId];
    });
    utils.saveJoinedEvents(joinedEvents);

    localStorage.removeItem(`eventChat_${eventId}`);
    utils.showToast('Подію видалено', 'success');
    renderEvents(events);
    if (dom.eventDetailModal) utils.closeModal(dom.eventDetailModal);
}

export function filterEvents(events) {
    const query = dom.searchQueryInput?.value.toLowerCase().trim() || '';
    const loc = dom.locationInput?.value.toLowerCase().trim() || '';
    const cat = dom.categorySelect?.value || '';
    const date = dom.dateInput?.value || '';
    const range = dom.peopleSelect?.value || '';
    const distance = parseInt(dom.distanceInput?.value) || 0;
    const sort = dom.sortSelect?.value || '';
    const status = dom.statusSelect?.value || '';
    const interest = dom.interestSearchInput?.value.toLowerCase().trim() || '';

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
        const matchesDistance = distance === 0 || true; // Логіка відстані не реалізована, просто заглушка

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

export function renderEvents(events) {
    const track = dom.eventsHorizontalTrack;
    const eventCount = dom.eventCount;
    if (!track || !eventCount) return;

    track.innerHTML = '';
    const filteredEvents = filterEvents(events).sort((a, b) => b.eventId - a.eventId);
    eventCount.textContent = `(${filteredEvents.length})`;

    if (filteredEvents.length === 0) {
        track.innerHTML = '<p style="color: #888; padding: 15px; text-align: center; width: 100%;">Подій немає. Створіть першу!</p>';
        return;
    }

    const user = utils.getCurrentUser();
    const joinedEvents = utils.getJoinedEvents();
    const userJoined = user ? (joinedEvents[user.id] || []) : [];
    const users = utils.getUsers();

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
            buttonHtml = `<button class="card-action-button card-action-organizer" disabled><i class="fas fa-crown"></i> Ви організатор</button>`;
        } else if (isJoined) {
            buttonHtml = `<button class="card-action-button" disabled><i class="fas fa-check"></i> Приєднано</button>`;
        } else if (isFull) {
            buttonHtml = `<button class="card-action-button" disabled><i class="fas fa-times-circle"></i> Подія повна</button>`;
        } else {
            buttonHtml = `<button class="card-action-button join-btn-v4" data-event-id="${event.eventId}"><i class="fas fa-plus"></i> Приєднатися</button>`;
        }
        card.innerHTML = `
            <div class="card-content-v4">
                <h3 class="card-title-v4">${event.title}</h3>
                <ul class="card-meta-list-v4">
                    <li class="meta-item-v4"><i class="fas fa-calendar-alt"></i><span>${utils.formatEventDate(event.date)}</span></li>
                    <li class="meta-item-v4"><i class="fas fa-map-marker-alt"></i><span>${event.location}</span></li>
                </ul>
                <div class="card-interests-v4">${interestsHtml || '<span class="interest-tag">немає тегів</span>'}</div>
                <div class="card-footer-v4">
                    <div class="creator-info-v4" data-user-id="${creator.id}">
                        <img src="${creator.avatarBase64}" alt="${creator.name}" loading="lazy">
                        <span>@${creator.username}</span>
                    </div>
                    <span class="card-participants-v4"><i class="fas fa-users"></i> ${event.currentParticipants}/${event.participants}</span>
                </div>
            </div>
            ${buttonHtml}
        `;
        track.appendChild(card);
    });

    // Оновлення кнопок прокрутки
    updateScrollButtons();
}

export function updateScrollButtons() {
    const track = dom.eventsHorizontalTrack;
    if (!track || !dom.scrollLeftBtn || !dom.scrollRightBtn) return;
    
    const canScrollLeft = track.scrollLeft > 10;
    const canScrollRight = track.scrollLeft < (track.scrollWidth - track.clientWidth - 10);

    dom.scrollLeftBtn.disabled = !canScrollLeft;
    dom.scrollRightBtn.disabled = !canScrollRight;
}

export function openEventDetail(event) {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб переглянути деталі', 'error');
        return;
    }

    dom.eventDetailModal.dataset.currentEventId = event.eventId;
    localStorage.setItem('currentEvent', JSON.stringify(event));

    const users = utils.getUsers();
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
                ${event.location} | ${utils.formatEventDate(event.date)}
            </div>
        `;
    }
    if (eventDetailDescription) eventDetailDescription.textContent = event.description;
    if (eventDetailInterests) eventDetailInterests.innerHTML = event.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');
    if (eventDetailParticipantsCount) eventDetailParticipantsCount.textContent = `${event.currentParticipants}/${event.participants} учасників`;

    const participantsContainer = document.getElementById('eventDetailParticipants');
    if (participantsContainer) {
        participantsContainer.innerHTML = '';
        const joinedEvents = utils.getJoinedEvents();
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
                    <img src="${p.avatarBase64 || 'https://via.placeholder.com/40?text=' + p.username[0]}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" loading="lazy">
                    <div>
                        <div style="font-weight: 600; font-size: 0.9em;">${p.name}</div>
                        <div style="font-size: 0.75em; color: #666;">${p.location}</div>
                    </div>
                `;
                participantsContainer.appendChild(div);
            });
        }
    }

    const mapContainer = document.getElementById('eventMap');
    if (mapContainer) {
        mapContainer.innerHTML = '';
        if (utils.map) {
            utils.map.off();
            utils.map.remove();
            utils.setMap(null);
        }

        const address = encodeURIComponent(event.location);
        fetch(`https://nominatim.openstreetmap.org/search?q=${address}&format=json&limit=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    const newMap = L.map(mapContainer, { zoomControl: true }).setView([lat, lon], 15);
                    utils.setMap(newMap);
                    
                    const tileUrl = document.body.classList.contains('dark-theme')
                        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                    const attribution = document.body.classList.contains('dark-theme')
                        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> & <a href="https://carto.com/attributions">CARTO</a>'
                        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
                    
                    L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(newMap);
                    const marker = L.marker([lat, lon]).addTo(newMap).bindPopup(`<b>${event.title}</b><br>${event.location}`);
                    marker.openPopup();
                    
                    setTimeout(() => { if (utils.map) utils.map.invalidateSize(); }, 300);
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
            actionsContainer.innerHTML = `<p style="color: var(--main-accent-color); font-weight: 600; text-align: center; margin: 12px 0;">Ви організатор цієї події</p>`;
        } else {
            const isJoined = (utils.getJoinedEvents()[user.id] || []).includes(event.eventId);
            const isFull = event.currentParticipants >= event.participants;

            if (isJoined) {
                joinBtn.style.display = 'none';
                leaveBtn.style.display = 'inline-block';
            } else if (isFull) {
                joinBtn.textContent = 'Повна';
                joinBtn.disabled = true;
                joinBtn.style.display = 'inline-block';
                leaveBtn.style.display = 'none';
            } else {
                joinBtn.textContent = 'Приєднатися';
                joinBtn.disabled = false;
                joinBtn.style.display = 'inline-block';
                leaveBtn.style.display = 'none';
            }
            deleteBtn.style.display = 'none';
            editBtn.style.display = 'none';
            actionsContainer.innerHTML = '';
            actionsContainer.appendChild(joinBtn);
            actionsContainer.appendChild(leaveBtn);
        }
    }

    utils.openModal(dom.eventDetailModal);
}

export const createEventValidations = [
    { inputId: 'eventTitle', errorId: 'eventTitleError', validationFn: v => v.length >= 3, errorMessage: 'Назва: від 3 символів' },
    { inputId: 'eventDescription', errorId: 'eventDescriptionError', validationFn: v => v.length >= 10, errorMessage: 'Опис: від 10 символів' },
    { inputId: 'eventCategory', errorId: 'eventCategoryError', validationFn: v => v !== "", errorMessage: 'Оберіть категорію' },
    { inputId: 'eventLocation', errorId: 'eventLocationError', validationFn: v => v.length >= 2, errorMessage: 'Місце: від 2 символів' },
    { inputId: 'eventDate', errorId: 'eventDateError', validationFn: v => new Date(v) > new Date(), errorMessage: 'Дата: у майбутньому' },
    { inputId: 'eventParticipants', errorId: 'eventParticipantsError', validationFn: v => v >= 2 && v <= 100, errorMessage: 'Учасники: від 2 до 100' }
];

export function handleCreateEventSubmit(e) {
    e.preventDefault();
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб створити подію', 'error');
        return;
    }
    const selectedInterests = Array.from(dom.eventInterestsContainer?.querySelectorAll('.interest-tag.selected') || []).map(tag => tag.dataset.interest);
    if (selectedInterests.length < 1) {
        utils.showToast('Виберіть хоча б один інтерес', 'error');
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

    if (!createEventValidations.every(v => utils.validateInput(dom.createEventForm.querySelector(`#${v.inputId}`), dom.createEventForm.querySelector(`#${v.errorId}`), v.validationFn, v.errorMessage))) {
        utils.showToast('Заповніть усі поля коректно', 'error');
        // Логіка показу кроку з помилкою вже вбудована в showEventStep
        return;
    }

    const newEvent = {
        eventId: utils.nextEventId,
        title: dom.eventTitle?.value.trim(),
        description: dom.eventDescription?.value.trim(),
        category: dom.eventCategory?.value,
        location: dom.eventLocation?.value.trim(),
        date: dom.eventDate?.value,
        participants: parseInt(dom.eventParticipants?.value),
        currentParticipants: 1,
        creatorId: user.id,
        interests: selectedInterests
    };

    utils.setNextEventId(utils.nextEventId + 1);
    const events = utils.getEvents();
    events.unshift(newEvent);
    utils.saveEvents(events);

    let joinedEvents = utils.getJoinedEvents();
    if (!joinedEvents[user.id]) joinedEvents[user.id] = [];
    joinedEvents[user.id].push(newEvent.eventId);
    utils.saveJoinedEvents(joinedEvents);

    utils.closeModal(dom.createEventModal);
    dom.createEventForm.reset();
    renderEvents(events);
    utils.showToast('Подію створено!', 'success');
}

export const editEventValidations = [
    { inputId: 'editEventTitle', errorId: 'editEventTitleError', validationFn: v => v.length >= 3, errorMessage: 'Назва: від 3 символів' },
    { inputId: 'editEventDescription', errorId: 'editEventDescriptionError', validationFn: v => v.length >= 10, errorMessage: 'Опис: від 10 символів' },
    { inputId: 'editEventLocation', errorId: 'editEventLocationError', validationFn: v => v.length >= 2, errorMessage: 'Місце: від 2 символів' },
    { inputId: 'editEventDate', errorId: 'editEventDateError', validationFn: v => new Date(v) > new Date(), errorMessage: 'Дата: у майбутньому' }, // Можливо, варто дозволити редагувати на ту саму дату
    { inputId: 'editEventParticipants', errorId: 'editEventParticipantsError', validationFn: v => v >= 2 && v <= 100, errorMessage: 'Учасники: від 2 до 100' }
];

export function openEditEventModal(event) {
    const user = utils.getCurrentUser();
    if (!user || user.id !== event.creatorId) {
        utils.showToast('Ви не можете редагувати цю подію', 'error');
        return;
    }

    if (dom.editEventTitle) dom.editEventTitle.value = event.title;
    if (dom.editEventDescription) dom.editEventDescription.value = event.description;
    if (dom.editEventCategory) dom.editEventCategory.value = event.category;
    if (dom.editEventLocation) dom.editEventLocation.value = event.location;
    if (dom.editEventDate) dom.editEventDate.value = event.date;
    if (dom.editEventParticipants) dom.editEventParticipants.value = event.participants;
    if (dom.editEventInterestsContainer) renderInterests(dom.editEventInterestsContainer, event.interests, () => {});

    if (dom.editEventForm) dom.editEventForm.dataset.eventId = event.eventId;
    utils.closeModal(dom.eventDetailModal);
    utils.openModal(dom.editEventModal);
}

export function handleEditEventSubmit(e) {
    e.preventDefault();
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Увійдіть, щоб редагувати подію', 'error');
        return;
    }

    if (!editEventValidations.every(v => utils.validateInput(dom.editEventForm.querySelector(`#${v.inputId}`), dom.editEventForm.querySelector(`#${v.errorId}`), v.validationFn, v.errorMessage))) {
        utils.showToast('Заповніть усі поля коректно', 'error');
        return;
    }

    const selectedInterests = Array.from(dom.editEventInterestsContainer?.querySelectorAll('.interest-tag.selected') || []).map(tag => tag.dataset.interest);
    if (selectedInterests.length < 1) {
        utils.showToast('Виберіть хоча б один інтерес', 'error');
        return;
    }

    const events = utils.getEvents();
    const eventId = parseInt(dom.editEventForm.dataset.eventId);
    const event = events.find(e => e.eventId === eventId);
    if (!event || event.creatorId !== user.id) {
        utils.showToast('Ви не можете редагувати цю подію', 'error');
        return;
    }

    const updatedEvent = {
        ...event,
        title: dom.editEventTitle?.value.trim(),
        description: dom.editEventDescription?.value.trim(),
        category: dom.editEventCategory?.value,
        location: dom.editEventLocation?.value.trim(),
        date: dom.editEventDate?.value,
        participants: parseInt(dom.editEventParticipants?.value),
        interests: selectedInterests
    };

    const updatedEvents = events.map(e => e.eventId === eventId ? updatedEvent : e);
    utils.saveEvents(updatedEvents);
    utils.closeModal(dom.editEventModal);
    renderEvents(updatedEvents);
    openEventDetail(updatedEvent);
    utils.showToast('Подію оновлено!', 'success');
}

export function handleAddEditEventInterest() {
    const interest = dom.editEventCustomInterestInput.value.trim();
    if (interest && interest.length <= 20) {
        if (utils.addGlobalInterest(interest)) {
            updateAllInterestContainers();
            dom.editEventCustomInterestInput.value = '';
            utils.showToast('Інтерес додано', 'success');
        } else {
            utils.showToast('Цей інтерес вже існує', 'error');
        }
    } else {
        utils.showToast(interest.length > 20 ? 'Інтерес занадто довгий' : 'Введіть інтерес', 'error');
    }
}