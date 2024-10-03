const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected succesfully');
}).catch((error) => {
    console.error('MongoDB could not connected', error);
});

// Şema ve model oluştur
const itemSchema = new mongoose.Schema({
    name: String,
    imageUrl: String,
    position: {
        x: Number,
        y: Number
    }
});

const Item = mongoose.model('Item', itemSchema);


app.get('/api/items', async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while retrieving data' });
    }
});

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('A user has connected');

    // Yeni öğe ekleme
    socket.on('addItem', async (data) => {

        const newItem = new Item({
            name: data.name,
            imageUrl: data.imageUrl,
            position: data.position
        });

        try {
            await newItem.save();
            io.emit('updateBillboard', newItem);
        } catch (error) {
            console.error('An error occurred while saving to Database:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User left');
    });
});

server.listen(4000, () => {
    console.log('The server is running on port 4000');
});
