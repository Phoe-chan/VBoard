var sqlite3 = require("sqlite3"), //.verbose();
    utils = require("./utils.js");

module.exports = {
  addActor : function(name, socket, io) {
    if (name) {
      var db = new sqlite3.Database("public/vboard.db");
      db.run("INSERT INTO actors ('name', 'stance', 'xPos', 'yPos') VALUES (?, 0, -1, -1)", [name], function(err) {
        if (err) {
          socket.emit("error", JSON.stringify({ message: "Failed to determine the identity of the new actor. Query returned error." + err }));
          return;
        }
        if (this.lastID) {
          var addedData = {id: this.lastID, name: name, stance: 0, xPos: -1, yPos: -1};
          io.sockets.emit("actorAdded", JSON.stringify(addedData));
        } else {
          socket.emit("error", JSON.stringify({ message: "Failed to add new actor. Likely a store issue or id collision." }));
        }
      });
      db.close();
    } else {
      socket.emit("error", JSON.stringify({ message: "Failed to add new actor. No name provided." }));
    }
  },

  deleteActor: function(id, name, socket, io) {
    if (id) {
      var index = namedActors.indexOf(name);
      if (index > -1) {    
        namedActors.splice(index, 1);
      }
  
      var db = new sqlite3.Database("public/vboard.db");
      db.run("DELETE FROM actors WHERE name = $name AND id = $id", { $name: name, $id: id }, function(err) {
        if (err) {
          socket.emit("error", JSON.stringify({ message: "Failed to delete actor. Query returned error." + err }));
          return;
        }
        if (this.changes == 1) {
          var deletedData = { id: id, name: name };
          io.sockets.emit("actorDeleted", JSON.stringify(deletedData));
        } else {
          socket.emit("error", JSON.stringify({ message: "Failed to delete actor. Delete resulted in " + this.changes + " changes." }));
        }
      });
      db.close();
    } else {
      socket.emit("error", JSON.stringify({ message: "Cannot delete actor, no id provided." }));
    }
  },

  moveActor: function(id, name, newX, newY, socket, io) {
    if (id) {
      if(!utils.isNumber(newX) || !utils.isNumber(newY)) {
        console.log("moveActor: Position data was not numeric.");
        socket.emit("error", JSON.stringify({ message: "Failed to update actor. The new positions were not valid numbers." }));
        return;
      }
      var db = new sqlite3.Database("public/vboard.db");
      db.run("UPDATE actors SET xPos = $xPos, yPos = $yPos WHERE name = $name AND id = $id", 
        { $xPos: newX, $yPos: newY, $name: name, $id: id }, 
        function(err) {
          if (err) {
            socket.emit("error", JSON.stringify({ message: "Failed to update actor. Query returned error." + err }));
            return;
          }
          if (this.changes == 1) {
            var movedData = { id: id, name: name, xPos: newX, yPos: newY };
            io.sockets.emit("actorMoved", JSON.stringify(movedData));
          } else {
            socket.emit("error", JSON.stringify({ message: "Failed to update actor. Update resulted in " + this.changes + " changes." }));
          }
        });
      db.close();
    } else {
      socket.emit("error", JSON.stringify({ message:"Cannot move actor: No id provided." }));
    }
  },

  getCurrentActorState: function(socket) {
    var db = new sqlite3.Database("public/vboard.db", "OPEN_READWRITE", function (error) {
      console.log(error);
    });
    db.all("SELECT id, name, stance, xPos, yPos FROM actors;", [], function(err, results) {
        if (err) {
          console.log("Error occurred during select.");
          socket.emit("error", JSON.stringify({ message: "Failed to retrieve actors. Query returned error." + err }));
          return;
        }
        if (results) {
          var actorData = [];
          for (var i = 0; i < results.length; i++) {
            actorData.push({ id: results[i].id, name: results[i].name, stance: results[i].stance, xPos: results[i].xPos, yPos: results[i].yPos });
          }
          socket.emit("actors", JSON.stringify(actorData));
        } else {
          socket.emit("error", JSON.stringify({ message: "Failed to retrieve actors. No actors were found." }));
        }
      });
    db.close();
  },

  updateStance: function(id, stance, socket, io) {
    if (id) {
      if (!utils.isNumber(stance) || (stance < 0 || stance > 3)) {
        stance = 1;
      }
      var db = new sqlite3.Database("public/vboard.db");
      db.run("UPDATE actors SET stance = $stance WHERE id = $id",
        { $stance:stance, $id:id }, 
        function(err) {
          if (err) {
            socket.emit("error", JSON.stringify({ message: "Failed to update the stance information for this actor." + err }));
            return;
          }
          if (this.changes == 1) {
            var changedData = {id: id, stance: stance};
            io.sockets.emit("stanceChanged", JSON.stringify(changedData));
          } else {
            socket.emit("error", JSON.stringify({ message: "Failed to update the single actor to their new stance." }));
          }
        });
      db.close();
    } else {
      socket.emit("error", JSON.stringify({ message: "Failed to change stance of actor, either no id or name provided." }));
    }
  }
};