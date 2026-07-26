import mongoose from "mongoose";
const  mongUri =process.env.MONGO_URI as string;

export const dbConnect= async ()=>{
    try{
        await mongoose.connect(mongUri);
        
        console.log("MongoDB Connected Successfully")
    }
    catch(error){
        console.error(error);
        console.log("MongoDB failed to Connect.");
        process.exit(1);
    }
}