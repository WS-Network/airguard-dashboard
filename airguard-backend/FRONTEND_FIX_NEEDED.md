# Frontend Fix Required: Cyclic Object Value Error

## Issue
When clicking "Use GPS" button, the frontend logs this error:
```
Error starting GPS pairing: TypeError: cyclic object value
    handleUseGps webpack-internal:///(app-pages-browser)/./src/app/dashboard/setup/page.tsx:376
```

## Root Cause
The frontend code at line 376 in `src/app/dashboard/setup/page.tsx` is trying to `JSON.stringify()` an error object that has circular references. This commonly happens when logging error objects from API calls.

## Solution for Frontend Agent

**File**: `src/app/dashboard/setup/page.tsx` (around line 376)

**Current Code** (likely):
```typescript
console.error('Error starting GPS pairing:', error);
// OR
console.error('Error starting GPS pairing:', JSON.stringify(error));
```

**Fixed Code**:
```typescript
// Option 1: Log error message only
console.error('Error starting GPS pairing:', error.message || error);

// Option 2: Use error serialization utility
console.error('Error starting GPS pairing:', {
  message: error.message,
  name: error.name,
  status: error.response?.status,
  data: error.response?.data
});

// Option 3: Use try-catch for stringification
try {
  console.error('Error starting GPS pairing:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
} catch (e) {
  console.error('Error starting GPS pairing:', error.message || String(error));
}
```

## Additional Context

The **primary error** causing this is the **403 Forbidden** response from the backend (user missing organizationId). The cyclic object error is a **secondary issue** caused by trying to log the 403 error object.

**Recommended Approach**:
1. **Backend fix first** (DONE): Run `npm run db:fix-orgs` to assign organizations to users
2. **Frontend fix** (NEEDED): Update error logging to avoid circular reference errors
3. **User action**: Re-login to get new JWT token with organizationId

## Testing After Fix

1. Backend fix applied: User has organizationId
2. User re-logins to dashboard
3. Click "Use GPS" button
4. If there's an error, it should log properly without "cyclic object value"
5. If successful, pairing session should start

---

**Status**: Backend fix committed (commit 817a954). Frontend fix needed from frontend agent.
