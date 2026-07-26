import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type {Request,Response} from "express";
import {UserModel} from "../model/User.js";
import dotenv from "dotenv";
dotenv.config();

interface SignupBody {
    username: string;
    password: string;
}

export const signup = async (
    req: Request<{}, {}, SignupBody>,
    res: Response
) => {
    try{
    const { username, password } = req.body;

    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({ username, password: hashedPassword });
    res.status(201).json({ message: "User created successfully" });

}catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }

}


export const login= async (req:Request<{}, {}, SignupBody>,res:Response)=>{

   try{
     const {username,password}= req.body;
    
    const existingUser= await UserModel.findOne({username});
    if(!existingUser){
        return res.status(400).json({message:"Invalid username or password"});
    }

    const isPasswordValid= await bcrypt.compare(password,existingUser.password);
    if(!isPasswordValid){
        return res.status(400).json({message:"Invalid username or password"});
    }

    const token = jwt.sign({userId:existingUser._id},process.env.JWT_SECRET as string,{expiresIn:"1h"});

    res.status(200).json({token});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
}