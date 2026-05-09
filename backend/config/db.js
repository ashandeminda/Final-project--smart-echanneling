import mongoose from "mongoose";

const connectDB = async () => {
  await mongoose.connect(
    `${process.env.MONGO_LOCAL_URL}/doctorapp`
  );
  console.log("MongoDB Connected");
};

export default connectDB;