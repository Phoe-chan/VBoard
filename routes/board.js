
/*
 * GET board display page.
 */

exports.board = function(req, res){
  var theBoardId = req.params.boardID;
  res.render('board', { title: 'VBoard', boardId: theBoardId });
};
