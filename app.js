var express = require("express")
  , routes = require("./routes")
  , http = require("http")
  , path = require("path")
  , sio = require("socket.io")
  , check = require("validator").check
  , sanitise = require("validator").sanitize
  , dbaccess = require("./server/dbaccess.js");

var app = express();

app.configure(function(){
  app.set("port", process.env.PORT || 3000);
  app.set("views", __dirname + "/views");
  app.set("view engine", "ejs");
  app.use(express.favicon(__dirname + "/public/favicon.ico", { maxAge: 2592000000 }));
  app.use(express.logger("dev"));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require("stylus").middleware(__dirname + "/public"));
  app.use(express.static(path.join(__dirname, "public")));
});

app.configure("development", function(){
  app.use(express.errorHandler());
});

app.get("/", routes.index);
app.get("/board/", routes.index);
app.get("/board/:boardId", routes.board);
app.post("/board/:mapName", routes.addboard);
app.delete("/board/:boardId", routes.deleteboard);
app.get("/boards/", routes.boardlist);
app.get("/images/", routes.imagelist);

var server = http.createServer(app).listen(app.get("port"), function(){
  console.log("Express server listening on port " + app.get("port"));
});
var io = sio.listen(server, { log: false });

io.sockets.on("connection", function (socket) {
  socket.on("error", function (data) {
    console.log(data.message);
  });
  socket.on("initialState", function (data) {
    //client has requested initial update, respond with an "actors" message.
    dbaccess.getCurrentActorState(socket);
  });
  socket.on("newActor", function (messageBody) {
    // add new actor
    var clean = sanitise(messageBody.name).xss();
    clean = sanitise(clean).entityEncode();
    dbaccess.addActor(clean, socket, io);
  });
  socket.on("deleteActor", function (messageBody) {
    // delete actor
    check(messageBody.id).isInt();
    dbaccess.deleteActor(messageBody.id, messageBody.name, socket, io);
    }
  });
  socket.on("moveActor", function (messageBody) {
    // update repository with new position data
    check(messageBody.id).isInt();
    dbaccess.moveActor(messageBody.id, messageBody.name, messageBody.xPos, messageBody.yPos, socket, io);
  });
  socket.on("changeStance", function (messageBody) {
    // update repository with new stance for character
    check(messageBody.id).isInt();
    check(messageBody.stance).isInt();
    dbaccess.updateStance(messageBody.id, messageBody.stance, socket, io);
  });
});
