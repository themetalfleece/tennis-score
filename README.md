# tennis_score
A tennis score keeper which features Broadcasting and Spectating

Static webpage without broadcasting/spectating: [Webpage index](https://themetalfleece.github.io/tennis_score/)

## Enable Broadcasting/Spectating with Websockets

1. Install **npm**
2. On the root project folder, run `npm install` in order to install the necessary modules
3. Run `node app.js` to start the websocket server
4. Navigate to your IP address with the given port.

### Broadcasting/Spectating instructions

#### Broadcasting
1. Whenever you want to broadcast your game, press the "Broadcast" button.
2. You will be given a Match #. This number is unique for your match and spectators can use it to spectate your game.

#### Spectating
1. Whenever you want to spectate a game, press the "Spectate" button.
2. You will be prompted to give a Match #. Enter the number which corresponds to the match you want to spectate.
3. A message will appear to inform you that you are spectating a match. Whenever its status changes, it will also change on your browser.