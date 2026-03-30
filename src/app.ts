import express, { Application, Request, Response } from 'express';
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { IndexRoutes } from './app/routes';

const app: Application = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://tutorbyte.vercel.app",
    ],
    credentials: true,
  })
);

app.use("/api/v1", IndexRoutes);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.get('/', (req: Request, res: Response) => {
  res.send('TutorByte');
});

export default app;
