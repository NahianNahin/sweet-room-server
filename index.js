const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

//MiddleWare
app.use(cors());
app.use(express.json());
// Verify JWT Token
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized Access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_JWT_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send('Forbidden Access');
        }
        req.decoded = decoded;
        next();
    })

}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4k7t9co.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const usersCollection = client.db("Sweet-home").collection("users");
        const citiesCollection = client.db("Sweet-home").collection("city");
        const roomsCollection = client.db("Sweet-home").collection("rooms");
        const bookingsCollection = client.db("Sweet-home").collection("bookings");
        const paymentsCollection = client.db("Sweet-home").collection("payments");
        const blogsCollection = client.db("Sweet-home").collection("blogs");


        // After VerifyJWT use VerifyAdmin
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const filter = { email: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.role !== 'Admin') {
                return res.status(403).send('Forbidden Access');
            }
            next();
        }
        // After VerifyJWT use VerifyRoom_provider
        const verifyRoom_provider = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const filter = { email: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.role !== 'room_provider') {
                return res.status(403).send('Forbidden Access');
            }
            next();
        }
        // After VerifyJWT use VerifyRoom_booker
        const verifyRoom_booker = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const filter = { email: decodedEmail };
            const user = await usersCollection.findOne(filter);
            if (user?.role !== 'room_booker') {
                return res.status(403).send('Forbidden Access');
            }
            next();
        }
        // Get User by Email
        app.get('/users', async (req, res) => {
            const setEmail = req.query.email;
            const query = { email: setEmail };
            const result = await usersCollection.findOne(query);
            res.send(result);
        })
        // Get User by room_provider Name
        app.get('/users_by_room_provider', async (req, res) => {
            const setRoom_provider = req.query.room_provider;
            const query = { name: setRoom_provider };
            const result = await usersCollection.findOne(query);
            res.send(result);
        })
        // Get User by role
        app.get('/users_role', async (req, res) => {
            const setRole = req.query.role;
            const query = { role: setRole };
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })

        //put User Details
        app.put('/users', async (req, res) => {
            const email = req.query.email;
            const filter = { email: email }
            const user = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: user.name,
                    role: user.role,
                    photoURL: user.photoURL
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })
        // Delete User
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })
        // Check room_provider
        app.get('/users_room_provider/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isRoom_provider: user?.role === 'room_provider' });
        })
        // Check room_booker
        app.get('/users_room_booker/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isRoom_booker: user?.role === 'room_booker' });
        })
        // Check Admin
        app.get('/users_admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
        })

        // Get cities 
        app.get('/cities', async (req, res) => {
            const query = {};
            const result = await citiesCollection.find(query).toArray();
            res.send(result);
        })
        // get room by cities 
        app.get('/cities/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const result = await roomsCollection.find(query).toArray();
            res.send(result);
        })

        // Get room by room_provider
        app.get('/room_provider_rooms', async (req, res) => {
            const setRoom_providerEmail = req.query.email;
            const filter = {
                room_providerEmail: setRoom_providerEmail
            }
            const result = await roomsCollection.find(filter).toArray();
            res.send(result)
        })
        // Get room by Advertised
        app.get('/advertise_rooms', async (req, res) => {
            const filter = {
                advertised: true,
                booked: false
            }
            const result = await roomsCollection.find(filter).toArray();
            res.send(result)
        })
        // Get room by Reported
        app.get('/reported_rooms', async (req, res) => {
            const filter = {
                reported: true
            }
            const result = await roomsCollection.find(filter).toArray();
            res.send(result)
        })

        //Get All  room
        app.get('/all_rooms', async (req, res) => {
            const query = {};
            const result = await roomsCollection.find(query).toArray();
            res.send(result);
        })
        // get room by cities 
        app.get('/rooms/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const result = await roomsCollection.find(query).toArray();
            res.send(result);
        })
        // Post room
        app.post('/rooms', async (req, res) => {
            const room = req.body;
            const result = await roomsCollection.insertOne(room);
            res.send(result);
        })
        //GET ADVERTISE UPDATE
        app.put('/room/get_advertise/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    advertised: true
                },
            };
            const result = await roomsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        //REMOVE ADVERTISE UPDATE
        app.put('/room/remove_advertise/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    advertised: false
                },
            };
            const result = await roomsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        //GET REPORT UPDATE
        app.put('/room/add_reported/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    reported: true
                },
            };
            const result = await roomsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        //GET BOOKED UPDATE
        app.put('/room/booked_status/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    booked: true
                },
            };
            const result = await roomsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        //GET UNBOOKED UPDATE
        app.put('/room/unbooked_status/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    booked: false
                },
            };
            const result = await roomsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        // Delete room
        app.delete('/room/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await roomsCollection.deleteOne(query);
            res.send(result);
        })
        // update Data
        app.get('/update', async (req, res) => {

            const filter = {

            }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    room_providerEmail: ''
                },
            };
            const result = await roomsCollection.updateMany(filter, updateDoc, options);
            res.send(result)
        })

        // Get Bookings by email
        app.get('/bookings', async (req, res) => {
            const selectedEmail = req.query.email;
            const filter = {
                email: selectedEmail
            }
            const booking = await bookingsCollection.find(filter).toArray();
            // console.log(booking);
            res.send(booking);
        })
        // Get Bookings by id
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            }
            const result = await bookingsCollection.findOne(query);
            res.send(result);
        })
        // Post Bookings
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })


        // PAYMENT
        // Stripe intent
        app.post("/create-payment-intent", async (req, res) => {
            const booking = req.body;
            const rent = booking.rent;
            const amount = rent * 100;

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                "payment_method_types": [
                    "card"
                ],
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        // Post Payment 
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const roomId = payment.room_id;
            const filter = {
                _id: ObjectId(id)
            }
            const query = {
                _id: ObjectId(roomId)
            }
            const updateBooking = {
                $set: {
                    paid: true,
                    transation_id: payment.transationId
                },
            };
            const updateroom = {
                $set: {
                    booked: true
                },
            };
            const updateresultBooking = await bookingsCollection.updateOne(filter, updateBooking);
            const updateresultroom = await roomsCollection.updateOne(query, updateroom);
            res.send(result);

        })


        // Get All blogs
        app.get('/blogs', async (req, res) => {
            const query = {};
            const result = await blogsCollection.find(query).toArray();
            res.send(result);
        })
    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);

// Get Jwt Token
app.get('/jwt', (req, res) => {
    const selectEmail = req.query.email;
    const user = {
        email: selectEmail
    }
    const token = jwt.sign(user, process.env.ACCESS_JWT_TOKEN, { expiresIn: '7d' });
    res.send({ token })
})
app.get('/', (req, res) => {
    res.send('Sweet Home server is running')
})

app.listen(port, () => {
    console.log(`Sweet Home server is listening on port ${port}`)
})