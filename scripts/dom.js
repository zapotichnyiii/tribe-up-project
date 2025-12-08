// scripts/dom.js (повна версія)

export let authScreen = null;
export let mainApp = null;
export let loginFormInitial = null;
export let showRegisterFormLink = null;
export let eventsGrid = null;
export let peopleGrid = null;
export let peopleHorizontalTrack = null;
export let peopleScrollLeftBtn = null;
export let peopleScrollRightBtn = null;

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

export let profileModal = null;
export let closeProfileModal = null;
export let profileModalAvatar = null;
export let profileModalName = null;
export let profileModalUsername = null;
export let profileModalMeta = null;
export let profileModalInterests = null;
export let profileLogoutBtn = null;
export let profileDisplay = null;
export let profileAvatar = null;
export let profileUsername = null;
export let userEventsList = null;

export let editProfileModal = null;
export let closeEditProfileModal = null;
export let editProfileForm = null;
export let editProfileAvatarPreview = null;
export let editProfilePhoto = null;
export let editProfileName = null;
export let editProfileUsername = null;
export let editProfileAge = null;
export let editProfileLocation = null;
export let editProfileInterestsContainer = null;
export let addEditCustomInterestBtn = null;
export let editCustomInterestInput = null;

export let eventDetailModal = null;
export let closeEventDetailModal = null;

export let editEventModal = null;
export let closeEditEventModal = null;
export let editEventForm = null;
export let editEventTitle = null;
export let editEventDescription = null;
export let editEventCategory = null;
export let editEventLocation = null;
export let editEventDate = null;
export let editEventParticipants = null;
export let editEventInterestsContainer = null;
export let addEditEventCustomInterestBtn = null;
export let editEventCustomInterestInput = null;

export let themeToggle = null;
export let backToTopBtn = null;
export let toggleArchiveBtn = null;

export let chatListModal = null;
export let closeChatListModal = null;
export let chatListBtn = null;
export let privateChatModal = null;
export let closePrivateChatModal = null;
export let privateChatMessages = null;
export let privateChatInput = null;
export let sendPrivateMessageBtn = null;
export let chatBadge = null;

export let otherUserProfileModal = null;
export let closeOtherUserProfileModal = null;
export let otherUserProfileAvatar = null;
export let otherUserProfileName = null;
export let otherUserProfileUsername = null;
export let otherUserProfileMeta = null;
export let otherUserProfileInterests = null;
export let otherUserProfileEvents = null;
export let otherUserMessageBtn = null;
export let otherUserFollowersBtn = null;
export let otherUserFollowingBtn = null;

export let eventsHorizontalTrack = null;
export let eventCount = null;
export let scrollLeftBtn = null;
export let scrollRightBtn = null;

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

export let interestSearchModal = null;
export let closeInterestSearchModal = null;
export let interestModalTitle = null;
export let interestModalEventsGrid = null;
export let interestModalPeopleGrid = null;

export let searchEventsBtn = null;
export let contactForm = null;

export let notificationBtn = null;
export let notificationBadge = null;
export let notificationDropdown = null;
export let notificationList = null;
export let markAllReadBtn = null;

export let myFollowersBtn = null;
export let myFollowingBtn = null;
export let socialListModal = null;
export let closeSocialListModal = null;
export let socialListContainer = null;
export let socialListTitle = null;

export let otherUserFollowBtn = null;
export let otherUserFollowersCount = null;
export let otherUserFollowingCount = null;

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

export let profileArea = null;
export let editProfileBtn = null;

export function refreshElements() {
    authScreen = document.getElementById('authScreen');
    mainApp = document.getElementById('mainApp');
    loginFormInitial = document.getElementById('loginFormInitial');
    showRegisterFormLink = document.getElementById('showRegisterFormLink');
    eventsGrid = document.getElementById('eventsGrid');
    peopleGrid = document.getElementById('peopleGrid');
    peopleHorizontalTrack = document.getElementById('peopleHorizontalTrack');
    peopleScrollLeftBtn = document.getElementById('peopleScrollLeftBtn');
    peopleScrollRightBtn = document.getElementById('peopleScrollRightBtn');

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

    profileModal = document.getElementById('profileModal');
    closeProfileModal = document.getElementById('closeProfileModal');
    profileModalAvatar = document.getElementById('profileModalAvatar');
    profileModalName = document.getElementById('profileModalName');
    profileModalUsername = document.getElementById('profileModalUsername');
    profileModalMeta = document.getElementById('profileModalMeta');
    profileModalInterests = document.getElementById('profileModalInterests');
    profileLogoutBtn = document.getElementById('profileLogoutBtn');
    profileDisplay = document.getElementById('profileDisplay');
    profileAvatar = document.getElementById('profileAvatar');
    profileUsername = document.getElementById('profileUsername');
    userEventsList = document.getElementById('userEventsList');

    editProfileModal = document.getElementById('editProfileModal');
    closeEditProfileModal = document.getElementById('closeEditProfileModal');
    editProfileForm = document.getElementById('editProfileForm');
    editProfileAvatarPreview = document.getElementById('editProfileAvatarPreview');
    editProfilePhoto = document.getElementById('editProfilePhoto');
    editProfileName = document.getElementById('editProfileName');
    editProfileUsername = document.getElementById('editProfileUsername');
    editProfileAge = document.getElementById('editProfileAge');
    editProfileLocation = document.getElementById('editProfileLocation');
    editProfileInterestsContainer = document.getElementById('editProfileInterestsContainer');
    addEditCustomInterestBtn = document.getElementById('addEditCustomInterestBtn');
    editCustomInterestInput = document.getElementById('editCustomInterestInput');

    eventDetailModal = document.getElementById('eventDetailModal');
    closeEventDetailModal = document.getElementById('closeEventDetailModal');

    editEventModal = document.getElementById('editEventModal');
    closeEditEventModal = document.getElementById('closeEditEventModal');
    editEventForm = document.getElementById('editEventForm');
    editEventTitle = document.getElementById('editEventTitle');
    editEventDescription = document.getElementById('editEventDescription');
    editEventCategory = document.getElementById('editEventCategory');
    editEventLocation = document.getElementById('editEventLocation');
    editEventDate = document.getElementById('editEventDate');
    editEventParticipants = document.getElementById('editEventParticipants');
    editEventInterestsContainer = document.getElementById('editEventInterestsContainer');
    addEditEventCustomInterestBtn = document.getElementById('addEditEventCustomInterestBtn');
    editEventCustomInterestInput = document.getElementById('editEventCustomInterestInput');

    themeToggle = document.querySelector('.theme-toggle');
    backToTopBtn = document.querySelector('.back-to-top');
    toggleArchiveBtn = document.getElementById('toggleArchiveBtn');

    chatListModal = document.getElementById('chatListModal');
    closeChatListModal = document.getElementById('closeChatListModal');
    chatListBtn = document.getElementById('chatListBtn') || document.querySelector('.chat-list-btn');
    privateChatModal = document.getElementById('privateChatModal');
    closePrivateChatModal = document.getElementById('closePrivateChatModal');
    privateChatMessages = document.getElementById('privateChatMessages');
    privateChatInput = document.getElementById('privateChatInput');
    sendPrivateMessageBtn = document.getElementById('sendPrivateMessage');
    chatBadge = document.getElementById('chatBadge');

    otherUserProfileModal = document.getElementById('otherUserProfileModal');
    closeOtherUserProfileModal = document.getElementById('closeOtherUserProfileModal');
    otherUserProfileAvatar = document.getElementById('otherUserProfileAvatar');
    otherUserProfileName = document.getElementById('otherUserProfileName');
    otherUserProfileUsername = document.getElementById('otherUserProfileUsername');
    otherUserProfileMeta = document.getElementById('otherUserProfileMeta');
    otherUserProfileInterests = document.getElementById('otherUserProfileInterests');
    otherUserProfileEvents = document.getElementById('otherUserProfileEvents');
    otherUserMessageBtn = document.getElementById('otherUserMessageBtn');
    otherUserFollowersBtn = document.getElementById('otherUserFollowersBtn');
    otherUserFollowingBtn = document.getElementById('otherUserFollowingBtn');

    eventsHorizontalTrack = document.getElementById('eventsHorizontalTrack');
    eventCount = document.getElementById('eventCount');
    scrollLeftBtn = document.getElementById('scrollLeftBtn');
    scrollRightBtn = document.getElementById('scrollRightBtn');

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

    interestSearchModal = document.getElementById('interestSearchModal');
    closeInterestSearchModal = document.getElementById('closeInterestSearchModal');
    interestModalTitle = document.getElementById('interestModalTitle');
    interestModalEventsGrid = document.getElementById('interestModalEventsGrid');
    interestModalPeopleGrid = document.getElementById('interestModalPeopleGrid');

    searchEventsBtn = document.getElementById('searchEventsBtn');
    contactForm = document.getElementById('contactForm');

    notificationBtn = document.getElementById('notificationBtn');
    notificationBadge = document.getElementById('notificationBadge');
    notificationDropdown = document.getElementById('notificationDropdown');
    notificationList = document.getElementById('notificationList');
    markAllReadBtn = document.getElementById('markAllReadBtn');

    myFollowersBtn = document.getElementById('myFollowersBtn');
    myFollowingBtn = document.getElementById('myFollowingBtn');
    socialListModal = document.getElementById('socialListModal');
    closeSocialListModal = document.getElementById('closeSocialListModal');
    socialListContainer = document.getElementById('socialListContainer');
    socialListTitle = document.getElementById('socialListTitle');

    otherUserFollowBtn = document.getElementById('otherUserFollowBtn');
    otherUserFollowersCount = document.getElementById('otherUserFollowersCount');
    otherUserFollowingCount = document.getElementById('otherUserFollowingCount');

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

    profileArea = document.getElementById('profileArea');
    editProfileBtn = document.getElementById('editProfileBtn');
}

refreshElements();