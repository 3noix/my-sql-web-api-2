import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import cors from "cors";
import {createExpressMiddleware} from "@trpc/server/adapters/express";
import {router} from "./router";


const app = express();
app.use(express.json({limit: "50MB"}));
app.use(bodyParser.json({limit: "50MB"}));
app.use(helmet());
app.use(cors());


app.use("/", createExpressMiddleware({
	router: router,
	createContext: () => ({})
}));


const port = 3000;
const server = app.listen(port, () => {
	console.log(`API server running. Access it from http://localhost:${port}`)
});

