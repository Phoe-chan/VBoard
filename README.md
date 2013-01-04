VBoard
======

Node.js based website using websockets for realtime updating of a virtual boardgame surface.

Running
=======

Just run node app.js and then connect multiple webbrowsers to port 3000. You can drag actors around in the scene, create new actors using the New Actor Name and "+" button, or destroy actors by dropping them into the Destroy box on the top right.

The board implements no gamelogic as it is to support our Play By Skype sessions of tabletop roleplaying games, it is simply a visualisation tool to help in the more tactically based games we play.

Updates
=======
v1.1 - Added stance functionality. Actors can now be in one of four stances, Forward, Balanced, Defensive and Ranged, the stance can be changed by clicking on the desired stance in the stance bar on each actor. The currently selected stance is backlit in white.
