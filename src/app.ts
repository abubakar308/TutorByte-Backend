import express, { Application, Request, Response } from 'express';
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";

const app: Application = express();

app.use(express.json());

app.all("/api/auth/*", toNodeHandler(auth));

app.get('/', (req: Request, res: Response) => {
  res.send('TutorByte');
});

export default app;
