const { app } = require('@azure/functions');

app.http('notifications', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Notification request received');

        try {
            const requestBody = await request.json();
            const { user_id, type, data } = requestBody;

            // Validate input
            if (!user_id || !type) {
                return {
                    status: 400,
                    jsonBody: { error: 'Missing required fields' }
                };
            }

            // Process notification based on type
            const result = await processNotification(user_id, type, data);

            return {
                status: 200,
                jsonBody: result
            };

        } catch (error) {
            context.log.error('Notification error:', error);
            return {
                status: 500,
                jsonBody: { error: 'Notification processing failed' }
            };
        }
    }
});

app.http('analytics', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Analytics event received');

        try {
            const requestBody = await request.json();
            const { event_type, data, source } = requestBody;

            // Store analytics data
            await storeAnalyticsEvent({
                event_type,
                data,
                source,
                timestamp: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: { message: 'Analytics event processed' }
            };

        } catch (error) {
            context.log.error('Analytics error:', error);
            return {
                status: 500,
                jsonBody: { error: 'Analytics processing failed' }
            };
        }
    }
});

async function processNotification(userId, type, data) {
    const notificationId = generateNotificationId();
    
    const notification = {
        notification_id: notificationId,
        user_id: userId,
        type: type,
        data: data,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    // Route notification based on type
    switch (type) {
        case 'order_confirmed':
            await sendEmailNotification(userId, 'Order Confirmed', 
                `Your order ${data.order_id} has been confirmed. Amount: $${data.amount}`);
            break;
        case 'payment_processed':
            await sendSMSNotification(userId, 
                `Payment of $${data.amount} processed successfully for order ${data.order_id}`);
            break;
        case 'order_shipped':
            await sendEmailNotification(userId, 'Order Shipped', 
                `Your order ${data.order_id} has been shipped. Tracking: ${data.tracking_number}`);
            break;
        default:
            await sendGenericNotification(userId, type, data);
    }

    notification.status = 'sent';
    notification.sent_at = new Date().toISOString();

    return notification;
}

async function sendEmailNotification(userId, subject, message) {
    // Email service integration would go here
    console.log(`Email to user ${userId}: ${subject} - ${message}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { type: 'email', status: 'sent' };
}

async function sendSMSNotification(userId, message) {
    // SMS service integration would go here
    console.log(`SMS to user ${userId}: ${message}`);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return { type: 'sms', status: 'sent' };
}

async function sendGenericNotification(userId, type, data) {
    // Generic notification handler
    console.log(`Generic notification to user ${userId}: ${type}`, data);
    return { type: 'generic', status: 'sent' };
}

async function storeAnalyticsEvent(event) {
    // Store in Azure SQL or Azure Table Storage
    console.log('Analytics event stored:', event);
    
    // In a real implementation, this would store to Azure SQL Database
    // or Azure Table Storage for analytics processing
    
    return { stored: true, event_id: generateEventId() };
}

function generateNotificationId() {
    return 'notif_' + Math.random().toString(36).substr(2, 10);
}

function generateEventId() {
    return 'event_' + Math.random().toString(36).substr(2, 10);
}