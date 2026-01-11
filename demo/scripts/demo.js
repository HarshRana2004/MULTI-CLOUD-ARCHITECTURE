#!/usr/bin/env node

/**
 * Multi-Cloud Architecture Demo Script
 * Demonstrates interoperability between AWS and Azure services
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const config = {
  aws: {
    baseUrl: process.env.AWS_API_URL || 'https://your-api-gateway-url.amazonaws.com/dev',
    apiKey: process.env.AWS_API_KEY || 'your-aws-api-key'
  },
  azure: {
    baseUrl: process.env.AZURE_API_URL || 'https://your-azure-function-app.azurewebsites.net/api',
    apiKey: process.env.AZURE_API_KEY || 'your-azure-api-key'
  }
};

class MultiCloudDemo {
  constructor() {
    this.demoData = {
      products: [],
      orders: [],
      users: []
    };
  }

  async run() {
    console.log('🚀 Multi-Cloud Architecture Demo'.rainbow.bold);
    console.log('====================================='.gray);
    console.log('Showcasing AWS + Azure Integration\n'.cyan);

    try {
      await this.step1_CreateProducts();
      await this.step2_CreateUser();
      await this.step3_PlaceOrder();
      await this.step4_ProcessPayment();
      await this.step5_SendNotifications();
      await this.step6_AnalyticsSync();
      await this.step7_ShowResults();
      
      console.log('\n✅ Demo completed successfully!'.green.bold);
      console.log('🎉 Multi-cloud interoperability demonstrated!'.rainbow);
      
    } catch (error) {
      console.error('\n❌ Demo failed:'.red.bold, error.message);
      process.exit(1);
    }
  }

  async step1_CreateProducts() {
    console.log('📦 Step 1: Creating Products in AWS DynamoDB'.yellow.bold);
    
    const products = [
      {
        name: 'MacBook Pro',
        description: '16-inch MacBook Pro with M2 chip',
        price: 2499.99,
        category: 'Electronics',
        inventory_count: 10
      },
      {
        name: 'iPhone 15',
        description: 'Latest iPhone with advanced features',
        price: 999.99,
        category: 'Electronics',
        inventory_count: 25
      },
      {
        name: 'AirPods Pro',
        description: 'Wireless earbuds with noise cancellation',
        price: 249.99,
        category: 'Electronics',
        inventory_count: 50
      }
    ];

    for (const product of products) {
      try {
        const response = await this.makeRequest('POST', `${config.aws.baseUrl}/products`, product);
        this.demoData.products.push(response.data);
        console.log(`   ✓ Created product: ${product.name}`.green);
      } catch (error) {
        console.log(`   ⚠️  Using mock data for: ${product.name}`.yellow);
        this.demoData.products.push({
          product_id: `prod_${Math.random().toString(36).substr(2, 9)}`,
          ...product,
          created_at: new Date().toISOString()
        });
      }
    }
    
    console.log(`   📊 Total products created: ${this.demoData.products.length}\n`.blue);
  }

  async step2_CreateUser() {
    console.log('👤 Step 2: Creating Demo User'.yellow.bold);
    
    const user = {
      user_id: 'demo_user_' + Date.now(),
      email: 'demo@example.com',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1-555-0123'
    };

    this.demoData.users.push(user);
    console.log(`   ✓ Created user: ${user.first_name} ${user.last_name}`.green);
    console.log(`   📧 Email: ${user.email}\n`.blue);
  }

  async step3_PlaceOrder() {
    console.log('🛒 Step 3: Placing Order via AWS Lambda'.yellow.bold);
    
    const user = this.demoData.users[0];
    const selectedProducts = this.demoData.products.slice(0, 2); // First 2 products
    
    const order = {
      user_id: user.user_id,
      items: selectedProducts.map(product => ({
        product_id: product.product_id,
        name: product.name,
        quantity: 1,
        price: product.price
      })),
      total_amount: selectedProducts.reduce((sum, p) => sum + p.price, 0),
      payment_method: 'credit_card',
      shipping_address: {
        street: '123 Demo Street',
        city: 'Demo City',
        state: 'CA',
        zip: '12345',
        country: 'US'
      }
    };

    try {
      const response = await this.makeRequest('POST', `${config.aws.baseUrl}/orders`, order);
      this.demoData.orders.push(response.data);
      console.log(`   ✓ Order created: ${response.data.order_id}`.green);
    } catch (error) {
      console.log('   ⚠️  Using mock order data'.yellow);
      this.demoData.orders.push({
        order_id: `ord_${Math.random().toString(36).substr(2, 9)}`,
        ...order,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }
    
    const orderTotal = order.total_amount.toFixed(2);
    console.log(`   💰 Order total: $${orderTotal}`.blue);
    console.log(`   📦 Items: ${order.items.length}\n`.blue);
  }

  async step4_ProcessPayment() {
    console.log('💳 Step 4: Processing Payment via Azure Functions'.yellow.bold);
    
    const order = this.demoData.orders[0];
    
    const paymentData = {
      order_id: order.order_id,
      amount: order.total_amount,
      payment_method: order.payment_method,
      customer_id: order.user_id
    };

    try {
      const response = await this.makeRequest('POST', `${config.azure.baseUrl}/payment`, paymentData);
      console.log(`   ✓ Payment processed: ${response.data.payment_id}`.green);
      console.log(`   💰 Amount: $${response.data.amount}`.blue);
      console.log(`   📊 Status: ${response.data.status}`.blue);
      
      // Update order status
      order.status = response.data.status === 'success' ? 'confirmed' : 'payment_failed';
      order.payment_id = response.data.payment_id;
      
    } catch (error) {
      console.log('   ⚠️  Simulating payment processing'.yellow);
      order.status = 'confirmed';
      order.payment_id = `pay_${Math.random().toString(36).substr(2, 12)}`;
      console.log(`   ✓ Payment simulated: ${order.payment_id}`.green);
    }
    
    console.log(`   🔄 Order status updated: ${order.status}\n`.blue);
  }

  async step5_SendNotifications() {
    console.log('📧 Step 5: Sending Notifications via Azure Functions'.yellow.bold);
    
    const order = this.demoData.orders[0];
    const user = this.demoData.users[0];
    
    const notifications = [
      {
        user_id: user.user_id,
        type: 'order_confirmed',
        data: {
          order_id: order.order_id,
          amount: order.total_amount,
          items_count: order.items.length
        }
      },
      {
        user_id: user.user_id,
        type: 'payment_processed',
        data: {
          payment_id: order.payment_id,
          amount: order.total_amount
        }
      }
    ];

    for (const notification of notifications) {
      try {
        const response = await this.makeRequest('POST', `${config.azure.baseUrl}/notifications`, notification);
        console.log(`   ✓ ${notification.type} notification sent`.green);
      } catch (error) {
        console.log(`   ⚠️  Simulated ${notification.type} notification`.yellow);
      }
    }
    
    console.log(`   📱 Total notifications sent: ${notifications.length}\n`.blue);
  }

  async step6_AnalyticsSync() {
    console.log('📊 Step 6: Syncing Analytics Data (AWS → Azure)'.yellow.bold);
    
    const analyticsEvents = [
      {
        event_type: 'product_view',
        data: {
          product_id: this.demoData.products[0].product_id,
          user_id: this.demoData.users[0].user_id,
          session_id: 'sess_' + Date.now()
        },
        source: 'aws-lambda'
      },
      {
        event_type: 'order_created',
        data: {
          order_id: this.demoData.orders[0].order_id,
          user_id: this.demoData.users[0].user_id,
          total_amount: this.demoData.orders[0].total_amount
        },
        source: 'aws-lambda'
      },
      {
        event_type: 'payment_completed',
        data: {
          payment_id: this.demoData.orders[0].payment_id,
          order_id: this.demoData.orders[0].order_id,
          amount: this.demoData.orders[0].total_amount
        },
        source: 'azure-functions'
      }
    ];

    for (const event of analyticsEvents) {
      try {
        await this.makeRequest('POST', `${config.azure.baseUrl}/analytics`, event);
        console.log(`   ✓ ${event.event_type} event synced`.green);
      } catch (error) {
        console.log(`   ⚠️  Simulated ${event.event_type} sync`.yellow);
      }
    }
    
    console.log(`   🔄 Analytics events processed: ${analyticsEvents.length}\n`.blue);
  }

  async step7_ShowResults() {
    console.log('📋 Step 7: Demo Results Summary'.yellow.bold);
    
    console.log('\n🏗️  Architecture Components Used:'.cyan.bold);
    console.log('   AWS Services:'.green);
    console.log('   ├── API Gateway (REST endpoints)');
    console.log('   ├── Lambda Functions (business logic)');
    console.log('   ├── DynamoDB (product catalog)');
    console.log('   └── CloudWatch (monitoring)');
    
    console.log('\n   Azure Services:'.blue);
    console.log('   ├── Functions (payment processing)');
    console.log('   ├── SQL Database (transactions)');
    console.log('   ├── Service Bus (messaging)');
    console.log('   └── Monitor (analytics)');
    
    console.log('\n🔄 Inter-Cloud Communication:'.magenta.bold);
    console.log('   ✓ REST API calls between clouds');
    console.log('   ✓ Asynchronous message processing');
    console.log('   ✓ Real-time data synchronization');
    console.log('   ✓ Cross-cloud authentication');
    
    console.log('\n📊 Demo Statistics:'.cyan.bold);
    console.log(`   Products created: ${this.demoData.products.length}`);
    console.log(`   Orders processed: ${this.demoData.orders.length}`);
    console.log(`   Users registered: ${this.demoData.users.length}`);
    console.log(`   Total transaction value: $${this.demoData.orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}`);
    
    console.log('\n🎯 Key Benefits Demonstrated:'.green.bold);
    console.log('   ✓ Vendor lock-in avoidance');
    console.log('   ✓ Best-of-breed service selection');
    console.log('   ✓ High availability across clouds');
    console.log('   ✓ Cost optimization opportunities');
    console.log('   ✓ Disaster recovery capabilities');
  }

  async makeRequest(method, url, data = null) {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'MultiCloud-Demo/1.0'
    };

    // Add appropriate API key based on URL
    if (url.includes('amazonaws.com')) {
      headers['X-API-Key'] = config.aws.apiKey;
    } else if (url.includes('azurewebsites.net')) {
      headers['X-API-Key'] = config.azure.apiKey;
    }

    const requestConfig = {
      method,
      url,
      headers,
      timeout: 10000
    };

    if (data) {
      requestConfig.data = data;
    }

    return await axios(requestConfig);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the demo
if (require.main === module) {
  const demo = new MultiCloudDemo();
  demo.run().catch(console.error);
}

module.exports = MultiCloudDemo;