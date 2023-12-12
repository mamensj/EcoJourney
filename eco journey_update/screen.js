document.addEventListener('DOMContentLoaded', function () {
  const socket = io('http://localhost:3000', { query: { isScreen: 'true' } });

  // Initially hide the waiting message and the story box
  document.getElementById('waitingMessage').style.display = 'block';

  // This will show the waiting message until the server says the game is ready to start
  socket.on('waitForPlayers', () => {
    document.getElementById('waitingMessage').textContent = 'Waiting for players to connect...';
    document.getElementById('welcome').textContent = '';
  });

  // Once the server says the game is ready to start, hide the waiting message and welcome
  socket.on('readyToStart', () => {
    console.log('Ready to start event received');
    document.getElementById('waitingMessage').style.display = 'none';
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('logo').style.display = 'none';
    document.getElementsByClassName('mov_background')[0].style.width = ((2001 * window.innerHeight) / 300) + 'px';
    document.getElementsByClassName('mov_back_container')[0].style.width = ((2001 * window.innerHeight) / 300) + 'px';
    document.getElementById('storyBox').style.display = 'block';
    document.getElementById('personagem1').style.display = 'block';
    document.getElementById('personagem2').style.display = 'block';
  });

  // When the server sends the narrative text, display it in the story box
  socket.on('narrativeText', (text) => {
    const storyBox = document.getElementById('storyBox');
    storyBox.textContent = text;
    storyBox.style.display = 'block';

    // Check if the narrative text indicates a bad ending
    const isBadEnding = text.toLowerCase().includes('bad ending');

    // Show or hide mov_backgroundstop based on whether it's a bad ending
    const movBackgroundStop = document.getElementsByClassName('mov_backgroundstop')[0];
    movBackgroundStop.style.display = isBadEnding ? 'block' : 'none';

    // Hide personagem1 if it's a bad ending
    const personagem1 = document.getElementById('personagem1');
    personagem1.style.display = isBadEnding ? 'none' : 'block';

    // Hide personagem2 if it's a bad ending
    const personagem2 = document.getElementById('personagem2');
    personagem2.style.display = isBadEnding ? 'none' : 'block';

    // Check if the narrative text indicates "listen to the owl"
    const listenToTheOwl = text.toLowerCase().includes('listen to the owl');

    // Show or hide owl bg based on "listen to the owl"
    const owlBackground = document.getElementsByClassName('owl_background')[0];
    owlBackground.style.display = listenToTheOwl ? 'block' : 'none';

    // Hide personagem1 and personagem2 when owl scene
    personagem1.style.display = listenToTheOwl ? 'none' : 'block';
    personagem2.style.display = listenToTheOwl ? 'none' : 'block';

//----
    // Check if the narrative text indicates "find a frog"
    const findafrog = text.toLowerCase().includes('find a frog');

    // Show or hide owl bg based on "find a frog"
    const frogBackground = document.getElementsByClassName('frog_background')[0];
    frogBackground.style.display = findafrog ? 'block' : 'none';

    // Hide personagem1 and personagem2 find a frog
    personagem1.style.display = findafrog ? 'none' : 'block';
    personagem2.style.display = findafrog ? 'none' : 'block';

//---

    // Change background when - Where should you throw the bottle
    const throwthebottle = text.toLowerCase().includes('should you throw the bottle');
    const ecoBackground = document.getElementsByClassName('eco_background')[0];
    ecoBackground.style.display = throwthebottle ? 'block' : 'none';
    // Hide personagem1 and personagem2 when owl scene
    personagem1.style.display = throwthebottle ? 'none' : 'block';
    personagem2.style.display = throwthebottle ? 'none' : 'block';

    //---

    // Change background when - they finnd a rabbit
    const theyfindarabbit = text.toLowerCase().includes('they find a rabbit');
    const rabbitBackground = document.getElementsByClassName('rabbit_background')[0];
    rabbitBackground.style.display = theyfindarabbit ? 'block' : 'none';
    // Hide personagem1 and personagem2 when rabbit
    personagem1.style.display = theyfindarabbit ? 'none' : 'block';
    personagem2.style.display = theyfindarabbit ? 'none' : 'block';

    
    //---

    // Change background when - bunny in the hole
    const insidethehole = text.toLowerCase().includes('she says that the forest');
    const bunnyBackground = document.getElementsByClassName('bunny_background')[0];
    bunnyBackground.style.display = insidethehole ? 'block' : 'none';
    // Hide personagem1 and personagem2 when rabbit
    personagem1.style.display = insidethehole ? 'none' : 'block';
    personagem2.style.display = insidethehole ? 'none' : 'block';

     //---

    // Change background when - bunny in the hole
    const glassbottle = text.toLowerCase().includes('glass bottle');
    const glassBackground = document.getElementsByClassName('glass_background')[0];
    glassBackground.style.display = glassbottle ? 'block' : 'none';
    // Hide personagem1 and personagem2 when rabbit
    personagem1.style.display = glassbottle ? 'none' : 'block';
    personagem2.style.display = glassbottle ? 'none' : 'block';

      //---

    // Change background when - pollution
    const weteachhim = text.toLowerCase().includes('we teach him');
    const pollutionBackground = document.getElementsByClassName('pollution_background')[0];
    pollutionBackground.style.display = weteachhim ? 'block' : 'none';
    // Hide personagem1 and personagem2 when pollution
    personagem1.style.display = weteachhim ? 'none' : 'block';
    personagem2.style.display = weteachhim ? 'none' : 'block';

      //---

    // Change background when - ending
    const theyareallhappy = text.toLowerCase().includes('animals can live without fear');
    const endingBackground = document.getElementsByClassName('ending_background')[0];
    endingBackground.style.display = theyareallhappy ? 'block' : 'none';
    // Hide personagem1 and personagem2 when end
    personagem1.style.display = theyareallhappy ? 'none' : 'block';
    personagem2.style.display = theyareallhappy ? 'none' : 'block';

  });

  socket.on('narrativeBg', (backimage, bgStatic) => {
    const bgImage = document.getElementsByClassName('mov_background')[0];

    if (bgStatic == true) {
      console.log("Static background enabled");
      bgImage.style.animation = 'none';
    } else {
      console.log("Static background disabled");
      bgImage.style.animation = ''; // This resets the animation to its initial state
    }

    // Update the image source
    bgImage.src = backimage;
  });
});
