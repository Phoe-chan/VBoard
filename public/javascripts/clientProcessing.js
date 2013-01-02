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
    console.log(messageBody);
    updateLog(messageBody.message, 1);
  });
  socket.on("actors", function (data) {
    //update the pieces into their initial positions here here;
    var messageArray = JSON.parse(data);
    updateLog("Initial update, "+ messageArray.length +" elements received.");
    for (var i = 0; i < messageArray.length; i++) {
      if (messageArray[i].xPos == -1 || messageArray[i].yPos == -1) {
        //this one is in the toolbox. No positioning.
        var newActor = "<div id='" + messageArray[i].id + "' class='actor inToolBox'>" + messageArray[i].name + "</div>";
        $("#actors").append(newActor);
      } else {
        var newActor = "<div id='" + messageArray[i].id + "' class='actor onMap'>" + messageArray[i].name + "</div>";
        $("#map").append(newActor);
        var posSet = $("#" + messageArray[i].id);
        posSet.css({top: messageArray[i].yPos, left: messageArray[i].xPos});
      }
      $("#" + messageArray[i].id).data("xPos", messageArray[i].xPos);
      $("#" + messageArray[i].id).data("yPos", messageArray[i].yPos);
      $("#" + messageArray[i].id).data("name", messageArray[i].name);
      $("#" + messageArray[i].id).draggable({ grid: [50, 50], revert: "invalid", snap: true });
    }
  });
  socket.on("actorAdded", function (data) {
    var messageBody = JSON.parse(data);
    updateLog("Adding actor " + messageBody.name);
    //Add new actor to the toolbox, then add message to the log.
    var newActor = "<div id='" + messageBody.id + "' class='actor inToolBox'>" + messageBody.name + "</div>";
    $("#actors").append(newActor);
    $("#" + messageBody.id).data("xPos", messageBody.xPos);
    $("#" + messageBody.id).data("yPos", messageBody.yPos);
    $("#" + messageBody.id).data("name", messageBody.name);
    $("#" + messageBody.id).draggable({ grid: [50, 50], revert: "invalid", snap: true });
  });
  socket.on('actorDeleted', function (data) {
    var messageBody = JSON.parse(data);
    updateLog("Deleting actor " + messageBody.name);
    //locate the actor involved and delete it, then add a message to the log.
    $("#" + messageBody.id).hide('explode', {}, 600, function() { 
      $("#" + messageBody.id).remove; 
    });
  });
  socket.on('actorMoved', function (data) {
    //locate the actor involved and update it, then add a message to the log.
    var messageBody = JSON.parse(data);
    updateLog("Updating actor " + messageBody.name);
  
    var activeActor = $("#" + messageBody.id);
    if (activeActor)
    {
      if (messageBody.xPos == -1 || messageBody.yPos == -1) {
        // command to move it into the toolbox.
        if (activeActor.data("xPos") == -1 || activeActor.data("yPos") == -1) {
          // it is presently in the toolbox. We need do nothing.
        } else {
          // it is presently on the map, must remove it and add it to the toolbox
          activeActor.remove();
          var newActor = "<div id='" + messageBody.id + "' class='actor inToolBox'>" + messageBody.name + "</div>";
          $("#actors").append(newActor);
          activeActor = $("#" + messageBody.id);
        }
      } else {
        // command to move it on the map.
        if (activeActor.data("xPos") == -1 || activeActor.data("yPos") == -1) {
          // it is presently in the toolbox. Must remove it and add it to the map.
          activeActor.remove();
          var newActor = "<div id='" + messageBody.id + "' class='actor onMap'>" + messageBody.name + "</div>";
          $("#map").append(newActor);
          activeActor = $("#" + messageBody.id);
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
      activeActor.draggable({ grid: [50, 50], revert: "invalid", snap: true });
    } else {
      // Could not find the actor being moved, raise error.
      updateLog("Error: Could not find the actor being moved: " + messageBody.name, 1);
    }
  });

  stretchScreen()

  $("#map").droppable( { greedy: true, accept: ".actor", tolerance: "fit" } );
  $("#map").bind("drop", function(event, ui) {
    //emit event for the element's move
    var dragName = ui.draggable.data("name");
    var dropPos = ui.draggable.offset()
    var mapPos = $(this).offset();
    var yOffset = dropPos.top - mapPos.top;
    var xOffset = dropPos.left - mapPos.left;
    console.log("move set to (" + xOffset + "," + yOffset + ")");
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
    socket.emit("newActor", { name: newName });
  });

  updateLog("Requesting initial state.");
  socket.emit("initialState", { });
});

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

