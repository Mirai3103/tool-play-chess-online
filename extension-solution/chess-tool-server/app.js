import express, { json } from "express";

import { createServer } from "http";

import crypto from "crypto";
import { Server } from "socket.io";
import Stockfish from "./stockfish.js";
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});
app.use(json());
app.get("/", (req, res) => {
    res.json({ message: "Hello World" });
});
io.on("connection", (socket) => {
    if (socket.stockfish) {
        console.log("a user connected with stockfish");
        initEvent(socket);
    } else {
        console.log("a user connected");
    }
});

io.use(function (socket, next) {
    var handshakeData = socket.handshake.query;
    const { depth, hash, threads, level } = handshakeData;
    console.log({ depth, hash, threads, level });
    const stockfish = new Stockfish();
    stockfish.depth = depth;
    stockfish.hash = hash;
    stockfish.threads = threads;
    stockfish.level = level;
    stockfish.start();
    socket.stockfish = stockfish;
    next();
});
server.listen(3000, () => {
    console.log("listening on *:3000");
});

function initEvent(socket) {
    socket.on("getBestMove", async (...args) => {
        const pgnMoves = args[0];
        const callback = args[1];
        if (!pgnMoves) return "";
        const bestMove = await socket.stockfish.getBestMove(pgnMoves);
        callback?.(bestMove);
    });
    socket.on("disconnect", () => {
        socket.stockfish.stop();
    });
    socket.on("config", (...args) => {
        const config = args[0];
        const { depth, hash, threads, level } = config;
        socket.stockfish.setOptions({ depth, hash, threads, level });
        console.log({ depth, hash, threads, level });
    });
}
