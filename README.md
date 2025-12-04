# tennis_score
A tennis score keeper which features Broadcasting and Spectating

 [Use the app here](https://tennis.themetalfleece.dev/)

## Enable Broadcasting/Spectating with Websockets

1. Install [node.js](https://nodejs.org/en)
2. Enable yarn: `corepack enable yarn`
3. On the root project folder, run `yarn` in order to install the necessary modules
4. Run `yarn start to start the websocket server
5. Navigate to your IP address with the given port.

### Broadcasting/Spectating instructions

#### Broadcasting
1. Whenever you want to broadcast your game, press the "Broadcast" button.
2. You will be given a Match #. This number is unique for your match and spectators can use it to spectate your game.

#### Spectating
1. Whenever you want to spectate a game, press the "Spectate" button.
2. You will be prompted to give a Match #. Enter the number which corresponds to the match you want to spectate.
3. A message will appear to inform you that you are spectating a match. Whenever its status changes, it will also change on your browser.

You can join an existing game by loading the page with `?room=X`, where `X` is the room number.
