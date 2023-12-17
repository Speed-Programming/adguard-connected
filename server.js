const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config();

// MongoDB connection URI
const mongoURI = process.env.MONGO_URI;
const mongoClient = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://post-it-heroku.herokuapp.com'],
  },
});

const { authSocket, socketServer } = require('./socketServer');
const posts = require('./routes/posts');
const users = require('./routes/users');
const comments = require('./routes/comments');
const messages = require('./routes/messages');

const PostLike = require('./models/PostLike');
const Post = require('./models/Post');

const PORT = process.env.PORT || 4000;

// MongoDB connection function
async function connectToMongoDB() {
  try {
    await mongoClient.connect();
    await mongoClient.db("admin").command({ ping: 1 });
    console.log("Pinged MongoDB. Successfully connected!");
  } finally {
    // Close the MongoDB connection when the app is finished
    await mongoClient.close();
  }
}

// Run the MongoDB connection function
connectToMongoDB().catch(console.dir);

// Mongoose connection
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

io.use(authSocket);
io.on('connection', (socket) => socketServer(socket));

app.use(express.json());
app.use(cors());
app.use('/api/posts', posts);
app.use('/api/users', users);
app.use('/api/comments', comments);
app.use('/api/messages', messages);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
