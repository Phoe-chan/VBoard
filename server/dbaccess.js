var sqlite3 = require("sqlite3"), //.verbose();
    utils = require("./utils.js");

module.exports = {
  addActor : function(name, boardId, socket, io) {
    if (name) {
      if (!boardId) {
        socket.emit("error", JSON.stringify({ message: "No board ID was provided with the actor creation. Cannot proceed." }));
        return;
      }
      var db = new sqlite3.Database("public/vboard.db", "OPEN_READWRITE", function (error) {
        console.log(error);
        socket.emit("error", JSON.stringify({ message: "Failed to open database." }));
        return;
      });
      db.run("INSERT INTO actors ('name', 'boardId', 'stance', 'xPos', 'yPos') VALUES (?, ?, 0, -1, -1)", [name, boardId], function(err) {
        if (err) {
          socket.emit("error", JSON.stringify({ message: "Failed to add new actor. Query returned error." + err }));
          return;
        }
        if (this.lastID) {
          var addedData = {id: this.lastID, name: name, boardId: boardId, stance: 0, xPos: -1, yPos: -1};
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

  deleteActor: function(id, name, boardId, socket, io) {
    if (id) {
      var db = new sqlite3.Database("public/vboard.db", "OPEN_READWRITE", function (error) {
        console.log(error);
        socket.emit("error", JSON.stringify({ message: "Failed to open database." }));
        return;
      });
      db.run("DELETE FROM actors WHERE name = $name AND id = $id", { $name: name, $id: id }, function(err) {
        if (err) {
          socket.emit("error", JSON.stringify({ message: "Failed to delete actor. Query returned error." + err }));
          return;
        }
        if (this.changes == 1) {
          var deletedData = { id: id, boardId: boardId, name: name };
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

  moveActor: function(id, name, boardId, newX, newY, socket, io) {
    if (id) {
      if(!utils.isNumber(newX) || !utils.isNumber(newY)) {
        console.log("moveActor: Position data was not numeric.");
        socket.emit("error", JSON.stringify({ message: "Failed to update actor. The new positions were not valid numbers." }));
        return;
      }
      var db = new sqlite3.Database("public/vboard.db", "OPEN_READWRITE", function (error) {
        console.log(error);
        socket.emit("error", JSON.stringify({ message: "Failed to open database." }));
        return;
      });
      db.run("UPDATE actors SET xPos = $xPos, yPos = $yPos WHERE name = $name AND id = $id", 
        { $xPos: newX, $yPos: newY, $name: name, $id: id }, 
        function(err) {
          if (err) {
            socket.emit("error", JSON.stringify({ message: "Failed to update actor. Query returned error." + err }));
            return;
          }
          if (this.changes == 1) {
            var movedData = { id: id, name: name, boardId: boardId, xPos: newX, yPos: newY };
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

  getCurrentActorState: function(boardId, socket) {
    if (!boardId) {
        socket.emit("error", JSON.stringify({ message: "No boardId provided when asking for Actor State. Cannot process.." }));
        return;
    }
    var db = new sqlite3.Database("public/vboard.db", "OPEN_READ", function (error) {
      console.log(error);
      socket.emit("error", JSON.stringify({ message: "Failed to open database." }));
      return;
    });
    db.all("SELECT id, name, stance, xPos, yPos FROM actors WHERE boardId = ?;", [boardId], function(err, results) {
        if (err) {
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

  updateStance: function(id, stance, boardId, socket, io) {
    if (id) {
      if (!utils.isNumber(stance) || (stance < 0 || stance > 3)) {
        stance = 1;
      }
      var db = new sqlite3.Database("public/vboard.db", "OPEN_READWRITE", function (error) {
        console.log(error);
        socket.emit("error", JSON.stringify({ message: "Failed to open database." }));
        return;
      });
      db.run("UPDATE actors SET stance = $stance WHERE id = $id",
        { $stance:stance, $id:id }, 
        function(err) {
          if (err) {
            socket.emit("error", JSON.stringify({ message: "Failed to update the stance information for this actor." + err }));
            return;
          }
          if (this.changes == 1) {
            var changedData = {id: id, boardId: boardId, stance: stance};
            io.sockets.emit("stanceChanged", JSON.stringify(changedData));
          } else {
            socket.emit("error", JSON.stringify({ message: "Failed to update the single actor to their new stance." }));
          }
        });
      db.close();
    } else {
      socket.emit("error", JSON.stringify({ message: "Failed to change stance of actor, either no id or name provided." }));
    }
  },
  
  getBoards: function(callback) {
    var db = new sqlite3.Database("public/vboard.db", "OPEN_READ", function (error) {
      console.log(error);
      callback({ vBoardError: "Failed to open database." });
      return;
    });
    db.all("SELECT id, mapName FROM boards;", [], function(err, results) {
      if (err) {
        callback ({ vBoardError: "Failed to retrieve boards. Query returned error." +err});
        return;
      }
      if (results) {
        var boardData = [];
        for (var i = 0; i < results.length; i++) {
          boardData.push({ id: results[i].id, mapName: results[i].mapName });
        }
        callback(boardData);
      } else {
        callback({ vBoardError: "Failed to retrieve boards. No boards were found." });
      }
    });
    db.close();
  },

  getBoardProperties: function(boardId, callback, errorCallback) {
    var db = new sqlite3.Database("public/vboard.db", "OPEN_READ", function (error) {
      console.log(error);
      errorCallback({ vBoardError: "Failed to open database." });
      return;
    });
    db.all("SELECT id, mapName FROM boards WHERE id = ?;", [boardId], function(err, results) {
      if (err) {
        errorCallback ({ vBoardError: "Failed to retrieve board properties. Query returned error." +err});
        return;
      }
      if (results) {
        var boardData;
        if (results.length != 1) {
          errorCallback({vBoardError: "Did not retrieve a unique board from the database, primary key failure."});
          return;
        } else {
          boardData = ({ id: results[0].id, mapName: results[0].mapName });
        }
        callback(boardData);
      } else {
        errorCallback({ vBoardError: "Failed to retrieve board. No board with that id was found." });
      }
    });
    db.close();
  },

  addBoard: function(mapName, callback) {
    if (!mapName) {
      callback({ vBoardError: "No map name provided, cannot create board." });
      return;
    }
    var db = new sqlite3.Database("public/vboard.db", "OPEN_READWRITE", function (error) {
      console.log(error);
      callback({ vBoardError: "Failed to open database." });
      return;
    });

    db.run("INSERT INTO boards ('mapName') VALUES (?)", [mapName], function(err) {
      if (err) {
        callback({ vBoardError: "Failed to determine the identity of the new board. Query returned error." + err });
        return;
      }
      if (this.lastID) {
        callback({id: this.lastID, name: mapName });
      } else {
        callback({ vBoardError: "Failed to add new board." });
      }
    });
    db.close();
  },

  deleteBoard: function(id, callback) {
    if (id) {
      var db = new sqlite3.Database("public/vboard.db", "OPEN_READWRITE", function (error) {
        console.log(error);
        callback({ vBoardError: "Failed to open database." });
        return;
      });
      db.run("DELETE FROM boards WHERE id = $id", { $id: id }, function(err) {
        if (err) {
          callback({ vBoardError: "Failed to delete board. Query returned error." + err });
          return;
        }
        if (this.changes == 1) {
          callback({ vBoardSuccess: "Deleted board id " + id });
        } else {
          callback({ vBoardError: "Failed to delete board. Delete resulted in " + this.changes + " changes." });
        }
      });
      db.close();
    } else {
      callback({ vBoardError: "Cannot delete board, no id provided." });
    }
  }
};
