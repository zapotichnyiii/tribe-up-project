// scripts/dom.js

// Екран авторизації (index.html)
export let authScreen = null;
export let mainApp = null;
export let loginFormInitial = null;
export let showRegisterFormLink = null;

// Головні контейнери (index.html)
export let eventsGrid = null; // Для результатів пошуку
export let peopleGrid = null; // Для результатів пошуку
export let peopleHorizontalTrack = null;
export let peopleScrollLeftBtn = null;
export let peopleScrollRightBtn = null;
export let eventsHorizontalTrack = null;
export let eventCount = null;
export let scrollLeftBtn = null;
export let scrollRightBtn = null;

// Модалки авторизації
export let registerModal = null;
export let closeRegisterModal = null;
export let registerForm = null;
export let registerInterestsContainer = null;
export let customInterestInput = null;
export let addCustomInterestBtn = null;
export let verifyModal = null;
export let verifyCodeInput = null;
export let verifyBtn = null;
export let verifyError = null;

export let forgotPasswordLink = null;
export let forgotPasswordModal = null;
export let closeForgotPasswordModal = null;
export let forgotStep1 = null;
export let forgotStep2 = null;
export let forgotEmailInput = null;
export let sendResetCodeBtn = null;
export let forgotEmailDisplay = null;
export let forgotCodeInput = null;
export let forgotNewPassword = null;
export let confirmResetBtn = null;

// Хедер
export let themeToggle = null;
export let backToTopBtn = null;
export let toggleArchiveBtn = null;
export let chatListBtn = null;
export let chatBadge = null;
export let notificationBtn = null;
export let notificationBadge = null;
export let notificationDropdown = null;
export let notificationList = null;
export let markAllReadBtn = null;
export let profileArea = null;
export let profileDisplay = null;
export let profileAvatar = null;
export let profileUsername = null;
export let profileLogoutBtn = null; // Якщо він в меню

// Фільтри
export let searchQueryInput = null;
export let locationInput = null;
export let categorySelect = null;
export let dateInput = null;
export let peopleSelect = null;
export let distanceInput = null;
export let sortSelect = null;
export let statusSelect = null;
export let interestSearchInput = null;
export let searchBtn = null;
export let clearFiltersBtn = null;
export let peopleInterestFilter = null;
export let userSearchInput = null;
export let cityFilterInput = null;
export let searchEventsBtn = null;

// Модалка пошуку за інтересом (спільна)
export let interestSearchModal = null;
export let closeInterestSearchModal = null;
export let interestModalTitle = null;
export let interestModalEventsGrid = null;
export let interestModalPeopleGrid = null;

// Модалка списків (підписники) - спільна
export let socialListModal = null;
export let closeSocialListModal = null;
export let socialListContainer = null;
export let socialListTitle = null;
export let myFollowersBtn = null;
export let myFollowingBtn = null;

// Елементи, які можуть бути на сторінці профілю іншого юзера (якщо ми на index.html)
// Якщо ми перейшли на user.html, ці змінні в dom.js будуть null, 
// але краще залишити їх декларацію, щоб main.js не ламався, якщо десь є перевірки
export let otherUserMessageBtn = null; 

export function refreshElements() {
    authScreen = document.getElementById('authScreen');
    mainApp = document.getElementById('mainApp');
    loginFormInitial = document.getElementById('loginFormInitial');
    showRegisterFormLink = document.getElementById('showRegisterFormLink');
    eventsGrid = document.getElementById('eventsGrid');
    peopleGrid = document.getElementById('peopleGrid');
    
    // Каруселі
    peopleHorizontalTrack = document.getElementById('peopleHorizontalTrack');
    peopleScrollLeftBtn = document.getElementById('peopleScrollLeftBtn');
    peopleScrollRightBtn = document.getElementById('peopleScrollRightBtn');
    eventsHorizontalTrack = document.getElementById('eventsHorizontalTrack');
    eventCount = document.getElementById('eventCount');
    scrollLeftBtn = document.getElementById('scrollLeftBtn');
    scrollRightBtn = document.getElementById('scrollRightBtn');

    // Реєстрація
    registerModal = document.getElementById('registerModal');
    closeRegisterModal = document.getElementById('closeRegisterModal');
    registerForm = document.getElementById('registerForm');
    registerInterestsContainer = document.getElementById('registerInterestsContainer');
    customInterestInput = document.getElementById('customInterestInput');
    addCustomInterestBtn = document.getElementById('addCustomInterestBtn');
    verifyModal = document.getElementById('verifyModal');
    verifyCodeInput = document.getElementById('verifyCodeInput');
    verifyBtn = document.getElementById('verifyBtn');
    verifyError = document.getElementById('verifyError');

    // Відновлення паролю
    forgotPasswordLink = document.getElementById('forgotPasswordLink');
    forgotPasswordModal = document.getElementById('forgotPasswordModal');
    closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
    forgotStep1 = document.getElementById('forgotStep1');
    forgotStep2 = document.getElementById('forgotStep2');
    forgotEmailInput = document.getElementById('forgotEmailInput');
    sendResetCodeBtn = document.getElementById('sendResetCodeBtn');
    forgotEmailDisplay = document.getElementById('forgotEmailDisplay');
    forgotCodeInput = document.getElementById('forgotCodeInput');
    forgotNewPassword = document.getElementById('forgotNewPassword');
    confirmResetBtn = document.getElementById('confirmResetBtn');

    // Хедер
    themeToggle = document.querySelector('.theme-toggle');
    backToTopBtn = document.querySelector('.back-to-top');
    toggleArchiveBtn = document.getElementById('toggleArchiveBtn');
    chatListBtn = document.getElementById('chatListBtn') || document.querySelector('.chat-list-btn');
    chatBadge = document.getElementById('chatBadge');
    notificationBtn = document.getElementById('notificationBtn');
    notificationBadge = document.getElementById('notificationBadge');
    notificationDropdown = document.getElementById('notificationDropdown');
    notificationList = document.getElementById('notificationList');
    markAllReadBtn = document.getElementById('markAllReadBtn');
    profileArea = document.getElementById('profileArea');
    profileDisplay = document.getElementById('profileDisplay');
    profileAvatar = document.getElementById('profileAvatar');
    profileUsername = document.getElementById('profileUsername');
    profileLogoutBtn = document.getElementById('profileLogoutBtn');

    // Фільтри
    searchQueryInput = document.getElementById('searchQueryInput');
    locationInput = document.getElementById('locationInput');
    categorySelect = document.getElementById('categorySelect');
    dateInput = document.getElementById('dateInput');
    peopleSelect = document.getElementById('peopleSelect');
    distanceInput = document.getElementById('distanceInput');
    sortSelect = document.getElementById('sortSelect');
    statusSelect = document.getElementById('statusSelect');
    interestSearchInput = document.getElementById('interestSearchInput');
    searchBtn = document.getElementById('searchBtn');
    clearFiltersBtn = document.getElementById('clearFiltersBtn');
    peopleInterestFilter = document.getElementById('peopleInterestFilter');
    userSearchInput = document.getElementById('userSearchInput');
    cityFilterInput = document.getElementById('cityFilterInput');
    searchEventsBtn = document.getElementById('searchEventsBtn');

    // Спільні модалки
    interestSearchModal = document.getElementById('interestSearchModal');
    closeInterestSearchModal = document.getElementById('closeInterestSearchModal');
    interestModalTitle = document.getElementById('interestModalTitle');
    interestModalEventsGrid = document.getElementById('interestModalEventsGrid');
    interestModalPeopleGrid = document.getElementById('interestModalPeopleGrid');

    socialListModal = document.getElementById('socialListModal');
    closeSocialListModal = document.getElementById('closeSocialListModal');
    socialListContainer = document.getElementById('socialListContainer');
    socialListTitle = document.getElementById('socialListTitle');
    myFollowersBtn = document.getElementById('myFollowersBtn');
    myFollowingBtn = document.getElementById('myFollowingBtn');

    // Тимчасові елементи (можуть бути відсутні на деяких сторінках)
    otherUserMessageBtn = document.getElementById('otherUserMessageBtn');
}

refreshElements();