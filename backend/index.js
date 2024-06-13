const express = require('express');
const cors = require('cors')
require('./db/config');
const User = require("./db/Users")
const Products = require("./db/Products")
const jwt = require('jsonwebtoken')

const jwtKey = 'e-comm';

const app = express();
app.use(express.json())
app.use(cors());
app.post("/register",async(req,resp)=>{
    let users = new User(req.body);
    let result = await users.save();
    result = result.toObject();
    delete result.password;
    //resp.send(result)

    jwt.sign({result}, jwtKey, {expiresIn: "2777h"}, (err,token)=>{
        if(err){
            resp.sendStatus({result:"No result found something went wrong"})
        }
        resp.send({result,auth:token});
    })

})

app.post("/add-product",async(req,resp)=>{
    let product =new Products(req.body);
    let result =await product.save();
    resp.send(result);
})

app.get("/products",async(req,resp)=>{
    let product = await Products.find();
    if(product.length>0){
        resp.send(product)
    }else{
        resp.send({result:"No product found"})
    }
})


app.post("/login",async (req,resp)=>{
    let user = await User.findOne(req.body).select("-password");
    console.log(req.body);
    if(req.body.email && req.body.password){
    if(user){
        jwt.sign({user}, jwtKey, {expiresIn: "2777h"}, (err,token)=>{
            if(err){
                resp.sendStatus({result:"No user found something went wrong"})
            }
            resp.send({user,auth:token});
        })
        
    }else{
        resp.send({result:'No user found'})
    }
   
}else{
    resp.send({result:'No user found'})
}
   
})

app.delete("/product/:id",async(req,resp)=>{
   
    const result = await Products.deleteOne({_id:req.params.id});
    resp.send(result)
});

app.get("/product/:id",async(req,resp)=>{
    let result = await Products.findOne({_id:req.params.id});
    if(result){
        resp.send(result)
    }else{
        resp.send({result:"No result found"})
    }
  
})

app.put("/product/:id", async (req,resp)=>{
    let result = await Products.updateOne(
        {_id: req.params.id},
        {
            $set : req.body
        })
        resp.send(result)
});

app.get("/search/:key",verifyToken,async(req,resp)=>{
    let result =await Products.find({
        "$or": [
            {name:{$regex:req.params.key}},
            {category:{$regex:req.params.key}},
            {company:{$regex:req.params.key}}
        ]
    });
    resp.send(result);
});

function verifyToken(req,resp,next){
    let token = req.headers['authorization'];
    if(token){
        token = token.Split(' ')[1];
        console.warn("middlewear called if",token);
        jwt.JsonWebTokenError.verify(token, jwtKey,(err,valid)=>{
            if(err){
                resp.send({result : "please Provide valid token"})
            }else{
                next();
            }
        })
    }else{
        resp.send({result : "please add token with header"})

    }
   // console.warn("middlewear called",token);
    next();
}

app.listen(5000);