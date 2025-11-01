# TribeUp

TribeUp is a front-end web application designed to connect people by allowing them to find, create, and join local events based on shared interests. It's a concept for a community-building platform where finding new friends and planning activities is simple and intuitive.

This project is built entirely as a front-end application and uses the browser's **localStorage** to simulate a database for users, events, chats, and interests.

## 🚀 Key Features

* **User Authentication:** A modern, tabbed interface for user login and registration. Includes registration consent for personal data processing.
* **Event Management:** Authenticated users can create, edit, delete, join, and leave events.
* **Dynamic Event Carousel:** A "Bold & Action" (V4) design for browsing popular events in a smooth, horizontal, scrollable carousel.
* **People Discovery:** Users can find other people from their city and filter them by shared interests.
* **Interest-Based Matching:** The core logic is built around user interests. Users can add custom interests, and events are tagged for easy filtering.
* **Integrated Chat System:**
    * **Event Chat:** Every event has its own group chat for participants.
    * **Private Chat:** A private, one-on-one messaging system between any two users.
* **Interactive Profiles:** Users have profiles displaying their avatar, interests, and a list of events they've created or joined.
* **Advanced Filtering:** A comprehensive filter section to find events by name, location, category, date, and more.
* **Interactive Maps:** Integrates with **Leaflet.js** to display a precise map location for each event.
* **Light & Dark Mode:** A toggleable theme to switch between light and dark modes.
* **Fully Responsive:** Designed to work smoothly on desktop, tablet, and mobile devices.

## 🛠️ Tech Stack

* **HTML5:** Semantic markup for structure.
* **CSS3:** Heavily styled with modern CSS, including Flexbox, Grid, Custom Properties, and animations for a responsive and beautiful UI.
* **JavaScript (ES6+):** Handles all application logic, DOM manipulation, state management, and user interactions.
* **LocalStorage:** Used as the client-side "database" to store all persistent data (users, events, chats).https://www.youtube.com/watch?v=2pIBe05NXAE
* **External Libraries:**
    * [Leaflet.js](https://leafletjs.com/) for interactive maps.
    * [Font Awesome](https://fontawesome.com/) for icons.
    * [Google Fonts](https://fonts.google.com/) (Montserrat & Playfair Display) for typography.

## 🏁 How to Run

No server or build process is required.

1.  Clone this repository.
2.  Open the `index.html` file in your web browser.
3.  (Optional) For the best experience, use a local server extension like **Live Server** in VS Code.

## 🎬 Application Demo
[Watch the full demo video here](https://www.youtube.com/watch?v=2pIBe05NXAE)

Here is a short video walkthrough of the TribeUp application, demonstrating its key features, user flow, and responsive design.
