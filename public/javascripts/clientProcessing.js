// draggable.handle('selector') - restrict dragging to just the designated element.
//          .scroll(bool) .scrollsensitivity(int) .scrollspeed(int) - on, threshold distance from edge, speed
//          .stack(bool) zindex(int) - bring to front when dragging, manually set the zindex 
$(document).ready(function(){
  var socket = io.connect();
  socket.on('connect', function (data) {
    updateLog("Connected");
  });
  socket.on('disconnect', function (data) {
    updateLog("Disconnected", 1);
  });
  socket.on('error', function (data) {
    var messageBody = JSON.parse(data);
    updateLog(messageBody.message, 1);
  });
  socket.on("actors", function (data) {
    //update the pieces into their initial positions here here;
    var messageArray = JSON.parse(data);
    updateLog("Initial update, "+ messageArray.length +" elements received.");
    for (var i = 0; i < messageArray.length; i++) {
      if (messageArray[i].xPos == -1 || messageArray[i].yPos == -1) {
        //this one is in the toolbox. No positioning.
        var newActor = createActor(messageArray[i].id, messageArray[i].name, "inToolBox");
        $("#actors").append(newActor);
      } else {
        var newActor = createActor(messageArray[i].id, messageArray[i].name, "onMap");
        $("#map").append(newActor);
        var posSet = $("#" + messageArray[i].id);
        posSet.css({top: messageArray[i].yPos, left: messageArray[i].xPos});
      }
      $("#" + messageArray[i].id).data("xPos", messageArray[i].xPos);
      $("#" + messageArray[i].id).data("yPos", messageArray[i].yPos);
      $("#" + messageArray[i].id).data("name", messageArray[i].name);
      $("#" + messageArray[i].id).data("stance", messageArray[i].stance);
      $("#" + messageArray[i].id).draggable({ revert: "invalid", snap: true, cancel: ".stanceControl" });
      $("#" + messageArray[i].id + "_" + messageArray[i].stance).addClass("lit");
      $("#" + messageArray[i].id).children(".stanceControl").click({ dispatch: socket }, stanceChangeHandler);
    }
  });
  socket.on("actorAdded", function (data) {
    var messageBody = JSON.parse(data);
    var boardId = $("input#boardId").val();
    if(!boardId == messageBody.boardId) {
      return;
    }
    updateLog("Adding actor " + messageBody.name);
    //Add new actor to the toolbox, then add message to the log.
    var newActor = createActor(messageBody.id, messageBody.name, "inToolBox");
    $("#actors").append(newActor);
    $("#" + messageBody.id).data("xPos", messageBody.xPos);
    $("#" + messageBody.id).data("yPos", messageBody.yPos);
    $("#" + messageBody.id).data("name", messageBody.name);
    $("#" + messageBody.id).data("stance", messageBody.stance);
    $("#" + messageBody.id).draggable({ revert: "invalid", snap: true, cancel: ".stanceControl"  });
    $("#" + messageBody.id + "_" + messageBody.stance).addClass("lit");
    $("#" + messageBody.id).children(".stanceControl").click({ dispatch: socket }, stanceChangeHandler);
  });
  socket.on("actorDeleted", function (data) {
    var messageBody = JSON.parse(data);
    updateLog("Deleting actor " + messageBody.name);
    //locate the actor involved and delete it, then add a message to the log.
    var deleteActor = $("#" + messageBody.id);
    if (!deleteActor) {
      return;
    }
    $("#" + messageBody.id).hide('explode', {}, 600, function() { 
      $("#" + messageBody.id).remove; 
    });
  });
  socket.on("actorMoved", function (data) {
    //locate the actor involved and update it, then add a message to the log.
    var messageBody = JSON.parse(data);
    updateLog("Updating actor " + messageBody.name);
  
    var activeActor = $("#" + messageBody.id);
    if (activeActor)
    {
      var stance = activeActor.data("stance");
      var name = activeActor.data("name");

      if (messageBody.xPos == -1 || messageBody.yPos == -1) {
        // command to move it into the toolbox.
        if (activeActor.data("xPos") == -1 || activeActor.data("yPos") == -1) {
          // it is presently in the toolbox. We need do nothing.
        } else {
          // it is presently on the map, must remove it and add it to the toolbox
          activeActor.remove();
          var newActor = createActor(messageBody.id, messageBody.name, "inToolBox");
          $("#actors").append(newActor);
          activeActor = $("#" + messageBody.id);
          activeActor.data("xPos", -1);
          activeActor.data("yPos", -1);
          activeActor.data("name", name);
          activeActor.data("stance", stance);
          $("#" + messageBody.id + "_" + activeActor.data("stance")).addClass("lit");
          activeActor.children(".stanceControl").click({ dispatch: socket }, stanceChangeHandler);
          activeActor.draggable({ revert: "invalid", snap: true, cancel: ".stanceControl" });
        }
      } else {
        // command to move it on the map.
        if (activeActor.data("xPos") == -1 || activeActor.data("yPos") == -1) {
          // it is presently in the toolbox. Must remove it and add it to the map.
          activeActor.remove();
          var newActor = createActor(messageBody.id, messageBody.name, "onMap");
          $("#map").append(newActor);
          activeActor = $("#" + messageBody.id);
          activeActor.children(".stanceControl").click({ dispatch: socket }, stanceChangeHandler);
          activeActor.draggable({ revert: "invalid", snap: true, cancel: ".stanceControl" });
          $("#" + messageBody.id + "_" + stance).addClass("lit");
        } else {
          // it is presently on the map, we must move it.
          activeActor = $("#" + messageBody.id);
        }
        // set actual display coordinates
        activeActor.css({ top: messageBody.yPos, left: messageBody.xPos });
      }
      activeActor.data("xPos", messageBody.xPos);
      activeActor.data("yPos", messageBody.yPos);
      activeActor.data("name", messageBody.name);
      activeActor.data("stance", stance);
    } else {
      // Could not find the actor being moved, this is valid if the actor is on another map.
      //updateLog("Error: Could not find the actor being moved: " + messageBody.name, 1);
    }
  });
  socket.on("stanceChanged", function (data) {
    var messageBody = JSON.parse(data);
    var activeActor = $("#" + messageBody.id);
    if (!activeActor) {
      return;
    }
    updateLog("Actor " + activeActor.data("name") + " changed stance from " + activeActor.data("stance") + " to " + messageBody.stance);
    $("#" + messageBody.id + "_" + activeActor.data("stance")).removeClass("lit");
    $("#" + messageBody.id + "_" + messageBody.stance).addClass("lit");
    activeActor.data("stance", messageBody.stance);
  });
  
  stretchScreen()

  $("#map").droppable( { greedy: true, accept: ".actor", tolerance: "fit" } );
  $("#map").bind("drop", function(event, ui) {
    //emit event for the element's move
    var dragName = ui.draggable.data("name");
    var dropPos = ui.draggable.offset()
    var mapPos = $(this).offset();
    var yOffset = dropPos.top - mapPos.top;
    yOffset = Math.floor(yOffset / 50) * 50;
    var xOffset = dropPos.left - mapPos.left;
    xOffset = Math.floor(xOffset / 50) * 50;
    socket.emit("moveActor", { id : ui.draggable.attr("id"), name: dragName, xPos: xOffset, yPos: yOffset });
  });
  $("#trash").droppable( { greedy: true, accept: ".actor", tolerance: "pointer" } );
  $("#trash").bind("drop", function(event, ui) {
    //emit event for the element's deletion
    var dragName = ui.draggable.data("name");
    socket.emit("deleteActor", { id : ui.draggable.attr("id"), name: dragName });
  });
  $("#actors").droppable( { greedy: true, accept: ".actor", tolerance: "pointer" } );
  $("#actors").bind("drop", function(event, ui) {
    //emit event moving the element back into the storage tray
    var dragName = ui.draggable.data("name");
    socket.emit("moveActor", { id: ui.draggable.attr("id"), name: dragName, xPos: -1, yPos: -1 });
  });

  $("#actorName").watermark("New Actor Name");
  $("#addButton").click(function() {
    var newName = $("#actorName").val();
    $("#actorName").val("");
    var boardId = $("input#boardId").val();
    socket.emit("newActor", { name: newName, boardId: boardId });
  });

  var mapImage = $("input#mapName").val();
  $("#map").css("background-image", "url('/images/" + mapImage + "')");

  updateLog("Requesting initial state.");
  var boardId = $("input#boardId").val();
  socket.emit("initialState", { boardId : boardId });
});

function createActor(id, name, positionClass) {
  return "<div id='" + id + "' class='actor " + positionClass + "'><div class='dragHandle'>" + name + "</div><div class='stanceControl forward' id='" + id + "_0'>F</div><div class='stanceControl balanced' id='" + id + "_1'>B</div><div class='stanceControl defensive' id='" + id + "_2'>D</div><div class='stanceControl ranged' id='" + id + "_3'>R</div></div>";
}

function stanceChangeHandler(event) {
    var ident = this.id.split("_");
    var actorid = ident[0];
    var stanceid = ident[1];
    var socket = event.data.dispatch;
    socket.emit("changeStance", { id:actorid, stance:stanceid } );
}

function updateLog(message, type) {
  type = type || 0;
  var messageClass = "logMsg";
  if (type == 1) {
    messageClass = "logError";
  }
  var time = new Date();
  $("#log").prepend("<div><div class='timestamp'>" 
    + ("00" + time.getHours()).slice(-2) + ":" 
    + ("00" + time.getMinutes()).slice(-2) + ":" 
    + ("00" + time.getSeconds()).slice(-2)
    + "</div><div class='" + messageClass + "'>" + message + "</div></div>");
  $("#log").children().filter(':gt(4)').remove();
}

function setMapWidth() {
  var pageWidth = $("#main").width();
  var toolbarWidth = $("#toolBox").width();
  $("#map").width(pageWidth - toolbarWidth);
}

//begin copy from JQuery forums on dealing with maximum height, empty divs.
  function stretchScreen () {
    var dheight = $("html").height(); 
    var wheight = $(window).height();
    //height first header, content, last footer
    var overTop = $("#topBar").height();
    var cbody = $("#main").height();
    // format for mobile select
    var overBottom = $("div[data-role='page']:first-child div[data-role='footer']:last-child").height();
    //correction 
    var correct = overTop + overBottom;
    var cheight = (wheight - dheight + cbody)

    if (cbody < dheight || cbody < wheight) { 
      changepush ();
    }
    if (wheight > dheight) {
      $("#main").height(cheight);
      $("#map").height(cheight);
    }
    //add orientationchange
    $(window).bind("resize orientationchange", function() {
      wheight = $(window).height();
      noscroll();
      changepush();
    });

    function noscroll() {
      if (wheight > dheight) {
        $("html").addClass("noscroll");
      } else if (wheight <= dheight)  {
        $("html").removeClass("noscroll");
      } else {}
    }

    function changepush() {
      if (wheight > dheight) {
        $("#main").css({"min-height" : wheight-correct+"px"});
        $("#map").css({"min-height" : wheight-correct+"px"});
        //$.mobile.silentScroll(0);
      } else {
        $("#main").css({"min-height" : dheight-correct+"px"});
        $("#map").css({"min-height" : dheight-correct+"px"});
        //$.mobile.silentScroll(0);
      }
    }

  } 
//end copy
