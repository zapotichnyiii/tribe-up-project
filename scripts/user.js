import * as dom from './dom.js';
import * as utils from './utils.js';

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export let myFollowingIds = [];
export let selectedPeopleInterests = [];
let allUsersCache = []; 
let scrollInitialized = false;

// === POLLING (Оновлення даних) ===
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
        const res = await fetch(`${utils.API_URL}/api/users/${user.id}/social`);
        const data = await res.json();
        
        myFollowingIds = data.following.map(u => u.id);
    } catch (e) { console.error(e); }
}

// === ДІЇ (FOLLOW/UNFOLLOW) ===
export async function toggleFollow(targetUserId, btnElement) {
    const user = utils.getCurrentUser();
    if (!user) return utils.showToast('Увійдіть, щоб підписатися', 'info');
    
    const isFollowing = myFollowingIds.includes(targetUserId);
    const endpoint = isFollowing ? 'unfollow' : 'follow';
    
    try {
        const res = await fetch(`${utils.API_URL}/api/users/${targetUserId}/${endpoint}`, {
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
            
            const followersCountEl = document.getElementById('otherUserFollowersCount');
            if (followersCountEl) {
                let current = parseInt(followersCountEl.textContent) || 0;
                followersCountEl.textContent = isFollowing ? Math.max(0, current - 1) : current + 1;
            }

        } else {
            const err = await res.json();
            utils.showToast(err.error || 'Помилка', 'error');
        }
    } catch (e) { utils.showToast('Помилка сервера', 'error'); }
}

// === РЕНДЕР КАРУСЕЛІ ЛЮДЕЙ ===
export async function renderPeople(customUsersList = null, isSearchResult = false) {
    if (!dom.peopleHorizontalTrack) return;

    if (!scrollInitialized) {
        initPeopleScroll();
        scrollInitialized = true;
    }
    
    const currentUser = utils.getCurrentUser();
    
    if (allUsersCache.length === 0 && !customUsersList) {
        allUsersCache = await utils.getUsers();
    }

    let usersToRender = customUsersList || allUsersCache;
    if (currentUser) {
        usersToRender = usersToRender.filter(u => u.id !== currentUser.id);
    }

    if (!isSearchResult) {
        const cityQuery = dom.cityFilterInput?.value.toLowerCase().trim();
        if (cityQuery) {
            usersToRender = usersToRender.filter(u => u.location.toLowerCase().includes(cityQuery));
        }

        if (selectedPeopleInterests.length > 0) {
            usersToRender = usersToRender.filter(u => u.interests.some(i => selectedPeopleInterests.includes(i)));
        }
    }

    usersToRender.sort((a, b) => b.id - a.id);

    dom.peopleHorizontalTrack.innerHTML = '';

    if (usersToRender.length === 0) {
        dom.peopleHorizontalTrack.innerHTML = '<p style="padding: 20px; text-align: center; color: #888; width: 100%;">Нікого не знайдено.</p>';
        return;
    }

    usersToRender.forEach(person => {
        const isFollowing = myFollowingIds.includes(person.id);
        const wrapper = document.createElement('div');
        wrapper.className = 'people-card-wrapper';
        
        const interestsHtml = person.interests.slice(0, 3).map(i => `<span class="interest-tag selected">${i}</span>`).join('');
        
        wrapper.innerHTML = `
            <div class="people-card" data-user-id="${person.id}">
                <div>
                    <div class="people-card-header">
                        <img src="${utils.getUserAvatar(person)}" alt="${person.name}">
                        <div>
                            <h3>${person.username}</h3>
                            <p style="font-size: 0.8em; color: var(--main-secondary-color);">${person.name}, ${person.age} років</p>
                            <p style="font-size: 0.8em; color: var(--main-secondary-color);"><i class="fas fa-map-marker-alt"></i> ${person.location}</p>
                        </div>
                    </div>
                    <div class="interests" style="margin-bottom: 10px;">${interestsHtml}</div>
                </div>
                
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button class="btn btn-outline btn-sm message-btn" style="flex: 1;">Написати</button>
                    <button class="btn btn-sm follow-btn ${isFollowing ? 'btn-outline' : 'btn-accent'}" style="flex: 1;">
                        ${isFollowing ? 'Відписатися' : 'Підписатися'}
                    </button>
                </div>
            </div>
        `;
        dom.peopleHorizontalTrack.appendChild(wrapper);
    });
}

function initPeopleScroll() {
    if (dom.peopleScrollLeftBtn && dom.peopleHorizontalTrack) {
        dom.peopleScrollLeftBtn.addEventListener('click', () => {
            dom.peopleHorizontalTrack.scrollBy({ left: -320, behavior: 'smooth' });
        });
    }
    if (dom.peopleScrollRightBtn && dom.peopleHorizontalTrack) {
        dom.peopleScrollRightBtn.addEventListener('click', () => {
            dom.peopleHorizontalTrack.scrollBy({ left: 320, behavior: 'smooth' });
        });
    }
}

// === ПОШУК ТА ФІЛЬТРИ ===
export async function renderPeopleInterestFilter() {
    if (allUsersCache.length === 0) {
        allUsersCache = await utils.getUsers();
    }
    
    const currentUser = utils.getCurrentUser();
    const otherUsers = currentUser ? allUsersCache.filter(u => u.id !== currentUser.id) : allUsersCache;
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

export function handleUserSearch(e) {
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

// === НАВІГАЦІЯ (РЕДІРЕКТИ) ===

export function openUserProfile() {
    window.location.href = '/profile.html';
}

export function openOtherUserProfile(userId) {
    const currentUser = utils.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        window.location.href = '/profile.html';
    } else {
        window.location.href = `/user.html?id=${userId}`;
    }
}

// === СПИСКИ ПІДПИСНИКІВ ===
export async function openSocialList(type, userId = null) {
    const targetId = userId || utils.getCurrentUser()?.id;
    if (!targetId) return;
    
    if(dom.socialListTitle) dom.socialListTitle.textContent = type === 'followers' ? 'Підписники' : 'Підписки';
    if(dom.socialListContainer) dom.socialListContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Завантаження...</p>';
    
    utils.openModal(dom.socialListModal);
    
    try {
        const res = await fetch(`${utils.API_URL}/api/users/${targetId}/social`);
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
        if(dom.socialListContainer) dom.socialListContainer.innerHTML = '<p style="text-align:center; color:red;">Помилка завантаження</p>';
    }
}