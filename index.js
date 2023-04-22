require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());

app.use(express.json());
app.use(express.static("public"));
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://localhost:27017/CanteenBuddyCopyDB");

const roles = {
  admin: 101,
  user: 102,
};

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  phone_no: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  college_id: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  orders: {
    type: [],
  },
  refreshToken: {
    type: String,
    default: null,
  },
});

const adminSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  canteen_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    default: null,
  },
});

const cartSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  canteen_name: {
    type: String,
    required: true,
  },
  userid: {
    type: String,
    required: true,
  },
});

const orderSchema = new Schema({
  cart: {
    type: [],
    required: true,
  },
  userid: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  ordertime: {
    type: String,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  canteen_name: {
    type: String,
    required: true,
  },
  canteen_id: {
    type: String,
    required: true,
  },
});

const canteenSchema = new Schema({
  canteen_name: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  fooditems: [
    {
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
});

const Admin = mongoose.model("admin", adminSchema);
const User = mongoose.model("user", userSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Order = mongoose.model("Order", orderSchema);
const Canteen = mongoose.model("Canteen", canteenSchema);

// userlogin
app.post("/login", (req, res) => {
  User.findOne({ email: req.body.email }).then((foundUser) => {
    if (foundUser) {
      bcrypt.compare(req.body.password, foundUser.password).then((result) => {
        if (result) {
          const role = roles.user;
          const accessToken = jwt.sign(
            {
              UserInfo: {
                id: foundUser._id,
                name: foundUser.name,
                email: foundUser.email,
                role: role,
              },
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "10s" }
          );
          const refreshToken = jwt.sign(
            {
              name: foundUser.name,
              email: foundUser.email,
              role: role,
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "1d" }
          );
          foundUser.refreshToken = refreshToken;
          foundUser.save();
          res.cookie("jwt", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 360000,
          });
          res.status(200).json({ accessToken, role, foundUser });
        } else {
          res.json("Invalid Password");
        }
      });
    } else {
      res.json("Invalid Email");
    }
  });
});

// user registration
app.post("/register", (req, res) => {
  User.findOne({ email: req.body.email }).then((foundUser) => {
    if (foundUser) {
      res.json("User already Exist");
    } else {
      bcrypt.hash(req.body.password, saltRounds).then((hash) => {
        const user = new User({
          name: req.body.name,
          phone_no: req.body.phone,
          role: req.body.role,
          college_id: req.body.college_id,
          department: req.body.department,
          email: req.body.email,
          password: hash,
        });
        user.save();
        res.json("Successfully Registered");
      });
    }
  });
});

// update user
app.post("/updateUser/:id", (req, res) => {
  User.findOne({ _id: req.params.id }).then((foundUser) => {
    if (foundUser) {
      bcrypt.compare(req.body.password, foundUser.password).then((result) => {
        if (result) {
          bcrypt.hash(req.body.npassword, saltRounds).then((hash) => {
            hash;
            User.updateOne(
              { _id: req.params.id },
              {
                $set: {
                  password: hash,
                },
              }
            ).then((user) => {
              if (user) {
                res.json("Updated Successfully");
              } else {
                res.json("User not found");
              }
            });
          });
        }
      });
    }
  });
});

// admin update
app.post("/updateAdmin/:id", (req, res) => {
  Admin.findOne({ _id: req.params.id }).then((foundAdmin) => {
    if (foundAdmin) {
      bcrypt.compare(req.body.password, foundAdmin.password).then((result) => {
        if (result) {
          bcrypt.hash(req.body.npassword, saltRounds).then((hash) => {
            hash;
            Admin.updateOne(
              { _id: req.params.id },
              {
                $set: {
                  password: hash,
                },
              }
            ).then((admin) => {
              if (admin) {
                res.json("Updated Successfully");
              } else {
                res.json("User not found");
              }
            });
          });
        }
      });
    }
  });
});

// admin registration
app.post("/adminregister", (req, res) => {
  Admin.findOne({ email: req.body.email }).then((foundAdmin) => {
    if (foundAdmin) {
      res.json("Admin already Exist");
    } else {
      bcrypt.hash(req.body.password, saltRounds).then((hash) => {
        Canteen.findOne({ canteen_name: req.body.canteen_name }).then(
          (foundcanteen) => {
            if (foundcanteen) {
              res.json("Canteen name not available");
            } else {
              const admin = new Admin({
                name: req.body.name,
                canteen_name: req.body.canteen_name,
                email: req.body.email,
                password: hash,
              });
              const canteen = new Canteen({
                canteen_name: req.body.canteen_name,
                name: req.body.name,
              });
              admin.save();
              canteen.save();
              res.json("Successfully Registered");
            }
          }
        );
      });
    }
  });
});

// admin login
app.post("/admin", (req, res) => {
  const { email, password } = req.body;
  Admin.findOne({ email: email }).then((admin) => {
    if (!admin) {
      res.json("Invalid Email");
    } else {
      bcrypt.compare(password, admin.password).then((result) => {
        if (result) {
          const role = roles.admin;
          const accessToken = jwt.sign(
            {
              UserInfo: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: role,
              },
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "10s" }
          );
          const refreshToken = jwt.sign(
            {
              name: admin.name,
              email: admin.email,
              role: role,
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "1d" }
          );
          admin.refreshToken = refreshToken;
          admin.save();
          res.cookie("jwt", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 1000 * 60 * 60 * 24 * 7,
          });
          Canteen.findOne({ canteen_name: admin.canteen_name }).then(
            (canteen) => {
              if (canteen)
                res.status(200).json({ accessToken, role, admin, canteen });
            }
          );
        } else {
          res.json("Wrong Password");
        }
      });
    }
  });
});

// find canteen
app.get("/canteen", (req, res) => {
  Canteen.find({}).then((result) => {
    if (result) {
      res.send(result);
    }
  });
});

// add food
app.post("/food/:id", (req, res) => {
  var food = {
    name: req.body.name,
    type: req.body.type,
    category: req.body.category,
    price: Number(req.body.price),
  };
  Canteen.findByIdAndUpdate(
    { _id: req.params.id },
    { $push: { fooditems: food } }
  ).then((err) => {
    if (err) {
      res.json(err);
    } else {
      res.json("Food Added");
    }
  });
});

// view food
app.get("/food/:name", (req, res) => {
  Canteen.findOne({ canteen_name: req.params.name }).then((result) => {
    if (result) res.send(result.fooditems);
  });
});

// delete food
app.delete("/food/:cid/:id", (req, res) => {
  Canteen.findOneAndUpdate(
    { _id: req.params.cid },
    { $pull: { fooditems: { _id: req.params.id } } }
  ).then((result) => {
    if (result) {
      res.send("Successful");
    }
  });
});

// view cart
app.get("/cart", (req, res) => {
  Cart.find({}).then((result) => {
    if (result) {
      res.send(result);
    }
  });
});

// add to cart
app.post("/cart", (req, res) => {
  const cart = new Cart({
    name: req.body.name,
    type: req.body.type,
    category: req.body.category,
    price: req.body.price,
    quantity: req.body.quantity,
    canteen_name: req.body.canteen_name,
    userid: req.body.user_id,
  });
  cart.save().then(res.send("Successfully Added"));
});

// remove from cart
app.delete("/cart/:id", (req, res) => {
  Cart.findByIdAndRemove(req.params.id).then((result) => {
    res.send("Done");
  });
});

//  delete cart
app.delete("/cart", (req, res) => {
  Cart.deleteMany({}).then((res) => console.log(res));
});

// place order
app.post("/order/:id/:name/:total/:canteen/:cid", (req, res) => {
  let currTime = new Date().toLocaleTimeString();
  const order = new Order({
    cart: req.body,
    username: req.params.name,
    userid: req.params.id,
    ordertime: currTime,
    total: Number(req.params.total),
    canteen_name: req.params.canteen,
    canteen_id: req.params.cid,
  });
  order.save().then((result) => {
    User.findByIdAndUpdate(req.params.id, {
      $push: { orders: result._id },
    }).then();
  });
});

// view order
app.get("/order/:id", (req, res) => {
  Order.find({ userid: req.params.id }).then((result) => {
    if (result) {
      res.send(result);
    }
  });
});

//  view oder by canteen
app.get("/order/:id/:cid", (req, res) => {
  Order.find({ userid: req.params.id, canteen_id: req.params.cid }).then(
    (result) => {
      if (result) {
        res.send(result);
      }
    }
  );
});

// all order
app.get("/allorder/:id", (req, res) => {
  Order.find({ canteen_id: req.params.id }).then((result) => {
    if (result) {
      res.send(result);
    }
  });
});

// total
app.get("/gettotal/:id", (req, res) => {
  let total = 0;
  Order.find({ canteen_id: req.params.id }).then((results) => {
    results.forEach((result) => {
      total = total + result.total;
    });
    res.json(total);
  });
});

//Handle Refresh for User
app.get("/refresh", async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;
  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) return res.sendStatus(403);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);
    const role = roles.user;
    const accessToken = jwt.sign(
      {
        UserInfo: {
          id: foundUser._id,
          name: foundUser.name,
          email: foundUser.email,
          role: role,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10s" }
    );
    res.json({ accessToken, role, foundUser });
  });
});

//Handle refresh for Admin
app.get("/refresh1", async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;
  const admin = await Admin.findOne({ refreshToken }).exec();
  if (!admin) return res.sendStatus(403);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err || admin.name !== decoded.name) return res.sendStatus(403);
    const role = roles.admin;
    const accessToken = jwt.sign(
      {
        UserInfo: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: role,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10s" }
    );
    Canteen.findOne({ canteen_name: admin.canteen_name }).then((canteen) => {
      if (canteen) res.json({ accessToken, role, admin, canteen });
    });
  });
});

//logout
app.get("/logout", async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  const refreshToken = cookies.jwt;

  // Is refreshToken in db?
  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    return res.sendStatus(204);
  }

  // Delete refreshToken in db
  foundUser.refreshToken = "";
  const result = await foundUser.save();

  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.sendStatus(204);
});

// logout1
app.get("/logout1", async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  const refreshToken = cookies.jwt;

  // Is refreshToken in db?
  const foundUser = await Admin.findOne({ refreshToken }).exec();
  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    return res.sendStatus(204);
  }

  // Delete refreshToken in db
  foundUser.refreshToken = "";
  const result = await foundUser.save();

  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.sendStatus(204);
});

app.listen(8080, () => {
  console.log("server running at port 8080");
});
