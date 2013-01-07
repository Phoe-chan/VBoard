/*
 * Application routes.
 */
var dbaccess = require("../server/dbaccess.js");

exports.index = function(req, res){
  res.render('index', { title: 'VBoard' });
};

exports.board = function(req, res) {
  var theBoardId = req.params.boardId;
  res.render('board', {title: 'VBoard', boardId: theBoardId });
}

exports.boardlist  = function(req, res){
  var boardlistJSON = JSON.stringify(dbaccess.getBoards()); 
  res.writeHead(200, {'content-type': 'text/json' });
  res.json(boardListJSON);
};

exports.addboard  = function(req, res){
  var mapName = req.params.mapName;
  var newBoard = JSON.stringify(dbaccess.addBoard(mapName));
  res.writeHead(200, {'content-type': 'text/json' });
  res.json(newBoard);
};

exports.deleteboard  = function(req, res){
  var boardId = req.params.boardId;
  var result = JSON.stringify(dbaccess.deleteBoard(boardId));
  res.writeHead(200, {'content-type': 'text/json' });
  res.json(result);
};

exports.imagelist  = function(req, res){
  //TODO: for next version, move this into the database and establish some method of adding new maps. For now, we will just present a small selection of hardcoded map names.
  var maplist = [];
  maplist.push( {mapName: "trollpool.jpg"} );
  maplist.push( {mapName: "temple.jpg"} );
  maplist.push( {mapName: "forestPath.jpg"} );
  var mapJSON = JSON.stringify(maplist);
  res.json(mapJSON);
};
