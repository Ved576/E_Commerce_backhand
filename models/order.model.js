const mongoose = require('mongoose');

// This defines the structure of each document in our 'orders' collection.
const orderSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    razorpayOrderId: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['created', 'successful', 'failed'], // The status can only be one of these values
        default: 'created',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create the model from the schema
const Order = mongoose.model('Order', orderSchema);

// This is the most important line: it makes the Order model available to other files.
module.exports = Order;
