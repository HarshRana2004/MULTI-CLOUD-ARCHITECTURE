const { app } = require('@azure/functions');
const sql = require('mssql');

app.http('payment', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Payment processing request received');

        try {
            const requestBody = await request.json();
            const { order_id, amount, payment_method, customer_id } = requestBody;

            // Validate input
            if (!order_id || !amount || !payment_method || !customer_id) {
                return {
                    status: 400,
                    jsonBody: { error: 'Missing required fields' }
                };
            }

            // Simulate payment processing
            const paymentResult = await processPayment({
                order_id,
                amount,
                payment_method,
                customer_id
            });

            // Store transaction in Azure SQL
            await storeTransaction(paymentResult);

            // Send message to Service Bus for further processing
            await sendToServiceBus('order-processing', {
                order_id,
                payment_id: paymentResult.payment_id,
                status: paymentResult.status,
                timestamp: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: paymentResult
            };

        } catch (error) {
            context.log.error('Payment processing error:', error);
            return {
                status: 500,
                jsonBody: { error: 'Payment processing failed' }
            };
        }
    }
});

async function processPayment(paymentData) {
    // Simulate payment gateway integration
    const paymentId = generatePaymentId();
    
    // Simulate payment success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;
    
    return {
        payment_id: paymentId,
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        status: isSuccess ? 'success' : 'failed',
        payment_method: paymentData.payment_method,
        customer_id: paymentData.customer_id,
        processed_at: new Date().toISOString(),
        gateway_response: isSuccess ? 'Payment approved' : 'Insufficient funds'
    };
}

async function storeTransaction(paymentResult) {
    const config = {
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: {
            encrypt: true,
            trustServerCertificate: false
        }
    };

    try {
        const pool = await sql.connect(config);
        
        const query = `
            INSERT INTO Transactions (
                payment_id, order_id, customer_id, amount, 
                payment_method, status, processed_at, gateway_response
            ) VALUES (
                @payment_id, @order_id, @customer_id, @amount,
                @payment_method, @status, @processed_at, @gateway_response
            )
        `;

        await pool.request()
            .input('payment_id', sql.VarChar, paymentResult.payment_id)
            .input('order_id', sql.VarChar, paymentResult.order_id)
            .input('customer_id', sql.VarChar, paymentResult.customer_id)
            .input('amount', sql.Decimal(10, 2), paymentResult.amount)
            .input('payment_method', sql.VarChar, paymentResult.payment_method)
            .input('status', sql.VarChar, paymentResult.status)
            .input('processed_at', sql.DateTime, new Date(paymentResult.processed_at))
            .input('gateway_response', sql.VarChar, paymentResult.gateway_response)
            .query(query);

        await pool.close();
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

async function sendToServiceBus(queueName, message) {
    // Service Bus integration would go here
    // For demo purposes, we'll just log the message
    console.log(`Sending to Service Bus queue ${queueName}:`, message);
}

function generatePaymentId() {
    return 'pay_' + Math.random().toString(36).substr(2, 12);
}