const express = require("express");
const app = express();
const cors = require("cors");
const jwt =require('jsonwebtoken');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.idds8so.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      // await client.connect();
      const dataset = client.db("blogVerseDB");
  
      const usersCollection = dataset.collection("users");

      //auth apis
      app.post('/jwt')
  
      app.get("/users", async (req, res) => {
        const result = await usersCollection.find().toArray();
        res.send(result);
      });
  
      app.get("/users/:id", async (req, res) => {
        console.log("/users/:id");
        const id = req.params.id;
        const result = await usersCollection.findOne({ _id: new ObjectId(id) });
        res.send(result);
      });
  
      app.get("/usersByEmail/:email", async (req, res) => {
        console.log("/usersByEmail/:email");
        const email = req.params.email;
        const result = await usersCollection.findOne({ email: email });
        res.send(result);
      });
  
      app.post("/users", async (req, res) => {
        console.log("/users");
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.send(result);
      });
  
      
  
      app.delete("/users/:id", async (req, res) => {
        const id = req.params.id;
        const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      });
  
  
      // Send a ping to confirm a successful connection
      // await client.db("admin").command({ ping: 1 });
      // console.log(
      //   "Pinged your deployment. You successfully connected to MongoDB!"
      // );
    } finally {
      // Ensures that the client will close when you finish/error
      // await client.close();
    }
  }
  run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from server!");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
