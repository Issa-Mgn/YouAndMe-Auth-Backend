# YouAndMe Backend

Secure Node.js API server for YouAndMe application.

## Tech Stack
- **Runtime**: Node.js + Express (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Firebase Admin SDK
- **Storage**: ImageKit
- **Hosting**: Render

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Duplicate `.env.example` (or just `.env`) and fill in your credentials.
   - **Firebase**: Get service account details from Firebase Console -> Project Settings -> Service Accounts.
     - Note: For `FIREBASE_PRIVATE_KEY`, if pasting directly in .env, ensure newlines are handled (often passed as `\n`).
   - **Supabase**: Get URL and Service Key (Secret, not Anon) from Project Settings -> API.
   - **ImageKit**: Get credentials from Developer Options.

3. **Database Setup**
   Run the SQL commands in `db_schema.sql` in your Supabase SQL Editor to create the `users` table.

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Server runs on http://localhost:3000

## API Endpoints

- **POST /api/auth/sync**
  - Headers: `Authorization: Bearer <firebase_token>`
  - Body: `{ "displayName": "User Name" }`
  - Returns: User object with `unique_code`.

- **POST /api/partners/link**
  - Headers: `Authorization: Bearer <firebase_token>`
  - Body: `{ "partnerCode": "AMOUR-XXXX" }`
  - Links the current user with the partner.

- **POST /api/profile/avatar**
  - Headers: `Authorization: Bearer <firebase_token>`
  - Format: `multipart/form-data` (file: `image`) OR JSON `{ "image_base64": "..." }`
  - Uploads avatar and updates user profile.
