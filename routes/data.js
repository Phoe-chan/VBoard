
/*
 * GET page for returning data to build pages.
 */

exports.boardlist  = function(req, res){
  res.json(['OK']);
};

exports.addboard  = function(req, res){
  //database write to make new board.
};

exports.deleteboard  = function(req, res){
  res.json(['OK']);
};

exports.imagelist  = function(req, res){
  res.json(['OK']);
};
