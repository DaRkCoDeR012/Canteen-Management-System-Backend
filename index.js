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
    name: {
        type: String,
        required:true
    },
    canteen_name:{
        type: String,
        required:true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type:String,
        required: true,
    }
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
    },
    canteen_name:{
        type:String,
        required:true
    }
});

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
    },
    canteen_name:{
        type:String,
        required:true
    },
    canteen_id:{
        type:String,
        required:true
    }
});

const canteenSchema = new Schema({
    canteen_name: {
        type:String,
        required: true
    },
    name: {
        type: String,
        required:true
    },
    fooditems:[{
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
        }]
})

const Food = mongoose.model("food", foodSchema);
const Admin = mongoose.model("admin",adminSchema);
const User = mongoose.model("user", userSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Order = mongoose.model("Order", orderSchema);
const Canteen = mongoose.model("Canteen", canteenSchema);

// userlogin
app.post("/login", (req,res) => {
    User.findOne({email: req.body.email}).then(foundUser => {
        if(foundUser){
            bcrypt.compare(req.body.password, foundUser.password).then(result => {
                if(result){
                    const payload = {
                        username: foundUser.email
                    }
                    const tkn = jwt.sign(payload,"usertoken", {expiresIn: '60s'});
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

// user registration
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

// admin registration
app.post("/adminregister", (req,res) => {
    Admin.findOne({email: req.body.email})
    .then((foundAdmin) => {
        if(foundAdmin){
            res.json("Admin already Exist");
        }
        else{
            bcrypt.hash(req.body.password,saltRounds).then(hash => {
                Canteen.findOne({canteen_name: req.body.canteen_name}).then((foundcanteen) => {
                    if(foundcanteen){
                        res.json("Canteen name not available")
                    }
                    else{
                        const admin = new Admin({
                            name: req.body.name,
                            canteen_name: req.body.canteen_name,
                            email: req.body.email,
                            password: hash
                        });
                        const canteen = new Canteen({
                            canteen_name: req.body.canteen_name,
                            name: req.body.name,
                            // fooditems: []
                        });
                        admin.save();
                        canteen.save();
                        res.json("Successfully Registered");
                    }
                })
            });
        }
    })
});

// admin login
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
                    const tkn = jwt.sign(payload,"usertoken", {expiresIn: '60s'});
                    Canteen.findOne({canteen_name:admin.canteen_name}).then((canteen) => {
                        const login = {
                            name: [admin.name,admin._id, admin.canteen_name,canteen._id],
                            message:"Login Successfull",
                            token: tkn
                        };
                        const obj = JSON.stringify(login);
                    res.send(obj);
                    })
                    
                    
                }
                else{
                    res.json("Wrong Password");
                }
            });
        }
    });
});

// admin profile
app.get("/adminprofile/:id",(req,res) => {
    Admin.find({_id:req.params.id}).then((result) => {
        if (result) {
            res.send(result)
        }
    })
});

// user profile
app.get("/userprofile/:id",(req,res) => {
    User.find({_id:req.params.id}).then((result) => {
        if (result) {
            res.send(result)
        }
    })
})

// find canteen
app.get("/canteen",(req,res) => {
    Canteen.find({}).then((result) =>{
        if (result) {
            res.send(result)
        }
    })
})

// add food
app.post("/food/:id",(req,res)=>{
    var food = {
        name: req.body.name,
        type: req.body.type,
        category: req.body.category,
        price: Number(req.body.price)
    };
    Canteen.findByIdAndUpdate({_id:req.params.id},{$push: {fooditems: food}})
    .then((err) => {
        if(err){
            res.json(err)
        }
        else{
            res.json("Food Added");
        }
    });
});

// view food
app.get("/food/:name",(req,res)=>{
    Canteen.find({canteen_name:req.params.name}).then((result) => {
        if(result)
            res.send(result[0].fooditems);
    })
});


// delete food
app.delete("/food/:cid/:id",(req,res) => {
    Canteen.findOneAndUpdate({_id:req.params.cid},{$pull:{'fooditems':{_id:req.params.id}}
    }).then(result=>{
        if(result){
            res.send("Successful");
        }
    });
})

// view cart
app.get("/cart",(req,res)=>{
    Cart.find({}).then(result => {
        if(result){
            res.send(result);
        }
    })
})

// add to cart
app.post("/cart",(req,res)=>{
    const cart = new Cart({
        name: req.body.name,
        type: req.body.type,
        category: req.body.category,
        price: req.body.price,
        quantity: req.body.quantity,
        userid: "",
        canteen_name:req.body.canteen_name
    });
    cart.save().then(res.send("Successfully Added"));
});

// remove from cart
app.delete("/cart/:id",(req,res) => {
    Cart.findByIdAndRemove(req.params.id).then((result)=>{
        res.send("Done");
    });
})

app.delete("/cart",(req,res) => {
    Cart.deleteMany({ }).then(res=>console.log(res));
})

// place order
app.post("/order/:id/:name/:total/:canteen",(req,res)=>{
    let currTime = new Date().toLocaleTimeString();
    const order = new Order({
        cart: req.body,
        username: req.params.name,
        userid: req.params.id,
        ordertime: currTime,
        total: Number(req.params.total),
        canteen_name:req.params.canteen
    });
    order.save().then((result)=>{
        User.findByIdAndUpdate(req.params.id,{$push:{orders: result._id}})
        .then();
    });
});

// view order
app.get("/order/:id",(req,res)=>{
    Order.find({userid: req.params.id}).then((result)=>{
        if(result){
            res.send(result);
        }
    });
});

// all order
app.get("/allorder/:id",(req,res)=>{
    Order.find({canteen_id:req.params.id}).then((result)=>{
        if(result){
            res.send(result);
        }
    });
});

// total
app.get("/gettotal/:id",(req,res)=>{
    let total = 0;
    Order.find({canteen_id:req.params.id}).then((results)=>{
        results.forEach(result=>{
            total = total+result.total;
        })
        res.json(total);
    });
});

app.listen(8080, () => {
    console.log("server running at port 8080");
});










// bcrypt.hash("admin@123",saltRounds).then(hash => {
// const admin = new Admin({
//     email: "admin@admin.com",
//     password: hash
// });
// admin.save();
// });




// app.post("/food",(req,res)=>{
    //     const food = new Food({
    //         name: req.body.name,
    //         type: req.body.type,
    //         category: req.body.category,
    //         price: Number(req.body.price)
    //     });
    //     food.save().then((err) => {
        //         if(err){
            //             res.json(err)
            //         }
            //         else{
                //             res.json("Food Added");
                //         }
                //     });
                // });
                
                
                
                // app.get("/food",(req,res)=>{
                    //     Food.find({}).then((result) => {
                        //         if(result)
                        //             res.send(result[0].fooditems);
                        //     })
                        // });
                        
                        // app.delete("/food/:name/:id",(req,res) => {
                            //     Canteen.findByName({canteen_name:req.params.name}).then(result=>{
//         if(result){
//             res.send("Successful");
//         }
//     });



    // app.get("/allorder",(req,res)=>{
    //     Order.find({}).then((result)=>{
    //         if(result){
    //             res.send(result);
    //         }
    //     });
    // });
// })