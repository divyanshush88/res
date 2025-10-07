// --- IMPORTS ---
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const app = express();
const port = 3000;
const mongoURI = 'mongodb+srv://divyanshush88:ds3465797@cluster022.ekdup.mongodb.net/?retryWrites=true&w=majority&appName=Cluster022';
const dbName = 'restaurantDB';

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// --- MAIN SERVER LOGIC ---
async function main() {
    const client = new MongoClient(mongoURI);

    try {
        await client.connect();
        console.log('Successfully connected to MongoDB!');

        const db = client.db(dbName);
        const menuCollection = db.collection('menu');
        const ordersCollection = db.collection('orders');
        const bookingsCollection = db.collection('bookings');

        // --- API ROUTES (ENDPOINTS) ---

        // == BILLING SYSTEM ROUTES ==
        app.post('/api/orders', async (req, res) => {
            try {
                const orderData = { ...req.body, createdAt: new Date() };
                const result = await ordersCollection.insertOne(orderData);
                res.status(201).json({ message: 'Order created', orderId: result.insertedId });
            } catch (error) { res.status(500).json({ message: 'Error saving order' }); }
        });

        app.post('/api/bookings', async (req, res) => {
            try {
                const bookingData = { ...req.body, bookingDateTime: new Date(req.body.bookingDateTime), createdAt: new Date() };
                const result = await bookingsCollection.insertOne(bookingData);
                res.status(201).json({ message: 'Booking created', bookingId: result.insertedId });
            } catch (error) { res.status(500).json({ message: 'Error saving booking' }); }
        });


        // == DASHBOARD ROUTES ==

        // GET /api/dashboard-stats - Fetches statistics for the dashboard cards.
        app.get('/api/dashboard-stats', async (req, res) => {
            try {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);

                const todaysOrders = await ordersCollection.find({ createdAt: { $gte: startOfToday } }).toArray();
                const upcomingBookings = await bookingsCollection.find({ bookingDateTime: { $gte: new Date() } }).toArray();

                const totalSales = todaysOrders.reduce((sum, order) => sum + order.grandTotal, 0);
                const orderCount = todaysOrders.length;
                const bookingCount = upcomingBookings.length;
                const customerCount = new Set(upcomingBookings.map(b => b.phone)).size;

                res.status(200).json({
                    totalSales,
                    orderCount,
                    bookingCount,
                    customerCount
                });
            } catch (error) {
                res.status(500).json({ message: 'Error fetching stats' });
            }
        });
        
        // GET /api/recent-orders - Fetches last 5 orders.
        app.get('/api/recent-orders', async (req, res) => {
             try {
                const recentOrders = await ordersCollection.find().sort({createdAt: -1}).limit(5).toArray();
                res.status(200).json(recentOrders);
            } catch (error) {
                res.status(500).json({ message: 'Error fetching recent orders' });
            }
        });

        // GET /api/upcoming-bookings - Fetches upcoming bookings.
        app.get('/api/upcoming-bookings', async (req, res) => {
             try {
                const bookings = await bookingsCollection.find({ bookingDateTime: { $gte: new Date() } }).sort({bookingDateTime: 1}).limit(10).toArray();
                res.status(200).json(bookings);
            } catch (error) {
                res.status(500).json({ message: 'Error fetching upcoming bookings' });
            }
        });

        // Serve index.html for root
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../index.html'));
        });

        // --- MENU MANAGEMENT ROUTES ---
        app.get('/api/menu', async (req, res) => {
            try {
                const menuItems = await menuCollection.find({}).toArray();
                res.status(200).json(menuItems);
            } catch (error) { res.status(500).json({ message: 'Error fetching menu data' }); }
        });

        app.post('/api/menu', async (req, res) => {
            try {
                const newItem = req.body;
                const result = await menuCollection.insertOne(newItem);
                res.status(201).json({ message: 'Item added', itemId: result.insertedId });
            } catch (error) { res.status(500).json({ message: 'Error adding menu item' }); }
        });

        app.put('/api/menu/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const updatedData = req.body;
                delete updatedData._id; // Do not try to update the immutable _id field
                const result = await menuCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
                if (result.matchedCount === 0) return res.status(404).json({ message: 'Item not found' });
                res.status(200).json({ message: 'Item updated successfully' });
            } catch (error) { res.status(500).json({ message: 'Error updating menu item' }); }
        });
        
        app.delete('/api/menu/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const result = await menuCollection.deleteOne({ _id: new ObjectId(id) });
                if (result.deletedCount === 0) return res.status(404).json({ message: 'Item not found' });
                res.status(200).json({ message: 'Item deleted successfully' });
            } catch (error) { res.status(500).json({ message: 'Error deleting menu item' }); }
        });

        // Start the Express server
        app.listen(port, () => {
            console.log(`Backend server listening at http://localhost:${port}`);
        });

    } catch (e) {
        console.error('Could not connect to MongoDB and start the server:', e);
        process.exit(1);
    }
}

main().catch(console.error);

