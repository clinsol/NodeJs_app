// Import required modules
import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Connect to MongoDB database
mongoose.connect("mongodb://127.0.0.1:27017", {
  dbName: "backend",
})
  .then(() => {
    console.log("Connected to mongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

// Define user schema for MongoDB
const userSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
  },
  Age: Number,
  Email: String,
  Password: {
    type: String,
    required: true,
  },
});

// Create User model
const User = mongoose.model("User", userSchema);

// Create Express application
const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(path.resolve(), "public")));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Set view engine to EJS
app.set("view engine", "ejs");

// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decode = jwt.verify(token, "Roshan1234");
    req.user = await User.findById(decode._id);
    next();
  } else {
    res.render("login"); // If not authenticated, render login page
  }
};

// Home page route
app.get("/", isAuthenticated, (req, res) => {
  console.log(req.user);
  res.render("logout", { name: req.user.Name }); // Render logout page with user's name
});

// Register page route
app.get("/register", (req, res) => {
  res.render("register");
});

// Login page route
app.get("/login", (req, res) => {
  res.render("login");
});

// Register user route
app.post("/register", async (req, res) => {
  const { name, age, email, password } = req.body;

  let user = await User.findOne({ Email: email });
  if (user) {
    return res.redirect("/login"); // If user already exists, redirect to login page
  }

  const hash_password=await bcrypt.hash(password,10);

  user = await User.create({
    Name: name,
    Age: age,
    Email: email,
    Password: hash_password,
  });

  const token = jwt.sign({
    _id: user._id,
  }, "Roshan1234");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

// Login user route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ Email: email });

    if (!user) {
      return res.redirect("register"); // If user does not exist, redirect to register page
    }

    const isMatch=bcrypt.compare(password,user.Password);

    if(!isMatch) {
      // Password is incorrect, render login page with an error message
      return res.render("login", {email,message: "Invalid password" });
    }

    // Login successful
    const token = jwt.sign({
      _id: user._id,
    }, "Roshan1234");

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 60 * 1000),
    });

    res.redirect("/"); // Redirect to the logout page

  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// Logout route
app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("login");
});

// Start the server
app.listen(5000, () => {
  console.log("listening at port 5000");
});
