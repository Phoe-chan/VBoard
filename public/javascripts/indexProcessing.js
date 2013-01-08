$(document).ready(function(){
  $(".deleteLink").each(function(idx, item) {
    $("#" + item.id).bind('click', function(evt) {
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
    });
  });
  //TODO: Bind a click handler to the new board function.
});

function getRootUrl(url) {
  return url.toString().replace(/^(.*\/\/[^\/?#]*).*$/, "$1");
}
