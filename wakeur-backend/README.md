# Wakeur Sokhna Daba Falilou - Backend

## Setup Instructions

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Firebase Configuration**
    - Go to the [Firebase Console](https://console.firebase.google.com/).
    - Create a new project (if you haven't already).
    - Go to **Project Settings > Service Accounts**.
    - Click **Generate New Private Key**.
    - Save the downloaded JSON file as `serviceAccountKey.json` inside the `config/` folder.
    - **Important:** Do not commit this file to version control.

3.  **Environment Variables**
    - Open `.env` file.
    - Update `FIREBASE_DATABASE_URL` with your Realtime Database URL (found in Firebase Console > Realtime Database).

4.  **Run Server**
    - Development mode (auto-restart):
      ```bash
      npm run dev
      ```
    - Production mode:
      ```bash
      npm start
      ```

## API Endpoints

- **Auth:** `GET /api/auth/profile` (Requires Bearer Token)
- **Products:**
    - `GET /api/products`
    - `POST /api/products` (Requires Auth)
- **Transfers:**
    - `GET /api/transfers` (Requires Auth)
    - `POST /api/transfers` (Requires Auth)
- **Sales:**
    - `GET /api/sales` (Requires Auth)
    - `POST /api/sales` (Requires Auth)
