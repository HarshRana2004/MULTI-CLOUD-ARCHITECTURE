const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class MultiCloudAuth {
    constructor(config) {
        this.jwtSecret = config.jwtSecret || process.env.JWT_SECRET;
        this.awsApiKey = config.awsApiKey || process.env.AWS_API_KEY;
        this.azureApiKey = config.azureApiKey || process.env.AZURE_API_KEY;
        this.tokenExpiry = config.tokenExpiry || '24h';
    }

    // Generate JWT token for cross-cloud authentication
    generateToken(payload) {
        const tokenPayload = {
            ...payload,
            iat: Math.floor(Date.now() / 1000),
            clouds: ['aws', 'azure'], // Token valid for both clouds
            scope: 'multi-cloud-access'
        };

        return jwt.sign(tokenPayload, this.jwtSecret, { 
            expiresIn: this.tokenExpiry,
            issuer: 'multi-cloud-auth',
            audience: ['aws-services', 'azure-services']
        });
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret, {
                issuer: 'multi-cloud-auth',
                audience: ['aws-services', 'azure-services']
            });
            
            return {
                valid: true,
                payload: decoded
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Generate API key for service-to-service communication
    generateApiKey(service, cloud) {
        const timestamp = Date.now();
        const data = `${service}-${cloud}-${timestamp}`;
        const hash = crypto.createHmac('sha256', this.jwtSecret)
                          .update(data)
                          .digest('hex');
        
        return `${cloud}_${hash.substring(0, 32)}`;
    }

    // Validate API key
    validateApiKey(apiKey, expectedCloud) {
        const [cloud, hash] = apiKey.split('_');
        
        if (cloud !== expectedCloud) {
            return { valid: false, error: 'Invalid cloud provider' };
        }

        // In production, you'd validate against stored API keys
        const validKeys = {
            aws: this.awsApiKey,
            azure: this.azureApiKey
        };

        return {
            valid: validKeys[cloud] === apiKey,
            cloud: cloud
        };
    }

    // Create authentication headers for cross-cloud requests
    createAuthHeaders(targetCloud, userToken = null) {
        const headers = {
            'Content-Type': 'application/json',
            'X-Multi-Cloud-Source': process.env.CURRENT_CLOUD || 'unknown'
        };

        if (userToken) {
            headers['Authorization'] = `Bearer ${userToken}`;
        }

        // Add cloud-specific API key
        if (targetCloud === 'aws') {
            headers['X-AWS-API-Key'] = this.awsApiKey;
        } else if (targetCloud === 'azure') {
            headers['X-Azure-API-Key'] = this.azureApiKey;
        }

        return headers;
    }

    // Middleware for validating requests
    authMiddleware() {
        return (req, res, next) => {
            const token = req.headers.authorization?.replace('Bearer ', '');
            const apiKey = req.headers['x-api-key'];

            // Check JWT token first
            if (token) {
                const tokenResult = this.verifyToken(token);
                if (tokenResult.valid) {
                    req.user = tokenResult.payload;
                    return next();
                }
            }

            // Check API key for service-to-service calls
            if (apiKey) {
                const currentCloud = process.env.CURRENT_CLOUD;
                const keyResult = this.validateApiKey(apiKey, currentCloud);
                if (keyResult.valid) {
                    req.service = { cloud: keyResult.cloud };
                    return next();
                }
            }

            return res.status(401).json({ error: 'Unauthorized' });
        };
    }

    // Generate cross-cloud session
    createCrossCloudSession(userId, userRole, permissions = []) {
        const sessionData = {
            user_id: userId,
            role: userRole,
            permissions: permissions,
            clouds: ['aws', 'azure'],
            session_id: this.generateSessionId(),
            created_at: new Date().toISOString()
        };

        const token = this.generateToken(sessionData);
        
        return {
            token: token,
            session: sessionData,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
    }

    // Validate cross-cloud permissions
    hasPermission(userPayload, requiredPermission, targetCloud) {
        if (!userPayload.clouds.includes(targetCloud)) {
            return false;
        }

        if (!userPayload.permissions) {
            return false;
        }

        return userPayload.permissions.includes(requiredPermission) || 
               userPayload.permissions.includes('*');
    }

    generateSessionId() {
        return crypto.randomBytes(16).toString('hex');
    }
}

// Export for use in both AWS Lambda and Azure Functions
module.exports = MultiCloudAuth;