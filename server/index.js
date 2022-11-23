const express = require("express");
const app = express();
const { Pool } = require("pg");
const socketConnect = require("./socket");
const instructorModel = require("./requests");
const argon2 = require("argon2");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
/*
package needed to read .env which is
not on github repo to read pool info
*/
require("dotenv").config();

console.log("Script started");

const pool = new Pool({
  host: "ec2-18-215-41-121.compute-1.amazonaws.com",
  user: "raplhvqtreahld",
  port: "5432",
  password: "a1ff5f231dd2747ac645573e92b36c6861b2cec959cc12d8f22b672b7f976742",
  database: "d69760tlssr9rr",
  ssl: {
    require: true, // This will help you. But you will see nwe error
    rejectUnauthorized: false, // This line will fix new error
  },
});

const port = process.env.SERVERPORT || 8000;
app.use(cors());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      //  "default-src" used as fallback for any undeclared directives
      "default-src": ["'self'"],
      // i am using stripe api. if you have any script add it here
      "script-src": ["'self'", "'unsafe-inline'", "js.stripe.com"],
      // external css link here
      "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      "frame-src": ["'self'", "js.stripe.com"],
      "font-src": [
        "'self'",
        "fonts.googleapis.com",
        "fonts.gstatic.com",
        "res.cloudinary.com/",
      ],
      "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
    },
    reportOnly: true,
  })
);
app.use(express.json());
app.use(express.static("public"));

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers"
  );
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'unsafe-inline' 'self'; style-src  'unsafe-inline' 'self'; "
  );
  next();
});

// Routes
app.get("/users", (req, res) => {
  instructorModel
    .getUsers()
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

app.get("/courses", (req, res) => {
  instructorModel
    .getCourses()
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

// Vacations
app.get("/vacations", (req, res) => {
  instructorModel
    .getVacationsApproved(req)
    .then((response) => {
      console.log("Response: " + response);
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

app.get("/vacationsNotApproved", (req, res) => {
  instructorModel
    .getAllVacationsNotApproved(req)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

app.post("/create/user", async (req, res) => {
  const body = req.body;

  body.password = await argon2.hash(body.password, { type: argon2.argon2id });
  body.datejoined = new Date(body.datejoined).getTime();
  console.log(body);

  instructorModel
    .postAdmin(body)
    .then((response) => {
      console.log("Response: " + response);
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

app.post("/vacations", (req, res) => {
  instructorModel
    .postUser(req.body)
    .then((response) => {
      console.log("Response: " + response);
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

// Login
app.post("/login", (req, res) => {
  instructorModel
    .login(req.body)
    .then(async (response) => {
      const body = req.body;
      const password = body.password;
      const verified = await argon2.verify(response.rows[0].password, password);
      if (verified) {
        let user = {
          status: 200,
          username: response.rows[0].username,
          first_name: response.rows[0].first_name,
          last_name: response.rows[0].last_name,
          admin: response.rows[0].admin,
        };
        res.status(200).send(user);
      } else {
        res.status(401).send({ status: "401" });
        console.log("fail");
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send({ status: "500" });
    });
});

app.put("/vacations/:id", (req, res) => {
  instructorModel
    .approveVacation(req.body)
    .then((response) => {
      console.log("Response: " + JSON.stringify(response));
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

// Detailed Schedule
app.get("/detailedSchedule", (req, res) => {
  instructorModel
    .getCourseDetail(req.query.courseNum)
    .then((response) => {
      console.log("Response: " + response);
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

app.get("/resources", (req, res) => {
  instructorModel
    .getResources(req.query.date)
    .then((response) => {
      console.log("Response: " + response);
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

app.get("/", (req, res) => {
  res.sendStatus(200);
});

app.get("*", (req, res) =>
  res.sendFile(path.resolve(__dirname + "/public", "index.html"))
);

var server = app.listen(
  port,
  console.log(`Server is running on the port no: ${port}`)
);

socketConnect.socketStart(server, pool, instructorModel);
