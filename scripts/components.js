// scripts/components.js

export const HEADER_HTML = `
<header>
    <div class="container">
        <nav class="navbar">
            <a href="/index.html" class="logo main-logo">TribeUp</a>
            <div class="navbar-right">
                <div class="notification-wrapper" style="position: relative;">
                    <button class="notification-bell-btn" id="notificationBtn" style="margin-right: 8px;" aria-label="Сповіщення">
                        <i class="fas fa-bell"></i>
                        <span id="notificationBadge" style="display:none; position:absolute; top:-5px; right:-5px; background:red; color:white; font-size:10px; padding:2px 5px; border-radius:50%;">0</span>
                    </button>
                    <div id="notificationDropdown" class="notification-dropdown">
                        <div class="dropdown-header">
                            <b>Сповіщення</b> <span id="markAllReadBtn" class="text-btn">Прочитати все</span>
                        </div>
                        <div id="notificationList" style="max-height:300px; overflow-y:auto;"></div>
                    </div>
                </div>
                
                <button class="chat-list-btn" id="chatListBtn" aria-label="Повідомлення" style="position: relative;">
                    <i class="fas fa-comments"></i>
                    <span id="chatBadge" style="display:none; position:absolute; top:-5px; right:-5px; background: var(--auth-accent-color); color:white; font-size:10px; padding:2px 5px; border-radius:50%; border: 2px solid white;">0</span>
                </button>

                <div class="profile-area" id="profileArea" style="cursor: pointer;">
                    <div class="profile-display" id="profileDisplay" style="display: flex; align-items: center; gap: 8px;">
                        <img id="profileAvatar" src="" alt="Avatar" class="profile-avatar-rect">
                        <span id="profileUsername" class="profile-name"></span>
                    </div>
                </div>
                <button class="theme-toggle" id="themeToggle"><i class="fas fa-moon"></i></button>
            </div>
        </nav>
    </div>
</header>
`;

export const ALL_MODALS_HTML = `
<div class="modal" id="profileModal" role="dialog">
    <div class="modal-content" style="max-width: 300px; padding: 15px; text-align: center;">
        <button class="modal-close" id="closeProfileModal">×</button>
        <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
            <img id="profileModalAvatar" src="" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid #1a2b44;">
            <h3 id="profileModalName" style="margin: 0; font-size: 1.2em;"></h3>
            <div id="profileModalUsername" style="font-weight: 600; color: #1a2b44; font-size: 0.9em;"></div>

            <div style="display:flex; gap:15px; justify-content:center; margin:10px 0; font-size:0.9em;">
                <div id="myFollowersBtn" style="cursor:pointer;"><b>0</b> підписників</div>
                <div id="myFollowingBtn" style="cursor:pointer;"><b>0</b> підписок</div>
            </div>
            <div id="profileModalMeta" style="color: #64748b; font-size: 0.8em;"></div>
            <div id="profileModalInterests" style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; margin: 6px 0;"></div>
            <div id="userEvents" style="width: 100%; text-align: left;">
                <h3 style="font-size: 1em; margin: 10px 0;">Ваші події</h3>
                <div id="userEventsList" style="display: grid; gap: 8px;"></div>
            </div>
            <button id="editProfileBtn" class="btn btn-sm" style="width: 100%; margin-top: 6px;">Редагувати</button>
            <button id="profileLogoutBtn" class="btn btn-outline btn-sm" style="width: 100%;">Вийти</button>
        </div>
    </div>
</div>

<div class="modal" id="editProfileModal" role="dialog">
    <div class="modal-content modern-modal-content">
        <button class="modal-close" id="closeEditProfileModal">×</button>
        <div class="modal-header-decoration">
            <h2 id="editProfileTitle">Редагувати профіль</h2>
            <p>Оновіть інформацію про себе</p>
        </div>
        <form id="editProfileForm" class="edit-profile-grid">
            <div class="profile-avatar-section">
                <div class="avatar-upload-wrapper">
                    <img id="editProfileAvatarPreview" src="" alt="Аватар">
                    <label for="editProfilePhoto" class="avatar-upload-overlay">
                        <i class="fas fa-camera"></i>
                        <span>Змінити</span>
                    </label>
                    <input type="file" id="editProfilePhoto" accept="image/*">
                </div>
            </div>
            <div class="profile-fields-section">
                <div class="form-group compact">
                    <label class="form-label-sm">Ім'я</label>
                    <input type="text" id="editProfileName" required class="form-control">
                </div>
                <div class="form-group compact">
                    <label class="form-label-sm">Нікнейм</label>
                    <input type="text" id="editProfileUsername" required class="form-control">
                </div>
                <div class="form-row-split">
                    <div class="form-group compact">
                        <label class="form-label-sm">Вік</label>
                        <input type="number" id="editProfileAge" min="16" max="100" required class="form-control">
                    </div>
                    <div class="form-group compact">
                        <label class="form-label-sm">Місто</label>
                        <input type="text" id="editProfileLocation" required class="form-control">
                    </div>
                </div>
                <div class="form-group compact">
                    <label class="form-label-sm">Інтереси</label>
                    <div id="editProfileInterestsContainer" class="interests-container-styled"></div>
                    <div class="add-interest-mini" style="margin-top: 5px;">
                        <input type="text" id="editCustomInterestInput" placeholder="Додати ще...">
                        <button type="button" id="addEditCustomInterestBtn" class="btn-icon-only"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <button type="submit" class="btn btn-accent btn-block" style="margin-top: 15px;">Зберегти зміни</button>
            </div>
        </form>
    </div>
</div>

<div class="modal" id="eventDetailModal" role="dialog">
    <div class="modal-content" style="max-width: 500px; padding: 15px;">
        <button class="modal-close" id="closeEventDetailModal">×</button>
        <div id="eventDetailContent">
            <h2 id="eventDetailTitle" style="margin: 0 0 10px; font-size: 1.3em;"></h2>
            <p id="eventDetailMeta" class="card-meta" style="margin: 0 0 12px; font-size: 0.9em;"></p>
            <p id="eventDetailDescription" style="line-height: 1.4; margin-bottom: 12px;"></p>
            <div class="interests" id="eventDetailInterests" style="margin-bottom: 12px;"></div>
            <div id="eventMap"></div>
            <p id="eventDetailParticipantsCount" style="margin: 10px 0; font-weight: 600; text-align: center; color: #0f172a;">
                0/0 учасників
            </p>
            <div id="eventDetailActions" style="margin: 12px 0; text-align: center;"></div>
            <h3 style="margin: 15px 0 10px; font-size: 1em;">Учасники:</h3>
            <div id="eventDetailParticipants" style="display: grid; gap: 10px; max-height: 180px; overflow-y: auto;"></div>
            <h3 style="margin: 15px 0 10px; font-size: 1em;">Чат події</h3>
            <div id="eventChatContainer" style="border: 1px solid #e2e8f0; border-radius: 8px; height: 250px; overflow-y: auto; padding: 8px; margin-bottom: 8px; background: #f8fafc; position: relative;">
                <div id="eventChatMessages"></div>
            </div>
            <div style="display: flex; gap: 8px;">
                <input type="text" id="contactInput" placeholder="Напишіть повідомлення..." style="flex: 1; padding: 6px; border: 1px solid #e2e8f0; border-radius: 4px;">
                <button id="sendChatMessage" class="btn btn-sm" style="padding: 6px 10px;">Надіслати</button>
            </div>
            <button id="editEventBtn" class="btn btn-outline btn-sm" style="display: none; margin-top: 8px;">Редагувати</button>
            <button id="deleteEventBtn" class="btn btn-outline btn-sm" style="display: none; margin-top: 8px; color: #dc3545; border-color: #dc3545;">Видалити</button>
        </div>
        <button id="joinEventBtn" class="btn btn-accent btn-sm" style="display: none;">Приєднатися</button>
        <button id="leaveEventBtn" class="btn btn-outline btn-sm" style="display: none;">Покинути</button>
    </div>
</div>

<div class="modal" id="editEventModal" role="dialog">
    <div class="modal-content">
        <button class="modal-close" id="closeEditEventModal">×</button>
        <h2 id="editEventTitleHeader">Редагувати подію</h2>
        <form id="editEventForm">
            <div class="form-group"><label class="form-label">Назва події</label><input type="text" class="form-control" id="editEventTitle" required></div>
            <div class="form-group"><label class="form-label">Опис</label><textarea class="form-control" id="editEventDescription" rows="4" required></textarea></div>
            <div class="form-group"><label class="form-label">Категорія</label><select class="form-select" id="editEventCategory" required><option value="sports">Спорт</option><option value="games">Ігри</option><option value="arts">Мистецтво</option><option value="food">Їжа</option><option value="outdoors">Природа</option><option value="learning">Навчання</option><option value="social">Соціальні</option><option value="music">Музика</option><option value="travel">Подорожі</option><option value="boardgames">Настільні ігри</option></select></div>
            <div class="form-group"><label class="form-label">Місце</label><input type="text" class="form-control" id="editEventLocation" required></div>
            <div class="form-group"><label class="form-label">Дата та час</label><input type="datetime-local" class="form-control" id="editEventDate" required></div>
            <div class="form-group"><label class="form-label">Макс. учасників</label><input type="number" class="form-control" id="editEventParticipants" required></div>
            <div class="form-group"><label class="form-label">Інтереси</label><div class="interests" id="editEventInterestsContainer"></div></div>
            <div class="form-group custom-interest-group"><div class="custom-input-group"><input type="text" class="form-control" id="editEventCustomInterestInput" placeholder="Додати інтерес"><button type="button" class="btn btn-outline" id="addEditEventCustomInterestBtn">Додати</button></div></div>
            <button type="submit" class="btn btn-accent">Зберегти</button>
        </form>
    </div>
</div>

<div class="modal" id="chatListModal" role="dialog">
    <div class="modal-content">
        <button class="modal-close" id="closeChatListModal">×</button>
        <h2>Особисті чати</h2>
        <div id="chatList" style="margin-top: 16px;"></div>
    </div>
</div>

<div class="modal" id="privateChatModal" role="dialog">
    <div class="modal-content">
        <button class="modal-close" id="closePrivateChatModal">×</button>
        <h2 id="privateChatTitle" style="margin-bottom: 16px;"></h2>
        <div id="privateChatMessages" style="max-height: 400px; overflow-y: auto; margin-bottom: 12px;"></div>
        <div id="privateChatContainer" class="custom-input-group">
            <input type="text" id="privateChatInput" class="form-control" placeholder="Напишіть повідомлення...">
            <button class="btn btn-accent btn-sm" id="sendPrivateMessage">Надіслати</button>
        </div>
    </div>
</div>

<div class="modal" id="socialListModal">
    <div class="modal-content" style="max-width: 400px; height: 500px; display:flex; flex-direction:column;">
        <button class="modal-close" id="closeSocialListModal">×</button>
        <h2 id="socialListTitle" style="text-align: center; margin-bottom:10px;">Список</h2>
        <div id="socialListContainer" style="overflow-y:auto; flex:1;"></div>
    </div>
</div>

<div class="modal" id="otherUserProfileModal" role="dialog">
    <div class="modal-content">
        <button class="modal-close" id="closeOtherUserProfileModal">×</button>
        <img id="otherUserProfileAvatar" src="" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin: 0 auto 12px; display: block;">
        <h2 id="otherUserProfileName" style="text-align: center;"></h2>
        <p id="otherUserProfileUsername" style="text-align: center; color: gray;"></p>
        <div style="display:flex; gap:15px; justify-content:center; margin:10px 0;">
            <div id="otherUserFollowersBtn" style="cursor: pointer;"><b id="otherUserFollowersCount">0</b> підписників</div>
            <div id="otherUserFollowingBtn" style="cursor: pointer;"><b id="otherUserFollowingCount">0</b> підписок</div>
        </div>
        <p id="otherUserProfileMeta" style="text-align: center; font-size: 0.9rem; color: var(--main-secondary-color); margin-bottom: 12px;"></p>
        <div id="otherUserProfileInterests" class="interests" style="justify-content: center;"></div>
        <div id="otherUserProfileEvents" style="margin-top: 16px;"></div>
        <div style="text-align: center; margin-top: 16px; display:flex; gap:10px; justify-content:center;">
            <button class="btn btn-accent" id="otherUserMessageBtn">Написати</button>
            <button class="btn btn-outline" id="otherUserFollowBtn">Підписатися</button>
        </div>
    </div>
</div>

<div class="modal" id="interestSearchModal" role="dialog">
    <div class="modal-content" style="max-width: 700px;"> 
        <button class="modal-close" id="closeInterestSearchModal">×</button>
        <h2 id="interestModalTitle" class="modal-step-title" style="text-align: left; margin-bottom: 1.5rem;">Результати для...</h2>
        <div class="interest-modal-layout">
            <div class="interest-modal-column">
                <h3><i class="fas fa-calendar-alt"></i> Події з цим інтересом</h3>
                <div class="interest-modal-grid" id="interestModalEventsGrid"></div>
            </div>
            <div class="interest-modal-column">
                <h3><i class="fas fa-users"></i> Люди з цим інтересом</h3>
                <div class="interest-modal-grid" id="interestModalPeopleGrid"></div>
            </div>
        </div>
    </div>
</div>
`;