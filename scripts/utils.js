export let map;
export function setMap(newMap) {
    map = newMap;
}

// === Управління станом ===
export let globalCustomInterests = JSON.parse(localStorage.getItem('globalCustomInterests') || '[]');
export let nextEventId = JSON.parse(localStorage.getItem('nextEventId') || '1');
export let nextChatId = JSON.parse(localStorage.getItem('nextChatId') || '1');
export const defaultInterests = ['Спорт', 'Музика', 'Подорожі', 'Ігри', 'Технології', 'Книги', 'Кіно', 'Кулінарія'];

export function setNextEventId(id) {
    nextEventId = id;
    localStorage.setItem('nextEventId', JSON.stringify(nextEventId));
}

export function addGlobalInterest(interest) {
    interest = interest.trim();
    if (!interest || interest.length > 20) return false;
    
    const allInterests = [...defaultInterests, ...globalCustomInterests];
    if (!allInterests.includes(interest)) {
        globalCustomInterests.push(interest);
        try {
            localStorage.setItem('globalCustomInterests', JSON.stringify(globalCustomInterests));
            return true;
        } catch (error) {
            console.error('Помилка збереження інтересу:', error);
            showToast('Помилка збереження даних', 'error');
            return false;
        }
    }
    return false;
}

// === LocalStorage Helpers ===
export function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

export function saveUsers(users) {
    try {
        localStorage.setItem('users', JSON.stringify(users));
    } catch (error) {
        console.error('Помилка збереження користувачів:', error);
        showToast('Помилка збереження даних', 'error');
    }
}

export function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser'));
    } catch (error) {
        console.error('Помилка отримання поточного користувача:', error);
        return null;
    }
}

export function getPrivateChats() {
    return JSON.parse(localStorage.getItem('privateChats') || '{}');
}

export function savePrivateChats(chats) {
    try {
        localStorage.setItem('privateChats', JSON.stringify(chats));
    } catch (error) {
        console.error('Помилка збереження чатів:', error);
        showToast('Помилка збереження чатів', 'error');
    }
}

export function getEvents() {
    return JSON.parse(localStorage.getItem('events') || '[]');
}

export function saveEvents(events) {
    try {
        localStorage.setItem('events', JSON.stringify(events));
    } catch (error) {
        console.error('Помилка збереження подій:', error);
        showToast('Помилка збереження даних', 'error');
    }
}

export function getJoinedEvents() {
    return JSON.parse(localStorage.getItem('joinedEvents') || '{}');
}

export function saveJoinedEvents(joined) {
     try {
        localStorage.setItem('joinedEvents', JSON.stringify(joined));
    } catch (error) {
        console.error('Помилка збереження даних про приєднання:', error);
        showToast('Помилка збереження даних', 'error');
    }
}

export function getChatId(user1Id, user2Id) {
    return [user1Id, user2Id].sort().join('_');
}

// === UI Helpers ===
export function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type} show`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(-15px)';
    }, 10);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function openModal(modal) {
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('open');
        if (modal.id === 'eventDetailModal' && map) {
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 300);
        }
        if (modal.id === 'privateChatModal') {
            const privateChatMessages = document.getElementById('privateChatMessages');
            if (privateChatMessages) {
                privateChatMessages.scrollTop = privateChatMessages.scrollHeight;
            }
        }
    }, 10);
    modal.focus();
}

export function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(() => {
        modal.style.display = 'none';
        if (modal.id === 'eventDetailModal' && map) {
            map.off();
            map.remove();
            setMap(null);
        }
    }, 300);
}

export function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offset = 80;
        const sectionPosition = section.getBoundingClientRect().top + window.pageYOffset - offset;
        
        window.scrollTo({
            top: sectionPosition,
            behavior: 'smooth'
        });
    }
}

// === Formatting Helpers ===
export function formatEventDate(dateTime) {
    const date = new Date(dateTime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const options = isToday 
        ? { hour: '2-digit', minute: '2-digit', hour12: false }
        : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
    return date.toLocaleString('uk-UA', options) + (isToday ? ' (сьогодні)' : '');
}

export function formatTime() {
    return new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// === Form Helpers ===
export async function fileToBase64(file) {
    try {
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('Помилка конвертації файлу:', error);
        showToast('Помилка завантаження зображення', 'error');
        return null;
    }
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