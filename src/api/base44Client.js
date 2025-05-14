import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "681b9f2897d56fd6796418ee", 
  requiresAuth: true // Ensure authentication is required for all operations
});
