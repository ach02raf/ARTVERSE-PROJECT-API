require("dotenv").config();
require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var morgan = require("morgan"); //morgan--dev return in cmd api source
var helmet = require("helmet"); //cashe source request
const { default: mongoose } = require("mongoose");
const connectDB = require("./DataBase/BD");
const bodyParser = require("body-parser");

var app = express();

const UserRoutes = require("./routes/users");

const PostRoutes = require("./routes/Posts");
const SingleRoutes = require("./routes/Single");
const ProjectRouts = require("./routes/projects");
const ChallengetRouts = require("./routes/Challenge");

const cors = require("cors");

var fs = require("fs");
var path = require("path");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set EJS as templating engine
app.set("view engine", "ejs");

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/User", cors(), UserRoutes);

app.use("/Posts", cors(), PostRoutes);
app.use("/Single", cors(), SingleRoutes);
app.use("/Project", cors(), ProjectRouts);
app.use("/Challenge", cors(), ChallengetRouts);

mongoose.set("strictQuery", false);
connectDB();

app.get("/", (rep, res) => {
  res.send("insaid server");
});
const port = process.env.PORT || 5000;

app.listen(port, () => console.log("server is up and running => ", port));
