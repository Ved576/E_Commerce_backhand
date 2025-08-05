require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('./models/order.model'); // FIX: Corrected file path

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch((err) => console.error('MongoDB connection error:', err));

// --- Razorpay Instance ---
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- API Endpoints ---

// 1. Endpoint to create a Razorpay order
app.post('/create-order', async (req, res) => {
    const { amount } = req.body;
    const options = {
        amount: amount * 100, // Amount in paise
        currency: 'INR',
    };
    try {
        const order = await razorpayInstance.orders.create(options);
        const newOrder = new Order({
            amount: amount,
            razorpayOrderId: order.id,
            status: 'created', // Using lowercase to match schema enum
        });
        await newOrder.save();
        res.json({ orderId: order.id });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send('Error creating order');
    }
});


// 2. Endpoint to verify the payment signature from the client
app.post('/verify-signature', async (req, res) => { // FIX: Renamed endpoint for clarity
    // FIX: Corrected destructuring
    const { order_id, payment_id, razorpay_signature } = req.body;

    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    // Create a signature using crypto
    const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(order_id + "|" + payment_id)
        .digest('hex');

    // FIX: Comparing with the correct variable 'razorpay_signature'
    if (generated_signature === razorpay_signature) {
        console.log("Payment is legitimate.");
        try {
            await Order.findOneAndUpdate(
                { razorpayOrderId: order_id },
                { status: 'successful' }
            );
            // FIX: Correct way to send a success response
            res.status(200).send('Payment verified successfully.');
        } catch (error) { // FIX: Using the correct error variable 'error'
            console.error("Database update error:", error);
            res.status(500).send('Error updating database.');
        }
    } else {
        console.error("Invalid signature received.");
        res.status(400).send('Invalid signature.');
    }
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
