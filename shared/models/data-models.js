// Shared data models for multi-cloud architecture

class Product {
    constructor(data) {
        this.product_id = data.product_id || this.generateId();
        this.name = data.name;
        this.description = data.description;
        this.price = parseFloat(data.price);
        this.category = data.category;
        this.inventory_count = parseInt(data.inventory_count) || 0;
        this.images = data.images || [];
        this.attributes = data.attributes || {};
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
        this.status = data.status || 'active';
    }

    validate() {
        const errors = [];
        
        if (!this.name || this.name.trim().length === 0) {
            errors.push('Product name is required');
        }
        
        if (!this.price || this.price <= 0) {
            errors.push('Product price must be greater than 0');
        }
        
        if (!this.category) {
            errors.push('Product category is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    toAWS() {
        // Format for AWS DynamoDB
        return {
            product_id: this.product_id,
            name: this.name,
            description: this.description,
            price: this.price,
            category: this.category,
            inventory_count: this.inventory_count,
            images: this.images,
            attributes: this.attributes,
            created_at: this.created_at,
            updated_at: this.updated_at,
            status: this.status
        };
    }

    toAzure() {
        // Format for Azure SQL Database
        return {
            ProductId: this.product_id,
            Name: this.name,
            Description: this.description,
            Price: this.price,
            Category: this.category,
            InventoryCount: this.inventory_count,
            Images: JSON.stringify(this.images),
            Attributes: JSON.stringify(this.attributes),
            CreatedAt: this.created_at,
            UpdatedAt: this.updated_at,
            Status: this.status
        };
    }

    generateId() {
        return 'prod_' + Math.random().toString(36).substr(2, 12);
    }
}

class Order {
    constructor(data) {
        this.order_id = data.order_id || this.generateId();
        this.user_id = data.user_id;
        this.items = data.items || [];
        this.total_amount = parseFloat(data.total_amount);
        this.status = data.status || 'pending';
        this.payment_method = data.payment_method;
        this.shipping_address = data.shipping_address || {};
        this.billing_address = data.billing_address || {};
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
        this.payment_id = data.payment_id;
        this.tracking_number = data.tracking_number;
    }

    validate() {
        const errors = [];
        
        if (!this.user_id) {
            errors.push('User ID is required');
        }
        
        if (!this.items || this.items.length === 0) {
            errors.push('Order must contain at least one item');
        }
        
        if (!this.total_amount || this.total_amount <= 0) {
            errors.push('Total amount must be greater than 0');
        }

        if (!this.payment_method) {
            errors.push('Payment method is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    calculateTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    toAWS() {
        return {
            order_id: this.order_id,
            user_id: this.user_id,
            items: this.items,
            total_amount: this.total_amount,
            status: this.status,
            payment_method: this.payment_method,
            shipping_address: this.shipping_address,
            billing_address: this.billing_address,
            created_at: this.created_at,
            updated_at: this.updated_at,
            payment_id: this.payment_id,
            tracking_number: this.tracking_number
        };
    }

    toAzure() {
        return {
            OrderId: this.order_id,
            UserId: this.user_id,
            Items: JSON.stringify(this.items),
            TotalAmount: this.total_amount,
            Status: this.status,
            PaymentMethod: this.payment_method,
            ShippingAddress: JSON.stringify(this.shipping_address),
            BillingAddress: JSON.stringify(this.billing_address),
            CreatedAt: this.created_at,
            UpdatedAt: this.updated_at,
            PaymentId: this.payment_id,
            TrackingNumber: this.tracking_number
        };
    }

    generateId() {
        return 'ord_' + Math.random().toString(36).substr(2, 12);
    }
}

class User {
    constructor(data) {
        this.user_id = data.user_id || this.generateId();
        this.email = data.email;
        this.first_name = data.first_name;
        this.last_name = data.last_name;
        this.phone = data.phone;
        this.addresses = data.addresses || [];
        this.preferences = data.preferences || {};
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
        this.status = data.status || 'active';
        this.role = data.role || 'customer';
    }

    validate() {
        const errors = [];
        
        if (!this.email || !this.isValidEmail(this.email)) {
            errors.push('Valid email is required');
        }
        
        if (!this.first_name || this.first_name.trim().length === 0) {
            errors.push('First name is required');
        }
        
        if (!this.last_name || this.last_name.trim().length === 0) {
            errors.push('Last name is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getFullName() {
        return `${this.first_name} ${this.last_name}`;
    }

    toAWS() {
        return {
            user_id: this.user_id,
            email: this.email,
            first_name: this.first_name,
            last_name: this.last_name,
            phone: this.phone,
            addresses: this.addresses,
            preferences: this.preferences,
            created_at: this.created_at,
            updated_at: this.updated_at,
            status: this.status,
            role: this.role
        };
    }

    toAzure() {
        return {
            UserId: this.user_id,
            Email: this.email,
            FirstName: this.first_name,
            LastName: this.last_name,
            Phone: this.phone,
            Addresses: JSON.stringify(this.addresses),
            Preferences: JSON.stringify(this.preferences),
            CreatedAt: this.created_at,
            UpdatedAt: this.updated_at,
            Status: this.status,
            Role: this.role
        };
    }

    generateId() {
        return 'usr_' + Math.random().toString(36).substr(2, 12);
    }
}

class Transaction {
    constructor(data) {
        this.transaction_id = data.transaction_id || this.generateId();
        this.payment_id = data.payment_id;
        this.order_id = data.order_id;
        this.user_id = data.user_id;
        this.amount = parseFloat(data.amount);
        this.currency = data.currency || 'USD';
        this.payment_method = data.payment_method;
        this.status = data.status;
        this.gateway_response = data.gateway_response;
        this.processed_at = data.processed_at || new Date().toISOString();
        this.metadata = data.metadata || {};
    }

    validate() {
        const errors = [];
        
        if (!this.order_id) {
            errors.push('Order ID is required');
        }
        
        if (!this.amount || this.amount <= 0) {
            errors.push('Amount must be greater than 0');
        }
        
        if (!this.payment_method) {
            errors.push('Payment method is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    toAzure() {
        return {
            TransactionId: this.transaction_id,
            PaymentId: this.payment_id,
            OrderId: this.order_id,
            UserId: this.user_id,
            Amount: this.amount,
            Currency: this.currency,
            PaymentMethod: this.payment_method,
            Status: this.status,
            GatewayResponse: this.gateway_response,
            ProcessedAt: this.processed_at,
            Metadata: JSON.stringify(this.metadata)
        };
    }

    generateId() {
        return 'txn_' + Math.random().toString(36).substr(2, 12);
    }
}

module.exports = {
    Product,
    Order,
    User,
    Transaction
};