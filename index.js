
const express = require("express");
const mongoose = require("mongoose");
const cookie_parser = require("cookie-parser");
const JWT = require("jsonwebtoken");
const app = express();
const PORT = 5000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(cookie_parser()); // cookieparser is a middleware and have to do app.use before any work of it
var logged = "";

// Database connectivity
mongoose
  .connect("mongodb://127.0.0.1:27017/backend_dev")
  .then(() => {
    console.log("Database connected");
  })
  .catch((e) => {
    console.log("error: " + e);
  });

const userSchema = mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});
const USER = mongoose.model("user", userSchema);

const authentication = async (req, res, next) => {
  const { token } = req.cookies; // if you want to see the cookies, you need to use npm install cookie-parser and require it

  if (token) {
    const decoded = JWT.verify(token, "VP@7875123");
    
    req.user = await USER.findById(decoded._id); // Change USER.findByID to USER.findById
    console.log(req.user)
    next();
  } else {
    res.render("login", { error: "" });
  }
};

app.get("/", authentication, (req, res) => {
//   console.log(req.user);
  res.status(200).render("success", { success: "You logged in successfully" , name:""});
});



app.get("/signup", (req, res)=>{ //if the success page will refresh then it will run
    res.render("signup",{done:""} )
})


app.post("/logedin", async(req, res)=>{
    const email = req.body.email
    const pass = req.body.pass

    const db_user = await USER.find({
        email:email,
    })

    if(db_user.length>0){

        if(db_user[0].email === email && db_user[0].password === pass){
            const userID = db_user[0]._id
            const token = JWT.sign({_id:userID}, "VP@7875123")

            res.cookie("token", token,{
                httpOnly:true,
                expires:new Date(Date.now()+60*5000),
            })
            logged = db_user[0].name
            res.status(200).render("success", {success:"You loged in successfully",name:"" })
        }
        else{
            res.render("login", {error:"Email/password is wrong"})
        }
    }else{
        res.render("login", {error:"User not found signup please"})
    }
})

app.get("/logedin", authentication, (req, res)=>{
    // console.log(req.user)
    res.render("success", {success:"You alrady loged in", name:"Hello "+req.user.name+", welcome back"})
})

app.get("/logout", (req, res)=>{
    logged = ""
    res.cookie("token", null, {
        httpOnly:true,
        expires:new Date(Date.now()),
    })

    res.redirect("/")
})


app.get("/users", async (req, res)=>{

    const data = await USER.find({
        name:logged //this is the filter
    })
    res.status(200).json({
        data,
    })
})

app.post("/contact", async(req, res)=>{
    const body = req.body 
    const email = req.body.email
    const user =  await USER.findOne({email})

    if(user){
        res.render("signup", {done:"email alrady exist please try to login"})
    }
    else{
        await USER.create({
            name:body.name,
            email:body.email,
            password:body.pass,
        })
        res.status(200).render("login", {error:"You can log in now"})
    }
})

app.listen(PORT, ()=>{
    console.log("server started")
})