// SETUP ENV
import { resolve } from 'node:path';
import { config } from 'dotenv';
config({ path: resolve('./config/.env.development') });

// load EXPRESS and express types
import express from 'express';
import type { Request, Express, Response } from 'express';

// third party middlewares
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

// module routing

import { BadRequistException, globalErrorHandling } from './utils/response/error.response';
import connectDB from './DB/connection.db';
import { createGetPreSignedUpLink, getFile } from './utils/multer/s3.config';


import { promisify } from 'node:util';
import { pipeline } from 'node:stream';
import { authRouter, postRouter, userRouter } from './modules';
const createS3WriteStreamPipe = promisify(pipeline)


// handle base rate limit on all api requestes
const limiter = rateLimit({
    windowMs: 60 * 60000,
    max: 2000,
    message: { error: 'Too many requests from this IP, please try again after an hour' },
    statusCode: 429,
});


// app start-point
const bootstrap = async (): Promise<void> => {

    const app: Express = express();
    const port: number | string = process.env.PORT || 5000;

    // global middleware
    app.use(cors());
    app.use(express.json());
    app.use(helmet());
    app.use(limiter);



    app.get('/events', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
    
        setInterval(() => {
            res.write(`data: ${JSON.stringify({ message: 'New event!' })}\n\n`);
        }, 2000);
    });



    // app-routing
    app.get('/', (req: Request, res: Response) => {
    //     setTimeout(() => {
    //         res.json({ message: `Welocme to ${process.env.APPLICATION_NAME} backend landing page 💖` });
    //     })
    // }, 5000);
     res.json({ message: `Welocme to ${process.env.APPLICATION_NAME} backend landing page 💖` });
        })

    // sub-app-routing-modules
    app.use("/auth", authRouter)
    app.use("/user", userRouter)
    app.use("/post", postRouter)


    // Get assets
    app.get("/upload/pre-signed/*path", async (req: Request, res: Response): Promise<Response> => {
        const { downloadName, download = "false", expiresIn = 120 } = req.query as { downloadName?: string, download?: string, expiresIn?: number }
        const { path } = req.params as unknown as { path: string[] };
        const Key = path.join("/");
        const url = await createGetPreSignedUpLink({ Key, downloadName: downloadName as string, download, expiresIn });
        return res.json({ message: "Done", data: { url } })
    })
    app.get("/upload/*path", async (req: Request, res: Response): Promise<void> => {
        const { downloadName, download = false } = req.query as { downloadName?: string, download?: string }
        const { path } = req.params as unknown as { path: string[] };
        const Key = path.join("/");
        const s3Responce = await getFile({ Key });
        console.log(s3Responce.Body);
        if (!s3Responce?.Body) {
            throw new BadRequistException("fail to fetch this asset")
        }


        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Content-type", `${s3Responce.ContentType || "application/octet-stream"}`);

        if (download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${downloadName || Key.split("/").pop()}"`);
        }

        return await createS3WriteStreamPipe(s3Responce.Body as NodeJS.ReadableStream, res);
    })


    // In-valid routing
    app.use("{/*dummy}", (req: Request, res: Response) => {
        return res.status(404).json({ message: 'In-valid application routing plz check  the method and url ❌' });
    })

    // global error handling
    app.use(globalErrorHandling)

    // DB
    await connectDB();


    // Hooks
    // async function test() {
    //     try {
    //         const user = new userModel({
    //             username: "moghj fndsjm",
    //             email: `${Date.now()}@gmail.com`,
    //             password: "de5rf6g7yh"
    //         })
    //         await user.save()
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }
    // test()

    // start server
    app.listen(port, () => {
        console.log(`Server is running on port :::${port} 🚀`);
    });
}

export default bootstrap;