import { verifyGoogleToken } from './src/services/googleAuthService.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * We can't easily test with a real Google token without manual intervention.
 * This test verifies that the service handles invalid tokens correctly.
 */
async function testGoogleAuth() {
    console.log('Testing Google Token Verification...');
    try {
        const result = await verifyGoogleToken('INVALID_TOKEN');
        console.log('Result:', result);
    } catch (error) {
        console.log('Expected Error:', error.message);
        if (error.message === 'Invalid Google ID token' || error.message.includes('idToken is required')) {
            console.log('✅ Service handles invalid tokens correctly.');
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
}

testGoogleAuth();
