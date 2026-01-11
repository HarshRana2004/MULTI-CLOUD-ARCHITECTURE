import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api-gateway-url.amazonaws.com/dev';
const AZURE_BASE_URL = process.env.REACT_APP_AZURE_URL || 'https://your-azure-function-app.azurewebsites.net/api';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ user_id: 'demo_user_123', name: 'Demo User' });

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      // Demo data fallback
      setProducts([
        { product_id: '1', name: 'Laptop', price: 999.99, category: 'Electronics' },
        { product_id: '2', name: 'Smartphone', price: 699.99, category: 'Electronics' },
        { product_id: '3', name: 'Headphones', price: 199.99, category: 'Electronics' }
      ]);
    }
    setLoading(false);
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders?user_id=${user.user_id}`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.product_id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === product.product_id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const processOrder = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const orderData = {
        user_id: user.user_id,
        items: cart,
        total_amount: parseFloat(calculateTotal()),
        payment_method: 'credit_card'
      };

      // Create order via AWS Lambda
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const order = await response.json();
      
      if (order.status === 'confirmed') {
        alert(`Order ${order.order_id} confirmed! Payment processed via Azure.`);
        setCart([]);
        loadOrders();
      } else {
        alert('Order failed. Please try again.');
      }
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Error processing order. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Multi-Cloud E-Commerce Demo</h1>
        <p>AWS + Azure Integration Showcase</p>
      </header>

      <div className="container">
        <div className="section">
          <h2>Products (AWS DynamoDB)</h2>
          {loading ? (
            <p>Loading products...</p>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <div key={product.product_id} className="product-card">
                  <h3>{product.name}</h3>
                  <p>Category: {product.category}</p>
                  <p className="price">${product.price}</p>
                  <button onClick={() => addToCart(product)}>
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <h2>Shopping Cart</h2>
          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <div>
              {cart.map(item => (
                <div key={item.product_id} className="cart-item">
                  <span>{item.name} x {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.product_id)}>
                    Remove
                  </button>
                </div>
              ))}
              <div className="cart-total">
                <strong>Total: ${calculateTotal()}</strong>
              </div>
              <button 
                className="checkout-btn" 
                onClick={processOrder}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Checkout (Process via Azure)'}
              </button>
            </div>
          )}
        </div>

        <div className="section">
          <h2>Order History</h2>
          {orders.length === 0 ? (
            <p>No orders found</p>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.order_id} className="order-item">
                  <div>
                    <strong>Order #{order.order_id}</strong>
                    <span className={`status ${order.status}`}>{order.status}</span>
                  </div>
                  <div>Amount: ${order.total_amount}</div>
                  <div>Date: {new Date(order.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section architecture-info">
          <h2>Architecture Overview</h2>
          <div className="arch-grid">
            <div className="arch-item aws">
              <h3>AWS Services</h3>
              <ul>
                <li>API Gateway - REST endpoints</li>
                <li>Lambda - Product & Order services</li>
                <li>DynamoDB - Product catalog</li>
                <li>S3 - Static assets</li>
              </ul>
            </div>
            <div className="arch-item azure">
              <h3>Azure Services</h3>
              <ul>
                <li>Functions - Payment processing</li>
                <li>SQL Database - Transactions</li>
                <li>Service Bus - Message queuing</li>
                <li>Monitor - Cross-cloud monitoring</li>
              </ul>
            </div>
          </div>
          <div className="communication">
            <h3>Inter-Cloud Communication</h3>
            <p>✓ REST APIs for synchronous communication</p>
            <p>✓ Message queues for asynchronous processing</p>
            <p>✓ Shared JWT authentication</p>
            <p>✓ Real-time data synchronization</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;