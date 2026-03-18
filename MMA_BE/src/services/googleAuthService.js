import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token and extract user profile data
 * @param {string} idToken - The Google id_token from the client
 * @returns {Object} - User profile (sub, email, name, picture)
 * @throws {Error} if token is invalid
 */
export const verifyGoogleToken = async (idToken) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        // Extract basic profile information
        const { sub, email, name, picture } = payload;
        
        return {
            googleId: sub,
            email,
            name,
            avatar: picture
        };
    } catch (error) {
        console.error('Google Token Verification Error:', error.message);
        throw new Error('Invalid Google ID token');
    }
};
