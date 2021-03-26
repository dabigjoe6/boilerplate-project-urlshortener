require("dotenv").config();

const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");

try {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
} catch (e) {
  console.warn(e);
}

// Basic Configuration
const port = process.env.PORT || 3000;

const getRandom = () => {
  return Math.random().toString(36).substring(3);
};

app.use(cors());

app.use(bodyParser());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

let urlSchema = new mongoose.Schema({
  original: String,
  short: String,
});

let UrlModel = new mongoose.model("URL", urlSchema);

app.post("/api/shorturl/new", async (req, res) => {
  let url = req.body.url;

  const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
  if (!regex.test(url)) {
    res.status(400).json({
      error: "invalid url",
    });
  }

  let shortUrl = null;

  while (!shortUrl) {
    let random = getRandom();
    isExist = await UrlModel.exists({ short: random });
    if (!isExist) {
      shortUrl = random;
    }
  }

  let newUrl = new UrlModel({
    short: shortUrl,
    original: url,
  });

  await newUrl.save();

  res.json({
    original_url: url,
    short_url: shortUrl,
  });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  let shortUrl = req.params.short_url;
  try {
    let url = await UrlModel.findOne({ short: shortUrl });
    if (url) {
      res.status(301).redirect(url.original);
    } else {
      res.json({ error: "URL doesn't exist" });
    }
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
