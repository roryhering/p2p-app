import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import os from "node:os";
import dns from "node:dns";
import { Server } from "socket.io";
import QRCode from "qrcode";

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = 5000;

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public/index.html"));
});

// Create a random id for the session
const sessionId = Math.random().toString(36).substr(2, 9);
app.get(`/${sessionId}`, (req, res) => {
  res.sendFile(join(__dirname, "public/chat.html"));
});

// Serve static files
app.use(express.static(join(__dirname, "public")));

// Get the local IP address
dns.lookup(
  os.hostname(),
  {
    family: 4,
    hints: dns.ADDRCONFIG | dns.V4MAPPED,
  },
  (err, address) => {
    const url = `http://${address}:${port}/${sessionId}`;

    // Generate QR code and save it to a file
    QRCode.toFile(
      join(__dirname, "public/qrcode.png"),
      url,
      {
        width: 300,
        height: 300,
      },
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(`Scan the QR code to join the chat: ${url}`);
        console.log(`QR code generated and saved to public/qrcode.png`);
      }
    );
  }
);

// Socket.io
io.on("connection", (socket) => {
  socket.on("joined", (nickname) => {
    io.emit("joined", nickname);
  });

  socket.on("message", (data) => {
    io.emit("message", data);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
