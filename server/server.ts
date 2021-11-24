require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
import { Socket } from "socket.io";
const server = require("express")();

const http = require("http").createServer(server);

const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 8080;

const connectedGotchis = {};

io.on("connection", function (socket: Socket) {
  const userId = socket.id;

  console.log("A user connected: " + userId);
  connectedGotchis[userId] = { id: userId };

  socket.on("handleDisconnect", () => {
    socket.disconnect();
  });

  socket.on(
    "setGotchiData",
    (gotchi: {
      name: string;
      tokenId: string;
      hauntId: string;
      collateralAddress: string;
      numericTraits: Array<number>;
      equippedWearables: Array<number>;
    }) => {
      connectedGotchis[userId].gotchi = gotchi;
      const connectedIds = Object.keys(connectedGotchis);
      const playerCount = connectedIds.length;
      connectedGotchis[userId].player = playerCount;

      console.log(connectedGotchis);

      if (playerCount === 2) {
        io.emit("handleMatchMade", [
          connectedGotchis[connectedIds[0]].gotchi,
          gotchi,
        ]);
      }
    }
  );

  socket.on("moveLeft", (playerNo: 1 | 2) => {
    console.log(userId, "moveLeft");
    io.emit("handleMoveLeft", playerNo);
  });

  socket.on("moveRight", (playerNo: 1 | 2) => {
    console.log(userId, "moveRight");
    io.emit("handleMoveRight", playerNo);
  });

  socket.on("goIdle", (playerNo: 1 | 2) => {
    console.log(userId, "goIdle");
    io.emit("handleGoIdle", playerNo);
  });

  socket.on("jump", (playerNo: 1 | 2) => {
    console.log(userId, "jump");
    io.emit("handleJump", playerNo);
  });

  socket.on("boostDown", (playerNo: 1 | 2) => {
    console.log(userId, "boostDown");
    io.emit("handleBoostDown", playerNo);
  });

  socket.on("disconnect", function () {
    console.log("A user disconnected: " + userId);
    io.emit("handlePlayerDisconnect");
    delete connectedGotchis[userId];
  });
});

http.listen(port, function () {
  console.log(`Listening on - PORT:${port}`);
});
