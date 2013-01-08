/*
 * Application routes.
 */
var dbaccess = require("../server/dbaccess.js");

exports.index = function(req, res){
  dbaccess.getBoards(function (result) {
    res.render('index', { title: 'VBoard', boards: result });
  });
};

exports.board = function(req, res) {
  var theBoardId = req.params.boardId;
  dbaccess.getBoardProperties( theBoardId,
    function (result) {
      res.render('board', {title: 'VBoard', boardDetails: result });
    },
    function (error) {
      res.render('error', {title: 'Error', error: error});
    });
}

exports.boardlist  = function(req, res){
  dbaccess.getBoards(function (result) { 
    res.json(JSON.stringify(result));
  });
};

exports.addboard  = function(req, res){
  var mapName = req.param('mapName', null);
  dbaccess.addBoard(mapName, function(result) {
    res.json(JSON.stringify(result));
  });
};

exports.deleteboard  = function(req, res){
  var boardId = req.params.boardId;
  dbaccess.deleteBoard(boardId, function(result) {
    res.json(JSON.stringify(result));
  });
};

exports.imagelist  = function(req, res){
  //TODO: for next version, move this into the database and establish some method of adding new maps. For now, we will just present a small selection of hardcoded map names.
  var maplist = [];
  maplist.push( {mapName: "trollpool.gif"} );
  maplist.push( {mapName: "temple.gif"} );
  maplist.push( {mapName: "forestPath.gif"} );
  var mapJSON = JSON.stringify(maplist);
  res.json(mapJSON);
};
