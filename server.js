const express = require('express');
const app = express();
app.use(express.json());

const USERS = [{ email: "student@test.com", password: "Password123", token: "mock-jwt-token-xyz789" }];
const INVENTORY = [
    { id: 1, name: "Wireless Mouse", price: 25.00, stock: 10 },
    { id: 2, name: "Mechanical Keyboard", price: 75.00, stock: 5 },
    { id: 3, name: "USB-C Hub", price: 40.00, stock: 2 }
];
let CART = [];
let APPLIED_COUPON = null;

function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized: Missing or malformed token" });
    }
    const token = authHeader.split(' ')[1];
    if (token !== "mock-jwt-token-xyz789") {
        return res.status(403).json({ error: "Forbidden: Invalid token" });
    }
    next();
}

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const user = USERS.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    res.status(200).json({ message: "Login successful", token: user.token });
});

app.get('/api/products', (req, res) => {
    res.status(200).json({ count: INVENTORY.length, products: INVENTORY });
});

app.post('/api/cart/add', (req, res) => {
    const { productId, quantity } = req.body;
    if (quantity === 0) return res.status(422).json({ error: "Quantity must be greater than zero" });
    if (quantity < 0) return res.status(400).json({ error: "Quantity cannot be negative" });
    const product = INVENTORY.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (quantity > product.stock) return res.status(409).json({ error: `Insufficient stock. Only ${product.stock} available` });

    CART.push({ productId: product.id, name: product.name, price: product.price, quantity });
    res.status(200).json({ message: "Item added to cart", cart: CART });
});

app.get('/api/cart', (req, res) => {
    const subtotal = CART.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = APPLIED_COUPON ? (subtotal * APPLIED_COUPON.percent) / 100 : 0;
    const tax = Number(((subtotal - discount) * 0.08).toFixed(2));
    const total = Number(((subtotal - discount) + tax).toFixed(2));
    res.status(200).json({ items: CART, itemCount: CART.length, subtotal, discount, tax, total });
});

app.post('/api/cart/coupon', (req, res) => {
    const { code } = req.body;
    if (APPLIED_COUPON) return res.status(400).json({ error: "A coupon is already applied to this cart" });
    if (code === "SAVE20") {
        APPLIED_COUPON = { code: "SAVE20", percent: 20 };
        return res.status(200).json({ message: "Coupon applied: 20% discount", coupon: APPLIED_COUPON });
    }
    res.status(404).json({ error: "Invalid coupon code" });
});

app.post('/api/checkout', authenticate, (req, res) => {
    if (CART.length === 0) return res.status(400).json({ error: "Cannot checkout an empty cart" });
    const subtotal = CART.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = APPLIED_COUPON ? (subtotal * APPLIED_COUPON.percent) / 100 : 0;
    const tax = Number(((subtotal - discount) * 0.08).toFixed(2));
    const totalAmount = Number(((subtotal - discount) + tax).toFixed(2));

    const order = {
        orderId: "ORD-" + Math.floor(100000 + Math.random() * 900000),
        status: "CONFIRMED",
        totalAmount,
        createdAt: new Date().toISOString()
    };
    CART = [];
    APPLIED_COUPON = null;
    res.status(201).json({ message: "Order placed successfully", order });
});

app.post('/api/cart/reset', (req, res) => {
    CART = [];
    APPLIED_COUPON = null;
    res.status(200).json({ message: "Cart reset successfully" });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`E-Commerce SUT running on http://localhost:${PORT}`));