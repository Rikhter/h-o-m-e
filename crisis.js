
(function() {
  // game vars
  let gameTime = 0;

  // game view
  let gameContainer;
  let scene;
  let arrowLeft;
  let arrowRight;

  let activeRoomIndex = Math.floor(Math.random() * 3);
  let activeRoom;
  let rooms = [
    {
      id: 'lounge',
      name: 'Lounge',
      counter: 100.0,
      active: false
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      counter: 100.0,
      active: false
    },
    {
      id: 'dining',
      name: 'Dining',
      counter: 100.0,
      active: false
    },
    {
      id: 'kids',
      name: 'Kids Room',
      counter: 100.0,
      active: false
    }
  ];

  function setup() {
    gameContainer = $('#game-container');
    scene = $('#scene');

    setupRooms();
    setupArrows();
  }

  function setupRooms() {
    for(let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
      let room = rooms[roomIndex];
      room.display = $(`
        <div>
          <div class="row">
            <h3 id="${room.id}">${room.name}</h3>
          </div>
          <div class="row">
            <img id="${room.id}-backdrop" src="assets/${room.id}-backdrop.png"/>
          </div>
        </div>
      `);
      if (activeRoomIndex === roomIndex) {
        activateRoom(room);
      }
    }
  }

  function deactivateRoom() {
    activeRoom.active = false;
    activeRoom.display.remove();
  }

  function activateRoom(room) {
    activeRoom = room;
    activeRoom.active = true;
    scene.append(room.display);
  }

  function setupArrows() {
    arrowLeft = $('#arrow-left');
    arrowLeft.click(moveLeft);
    arrowRight = $('#arrow-right');
    arrowRight.click(moveRight);
  }

  function moveLeft() {
    deactivateRoom();
    if (activeRoomIndex === 0) {
      activeRoomIndex = 3;
    } else {
      activeRoomIndex = activeRoomIndex - 1;
    }
    activateRoom(rooms[activeRoomIndex])
  }

  function moveRight() {
    deactivateRoom();
    if (activeRoomIndex === 3) {
      activeRoomIndex = 0;
    } else {
      activeRoomIndex = activeRoomIndex + 1;
    }
    activateRoom(rooms[activeRoomIndex])
  }

  function start() {
    window.requestAnimationFrame(loop);
  }

  let accumulator = 0;
  function loop() {
    let stepTime = (new Date()).getTime();
    let delta = stepTime - gameTime;

    if (accumulator > 1000) {
      console.log('Delta: ', delta);
      for(var roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
        updateRoom(rooms[roomIndex], delta, false);
      }
      accumulator = 0;
    } else {
      accumulator += delta;
    }

    gameTime = stepTime;

    window.requestAnimationFrame(loop);
  }

  function updateRoom(room, delta) {
    if (!room.active) {
      room.counter = room.counter - 1;
    } else {
      console.log(room.name, room.counter + " : " + room.active)
    }
  }

  setup();
  start();
})();