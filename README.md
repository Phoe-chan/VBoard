VBoard
======

Node.js based website using websockets for realtime updating of multiple virtual boardgame surfaces.

Running
=======

Just run node app.js and then connect multiple webbrowsers to port 3000. You will be presented with an index of available boards. You can either use or delete an existing board or make a new one and use it. Once on the board page itself you can drag actors around in the scene, create new actors using the New Actor Name and "+" button, or destroy actors by dropping them into the Destroy box on the top right.

The board implements no gamelogic as it is to support our Play By Skype sessions of tabletop roleplaying games, it is simply a visualisation tool to help in the more tactically based games we play.

Updates
=======
v1.2 - Added multiple board support. Index page now lists, adds and deletes boards with a background map from a selection decided by server admin. Actors will not transition between boards and updates should not affect other boards.
v1.1 - Added stance functionality. Actors can now be in one of four stances, Forward, Balanced, Defensive and Ranged, the stance can be changed by clicking on the desired stance in the stance bar on each actor. The currently selected stance is backlit in white.
