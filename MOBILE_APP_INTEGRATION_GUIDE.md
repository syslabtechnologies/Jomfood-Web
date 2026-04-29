# 📱 Mobile App Integration Guide: Email Verification Flow

## 📌 Overview
We have introduced a mandatory Email Verification step in the user registration process. Users can no longer log in immediately after registration; they must verify their email address using a 6-digit OTP code sent to their email.

This guide details the changes required in the Mobile App to align with the Web implementation.

---

## 🔄 The New Flow

1. **User Registers** → Backend sends OTP Email.
   * *Old Behavior:* Returns Auth Tokens immediately.
   * *New Behavior:* Returns `userId` and `verificationRequired: true`. No tokens.
2. **User Redirected to Verification Screen**.
3. **User Enters OTP** (or clicks link in email).
4. **App Verifies OTP** → Backend returns Auth Tokens.
5. **User Logged In**.

---

## 🛠 Implementation Steps

### 1️⃣ Update Registration Logic
**Screen:** Sign Up / Register

*   **Action:** Modify the API success handler for the registration endpoint (`/api/customer-users/register`).
*   **Logic Change:**
    *   **IF** response contains `verificationRequired: true`:
        1.  Do **NOT** attempt to log the user in automatically.
        2.  Save the `userId` from `response.data.userId` locally (temporary state).
        3.  Navigate the user to the **OTP Verification Screen**.
    *   **ELSE** (Fallback): Continue with the old flow (auto-login) if the backend flag isn't present.

**Code Logic Example:**
```javascript
// POST /api/customer-users/register
if (response.success && response.data.verificationRequired) {
    // New Flow
    saveToState('pendingUserId', response.data.userId);
    navigateTo('VerificationScreen');
} else {
    // Old Flow
    saveTokens(response.token);
    navigateTo('Dashboard');
}
```

---

### 2️⃣ Create "OTP Verification" Screen
**New Screen Required**

**UI Requirements:**
*   6-digit numeric input field.
*   "Verify" Button.
*   "Resend Code" Button (with ~60s countdown timer).
*   Message: "We have sent a code to your email..."

**Logic:**
1.  **On Mount:** Retrieve the `pendingUserId` passed from the Registration screen.
2.  **On Verify Click:** Call the verification API.
    *   **Endpoint:** `POST /api/customer-users/verify-email`
    *   **Body:** `{ "userId": "...", "otp": "123456" }`
3.  **On Success:**
    *   The API returns `token` and `refreshToken` in `data.tokens`.
    *   Save these tokens to secure storage.
    *   Clear `pendingUserId`.
    *   Navigate user to **Dashboard/Home**.
4.  **On Failure:** Show error message ("Invalid Code", etc.).

**Resend Logic:**
*   **Endpoint:** `POST /api/customer-users/resend-otp`
*   **Body:** `{ "userId": "..." }`

---

### 3️⃣ Update Login Logic (Error Handling)
**Screen:** Login

Users might try to log in without verifying their email. You must handle this specific error.

*   **Action:** Catch `403 Forbidden` errors during login.
*   **Check:** If `error.code === 'EMAIL_NOT_VERIFIED'`.
*   **Logic:**
    1.  Extract `userId` from the error response (`error.data.userId`).
    2.  Show an alert: "Please verify your email first."
    3.  Navigate user to the **OTP Verification Screen**, passing the `userId`.

**Response Example to Handle:**
```json
// 403 Forbidden
{
  "success": false,
  "error": "EMAIL_NOT_VERIFIED",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "verificationRequired": true
  }
}
```

---

### 4️⃣ (Optional) Deep Linking
The email sent to users contains a link: `https://your-domain.com/verify-email?userId=...&otp=...`

*   **If the mobile app supports Deep Linking:**
    *   Intercept this URL.
    *   Extract `userId` and `otp`.
    *   Call the `GET /api/customer-users/verify-email` endpoint (or pre-fill the manual form).
    *   Log the user in automatically upon success.

---

## 📡 API Reference Cheat Sheet

| Action | Method | Endpoint | Payload / Params |
| :--- | :--- | :--- | :--- |
| **Verify (Manual)** | `POST` | `/auth/customer/verify-email` | `{ "userId": "...", "otp": "..." }` |
| **Verify (Link)** | `GET` | `/auth/customer/verify-email` | `?userId=...&otp=...` |
| **Resend OTP** | `POST` | `/auth/customer/resend-otp` | `{ "userId": "..." }` |

**Verification Success Response:**
```json
{
    "success": true,
    "data": {
        "tokens": {
            "token": "access_token_here",
            "refreshToken": "refresh_token_here"
        },
        "user": { ... }
    }
}
```
