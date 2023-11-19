const express = require("express");
const app = express();
const cors = require("cors");
// const cookieParser = require("cookie-parser");
// const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// middleware
// app.use(
//   cors({
//     origin: [
//       // "http://localhost:5173",
//       "https://blogverse-jamiulalam18.netlify.app/"
//     ],
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(cookieParser());

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

// // middlewares
// const logger = (req, res, next) => {
//   console.log("log: info", req.method, req.url);
//   next();
// };

// const verifyToken = (req, res, next) => {
//   const token = req?.cookies?.token;
//   // console.log('token in the middleware', token);
//   // no token available
//   if (!token) {
//     return res.status(401).send({ message: "unauthorized access" });
//   }
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(401).send({ message: "unauthorized access" });
//     }
//     req.user = decoded;
//     next();
//   });
// };

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const dataset = client.db("blogVerseDB");

    const usersCollection = dataset.collection("users");
    const blogsCollection = dataset.collection("blogs");

    // auth related api
    // app.post("/jwt", logger, async (req, res) => {
    //   const user = req.body;
    //   console.log("user for token", user);
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    //     expiresIn: "1h",
    //   });

    //   res
    //     .cookie("token", token, {
    //       httpOnly: true,
    //       secure: true,
    //       sameSite: "none",
    //     })
    //     .send({ success: true });
    // });

    // app.post("/logout", async (req, res) => {
    //   const user = req.body;
    //   console.log("logging out", user);
    //   res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    // });

    app.get("/topAuthors", async (req, res) => {
      const result = await blogsCollection
        .aggregate([
          {
            $group: {
              _id: "$author_id",
              blogCount: { $sum: 1 },
            },
          },
          {
            $match: {
              blogCount: { $gt: 2 },
            },
          },
          {
            $project: {
              _id: 1, // Include author_id in the result
              blogCount: 1, // Include the count of blogs
            },
          },
        ])
        .toArray();
      const authorsWithMoreThan3Blogs = result.map((author) => author._id);

      console.log("Authors with more than 3 blogs:", authorsWithMoreThan3Blogs);
      res.send(result);
    });

    //user related
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

    app.patch("/addToWishList/:id", async (req, res) => {
      const id = req.params.id;
      const blogId = req.body.blogId;
      console.log(blogId);

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { wishlist: blogId } },
        { upsert: true }
      );
      console.log(result);
      res.send(result);
    });

    app.patch("/removeFromWishList/:id", async (req, res) => {
      const id = req.params.id;
      const blogId = req.body.blogId;
      console.log(blogId);

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { wishlist: blogId } },
        { upsert: true }
      );
      // console.log(result);
      res.send(result);
    });

    app.get("/getAuthorNameImg/:id", async (req, res) => {
      const id = req.params.id;
      const result = await usersCollection.findOne(
        { _id: new ObjectId(id) },
        {
          projection: { full_name: 1, image: 1 },
        }
      );
      res.send(result);
    });

    //blogs related

    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const result = await blogsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/blogsByAuthor/:id", async (req, res) => {
      const id = req.params.id;
      const result = await blogsCollection.find({ author_id: new ObjectId(id) }).toArray();

      console.log(result);
      res.send(result);
    });
    

    app.get("/featuredBlogs", async (req, res) => {
      // Aggregate to find 6 blogs with the longest main_text

      const result = await blogsCollection.aggregate([
      {
        $project: {
          _id: 1,
          wordCount: { $size: { $split: ['$main_post', ' '] } },
        },
      },
      {
        $sort: { wordCount: -1 },
      },
      {
        $limit: 10,
      },
    ]).toArray();
      console.log("Top 10 blogs with the longest main_text:", result);
      res.send(result);
    });

    app.get("/blogsCount", async (req, res) => {
      const filter = req.query.filter;
      const search = req.query.search;
      if (search === "") {
        if (filter === "All") {
          const count = await blogsCollection.estimatedDocumentCount();
          res.send({ count });
        } else {
          const query = { post_category: filter };
          const count = await blogsCollection.countDocuments(query);
          res.send({ count });
        }
      } else {
        const searchPhrase = search;
        const regex = new RegExp(searchPhrase, "i"); // 'i' for case-insensitive
        // Use the regex in the filter to perform a partial search in title and tags
        const query = {
          $or: [
            { post_title: { $regex: regex } },
            { post_tags_arr: { $elemMatch: { $regex: regex } } },
          ],
        };
        const query2 = {
          $and: [
            {
              $or: [
                { post_title: { $regex: regex } },
                { post_tags_arr: { $elemMatch: { $regex: regex } } },
              ],
            },
            { post_category: filter },
          ],
        };
        // Find documents with the specified partial search phrase in title, tags
        if (filter === "All") {
          const initialResults = await blogsCollection.find(query).toArray();
          res.send({ count: initialResults.length });
        } else {
          const initialResults = await blogsCollection.find(query2).toArray();
          res.send({ count: initialResults.length });
        }
      }
    });

    app.get("/blogsByPage", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const filter = req.query.filter;
      const search = req.query.search;

      if (search === "") {
        if (filter === "All") {
          const result = await blogsCollection
            .find()
            .skip(page * size)
            .limit(size)
            .toArray();
          res.send(result);
        } else {
          const query = { post_category: filter };
          const result = await blogsCollection
            .find(query)
            .skip(page * size)
            .limit(size)
            .toArray();
          res.send(result);
        }
      } else {
        const searchPhrase = search;
        const regex = new RegExp(searchPhrase, "i"); // 'i' for case-insensitive
        // Use the regex in the filter to perform a partial search in title and tags
        const query = {
          $or: [
            { post_title: { $regex: regex } },
            { post_tags_arr: { $elemMatch: { $regex: regex } } },
          ],
        };
        const query2 = {
          $and: [
            {
              $or: [
                { post_title: { $regex: regex } },
                { post_tags_arr: { $elemMatch: { $regex: regex } } },
              ],
            },
            { post_category: filter },
          ],
        };
        // Find documents with the specified partial search phrase in title, tags
        if (filter === "All") {
          const initialResults = await blogsCollection
            .find(query)
            .skip(page * size)
            .limit(size)
            .toArray();
          res.send(initialResults);
        } else {
          const initialResults = await blogsCollection
            .find(query2)
            .skip(page * size)
            .limit(size)
            .toArray();
          res.send(initialResults);
        }
      }
    });

    app.get("/recentBlogs", async (req, res) => {
      // Find the recent 6 items, sort by createdAt in descending order
      const recentItems = await blogsCollection
        .find({})
        .sort({ timePosted: -1 })
        .limit(6)
        .toArray();
      res.send(recentItems);
    });

    app.post("/blogs", async (req, res) => {
      const author_id = req.body.author_id;
      const new_post = {
        ...req.body,
        timePosted: new Date(),
        author_id: new ObjectId(author_id),
      };
      const result = await blogsCollection.insertOne(new_post);
      res.send(result);
    });

    app.patch("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedBlog = req.body;

      const blog = {
        $set: {
          author_id: new ObjectId(updatedBlog.author_id),
          post_category: updatedBlog.post_category,
          post_title: updatedBlog.post_title,
          thumbnail: updatedBlog.thumbnail,
          main_img: updatedBlog.main_img,
          short_description: updatedBlog.short_description,
          main_post: updatedBlog.main_post,
          main_post_Style: updatedBlog.main_post_Style,
          post_tags_arr: updatedBlog.post_tags_arr,
        },
      };
      console.log(blog);

      const result = await blogsCollection.updateOne(filter, blog, options);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } catch (error) {
    console.log(error);
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
