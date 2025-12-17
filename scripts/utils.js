export let map;
export function setMap(newMap) { map = newMap; }

// Пряме підключення до локального бекенду
export const API_URL = 'http://localhost:8000';

// --- Глобальні інтереси ---
export let globalCustomInterests = [];

export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        location.reload();
    }

    return response;
}

export async function fetchGlobalInterests() {
    try {
        const res = await fetch(`${API_URL}/api/interests`);
        const interests = await res.json();
        if (Array.isArray(interests)) {
            globalCustomInterests = interests;
        }
    } catch (e) {
        console.error('Failed to load interests', e);
    }
}

export function addGlobalInterest(interest) {
    if (!globalCustomInterests.includes(interest)) {
        globalCustomInterests.push(interest);
        return true;
    }
    return false;
}

export async function getUsers() {
    try {
        const res = await fetch(`${API_URL}/api/users`);
        return await res.json();
    } catch (e) { return []; }
}

export function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('currentUser')); } catch (error) { return null; }
}

export async function getEvents(status = 'active') { 
    try {
        const res = await fetch(`${API_URL}/api/events?status=${status}`);
        if (!res.ok) {
            console.error(`Server error: ${res.status}`);
            return []; 
        }
        return await res.json();
    } catch (e) {
        console.error("Network error fetching events:", e);
        return [];
    }
}

export async function getJoinedEvents() {
    const user = getCurrentUser();
    if (!user) return {};
    try {
        const res = await fetch(`${API_URL}/api/my-joined-events/${user.id}`);
        const ids = await res.json();
        return { [user.id]: ids };
    } catch (e) { return {}; }
}

export function saveUsers(users) {}
export function saveEvents(events) {}
export function saveJoinedEvents(joined) {}

// UI Helpers
export function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type} show`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(-15px)'; }, 10);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(0)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

export function openModal(modal) {
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('open');
        if (modal.id === 'eventDetailModal' && map) { setTimeout(() => { if (map) map.invalidateSize(); }, 300); }
        if (modal.id === 'privateChatModal') {
            const privateChatMessages = document.getElementById('privateChatMessages');
            if (privateChatMessages) privateChatMessages.scrollTop = privateChatMessages.scrollHeight;
        }
    }, 10);
}

export function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(() => {
        modal.style.display = 'none';
        if (modal.id === 'eventDetailModal' && map) { map.off(); map.remove(); setMap(null); }
    }, 300);
}

export function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offset = 80;
        const sectionPosition = section.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: sectionPosition, behavior: 'smooth' });
    }
}

export function formatEventDate(dateTime) {
    const date = new Date(dateTime);
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
    return date.toLocaleString('uk-UA', options);
}

export function formatTime() {
    return new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function validateInput(input, errorElement, validationFn, errorMessage) {
    if (!input || !errorElement) return false;
    const isValid = validationFn(input.value);
    input.classList.toggle('invalid', !isValid);
    errorElement.style.display = isValid ? 'none' : 'block';
    errorElement.textContent = isValid ? '' : errorMessage;
    return isValid;
}

export function setupFormValidation(form, fields) {
    if (!form) return;
    fields.forEach(({ inputId, errorId, validationFn, errorMessage }) => {
        const input = form.querySelector(`#${inputId}`);
        const error = form.querySelector(`#${errorId}`);
        if (input && error) {
            input.addEventListener('input', () => validateInput(input, error, validationFn, errorMessage));
        }
    });
}

export function getUserAvatar(user) {
    if (user && (user.avatarBase64 || user.avatar_base64)) {
        return user.avatarBase64 || user.avatar_base64;
    }

    const seed = user ? (user.name || user.username || 'User') : 'User';

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=random&color=fff&size=128`;
}