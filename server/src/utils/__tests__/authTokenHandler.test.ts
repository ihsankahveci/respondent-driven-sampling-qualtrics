import {
	afterAll,
	beforeAll,
	describe,
	expect,
	it
} from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mock environment variable for testing
const TEST_SECRET = 'test-secret-key';
const originalEnv = process.env.AUTH_SECRET;

// Set environment variable before import
process.env.AUTH_SECRET = TEST_SECRET;

import { generateAuthToken, verifyAuthToken } from '../authTokenHandler';

describe('authTokenHandler', () => {
	beforeAll(() => {
		process.env.AUTH_SECRET = TEST_SECRET;
	});

	afterAll(() => {
		process.env.AUTH_SECRET = originalEnv;
	});

	describe('generateAuthToken', () => {
		it('should generate a valid JWT token', () => {
			const userObjectId = '507f1f77bcf86cd799439011';
			const token = generateAuthToken(userObjectId);
			expect(token).toBeDefined();
			expect(typeof token).toBe('string');
			expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
		});

		it('should include userObjectId in the token payload', () => {
			const userObjectId = '507f1f77bcf86cd799439011';

			const token = generateAuthToken(userObjectId);
			const decoded = jwt.verify(token, TEST_SECRET) as any;

			expect(decoded.userObjectId).toBe(userObjectId);
		});

		it('should set token expiration to 12 hours', () => {
			const userObjectId = '507f1f77bcf86cd799439011';
			const token = generateAuthToken(userObjectId);
			const decoded = jwt.verify(token, TEST_SECRET) as any;

			expect(decoded.exp).toBeDefined();
			expect(decoded.iat).toBeDefined();

			// Check that expiration is approximately 12 hours from issue time
			const expirationTime = decoded.exp - decoded.iat;
			expect(expirationTime).toBe(12 * 60 * 60); // 12 hours in seconds
		});
	});

	describe('verifyAuthToken', () => {
		it('should verify a valid token', () => {
			const userObjectId = '507f1f77bcf86cd799439011';
			const token = generateAuthToken(userObjectId);
			const decoded = verifyAuthToken(token);

			expect(decoded).toBeDefined();
			expect(decoded.userObjectId).toBe(userObjectId);
		});

		it('should throw error for invalid token', () => {
			const invalidToken = 'invalid.token.here';

			expect(() => {
				verifyAuthToken(invalidToken);
			}).toThrow();
		});

		it('should throw error for token with wrong secret', () => {
			const token = jwt.sign(
				{ userObjectId: '507f1f77bcf86cd799439011' },
				'wrong-secret',
				{ expiresIn: '12h' }
			);

			expect(() => {
				verifyAuthToken(token);
			}).toThrow();
		});

		it('should throw error for expired token', () => {
			const expiredToken = jwt.sign(
				{ userObjectId: '507f1f77bcf86cd799439011' },
				TEST_SECRET,
				{ expiresIn: '-1s' } // Already expired
			);

			expect(() => {
				verifyAuthToken(expiredToken);
			}).toThrow();
		});
	});
});