// Експортуємо всі DOM-елементи для легкого доступу з інших модулів
export const authScreen = document.getElementById('authScreen');
export const mainApp = document.getElementById('mainApp');
export const loginFormInitial = document.getElementById('loginFormInitial');
export const showRegisterFormLink = document.getElementById('showRegisterFormLink');
export const eventsGrid = document.getElementById('eventsGrid');
export const peopleGrid = document.getElementById('peopleGrid');
export const peopleHorizontalTrack = document.getElementById('peopleHorizontalTrack');
export const peopleScrollLeftBtn = document.getElementById('peopleScrollLeftBtn');
export const peopleScrollRightBtn = document.getElementById('peopleScrollRightBtn');

// --- СТВОРЕННЯ ПОДІЇ ---
export const createEventBtn = document.getElementById('createEventBtn');
export const createEventModal = document.getElementById('createEventModal');
export const closeEventModal = document.getElementById('closeEventModal');
export const createEventForm = document.getElementById('createEventForm');

// Поля форми створення
export const eventTitle = document.getElementById('eventTitle');
export const eventDescription = document.getElementById('eventDescription');
export const eventCategory = document.getElementById('eventCategory');
export const eventLocation = document.getElementById('eventLocation');
export const eventDate = document.getElementById('eventDate');
export const eventParticipants = document.getElementById('eventParticipants');
export const eventMinParticipants = document.getElementById('eventMinParticipants');
export const eventInterestsContainer = document.getElementById('eventInterestsContainer');
export const addEventCustomInterestBtn = document.getElementById('addEventCustomInterestBtn');
export const eventCustomInterestInput = document.getElementById('eventCustomInterestInput');

// Навігація в модалці створення
export const eventStepNext1 = document.getElementById('eventStepNext1');
export const eventStepNext2 = document.getElementById('eventStepNext2');
export const eventStepBack2 = document.getElementById('eventStepBack2');
export const eventStepBack3 = document.getElementById('eventStepBack3');
export const eventStepIndicator = document.getElementById('eventStepIndicator');
export const modalStepTitle = document.getElementById('createEventTitle');
export const eventSteps = document.querySelectorAll('#createEventModal .modal-step');

// --- РЕЄСТРАЦІЯ ---
export const registerModal = document.getElementById('registerModal');
export const closeRegisterModal = document.getElementById('closeRegisterModal');
export const registerForm = document.getElementById('registerForm');
export const registerInterestsContainer = document.getElementById('registerInterestsContainer');
export const customInterestInput = document.getElementById('customInterestInput');
export const addCustomInterestBtn = document.getElementById('addCustomInterestBtn');
export const verifyModal = document.getElementById('verifyModal');
export const verifyCodeInput = document.getElementById('verifyCodeInput');
export const verifyBtn = document.getElementById('verifyBtn');
export const verifyError = document.getElementById('verifyError');

// --- ПРОФІЛЬ ---
export const profileModal = document.getElementById('profileModal');
export const closeProfileModal = document.getElementById('closeProfileModal');
export const profileModalAvatar = document.getElementById('profileModalAvatar');
export const profileModalName = document.getElementById('profileModalName');
export const profileModalUsername = document.getElementById('profileModalUsername');
export const profileModalMeta = document.getElementById('profileModalMeta');
export const profileModalInterests = document.getElementById('profileModalInterests');
export const profileLogoutBtn = document.getElementById('profileLogoutBtn');
export const profileDisplay = document.getElementById('profileDisplay');
export const profileAvatar = document.getElementById('profileAvatar');
export const profileUsername = document.getElementById('profileUsername');
export const userEventsList = document.getElementById('userEventsList');

// --- РЕДАГУВАННЯ ПРОФІЛЮ ---
export const editProfileModal = document.getElementById('editProfileModal');
export const closeEditProfileModal = document.getElementById('closeEditProfileModal');
export const editProfileForm = document.getElementById('editProfileForm');
export const editProfileAvatarPreview = document.getElementById('editProfileAvatarPreview');
export const editProfilePhoto = document.getElementById('editProfilePhoto');
export const editProfileName = document.getElementById('editProfileName');
export const editProfileUsername = document.getElementById('editProfileUsername');
export const editProfileAge = document.getElementById('editProfileAge');
export const editProfileLocation = document.getElementById('editProfileLocation');
export const editProfileInterestsContainer = document.getElementById('editProfileInterestsContainer');
export const addEditCustomInterestBtn = document.getElementById('addEditCustomInterestBtn');
export const editCustomInterestInput = document.getElementById('editCustomInterestInput');

// --- ДЕТАЛІ ПОДІЇ ---
export const eventDetailModal = document.getElementById('eventDetailModal');
export const closeEventDetailModal = document.getElementById('closeEventDetailModal');

// --- РЕДАГУВАННЯ ПОДІЇ ---
export const editEventModal = document.getElementById('editEventModal');
export const closeEditEventModal = document.getElementById('closeEditEventModal');
export const editEventForm = document.getElementById('editEventForm');
export const editEventTitle = document.getElementById('editEventTitle');
export const editEventDescription = document.getElementById('editEventDescription');
export const editEventCategory = document.getElementById('editEventCategory');
export const editEventLocation = document.getElementById('editEventLocation');
export const editEventDate = document.getElementById('editEventDate');
export const editEventParticipants = document.getElementById('editEventParticipants');
export const editEventInterestsContainer = document.getElementById('editEventInterestsContainer');
export const addEditEventCustomInterestBtn = document.getElementById('addEditEventCustomInterestBtn');
export const editEventCustomInterestInput = document.getElementById('editEventCustomInterestInput');

// --- ІНШЕ ---
export const themeToggle = document.querySelector('.theme-toggle');
export const backToTopBtn = document.querySelector('.back-to-top');
export const toggleArchiveBtn = document.getElementById('toggleArchiveBtn');

// --- ЧАТИ ---
export const chatListModal = document.getElementById('chatListModal');
export const closeChatListModal = document.getElementById('closeChatListModal');
export const chatListBtn = document.querySelector('.chat-list-btn');
export const privateChatModal = document.getElementById('privateChatModal');
export const closePrivateChatModal = document.getElementById('closePrivateChatModal');
export const privateChatMessages = document.getElementById('privateChatMessages');
export const privateChatInput = document.getElementById('privateChatInput');
export const sendPrivateMessageBtn = document.getElementById('sendPrivateMessage');
export const chatBadge = document.getElementById('chatBadge');

// --- ІНШИЙ ЮЗЕР ---
export const otherUserProfileModal = document.getElementById('otherUserProfileModal');
export const closeOtherUserProfileModal = document.getElementById('closeOtherUserProfileModal');
export const otherUserProfileAvatar = document.getElementById('otherUserProfileAvatar');
export const otherUserProfileName = document.getElementById('otherUserProfileName');
export const otherUserProfileUsername = document.getElementById('otherUserProfileUsername');
export const otherUserProfileMeta = document.getElementById('otherUserProfileMeta');
export const otherUserProfileInterests = document.getElementById('otherUserProfileInterests');
export const otherUserProfileEvents = document.getElementById('otherUserProfileEvents');
export const otherUserMessageBtn = document.getElementById('otherUserMessageBtn');
export const otherUserFollowersBtn = document.getElementById('otherUserFollowersBtn');
export const otherUserFollowingBtn = document.getElementById('otherUserFollowingBtn');

// --- КАРУСЕЛЬ ТА ФІЛЬТРИ ---
export const eventsHorizontalTrack = document.getElementById('eventsHorizontalTrack');
export const eventCount = document.getElementById('eventCount');
export const scrollLeftBtn = document.getElementById('scrollLeftBtn');
export const scrollRightBtn = document.getElementById('scrollRightBtn');

export const searchQueryInput = document.getElementById('searchQueryInput');
export const locationInput = document.getElementById('locationInput');
export const categorySelect = document.getElementById('categorySelect');
export const dateInput = document.getElementById('dateInput');
export const peopleSelect = document.getElementById('peopleSelect');
export const distanceInput = document.getElementById('distanceInput');
export const sortSelect = document.getElementById('sortSelect');
export const statusSelect = document.getElementById('statusSelect');
export const interestSearchInput = document.getElementById('interestSearchInput');
export const searchBtn = document.getElementById('searchBtn');
export const clearFiltersBtn = document.getElementById('clearFiltersBtn');
export const peopleInterestFilter = document.getElementById('peopleInterestFilter');
export const userSearchInput = document.getElementById('userSearchInput');
export const cityFilterInput = document.getElementById('cityFilterInput');

// --- ПОШУК ІНТЕРЕСІВ ---
export const interestSearchModal = document.getElementById('interestSearchModal');
export const closeInterestSearchModal = document.getElementById('closeInterestSearchModal');
export const interestModalTitle = document.getElementById('interestModalTitle');
export const interestModalEventsGrid = document.getElementById('interestModalEventsGrid');
export const interestModalPeopleGrid = document.getElementById('interestModalPeopleGrid');

export const searchEventsBtn = document.getElementById('searchEventsBtn');
export const contactForm = document.getElementById('contactForm');

// --- НОВІ ЕЛЕМЕНТИ (СОЦІАЛЬНІ ТА СПОВІЩЕННЯ) ---
export const notificationBtn = document.getElementById('notificationBtn');
export const notificationBadge = document.getElementById('notificationBadge');
export const notificationDropdown = document.getElementById('notificationDropdown');
export const notificationList = document.getElementById('notificationList');
export const markAllReadBtn = document.getElementById('markAllReadBtn');

export const myFollowersBtn = document.getElementById('myFollowersBtn');
export const myFollowingBtn = document.getElementById('myFollowingBtn');
export const socialListModal = document.getElementById('socialListModal');
export const closeSocialListModal = document.getElementById('closeSocialListModal');
export const socialListContainer = document.getElementById('socialListContainer');
export const socialListTitle = document.getElementById('socialListTitle');

export const otherUserFollowBtn = document.getElementById('otherUserFollowBtn');
export const otherUserFollowersCount = document.getElementById('otherUserFollowersCount');
export const otherUserFollowingCount = document.getElementById('otherUserFollowingCount');

// --- ВІДНОВЛЕННЯ ПАРОЛЮ ---
export const forgotPasswordLink = document.getElementById('forgotPasswordLink');
export const forgotPasswordModal = document.getElementById('forgotPasswordModal');
export const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
export const forgotStep1 = document.getElementById('forgotStep1');
export const forgotStep2 = document.getElementById('forgotStep2');
export const forgotEmailInput = document.getElementById('forgotEmailInput');
export const sendResetCodeBtn = document.getElementById('sendResetCodeBtn');
export const forgotEmailDisplay = document.getElementById('forgotEmailDisplay');
export const forgotCodeInput = document.getElementById('forgotCodeInput');
export const forgotNewPassword = document.getElementById('forgotNewPassword');
export const confirmResetBtn = document.getElementById('confirmResetBtn');