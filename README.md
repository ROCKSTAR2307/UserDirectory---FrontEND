# User Directory App 🚀

This project is a comprehensive user management application built with React, Redux, and Material UI. It provides a user-friendly interface for creating, reading, updating, and deleting user data. The application also includes features such as authentication, data filtering, sorting, pagination, bulk actions, and import functionality. It leverages Redux for state management, ensuring a predictable and maintainable application architecture.

## 🚀 Key Features

- **User Management:** Create, read, update, and delete user information seamlessly.
- **Authentication:** Secure user login and authentication process.
- **Data Fetching:** Efficiently retrieve user data from an API with pagination, sorting, and filtering.
- **State Management:** Utilize Redux for centralized state management, ensuring data consistency across components.
- **UI Rendering:** Render a clean and intuitive user interface with Material UI components.
- **Notifications:** Display real-time notifications to users for important events and feedback.
- **Confirmation Dialogs:** Implement confirmation dialogs for critical actions to prevent accidental data loss.
- **Bulk Actions:** Perform actions on multiple users simultaneously, such as bulk deletion.
- **Import Functionality:** Import user data from files for quick and easy data population.
- **Rate Limiting:** Handle API rate limits gracefully and inform users about the status.
- **Recently Viewed Users:** Display a list of recently viewed users for quick access.
- **Deleted Users Panel:** Manage and view deleted users.

## 🛠️ Tech Stack

- **Frontend:**
    - React
    - React-DOM
    - Material UI (@mui/material, @mui/icons-material)
    - Emotion (@emotion/react, @emotion/styled)
- **State Management:**
    - Redux
    - Redux Toolkit (@reduxjs/toolkit)
    - React-Redux
- **Build Tool:**
    - Vite
    - @vitejs/plugin-react
- **Authentication:**
    - Toolpad Core (@toolpad/core)
- **Other:**
    - TypeScript
    - ESLint
- **API Communication:**
    - Fetch API

## 📦 Getting Started / Setup Instructions

### Prerequisites

- Node.js (>=18)
- npm or yarn

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository_url>
    cd userdirectory
    ```

2.  Install dependencies:

    ```bash
    npm install # or yarn install
    ```

### Running Locally

1.  Start the development server:

    ```bash
    npm run dev # or yarn dev
    ```

    This will start the application at `http://localhost:5173` (or another port if 5173 is in use).

2.  Configure API Proxy:

    Ensure your backend API is running at `http://localhost:8080`. The Vite configuration (`vite.config.ts`) is set up to proxy `/api` requests to this address.

## 📂 Project Structure

```
userdirectory/
├── src/
│   ├── auth/
│   │   └── login.tsx             # Login component
│   ├── components/
│   │   ├── header.tsx            # Header component
│   │   ├── UserCard.tsx          # User card component
│   │   ├── UserModal.tsx         # User modal component
│   │   ├── RecentlyViewed.tsx    # Recently viewed component
│   │   ├── DeletedPanel.tsx      # Deleted panel component
│   │   ├── RateLimitToast.tsx    # Rate limit toast component
│   │   ├── SkeletonCard.tsx      # Skeleton card component
│   │   ├── ImportReviewModal.tsx # Import review modal component
│   │   ├── NotificationContext.tsx # Notification context
│   │   ├── Notification.tsx      # Notification component
│   │   ├── ConfirmDialog.tsx     # Confirm dialog component
│   │   └── config.ts             # Configuration file
│   ├── store/
│   │   ├── store.ts              # Redux store configuration
│   │   └── usersSlice.ts         # Redux slice for users
│   ├── utils/
│   │   └── api.ts                # API utility functions
│   ├── App.tsx                   # Main application component
│   ├── organized_app.tsx         # Re-export of App component
│   ├── main.tsx                  # Entry point for React application
│   ├── index.css                 # Global CSS styles
│   └── types.ts                  # Type definitions
├── vite.config.ts              # Vite configuration file
├── package.json                # Project metadata and dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project documentation (this file)
```

## 💻 Usage

1.  **Login:** Navigate to the login page to authenticate.
2.  **User Management:** Use the UI to create, update, and delete user records.
3.  **Filtering and Sorting:** Apply filters and sorting options to refine the user list.
4.  **Bulk Actions:** Select multiple users and perform actions like deletion.
5.  **Import Data:** Import user data from a file to populate the directory.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, concise messages.
4.  Submit a pull request.


## 💖 Thanks

Thank you for checking out this project! Your interest and contributions are greatly appreciated.

This is written by [readme.ai](https://readme-generator-phi.vercel.app/).
