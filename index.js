var express = require('express');
const app = express();

const request = require('request');

var passwordHash = require("password-hash");
const bodyParser = require('body-parser')
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: false}));


app.use(express.static("public"));
const port = 3000

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Filter} = require('firebase-admin/firestore');

var serviceAccount = require("./key.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
app.set("view engine", "ejs");

app.get("/", (req,res) => {
    res.render('home');
})

app.get("/signin", (req,res) => {
    res.render('signin');
})


    app.post("/signupsubmit", function(req, res) {
        console.log(req.body);
        db.collection("personalData")
            .where(
                Filter.or(
                    Filter.where("email", "==", req.body.email),
                    Filter.where("user_name", "==", req.body.user_name)
                )
            )
            .get()
            .then((docs) => {
                if (docs.size > 0) {
                    res.send("Hey, this account already exists with the email and username.");
                } else {
                    db.collection("personalData")
                        .add({
                            user_name: req.body.user_name,
                            email: req.body.email,
                            password: passwordHash.generate(req.body.password),
                        })
                        .then(() => {
                            res.redirect("/signin");
                        })
                        .catch(() => {
                            res.send("Something Went Wrong");
                        });
                }
            });
    });


    app.post("/signinsubmit", (req, res) => {
        const email = req.body.email;
        const password = req.body.password;
        console.log(email)
        console.log(password)
      
        db.collection("personalData")
          .where("email", "==", email)
          .get()
          .then((docs) => {
            if (docs.empty) {
              res.send("User not found");
            } else {
              let verified = false;
              docs.forEach((doc) => {
                verified = passwordHash.verify(password, doc.data().password);
              });
              if (verified) {
                res.redirect('/dashboard');
              } else {
                res.send("Authentication failed");
              }
            }
          })
          .catch((error) => {
            console.error("Error querying Firestore:", error);
            res.send("Something went wrong.");
          });
      });


app.get("/signup", (req, res) => {
    res.render('signup'); 
});

app.get("/home", (req, res) => {
    res.render('home'); 
});

app.get("/dashboard", (req, res) => {
    res.render('dashboard'); 
});

app.get("/logout", (req, res) => {
    res.render('logout'); 
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
