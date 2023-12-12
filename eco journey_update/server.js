//server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

class Node {
  constructor(text, options, backimage, voice = null) {
    this.text = text;
    this.options = options; // options is an array of objects { text, nextNode }
    this.backimage = backimage;
    this.voice = voice;
  }
}


const storyGraph = {
  start: new Node(" One day in a small village a girl named Polly and her friend Joca were playing in the forest as usual. But this time something seemed strange...  ", [
    { text: "Leave", nextNode: "badEnding1" },
    { text: "Keep investigating", nextNode: "keepInvestigating" }
  ], "Background_1.png"),
 
  keepInvestigating: new Node("They wondered the forest and found the river, that was now all dirty and polluted, and the area next to it as well. It was full of garbage. An owl is right there next to the river and starts talking to them...", [
    { text: "Talk to the owl", nextNode: "owlSpeaks" },
    { text: "Ignore the owl", nextNode: "badEnding1" }
  ],  "Background_2.png"),

  owlSpeaks: new Node("They listen to the owl and she tells them about the current state of the forest, people have been progressively mean and mistreat mother nature even though is what helps them live. But in fact, there’s something they can do. They can clean the river and help the animals", [
    { text: "Clean the river", nextNode: "river" },
    { text: "Go home", nextNode: "badEnding2" }
  ], "owl_bg.png", "Hello"),

  river: new Node("The kids clean the river and find a frog trapped in a bottle.",[
    { text: "Help the frog out", nextNode: "bottle" },
    { text: "Ignore the frog", nextNode: "badEnding2" }
  ], "Background_2.png", "This frog needs help"),
  bottle: new Node("Where should you throw the bottle?",[
    { text: "Throw the bottle in the yellow bin", nextNode: "rabbit" },
    { text: "Throw the bottle in the blue bin", nextNode: "badEnding2" }
  ], "Background_3.png"),
  rabbit: new Node("Next to where they are cleaning, they find a rabbit who asks for help to unclog his house full of garbage",[
    { text:"Help the rabbit", nextNode: "unclog" },
    { text: "Don't pay attention to the rabbit", nextNode: "badEnding2"}
  ], "Background_3.png") ,
  unclog: new Node("Inside the hole was the rabbit's wife. She says that the forest is being dirty by a villain called pollution",[
    { text:"Let's fight with him", nextNode: "fight" },
    { text: "Don't fight", nextNode: "badEnding2"}
  ], "Background_1.png") ,
  fight: new Node("We clean up the forest little by little. In which container do yo throw a glass bottle?",[
    { text:"Green", nextNode: "glass" },
    { text: "Blue", nextNode: "badEnding2"}
  ], "Background_1.png", "There is something we can do") ,
  glass: new Node("After picking up the glass. Suddenly, among the trees, they heard malicious laughter and saw someone hiding behind a pile of garbage. They approached cautiously and,he said that behind the dirt he was a boy of the same age, he admitted that he was responsible for all the pollution in the forest, he knew nothing about recycle. Shall we teach him?",[
    { text:"Yes", nextNode: "goodEnding"},
    { text: "No", nextNode: "badEnding2"}
  ], "bad_ending.png") ,

  badEnding1: new Node("They left and the pollution got very bad that it eventually destroyed the forest, they lost their animal friends that left to find another forest to live and the quality of the air in their village also worsen... you got the bad ending.",[
    { text:"Try again...", nextNode:"start"}
  ], "bad_ending.png"),

  badEnding2 : new Node("They go back home and the pollution gets worse, because they didn’t help the animals and the water from the river got worse so they left the forest even the owl. You got the the bad ending…", [
    { text:"Try again...", nextNode:"start"}
  ], "bad_ending.png"),

  goodEnding : new Node("Polly and Joca teach the boy to recycle and clean him, they become good friends and spend their days together playing in the forest. Animals can live without fear. They are all happy.", [
    {text:"You made it! Want to play again?",nextNode:"start"}
  ], "Background_1.png"),
  // ... add more nodes as needed for your story ...
};


let players = [];
let screenSocketId = null;
let currentNodeKey = 'start';
let pendingChoice = null; // To track the choice awaiting confirmation

app.use(express.static('public'));

io.on('connection', (socket) => {
  const isScreen = socket.handshake.query.isScreen === 'true';

  if (isScreen) {
    screenSocketId = socket.id;
    socket.emit('waitForPlayers');
    return;
  }

  console.log(`User ${socket.id} connected`);

  socket.on('joinGame', () => {
    if (players.length < 2) {
      players.push({ id: socket.id, isTurn: players.length === 0 });
      socket.emit('playerRegistered', { playerNumber: players.length, isTurn: players.length === 1 });
      if (players.length === 2 && screenSocketId) {
        io.to(screenSocketId).emit('readyToStart');
        startGame();
      }
    } else {
      socket.emit('serverFull');
    }
  });

  socket.on('confirmChoice', (confirm) => {
    const standbyPlayer = players.find(player => !player.isTurn);
    if (standbyPlayer && socket.id === standbyPlayer.id && pendingChoice) {
      if (confirm) {
        applyChoice(pendingChoice.choiceIndex);
      } else {
        const activePlayer = players.find(player => player.isTurn);
  
        // Notify both players about the disagreement
        io.to(activePlayer.id).emit('choiceDisagreed');
        io.to(standbyPlayer.id).emit('choiceDisagreed');
  
        // Update players with the current state
        updatePlayersWithState();
        pendingChoice = null;
      }
    }
  });
  
  socket.on('playerAction', (choiceIndex) => {
    const currentPlayer = players.find(player => player.isTurn);
    if (currentPlayer && socket.id === currentPlayer.id) {
      pendingChoice = {
        choiceIndex: choiceIndex,
        chosenBy: currentPlayer.id
      };
      // Ask the other player for confirmation
      askForConfirmation();
    }
  });

  socket.on('confirmChoice', (confirm) => {
    const standbyPlayer = players.find(player => !player.isTurn);
    if (standbyPlayer && socket.id === standbyPlayer.id && pendingChoice) {
      if (confirm) {
        applyChoice(pendingChoice.choiceIndex);
      } else {
        const activePlayer = players.find(player => player.isTurn);
        // Notify active player that the choice was reset
        io.to(activePlayer.id).emit('choiceDisagreed');
        // It's still the active player's turn, so ask them to choose again
        updatePlayersWithState();
        pendingChoice = null;
        // Toggle turns after resetting the choice
        players.forEach(player => {
          player.isTurn = !player.isTurn;
        });
      }
    }
  });
  

  socket.on('disconnect', () => {
    players = players.filter(player => player.id !== socket.id);
    if (socket.id === screenSocketId) {
      screenSocketId = null; // Reset if the screen disconnects
    }
    console.log(`User ${socket.id} disconnected. Remaining players: ${players.length}`);
    if (players.length < 2) {
      currentNodeKey = 'start';
      io.emit('playerLeft');
      if (players.length === 1) {
        players[0].isTurn = true;
      }
    }
  });
});


function askForConfirmation() {
  const standbyPlayer = players.find(player => !player.isTurn);
  if (standbyPlayer && pendingChoice) {
    io.to(standbyPlayer.id).emit('confirmChoice', {
      text: `Do you agree with this choice: "${storyGraph[currentNodeKey].options[pendingChoice.choiceIndex].text}"?`,
      choiceIndex: pendingChoice.choiceIndex
    });
  } else {
    updatePlayersWithState();
  }
}



function applyChoice(choiceIndex) {
  const node = storyGraph[currentNodeKey];
  if (node && node.options[choiceIndex]) {
    currentNodeKey = node.options[choiceIndex].nextNode;
    const newNode = storyGraph[currentNodeKey];

    if (screenSocketId) {
      io.to(screenSocketId).emit('narrativeText', newNode.text);
      io.to(screenSocketId).emit('narrativeBg', newNode.backimage);
    }

    // Toggle turns
    players.forEach(player => {
      player.isTurn = !player.isTurn;
    });

    updatePlayersWithState();
    pendingChoice = null; // Reset pending choice after applying
  }
}


function startGame() {
  updatePlayersWithState();
  const startNode = storyGraph[currentNodeKey];
  if (screenSocketId) {
    io.to(screenSocketId).emit('narrativeText', startNode.text);
    //io.to(screenSocketId).emit('narrativeBg', { backimage: startNode.backimage, bgStatic: startNode.bgStatic });
    io.to(screenSocketId).emit('narrativeBg', startNode.backimage);
  }
}

function updatePlayersWithState() {
  const node = storyGraph[currentNodeKey];
  players.forEach(player => {
    if (player.isTurn) {
      io.to(player.id).emit('yourTurn', {
        options: node.options,
        text: node.text,
        backimage: node.backimage,
        bgStatic: node.bgStatic,
        voice: node.voice,
      });
    } else {
      io.to(player.id).emit('waitForTurn');
    }
  });
}

server.listen(3000, '0.0.0.0', () => {
  console.log('Server listening on port 3000');
});