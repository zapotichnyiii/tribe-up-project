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
<div class="modal" id="socialListModal">
    <div class="modal-content small-modal">
        <button class="modal-close" id="closeSocialListModal">×</button>
        <h2 id="socialListTitle" style="text-align: center; margin-bottom:10px;">Список</h2>
        <div id="socialListContainer" class="social-list-scroll"></div>
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

<div class="modal" id="forgotPasswordModal" role="dialog">
    <div class="modal-content" style="max-width: 400px;">
        <button class="modal-close" id="closeForgotPasswordModal">×</button>
        
        <div id="forgotStep1">
            <h2 style="text-align: center; margin-bottom: 15px;">Відновлення доступу</h2>
            <p style="text-align: center; margin-bottom: 20px; color: var(--main-secondary-color);">Введіть пошту, прив'язану до акаунту</p>
            <div class="form-group">
                <input type="email" id="forgotEmailInput" class="form-control" placeholder="Ваша пошта" required>
            </div>
            <button id="sendResetCodeBtn" class="btn btn-accent" style="width: 100%;">Надіслати код</button>
        </div>

        <div id="forgotStep2" style="display: none;">
            <h2 style="text-align: center; margin-bottom: 15px;">Зміна паролю</h2>
            <p style="text-align: center; margin-bottom: 20px;">Код надіслано на <b id="forgotEmailDisplay"></b></p>
            
            <div class="form-group">
                <input type="text" id="forgotCodeInput" class="form-control" placeholder="Код з листа (6 цифр)" maxlength="6" style="text-align: center; letter-spacing: 2px;">
            </div>
            <div class="form-group">
                <input type="password" id="forgotNewPassword" class="form-control" placeholder="Новий пароль">
            </div>
            <button id="confirmResetBtn" class="btn btn-accent" style="width: 100%;">Змінити пароль</button>
        </div>
    </div>
</div>

<div class="modal" id="verifyModal" role="dialog">
    <div class="modal-content" style="max-width: 400px; text-align: center;">
        <h2>Підтвердження пошти</h2>
        <p>Ми надіслали 6-значний код на вашу пошту. Введіть його нижче:</p>
        <div class="form-group">
            <input type="text" id="verifyCodeInput" class="form-control" placeholder="123456" maxlength="6" style="text-align: center; font-size: 1.5em; letter-spacing: 5px;">
        </div>
        <button id="verifyBtn" class="btn btn-accent" style="width: 100%;">Підтвердити</button>
        <p id="verifyError" style="color: red; margin-top: 10px; display: none;"></p>
    </div>
</div>
`;