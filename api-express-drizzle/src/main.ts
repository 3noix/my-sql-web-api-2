import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import cors from "cors";
import {createExpressMiddleware} from "@trpc/server/adapters/express";
import {applyWSSHandler} from "@trpc/server/adapters/ws";
import {router} from "./router";
import ws from "ws";
import {env} from "./environment";


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
const onHttpServerListening = () => {console.log(`API HTTP server running on http://localhost:${port}`)};
const onWsServerListening   = () => {console.log(`API WS server listening on ws://localhost:${port}`)};
const onWsConnectionOpening = () => {if (env.trpc.logWsConnectionOpening) {console.log(`++ Connection (${wsServer.clients.size})`);}};
const onWsConnectionClose   = () => {if (env.trpc.logWsConnectionClose)   {console.log(`-- Connection (${wsServer.clients.size})`);}};

const httpServer = app.listen(port, onHttpServerListening);
const wsServer = new ws.Server({server: httpServer});

const handler = applyWSSHandler({
	wss: wsServer,
	router: router,
	createContext: () => ({})
});
wsServer.on("connection", ws => {
	onWsConnectionOpening();
	ws.once("close", onWsConnectionClose);
});
onWsServerListening();

process.on("SIGTERM", () => {
	console.log("SIGTERM");
	handler.broadcastReconnectNotification();
	wsServer.close();
});

