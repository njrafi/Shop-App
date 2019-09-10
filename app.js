const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const mongoDbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flush = require("connect-flash");

const mongoDbUri =
	"mongodb+srv://njrafi:NodeJs1234@nodejscluster-zwpxh.mongodb.net/shop?retryWrites=true&w=majority";
const app = express();
const store = new mongoDbStore({
	uri: mongoDbUri,
	collection: "sessions"
});
const csrfProtection = csrf();

const errorController = require("./controllers/error");

const User = require("./models/user");
app.set("view engine", "ejs");
app.set("views", "views");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(
	bodyParser.urlencoded({
		extended: false
	})
);

app.use(express.static(path.join(__dirname, "public")));
app.use(
	session({
		secret: "my secret",
		resave: false,
		saveUninitialized: false,
		store: store
	})
);
app.use(csrfProtection);
app.use(flush());
app.use((req, res, next) => {
	if (!req.session.user) {
		return next();
	}

	User.findById(req.session.user._id)
		.then(user => {
			req.user = user;
			next();
		})
		.catch(err => console.log(err));
});
app.use((req, res, next) => {
	res.locals.isLoggedIn = req.session.isLoggedIn;
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorController.get404Page);

mongoose
	.connect(mongoDbUri, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(result => {
		console.log("connected to mongoDb Database");
		console.log("server started at port 3000");
		app.listen(3000);
	})
	.catch(err => console.log(err));
