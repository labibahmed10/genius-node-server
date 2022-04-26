const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
const jwt = require("jsonwebtoken");

require("dotenv").config();

//middleware
app.use(cors());
app.use(express.json());

//verifying jwt token

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    } else {
      req.decoded = decoded;
      next();
    }
  });
}

//mongo db main file here

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.PASSWORD_KEY}@cluster0.zqp7w.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("geniusService").collection("service");
    //creating new db collections for order
    const orderCollection = client.db("geniusService").collection("orders");

    //get all by GET method & by using FIND
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    //get individual one by GET & using FINDONE
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    //getting from user by POST method using INSERTONE

    app.post("/service", async (req, res) => {
      const newService = req?.body;
      const result = await serviceCollection.insertOne(newService);

      console.log(result);
      res.send(result);
    });

    // to delete any individual by DELETE method & by DELETEONE
    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    //to update any particular one by PUT method & by UPDATEONE

    app.put("/service/:id", async (req, res) => {
      const id = req.params.id;
      const updatedService = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };

      const updateDoc = {
        $set: updatedService,
      };

      const result = await serviceCollection.updateOne(filter, updateDoc, options);

      res.send(result);
    });

    //creating POST to get order details collection
    app.post("/orders", async (req, res) => {
      const orderDetail = req.body;
      const result = await orderCollection.insertOne(orderDetail);
      res.send(result);
    });

    //fetching by email these orders in UI by GET method and find
    app.get("/orderhistory", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;

      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    });

    //creating JWT token for security purpose
    app.post("/getToken", async (req, res) => {
      const usersEmail = req.body;
      const accessToken = jwt.sign(usersEmail, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });

      res.send({ accessToken });
    });
  } finally {
    console.log("Connected to database");
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("It's working insha'Allah");
});

app.listen(port, () => {
  console.log("It's running");
});
