import * as dom from './dom.js';
import * as utils from './utils.js';
import { renderInterests } from './ui.js';
import * as events from './events.js';

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export let myFollowingIds = [];
export let selectedPeopleInterests = [];
let allUsersCache = []; 

export function startUserPolling() {
    refreshUserCache();
    setInterval(() => {
        refreshUserCache();
    }, 10000);
}

async function refreshUserCache() {
    try {
        const users = await utils.getUsers();
        
        if (JSON.stringify(users.map(u => u.id)) !== JSON.stringify(allUsersCache.map(u => u.id))) {
            allUsersCache = users;
            
            const currentQuery = dom.userSearchInput?.value.trim();
            if (currentQuery) {
                const fakeEvent = { target: { value: currentQuery } };
                handleUserSearch(fakeEvent);
            } else {
                renderPeople();
            }
        }
    } catch (e) { console.error("Polling error", e); }
}

export async function fetchMySocials() {
    const user = utils.getCurrentUser();
    if (!user) return;
    try {
        const res = await fetch(`http://localhost:5000/api/users/${user.id}/social`);
        const data = await res.json();
        
        myFollowingIds = data.following.map(u => u.id);
        
        if (dom.myFollowersBtn) dom.myFollowersBtn.innerHTML = `<b>${data.followers.length}</b> підписників`;
        if (dom.myFollowingBtn) dom.myFollowingBtn.innerHTML = `<b>${data.following.length}</b> підписок`;
    } catch (e) { console.error(e); }
}

export async function toggleFollow(targetUserId, btnElement) {
    const user = utils.getCurrentUser();
    if (!user) return utils.showToast('Увійдіть, щоб підписатися', 'info');
    
    const isFollowing = myFollowingIds.includes(targetUserId);
    const endpoint = isFollowing ? 'unfollow' : 'follow';
    try {
        const res = await fetch(`http://localhost:5000/api/users/${targetUserId}/${endpoint}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ followerId: user.id })
        });

        if (res.ok) {
            if (isFollowing) {
                myFollowingIds = myFollowingIds.filter(id => id !== targetUserId);
                if(btnElement) {
                    btnElement.textContent = 'Підписатися';
                    btnElement.classList.remove('btn-outline');
                    btnElement.classList.add('btn-accent');
                }
                utils.showToast('Відписано', 'info');
            } else {
                myFollowingIds.push(targetUserId);
                if(btnElement) {
                    btnElement.textContent = 'Відписатися';
                    btnElement.classList.remove('btn-accent');
                    btnElement.classList.add('btn-outline');
                }
                utils.showToast('Підписано!', 'success');
            }

            fetchMySocials();
            
            const currentModalUser = parseInt(dom.otherUserMessageBtn?.dataset.userId);
            if ((dom.otherUserProfileModal.classList.contains('open') || dom.otherUserProfileModal.style.display === 'flex') && currentModalUser === targetUserId) {
                updateOtherUserProfileStats(targetUserId);
            }
        } else {
            const err = await res.json();
            utils.showToast(err.error || 'Помилка', 'error');
        }
    } catch (e) { utils.showToast('Помилка сервера', 'error'); }
}

async function updateOtherUserProfileStats(userId) {
    try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}/social`);
        const data = await res.json();
        if(dom.otherUserFollowersCount) dom.otherUserFollowersCount.textContent = data.followers.length;
        if(dom.otherUserFollowingCount) dom.otherUserFollowingCount.textContent = data.following.length;
    } catch(e) {}
}

export async function openSocialList(type, userId = null) {
    const targetId = userId || utils.getCurrentUser()?.id;
    if (!targetId) return;
    
    dom.socialListTitle.textContent = type === 'followers' ? 'Підписники' : 'Підписки';
    dom.socialListContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Завантаження...</p>';
    
    utils.openModal(dom.socialListModal);
    
    try {
        const res = await fetch(`http://localhost:5000/api/users/${targetId}/social`);
        const data = await res.json();
        const list = type === 'followers' ? data.followers : data.following;
        
        dom.socialListContainer.innerHTML = '';
        
        if (list.length === 0) {
            dom.socialListContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">Список порожній</p>';
            return;
        }

        list.forEach(u => {
            const div = document.createElement('div');
            div.style.cssText = 'padding: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background 0.2s;';
            
            const avatarSrc = u.avatar_base64 || u.avatarBase64 || 'https://via.placeholder.com/40';

            div.innerHTML = `
                <img src="${avatarSrc}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                <div>
                    <div style="font-weight: 600;">${u.username}</div>
                    <div style="font-size: 0.8em; color: gray;">${u.name}</div>
                </div>
            `;
            
            div.addEventListener('mouseenter', () => div.style.background = 'rgba(0,0,0,0.05)');
            div.addEventListener('mouseleave', () => div.style.background = 'transparent');
            
            div.addEventListener('click', () => {
                utils.closeModal(dom.socialListModal);
                openOtherUserProfile(u.id);
            });
            dom.socialListContainer.appendChild(div);
        });
    } catch(e) {
        dom.socialListContainer.innerHTML = '<p style="text-align:center; color:red;">Помилка завантаження</p>';
    }
}

export async function renderPeopleInterestFilter() {
    if (allUsersCache.length === 0) {
        allUsersCache = await utils.getUsers();
    }
    
    const currentUser = utils.getCurrentUser();
    if (!currentUser) return;
    
    const otherUsers = allUsersCache.filter(u => u.id !== currentUser.id);
    const allInterests = [...new Set(otherUsers.flatMap(u => u.interests))].sort();
    
    if (dom.peopleInterestFilter) {
        dom.peopleInterestFilter.innerHTML = allInterests.map(interest => `
            <span class="interest-tag ${selectedPeopleInterests.includes(interest) ? 'selected' : ''}" data-interest="${interest}">${interest}</span>
        `).join('');
    }
}

export function handlePeopleInterestClick(e) {
    const tag = e.target.closest('.interest-tag');
    if (!tag) return;

    const interest = tag.dataset.interest;
    const idx = selectedPeopleInterests.indexOf(interest);

    if (idx === -1) {
        selectedPeopleInterests.push(interest);
        tag.classList.add('selected');
    } else {
        selectedPeopleInterests.splice(idx, 1);
        tag.classList.remove('selected');
    }
    renderPeople();
}

export async function renderPeople(customUsersList = null, isSearchResult = false) {
    if (!dom.peopleGrid) return;
    
    const currentUser = utils.getCurrentUser();
    if (!currentUser) {
        dom.peopleGrid.innerHTML = '<p>Увійдіть, щоб бачити людей.</p>';
        return;
    }

    // Якщо це перший запуск і кеш пустий - вантажимо
    if (allUsersCache.length === 0 && !customUsersList) {
        allUsersCache = await utils.getUsers();
    }

    let usersToRender = [];

    if (customUsersList) {
        usersToRender = customUsersList;
    } else {
        // Завжди беремо з кешу, який оновлюється фоново
        usersToRender = allUsersCache;
    }

    let filtered = usersToRender.filter(u => u.id !== currentUser.id);

    if (!isSearchResult) {
        const cityQuery = dom.cityFilterInput?.value.toLowerCase().trim();
        if (cityQuery) {
            filtered = filtered.filter(u => u.location.toLowerCase().includes(cityQuery));
        }

        if (selectedPeopleInterests.length > 0) {
            filtered = filtered.filter(u => u.interests.some(i => selectedPeopleInterests.includes(i)));
        }
    }

    dom.peopleGrid.innerHTML = '';

    if (filtered.length === 0) {
        dom.peopleGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">Нікого не знайдено.</p>';
        return;
    }

    filtered.forEach(person => {
        const isFollowing = myFollowingIds.includes(person.id);
        const card = document.createElement('div');
        card.className = 'card people-card';
        card.dataset.userId = person.id;
        
        const interestsHtml = person.interests.slice(0, 3).map(i => `<span class="interest-tag selected">${i}</span>`).join('');
        
        card.innerHTML = `
            <div class="people-card-header">
                <img src="${person.avatarBase64 || 'https://via.placeholder.com/60'}" alt="${person.name}">
                <div>
                    <h3>${person.username}</h3>
                    <p style="font-size: 0.8em; color: #666;">${person.name}, ${person.age} років</p>
                    <p style="font-size: 0.8em; color: #666;">${person.location}</p>
                </div>
            </div>
            <div class="interests" style="margin-bottom: 10px;">${interestsHtml}</div>
            
            <div style="display: flex; gap: 8px; margin-top: auto;">
                <button class="btn btn-outline btn-sm message-btn" style="flex: 1;">Написати</button>
                <button class="btn btn-sm follow-btn ${isFollowing ? 'btn-outline' : 'btn-accent'}" style="flex: 1;">
                    ${isFollowing ? 'Відписатися' : 'Підписатися'}
                </button>
            </div>
        `;
        dom.peopleGrid.appendChild(card);
    });
}

// Миттєвий пошук
export function handleUserSearch(e) {
    // Беремо value або з події, або з об'єкта-заглушки (якщо викликаємо з refreshUserCache)
    const query = (e.target.value || '').toLowerCase().trim();

    if (allUsersCache.length === 0) return;

    if (query.length === 0) {
        renderPeople(null);
        return;
    }

    const filtered = allUsersCache.filter(u => 
        u.username.toLowerCase().includes(query) || 
        u.name.toLowerCase().includes(query)
    );
    
    renderPeople(filtered, true);
}

export async function openOtherUserProfile(userId) {
    // Спочатку шукаємо в кеші для швидкості
    let user = allUsersCache.find(u => u.id === userId);
    if (!user) {
        // Якщо раптом немає в кеші, робимо запит
        const users = await utils.getUsers();
        user = users.find(u => u.id === userId);
    }
    
    if (!user) return;

    if (dom.otherUserProfileAvatar) dom.otherUserProfileAvatar.src = user.avatarBase64 || 'https://via.placeholder.com/100';
    if (dom.otherUserProfileName) dom.otherUserProfileName.textContent = user.name;
    if (dom.otherUserProfileUsername) dom.otherUserProfileUsername.textContent = user.username;
    if (dom.otherUserProfileInterests) dom.otherUserProfileInterests.innerHTML = user.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');
    
    if (dom.otherUserFollowersBtn) dom.otherUserFollowersBtn.dataset.userId = userId;
    if (dom.otherUserFollowingBtn) dom.otherUserFollowingBtn.dataset.userId = userId;

    const currentUser = utils.getCurrentUser();
    const isMe = currentUser && currentUser.id === user.id;

    if (dom.otherUserMessageBtn) {
        dom.otherUserMessageBtn.dataset.userId = user.id;
        dom.otherUserMessageBtn.style.display = isMe ? 'none' : 'block';
    }

    if (dom.otherUserFollowBtn) {
        if (isMe) {
            dom.otherUserFollowBtn.style.display = 'none';
        } else {
            dom.otherUserFollowBtn.style.display = 'block';
            await fetchMySocials(); 
            const isFollowing = myFollowingIds.includes(user.id);
            
            dom.otherUserFollowBtn.textContent = isFollowing ? 'Відписатися' : 'Підписатися';
            dom.otherUserFollowBtn.className = isFollowing ? 'btn btn-outline' : 'btn btn-accent';
            
            dom.otherUserFollowBtn.onclick = (e) => {
                e.preventDefault();
                toggleFollow(user.id, dom.otherUserFollowBtn);
            };
        }
    }

    updateOtherUserProfileStats(userId);

    const allEvents = await utils.getEvents();
    const userEvents = allEvents.filter(e => e.creatorId === userId);
    
    if (dom.otherUserProfileEvents) {
        dom.otherUserProfileEvents.innerHTML = userEvents.length ? '' : '<p>Немає подій</p>';
        userEvents.forEach(e => {
            const card = document.createElement('div');
            card.className = 'mini-event-card';
            card.innerHTML = `
                <div class="mini-event-title">${e.title}</div>
                <div class="mini-event-date"><i class="fas fa-calendar-alt"></i> ${utils.formatEventDate(e.date)}</div>
            `;
            
            card.addEventListener('click', () => {
                utils.closeModal(dom.otherUserProfileModal);
                events.openEventDetail(e);
            });

            dom.otherUserProfileEvents.appendChild(card);
        });
    }

    utils.openModal(dom.otherUserProfileModal);
}

export async function openUserProfile() {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) return;
    
    await fetchMySocials();

    try {
        const users = await utils.getUsers();
        const freshUser = users.find(u => u.id === currentUser.id);
        if (!freshUser) return utils.showToast('Не вдалося завантажити профіль', 'error');

        if(dom.profileModalAvatar) dom.profileModalAvatar.src = freshUser.avatarBase64 || 'https://via.placeholder.com/100';
        if(dom.profileModalName) dom.profileModalName.textContent = freshUser.name;
        if(dom.profileModalUsername) dom.profileModalUsername.textContent = freshUser.username;
        if(dom.profileModalInterests) dom.profileModalInterests.innerHTML = freshUser.interests.map(i => `<span class="interest-tag selected">${i}</span>`).join('');

        const allEvents = await utils.getEvents('active');
        const myEvents = allEvents.filter(e => e.creatorId === freshUser.id);
        if (dom.userEventsList) {
            dom.userEventsList.innerHTML = myEvents.length ? '' : '<p style="color:#888;">Поки немає подій</p>';
            
            myEvents.forEach(e => {
                const card = document.createElement('div');
                card.className = 'mini-event-card';
                card.innerHTML = `
                    <div class="mini-event-title">${e.title}</div>
                    <div class="mini-event-date"><i class="fas fa-calendar-alt"></i> ${utils.formatEventDate(e.date)}</div>
                `;
                
                card.addEventListener('click', () => {
                    utils.closeModal(dom.profileModal);
                    events.openEventDetail(e);
                });

                dom.userEventsList.appendChild(card);
            });
        }
        utils.openModal(dom.profileModal);
    } catch (e) { console.error(e); }
}

export const editProfileValidations = [{ inputId: 'editProfileName', errorId: 'editProfileNameError', validationFn: v => v.length >= 2, errorMessage: 'Ім’я: від 2 символів' }];

export async function openEditProfileModal() {
    const currentUser = utils.getCurrentUser();
    if (!currentUser) return;
    
    const users = await utils.getUsers();
    const user = users.find(u => u.id === currentUser.id);
    if (!user) return;

    if(dom.editProfileName) dom.editProfileName.value = user.name;
    if(dom.editProfileUsername) dom.editProfileUsername.value = user.username;
    if(dom.editProfileAge) dom.editProfileAge.value = user.age;
    if(dom.editProfileLocation) dom.editProfileLocation.value = user.location;
    if (dom.editProfileAvatarPreview) {
        dom.editProfileAvatarPreview.src = user.avatarBase64 || 'https://via.placeholder.com/150';
    }
    
    if (dom.editProfilePhoto) {
        dom.editProfilePhoto.onchange = (evt) => {
            const [file] = dom.editProfilePhoto.files;
            if (file) {
                dom.editProfileAvatarPreview.src = URL.createObjectURL(file);
            }
        };
    }

    if(dom.editProfileInterestsContainer) renderInterests(dom.editProfileInterestsContainer, user.interests, () => {});
    
    utils.closeModal(dom.profileModal);
    utils.openModal(dom.editProfileModal);
}

export async function handleEditProfileSubmit(e) {
    e.preventDefault();
    const user = utils.getCurrentUser();
    if (!user) return;
    const updatedData = {
        name: dom.editProfileName.value,
        username: dom.editProfileUsername.value,
        age: parseInt(dom.editProfileAge.value),
        location: dom.editProfileLocation.value,
        interests: Array.from(dom.editProfileInterestsContainer.querySelectorAll('.selected')).map(el => el.dataset.interest),
        avatarBase64: user.avatarBase64
    };
    const photo = dom.editProfilePhoto?.files[0];
    if (photo) updatedData.avatarBase64 = await utils.fileToBase64(photo);

    try {
        const res = await fetch(`http://localhost:5000/api/users/${user.id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updatedData) });
        if (res.ok) {
            utils.showToast('Оновлено', 'success');
            utils.closeModal(dom.editProfileModal);
            setTimeout(() => location.reload(), 500);
        } else { utils.showToast('Помилка оновлення', 'error'); }
    } catch (e) { utils.showToast('Помилка сервера', 'error'); }
}

export function handleAddEditCustomInterest() {
    const input = dom.editCustomInterestInput;
    const interest = input.value.trim();
    if(interest) {
        const container = dom.editProfileInterestsContainer;
        const span = document.createElement('span');
        span.className = 'interest-tag selected';
        span.dataset.interest = interest;
        span.textContent = interest;
        container.appendChild(span);
        input.value = '';
    }
}