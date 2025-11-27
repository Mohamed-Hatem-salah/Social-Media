import { connect } from 'mongoose';
import { userModel } from './model/user.model';


const connectDB = async ():Promise<void> => {
    try {
        const result = await connect(process.env.DB_URI as string, {
            serverSelectionTimeoutMS: 30000,
        });

        await userModel.syncIndexes();

        console.log(result.models);
        console.log("DB connected successfully 🚀");
    } catch (error) {
        console.log(`Failed to connect to DB ❌`);
        
    }
}

export default connectDB;