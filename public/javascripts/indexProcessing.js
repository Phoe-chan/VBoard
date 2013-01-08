$(document).ready(function(){
  $(".deleteLink").each(function(idx, item) {
    $("#" + item.id).bind("click", function(evt) {
      if (confirm("Are you certain you wish to delete this board.")) {
        var elementId = evt.target.id.split('_')[0];
        $.ajax({
          url: '/board/' + elementId,
          type: 'DELETE',
          success: function(response) {
            var msg = jQuery.parseJSON(response);
            var message = msg.vBoardError;
            if(message) {
              $("#error").text(message);
            }
            else {
              //TODO: in a future revision I should rewrite the building of the board list to be a JQuery method rather than server side then I can simply rebuild it here rather than forcing a refresh.
              window.location.href = getRootUrl(window.location);
            }
          }
        });
      }
    });
  });

  $("#addButton").bind("click", function(evt) {
    var mapname = $("#mapNameInput").val();
    $.ajax({
      url: '/board/',
      type: 'POST',
      data: { mapName: mapname },
      success: function(response) {
        var msg = jQuery.parseJSON(response);
        var message = msg.vBoardError;
        if(message) {
          $("#error").text(message);
        }
        else {
          //TODO: in a future revision I should rewrite the building of the board list to be a JQuery method rather than server side then I can simply rebuild it here rather than forcing a refresh.
          window.location.href = getRootUrl(window.location);
        }
      }
    });
  });

  $.getJSON("/images/", function(result) {
    var maps = JSON.parse(result);
    var mapSelect = $("#mapNameInput");
    $.each(maps, function() {
      mapSelect.append($("<option />").val(this.mapName).text(this.mapName));
    });
  });
});

function getRootUrl(url) {
  return url.toString().replace(/^(.*\/\/[^\/?#]*).*$/, "$1");
}
