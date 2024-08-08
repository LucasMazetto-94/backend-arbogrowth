require("dotenv").config({ path: "variaveis.env" });
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const routes = require("./routes");

const corsOptions = {
  origin: "http://localhost:3000", // Substitua por seu domínio frontend
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Habilita cookies
};

const server = express();
server.use(cors(corsOptions));
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use("/uploads", express.static("src/uploads"));

server.use("/api", routes);

server.listen(process.env.PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${process.env.PORT}`);
});
