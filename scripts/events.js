import * as dom from './dom.js';
import * as utils from './utils.js';

let allEventsCache = []; 
let usersCache = new Map(); 
let myJoinedEventIds = [];
let isShowingArchive = false;

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export function startEventPolling() {
    refreshEventsCache();
    setInterval(() => {
        refreshEventsCache();
    }, 5000);
}

export async function refreshEventsCache() {
    try {
        const users = await utils.getUsers();
        usersCache = new Map(users.map(u => [u.id, u]));

        const currentUser = utils.getCurrentUser();
        if (currentUser) {
            const joinedData = await utils.getJoinedEvents();
            myJoinedEventIds = joinedData[currentUser.id] || [];
        }

        const status = isShowingArchive ? 'finished' : 'active';
        const events = await utils.getEvents(status);
        
        allEventsCache = events;
        renderEventsLocal();
    } catch (e) {
        console.error("Polling error:", e);
    }
}

export function toggleArchiveMode(showArchive) {
    isShowingArchive = showArchive;
    dom.eventsHorizontalTrack.innerHTML = '<p style="padding:20px; text-align:center;">Завантаження...</p>';
    refreshEventsCache();
}

export function initEventFilters() {
    const inputs = [
        dom.searchQueryInput, dom.locationInput, dom.categorySelect,
        dom.dateInput, dom.peopleSelect, dom.distanceInput, 
        dom.sortSelect, dom.statusSelect, dom.interestSearchInput
    ];

    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', renderEventsLocal);
            input.addEventListener('change', renderEventsLocal);
        }
    });

    if (dom.clearFiltersBtn) {
        dom.clearFiltersBtn.addEventListener('click', () => {
            inputs.forEach(input => { if(input) input.value = ''; });
            renderEventsLocal();
        });
    }
    
    if (dom.searchBtn) {
        dom.searchBtn.addEventListener('click', renderEventsLocal);
    }
}

function filterEventsLocal(events) {
    const query = dom.searchQueryInput?.value.toLowerCase().trim() || '';
    const loc = dom.locationInput?.value.toLowerCase().trim() || '';
    const cat = dom.categorySelect?.value || '';
    const dateVal = dom.dateInput?.value || '';
    const peopleVal = dom.peopleSelect?.value || '';
    const interestVal = dom.interestSearchInput?.value.toLowerCase().trim() || '';
    const statusVal = dom.statusSelect?.value || '';

    return events.filter(e => {
        const matchQuery = !query || e.title.toLowerCase().includes(query) || e.description.toLowerCase().includes(query);
        const matchLoc = !loc || e.location.toLowerCase().includes(loc);
        const matchCat = !cat || e.category === cat;
        
        let matchDate = true;
        if (dateVal) {
            const eDate = new Date(e.date).toISOString().split('T')[0];
            matchDate = eDate === dateVal;
        }

        let matchPeople = true;
        if (peopleVal) {
            const [min, max] = peopleVal.split('-').map(Number);
            if (peopleVal === '10+') matchPeople = e.participants >= 10;
            else matchPeople = e.participants >= min && e.participants <= max;
        }

        const matchInterest = !interestVal || e.interests.some(i => i.toLowerCase().includes(interestVal));
        
        let matchStatus = true;
        if (statusVal) {
            const isFull = e.currentParticipants >= e.participants;
            if (statusVal === 'open') matchStatus = !isFull;
            if (statusVal === 'full') matchStatus = isFull;
        }

        return matchQuery && matchLoc && matchCat && matchDate && matchPeople && matchInterest && matchStatus;
    });
}

function sortEventsLocal(events) {
    const sortVal = dom.sortSelect?.value || 'date-asc';
    return [...events].sort((a, b) => {
        if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortVal === 'participants-asc') return a.currentParticipants - b.currentParticipants;
        if (sortVal === 'participants-desc') return b.currentParticipants - a.currentParticipants;
        if (sortVal === 'title') return a.title.localeCompare(b.title);
        return 0;
    });
}

export function renderEventsLocal() {
    const track = dom.eventsHorizontalTrack;
    const eventCount = dom.eventCount;
    if (!track) return;

    let processedEvents = filterEventsLocal(allEventsCache);
    processedEvents = sortEventsLocal(processedEvents);
    
    if (eventCount) eventCount.textContent = `(${processedEvents.length})`;

    track.innerHTML = '';

    if (processedEvents.length === 0) {
        track.innerHTML = isShowingArchive 
            ? '<p style="color: #888; width: 100%; text-align: center; padding: 20px;">Архів порожній.</p>' 
            : '<p style="color: #888; width: 100%; text-align: center; padding: 20px;">Подій не знайдено.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    processedEvents.forEach(event => {
        let statusText = '';
        let statusColor = ''; 

        if (isShowingArchive) {
            statusText = '(Завершено)';
            statusColor = '#64748b';
        } else if (event.minParticipants > 0) {
            if (event.currentParticipants >= event.minParticipants) {
                statusText = '✓ Відбудеться';
                statusColor = '#10b981';
            } else {
                const needed = event.minParticipants - event.currentParticipants;
                statusText = `(Ще ${needed} до підтвердження)`;
                statusColor = '#f59e0b';
            }
        }

        const creator = usersCache.get(event.creatorId);
        const creatorName = creator ? creator.username : 'Невідомий';
        const creatorAvatar = creator?.avatarBase64 || 'https://via.placeholder.com/24';
        const interestsHtml = event.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');
        
        let buttonHtml = '';
        const currentUser = utils.getCurrentUser();
        
        if (currentUser && currentUser.id === event.creatorId) {
            buttonHtml = `<button class="card-action-button card-action-organizer" disabled style="background: #f1f5f9; color: #6b21a8; cursor: default;"><i class="fas fa-crown"></i> Ви організатор</button>`;
        } else if (currentUser && myJoinedEventIds.includes(event.eventId) && !isShowingArchive) {
            buttonHtml = `<button class="card-action-button leave-btn-v4" data-event-id="${event.eventId}" style="background: #ef4444;">Покинути</button>`;
        } else if (!isShowingArchive) {
            buttonHtml = `<button class="card-action-button join-btn-v4" data-event-id="${event.eventId}"><i class="fas fa-plus"></i> Приєднатися</button>`;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'event-card-wrapper';
        wrapper.innerHTML = `
            <div class="event-card-horizontal" data-event-id="${event.eventId}" ${isShowingArchive ? 'style="opacity: 0.7"' : ''}>
                <div class="card-content-v4">
                    <h3 class="card-title-v4" style="margin-bottom: 0.5rem;">${event.title}</h3>
                    <ul class="card-meta-list-v4">
                        <li class="meta-item-v4"><i class="fas fa-calendar-alt"></i><span>${utils.formatEventDate(event.date)}</span></li>
                        <li class="meta-item-v4"><i class="fas fa-map-marker-alt"></i><span>${event.location}</span></li>
                    </ul>
                    <div class="card-interests-v4">${interestsHtml}</div>
                    <div class="card-footer-v4" style="margin-top: auto; padding-top: 15px;">
                        <div class="creator-info-v4 creator-chip" data-user-id="${event.creatorId}">
                            <img src="${creatorAvatar}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
                            <span>${creatorName}</span>
                        </div>
                        <div style="text-align: right;">
                            <span class="card-participants-v4" style="display: block;">
                                <i class="fas fa-users"></i> ${event.currentParticipants}/${event.participants}
                            </span>
                            <span style="font-size: 0.75em; font-weight: 600; color: ${statusColor}; display: block; margin-top: 2px;">${statusText}</span>
                        </div>
                    </div>
                </div>
            </div>
            ${buttonHtml}
        `;
        fragment.appendChild(wrapper);
    });

    track.appendChild(fragment);
    updateScrollButtons();
}

export function updateScrollButtons() {
    const track = dom.eventsHorizontalTrack;
    if (!track || !dom.scrollLeftBtn) return;
    dom.scrollLeftBtn.disabled = track.scrollLeft <= 10;
}

// === ACTION HANDLERS (Викликаються з головної або сторінки події) ===

export async function handleJoinEvent(data) {
    const user = utils.getCurrentUser();
    if (!user) {
        utils.showToast('Будь ласка, увійдіть', 'info');
        return false;
    }
    try {
        const res = await fetch('https://tribe-up-backend.onrender.com/api/events/join', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ userId: user.id, eventId: data.eventId })
        });
        if (res.ok) {
            utils.showToast('Ви приєдналися!', 'success');
            await refreshEventsCache();
            return true;
        } else {
            utils.showToast('Помилка приєднання', 'error');
            return false;
        }
    } catch (e) { return false; }
}

export async function handleLeaveEvent(data) {
    const user = utils.getCurrentUser();
    if (!user) return;
    try {
        const res = await fetch('https://tribe-up-backend.onrender.com/api/events/leave', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ userId: user.id, eventId: data.eventId })
        });
        if (res.ok) {
            utils.showToast('Ви покинули подію', 'info');
            await refreshEventsCache();
        }
    } catch (e) { console.error(e); }
}