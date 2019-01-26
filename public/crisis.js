
(function() {
  // game vars
  let gameTime = 0;

  // game view
  let gameContainer;
  let scene;
  let arrowLeft;
  let arrowRight;

  let events = [];

  let transitionRoom = {
    id: 'transition',
    name: 'transition',
    display: $('<h1>transition</h1>'),
    events: {
      "transition" : {
        ticks: 1,
        targetRoom: null,
        action: function() {
          triggerDeactivation();
          triggerActivation(this.targetRoom);
        }
      }
    },
    activateRoom: function() {
      removeArrows();
    },
    deactivateRoom: function() {
      setupArrows();
    },
  };

  // let activeRoomIndex = Math.floor(Math.random() * 3);
  let activeRoomIndex = 0;
  let activeRoom;
  let rooms = [
    {
      id: 'lounge',
      name: 'Lounge',
      counter: 50.0,
      scalefactor: 1,
      rewardValues: [1, 2, 3],
      active: false,
      inputs: [
        {
          id: "talk1",
          icon: "heart",
          classes: "right",
          position: [0, 0]
        },
        {
          id: "talk2",
          icon: "heart",
          classes: "left",
          position: [65, 0]
        },
      ],
      outputs: [
        {
          id: "talk-back",
          icon: "heart",
          position: [0, 58]
        },
      ],
      inputCall: function(room, input) {
        console.log(input);
        console.log(room.name, room.counter + " : " + room.active);
        removeInputs(room);
        events.push({
          ticks: 2,
          action: function() {
            room.container.append(`<img id="${room.outputs[0].id}" class="icon left" ` +
                `src="assets/${room.id}-icon-${room.outputs[0].icon}.png"/>`)
            modifyRoomScore(room, room.calculateScore());
            room.roomUpkeep();
            events.push({
              ticks: 1,
              action: function() {
                room.container.find(`#${room.outputs[0].id}`).remove();
                setupInputs(room);
              }
            })
          }
        });
      },
      calculateScore: function () {
        let rewardIndex = Math.floor(Math.random() * (this.rewardValues.length));
        console.log('Index:', rewardIndex);
        console.log('Base reward:', this.rewardValues[rewardIndex]);
        console.log('Scaled factor:', this.scalefactor);
        console.log('Scaled reward:', this.rewardValues[rewardIndex] * this.scalefactor);
        return this.rewardValues[rewardIndex] * this.scalefactor;
      },
      roomUpkeep: function() {
        this.scalefactor += 1;
      },
      activateRoom: function() {
        // setupInputs(this);
      },
      deactivateRoom: function() {
        this.scalefactor = 1;
      },
      update: function (delta, active) {
        // console.log(room.name, room.counter + " : " + room.active);
        this.counter = this.counter - 1;
      }
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      counter: 50.0,
      active: false,
      intervals: [3, 5, 10],
      potReadyCount: 0,
      potReady: true,
      potStirredReward: 10,
      inputs: [
        {
          id: "4",
          icon: "heart",
          classes: "right",
          position: [0, 0]
        }
      ],
      outputs: [
        {
          id: "pot-stirred",
          icon: "heart",
          position: [0, 58]
        },
      ],
      events: {
        'pot-stirred' : {
          ticks: 0,
          action: function() {
            this.room.container.append(`<img id="${this.room.outputs[0].id}" class="icon left" ` +
                `src="assets/${this.room.id}-icon-${this.room.outputs[0].icon}.png"/>`);

            this.room.potReady = false;
            modifyRoomScore(this.room, this.room.potStirredReward);
            let resultEvent = $.extend({}, this.room.events["pot-ready"]);
            let randomTicks = this.room.intervals[Math.floor(Math.random() * this.room.intervals.length)];
            console.log("Ticks: ",randomTicks);
            resultEvent.ticks = randomTicks;
            resultEvent.room = this.room;
            events.push(resultEvent);
          }
        },
        'pot-ready' : {
          ticks: 0,
          action: function() {
            this.room.container.find(`#${this.room.outputs[0].id}`).remove();
            this.room.potReady = true;
            setupInputs(this.room);
          }
        }
      },
      inputCall: function(room, input) {
        removeInputs(room);
        let resultEvent = $.extend({}, room.events["pot-stirred"]);
        resultEvent.room = room;
        events.push(resultEvent);
      },
      calculateScore: function() {

      },
      activateRoom: function() {
        // if (this.potReady) {
        //   setupInputs(this);
        // }
      },
      deactivateRoom: function() {

      },
      update: function (delta, active) {
        console.log(this);
        if (this.potReady) {
          console.log(this.counter);
          this.potReadyCount++;
          this.counter = this.counter - this.potReadyCount;
          console.log("pot counter: ", this.potReadyCount);
          console.log("advanced decrement: ", this.counter + " : " + this.active);
          console.log(this.counter);
        } else {
          console.log(this.counter);
          this.potReadyCount = 0;
          this.counter = this.counter - 1;
          console.log("regular decrement: ", this.counter + " : " + this.active);
          console.log(this.counter);
        }
      }
    },
    // {
    //   id: 'dining',
    //   name: 'Dining',
    //   counter: 20.0,
    //   active: false,
    //   inputs: [
    //     {
    //       id: "3",
    //       icon: "heart",
    //       position: [0, 0]
    //     }
    //   ],
    //   update: function (delta, active) {
    //     // console.log(room.name, room.counter + " : " + room.active);
    //     this.counter = this.counter - 1;
    //   }
    // },
    // {
    //   id: 'kids',
    //   name: 'Kids Room',
    //   counter: 20.0,
    //   active: false,
    //   inputs: [
    //     {
    //       id: "2",
    //       icon: "heart",
    //       position: [0, 0]
    //     }
    //   ],
    //   update: function (delta, active) {
    //     // console.log(room.name, room.counter + " : " + room.active);
    //     this.counter = this.counter - 1;
    //   }
    // }
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
            <h3 id="room-title">${room.name}</h3>
          </div>
          <div id="${room.id}-container" class="row">
            <img id="${room.id}-backdrop" src="assets/${room.id}-backdrop.png"/>
          </div>
        </div>
      `);
      room.container = room.display.find(`#${room.id}-container`);
      setupInputs(room);
      if (activeRoomIndex === roomIndex) {
        triggerActivation(room);
      }
    }
  }

  function triggerDeactivation() {
    activeRoom.active = false;
    activeRoom.display.remove();
    console.log(activeRoom);
    activeRoom.deactivateRoom();
  }

  function triggerActivation(room) {
    activeRoom = room;
    activeRoom.active = true;
    scene.append(room.display);
    activeRoom.activateRoom();
  }

  function setupInputs(room) {
    for(let i = 0; i < room.inputs.length; i++) {
      let input = room.inputs[i];
      input.display = $(`<img id="${input.id}" class="icon ${input.classes}" ` +
          `src="assets/${room.id}-icon-${input.icon}.png"/>`);

      input.display.css({
        left: input.position[0],
        top: input.position[1],
      });

      input.display.click(function () {
        room.inputCall(room, input);
      });

      room.display.find(`#${room.id}-container`)
          .append(input.display);
    }
  }

  function removeInputs(room) {
    for (let i = 0; i < room.inputs.length; i++) {
      let input = room.inputs[i];
      input.display.remove();
    }
  }

  function modifyRoomScore(room ,score) {
    room.counter += score;
  }

  function setupArrows() {
    arrowLeft = $(`<div id="arrow-left"><img class="left" src="assets/lounge-icon-heart.png"></div>`);
    arrowLeft.click(moveLeft);
    $('#button-container-left').append(arrowLeft);

    arrowRight = $(`<div id="arrow-right"><img class="right" src="assets/lounge-icon-heart.png"></div>`);
    arrowRight.click(moveRight);
    $('#button-container-right').append(arrowRight);
  }

  function removeArrows() {
    arrowLeft.remove();
    arrowRight.remove();
  }

  function moveLeft() {
    triggerDeactivation();
    let transitionEvent = $.extend({}, transitionRoom.events.transition);
    if (activeRoomIndex === 0) {
      activeRoomIndex = rooms.length-1;
    } else {
      activeRoomIndex = activeRoomIndex - 1;
    }
    transitionEvent.targetRoom = rooms[activeRoomIndex];
    events.push(transitionEvent);
    triggerActivation(transitionRoom);
  }

  function moveRight() {
    triggerDeactivation();
    let transitionEvent = $.extend({}, transitionRoom.events.transition);
    if (activeRoomIndex === rooms.length-1) {
      activeRoomIndex = 0;
    } else {
      activeRoomIndex = activeRoomIndex + 1;
    }
    transitionEvent.targetRoom = rooms[activeRoomIndex];
    events.push(transitionEvent);
    triggerActivation(transitionRoom);
  }

  function start() {
    window.requestAnimationFrame(loop);
  }

  let accumulator = 0;

  function loop() {
    let stepTime = (new Date()).getTime();
    let delta = stepTime - gameTime;

    if (accumulator > 1000) {
      processEvents();
      for(var roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
        rooms[roomIndex].update(delta, false);
      }
      checkGameState();
      accumulator = 0;
    } else {
      accumulator += delta;
    }

    gameTime = stepTime;

    window.requestAnimationFrame(loop);
  }

  function processEvents() {
    for (let eventIndex = 0; eventIndex < events.length; eventIndex++) {
      let event = events.shift();
      if (event.ticks > 0) {
        event.ticks--;
        events.push(event);
      } else {
        event.action();
      }
    }
  }

  function checkGameState() {
    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
      let room = rooms[roomIndex];
      if (room.counter <= 0) {
        scene.html("<h1>Game Over</h1>");
      }
    }
  }

  setup();
  start();
})();