//mobile.js
const socket = io('http://localhost:3000', { query: { isPlayer: 'true' } });
let voiceRecognitionActive = false;
let voiceRecognitionSuccess = false;
let recognition; 

socket.on('serverFull', () => {
  alert('The server is full. Please try again later.');
});

socket.on('narrativeText', (text) => {
  const narrativeElement = document.getElementById('narrative');
  narrativeElement.textContent = text;
  document.getElementById('status').textContent = '';
});

socket.on('playerRegistered', (data) => {
  const playerTitle = document.getElementById('playerTitle');
  playerTitle.textContent = `Player ${data.playerNumber}`;
  const playerImage = document.getElementById(`player${data.playerNumber}`);
  playerImage.style.display = 'block';
  document.getElementById('status').textContent = `You are player ${data.playerNumber}. Waiting for the other player...`;
});

socket.on('playerLeft', () => {
  document.getElementById('status').textContent = 'The other player has left. Waiting for a new player...';
  document.getElementById('choices').style.display = 'none';
});


socket.on('yourTurn', (data) => {
  if (data.voice !== null) {
    document.getElementById('status').textContent = 'Say the line outloud!';

    document.getElementById('line_to_speak').textContent = '"' + data.voice + '"';
    document.getElementById('line_to_speak').style.display = "inline-block";

    const voiceButton = document.createElement('button');
    voiceButton.textContent = 'Start Voice Recognition';
    voiceButton.addEventListener('click', async () => {
      const voiceRecognitionSuccess = await startVoiceRecognition(data.voice);
      if (voiceRecognitionSuccess) {
        displayChoices(data.options);
        document.getElementById('line_to_speak').textContent = "";
        document.getElementById('line_to_speak').style.display = "none";
      }
    });
    document.getElementById('choices').innerHTML = '';
    document.getElementById('choices').appendChild(voiceButton);
  } else {
    displayChoices(data.options);
    document.getElementById('line_to_speak').textContent = "";
    document.getElementById('line_to_speak').style.display = "none";
    document.getElementById('status').textContent = 'Your turn to make a move!';
  }
  document.getElementById('choices').style.display = 'block';
});



socket.on('waitForTurn', () => {
  document.getElementById('status').textContent = 'Waiting for the other player to make a move...';
  document.getElementById('choices').style.display = 'none';
});

socket.on('confirmChoice', (data) => {
  const confirmElement = document.getElementById('confirm');
  confirmElement.innerHTML = `Player 1 has chosen: "${data.text}" Do you agree?`;

  const confirmButton = document.createElement('button');
  confirmButton.textContent = 'Agree';
  confirmButton.onclick = () => confirmAction(true);

  const denyButton = document.createElement('button');
  denyButton.textContent = 'Disagree';
  denyButton.onclick = () => confirmAction(false);

  confirmElement.appendChild(confirmButton);
  confirmElement.appendChild(denyButton);

  document.getElementById('status').textContent = 'Please confirm the action.';
  confirmElement.style.display = 'block';
});

socket.on('choiceReset', () => {
  const resetMessage = document.getElementById('resetMessage');
  resetMessage.textContent = 'The other player has disagreed with your choice. Please make a new choice.';
  resetMessage.style.display = 'block';

  document.getElementById('confirm').style.display = 'none';
  document.getElementById('choices').style.display = 'block';
});

function sendAction(choiceIndex) {
  socket.emit('playerAction', choiceIndex);
  document.getElementById('choices').style.display = 'none';
}

function confirmAction(confirmation) {
  voiceRecognitionSuccess = false;
  socket.emit('confirmChoice', confirmation);
  document.getElementById('confirm').innerHTML = '';
  document.getElementById('confirm').style.display = 'none';
}



async function startVoiceRecognition(voice) {
  return new Promise((resolve) => {
    if (!voiceRecognitionActive && 'webkitSpeechRecognition' in window) {
      voiceRecognitionActive = true;
      recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false; // Cambiado a false para obtener el resultado final directamente

      recognition.onstart = () => {
        document.getElementById('status').textContent = 'Listening...';
      };

      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript.toLowerCase();
        const expectedWord = voice.toLowerCase();
        console.log(result);
        console.log(expectedWord);

        if (result === expectedWord) {
          document.getElementById('status').textContent = 'Your turn to make a move!';
          recognition.stop();
          voiceRecognitionActive = false;
          voiceRecognitionSuccess = true;
          resolve(true);
        } else {
          document.getElementById('status').textContent = `Ops... Try again! Your line is: "${expectedWord}".`;
          recognition.stop();
          voiceRecognitionActive = false;
          resolve(false);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        document.getElementById('status').textContent = 'Speech recognition error. Please try again.';
        voiceRecognitionActive = false;
        resolve(false);
      };

      recognition.onend = () => {
        if (!voiceRecognitionSuccess) {
          //document.getElementById('status').textContent = 'Speech recognition ended. Please try again.';
          voiceRecognitionActive = false;
          resolve(false);
        }
      };

      recognition.start();
    } else {
      alert('Speech recognition not supported in your browser or recognition is already active.');
      resolve(false);
    }
  });
}


function displayChoices(options) {
  const choicesElement = document.getElementById('choices');
  choicesElement.innerHTML = '';

  options.forEach((option, index) => {
    const button = document.createElement('button');
    button.textContent = option.text;
    button.addEventListener('click', () => {
      sendAction(index);
    });
    choicesElement.appendChild(button);
  });
}

document.getElementById('status').textContent = 'Connecting to the server...';
socket.emit('joinGame');