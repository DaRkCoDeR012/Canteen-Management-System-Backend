require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Schema } = mongoose;
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require("jsonwebtoken");
// const token=require('crypto').randomBytes(64).toString('hex');
// console.log(token);

const app = express();

app.use(express.json());
app.use(express.static("public"));
app.use(cors());

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/CanteenBuddyCopyDB");

const userSchema = new Schema ({
    fname: {
        type: String,
        required: true},
    lname: {
        type: String,
        required: true},
    email: {
        type: String,
        required: true},
    password: {
        type: String,
        required: true},
    orders: {
        type: []
    }
});

const adminSchema = new Schema({
    email: {
        type: String,
        required: true},
    password: {
        type:String,
        required: true,}
});

const foodSchema = new Schema ({
    name: {
        type:String,
        required:true
    },
    type:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    }
});

const cartSchema = new Schema ({
    name: {
        type:String,
        required:true
    },
    type:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    quantity:{
        type:Number,
        required: true
    }
})

const orderSchema = new Schema ({
    cart: {
        type: [],
        required: true,
    },
    userid: {
        type: String,
        required: true
    },
    username:{
        type: String,
        required: true
    },
    ordertime:{
        type:String,
        required: true
    },
    total:{
        type: Number,
        required: true
    }
})

const Food = mongoose.model("food", foodSchema);
const Admin = mongoose.model("admin",adminSchema);
const User = mongoose.model("user", userSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Order = mongoose.model("Order", orderSchema);

app.post("/login", (req,res) => {
    User.findOne({email: req.body.email}).then(foundUser => {
        if(foundUser){
            bcrypt.compare(req.body.password, foundUser.password).then(result => {
                if(result){
                    const payload = {
                        username: foundUser.email
                    }
                    const tkn = jwt.sign(payload,process.env.TOKEN_SECRET, {expiresIn: '60s'});
                    const login = {
                        name: [foundUser.fname,foundUser._id],
                        message:"Login Successfull",
                        token: tkn
                    };
                    Cart.deleteMany({});
                    const obj = JSON.stringify(login);
                    res.send(obj);
                }
                else{
                    res.json("Wrong Password");
                }
            });
        }
        else {
            res.json("Invalid Email");
        }
    });
});

app.post("/register", (req,res) => {
    User.findOne({email: req.body.email})
    .then((foundUser) => {
        if(foundUser){
            res.json("User already Exist");
        }
        else{
            bcrypt.hash(req.body.password,saltRounds).then(hash => {
                const user = new User({
                    fname: req.body.fname,
                    lname: req.body.lname,
                    email: req.body.email,
                    password: hash
                });
                user.save();
                res.json("Successfully Registered");
            });
        }
    })
});

// bcrypt.hash("admin@123",saltRounds).then(hash => {
// const admin = new Admin({
//     email: "admin@admin.com",
//     password: hash
// });
// admin.save();
// });

app.post("/admin", (req,res) => {
    const {email, password} = req.body;
    Admin.findOne({email: email}).then((admin) => {
        if(!admin){
            res.json("Invalid Email");
        }
        else{
            bcrypt.compare(password, admin.password).then((result)=>{
                if(result){
                    const payload = {
                        username: admin.email
                    }
                    const tkn = jwt.sign(payload,process.env.TOKEN_SECRET, {expiresIn: '60s'});
                    const login = {
                        message:"Login Successfull",
                        token: tkn
                    };
                    const obj = JSON.stringify(login);
                    res.send(obj);
                }
                else{
                    res.json("Wrong Password");
                }
            });
        }
    });
});

app.post("/food",(req,res)=>{
    const food = new Food({
        name: req.body.name,
        type: req.body.type,
        category: req.body.category,
        price: Number(req.body.price)
    });
    food.save().then((err) => {
        if(err){
            res.json(err)
        }
        else{
            res.json("Food Added");
        }
    });
});

app.get("/food",(req,res)=>{
    Food.find({}).then((result) => {
        if(result)
            res.send(result);
    })
});

app.delete("/food/:id",(req,res) => {
    Food.findByIdAndRemove(req.params.id).then(result=>{
        if(result){
            res.send("Successful");
        }
    });
})

app.get("/cart",(req,res)=>{
    Cart.find({}).then(result => {
        if(result){
            res.send(result);
        }
    })
})

app.post("/cart",(req,res)=>{
    const cart = new Cart({
        name: req.body.name,
        type: req.body.type,
        category: req.body.category,
        price: req.body.price,
        quantity: req.body.quantity,
        userid: ""
    });
    cart.save().then(res.send("Successfully Added"));
});

app.delete("/cart/:id",(req,res) => {
    Cart.findByIdAndRemove(req.params.id).then((result)=>{
        res.send("Done");
    });
})

app.delete("/cart",(req,res) => {
    Cart.deleteMany({ }).then(res=>console.log(res));
})

app.post("/order/:id/:name/:total",(req,res)=>{
    let currTime = new Date().toLocaleTimeString();
    const order = new Order({
        cart: req.body,
        username: req.params.name,
        userid: req.params.id,
        ordertime: currTime,
        total: Number(req.params.total)
    });
    order.save().then((result)=>{
        User.findByIdAndUpdate(req.params.id,{$push:{orders: result._id}})
        .then();
    });
});

app.get("/order/:id",(req,res)=>{
    Order.find({userid: req.params.id}).then((result)=>{
        if(result){
            res.send(result);
        }
    });
});

app.get("/order",(req,res)=>{
    Order.find({}).then((result)=>{
        if(result){
            res.send(result);
        }
    });
});

app.get("/gettotal",(req,res)=>{
    let total = 0;
    Order.find({}).then((results)=>{
        results.forEach(result=>{
            total = total+result.total;
        })
        res.json(total);
    });
});

app.listen(8080, () => {
    console.log("server running at port 8080");
});