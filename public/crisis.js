
(function() {
  // game vars
  let gameTime = 0;
  let tickMillis = 250;
  let timeScale = 1000 / tickMillis;

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
    inputs: [],
    outputs: [],
    events: {
      "transition" : {
        ticks: 0.25 * timeScale,
        targetRoom: null,
        action: function() {
          triggerDeactivation();
          triggerActivation(this.targetRoom);
        }
      }
    },
    activateRoom: function() {
      hideArrows();
    },
    deactivateRoom: function() {
      showArrows();
    },
  };

  // let activeRoomIndex = Math.floor(Math.random() * 3);
  let activeRoomIndex = 0;
  let activeRoom;
  let rooms = [
    {
      id: 'lounge',
      name: 'Lounge',
      counter: 50.0 * timeScale,
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
        // console.log(input);
        // console.log(room.name, room.counter + " : " + room.active);
        hideInputs(room);
        events.push({
          ticks: 2 * timeScale,
          action: function() {
            room.outputs[0].display.show();
            modifyRoomScore(room, room.calculateScore());
            room.roomUpkeep();
            events.push({
              ticks: 1 * timeScale,
              action: function() {
                room.outputs[0].display.hide();
                console.log('steup from event');
                showInputs(room);
              }
            })
          }
        });
      },
      calculateScore: function () {
        let rewardIndex = Math.floor(Math.random() * (this.rewardValues.length));
        // console.log('Index:', rewardIndex);
        // console.log('Base reward:', this.rewardValues[rewardIndex]);
        // console.log('Scaled factor:', this.scalefactor);
        // console.log('Scaled reward:', this.rewardValues[rewardIndex] * this.scalefactor);
        return this.rewardValues[rewardIndex] * this.scalefactor;
      },
      roomUpkeep: function() {
        this.scalefactor += 1;
      },
      activateRoom: function() {
        // showInputs(this);
      },
      deactivateRoom: function() {
        this.scalefactor = 1;
      },
      setup: function() {
        setupOutputs(this);
        setupInputs(this);
      },
      update: function (delta, active) {
        // console.log(room.name, room.counter + " : " + room.active);
        this.counter = this.counter - 1;
      }
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      counter: 50.0 * timeScale,
      active: false,
      intervals: [3, 5, 10],
      potReadyCount: 0,
      potReady: true,
      potStirredReward: 10,
      potReadyIncrement: 1,
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
            this.room.outputs[0].display.show();

            this.room.potReady = false;
            modifyRoomScore(this.room, this.room.potStirredReward * timeScale);
            let resultEvent = $.extend({}, this.room.events["pot-ready"]);
            let randomTicks = this.room.intervals[Math.floor(Math.random() * this.room.intervals.length)] * timeScale;
            // console.log("Ticks: ",randomTicks);
            resultEvent.ticks = randomTicks;
            resultEvent.room = this.room;
            events.push(resultEvent);
          }
        },
        'pot-ready' : {
          ticks: 0,
          action: function() {
            this.room.outputs[0].display.hide();
            this.room.potReady = true;
            showInputs(this.room);
          }
        }
      },
      inputCall: function(room, input) {
        hideInputs(room);
        let resultEvent = $.extend({}, room.events["pot-stirred"]);
        resultEvent.room = room;
        events.push(resultEvent);
      },
      calculateScore: function() {

      },
      activateRoom: function() {
        // showInputs(this);
      },
      deactivateRoom: function() {

      },
      setup: function() {
        setupOutputs(this);
        setupInputs(this);
      },
      update: function (delta, active) {
        // console.log(this);
        if (this.potReady) {
          // console.log(this.counter);
          this.potReadyCount += this.potReadyIncrement / timeScale;
          this.counter = this.counter - this.potReadyCount;
          // console.log("pot counter: ", this.potReadyCount);
          // console.log("advanced decrement: ", this.counter + " : " + this.active);
          // console.log(this.counter);
        } else {
          // console.log(this.counter);
          this.potReadyCount = 0;
          this.counter = this.counter - 1;
          // console.log("regular decrement: ", this.counter + " : " + this.active);
          // console.log(this.counter);
        }
      }
    },
    {
      id: 'dining',
      name: 'Dining',
      counter: 50.0 * timeScale,
      liftCounter: 0,
      liftThreshold: 30,
      liftWaitMin: 2,
      liftWaitMax: 3,
      active: false,
      inputs: [
        {
          id: "lift-chair",
          icon: "heart",
          class: "top",
          position: [0, 0]
        }
      ],
      outputs: [],
      events: {
        'knockdown-chair' : {
          ticks: 0,
          action: function() {
            console.log('knock-down');
            showInputs(this.room);
            this.room.scheduleLift();
          }
        },
        'check-lift' : {
          ticks: 0,
          action: function() {
            // console.log('check-lift');
            if(this.room.liftThreshold < this.room.liftCounter) {
              // console.log('release');
              this.room.liftCounter = 0;
              modifyRoomScore(this.room, 6 * timeScale);
              hideInputs(this.room);
              this.room.scheduleKnockdown();
            } else {
              // console.log('persist');
              this.room.scheduleLift();
            }
          }
        }
      },
      scheduleKnockdown: function() {
        let knockEvent = $.extend({}, this.events["knockdown-chair"]);
        knockEvent.room = this;
        knockEvent.ticks = (Math.floor(Math.random()*this.liftWaitMax) + this.liftWaitMin) * timeScale;
        events.push(knockEvent);
      },
      scheduleLift: function() {
        let checkLiftEvent = $.extend({}, this.events["check-lift"]);
        checkLiftEvent.room = this;
        events.push(checkLiftEvent);
      },
      inputCall: function(room, input) {
        this.liftCounter++;
        console.log(this.liftCounter);
      },
      setup: function() {
        setupOutputs(this);
        setupInputs(this);
        this.scheduleKnockdown();
      },
      activateRoom: function() {

      },
      deactivateRoom: function() {

      },
      update: function (delta, active) {
        console.log(this.name, this.counter + " : " + this.active);
        this.counter = this.counter - 1;

        // determine state transition
        if (this.knockedOver) {

        }
        // put the event on if state broken

      }
    },
    // {
    //   id: 'kids',
    //   name: 'Kids Room',
    //   counter: 50.0 * timeScale,
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
      room.display.hide();
      if (room.setup) {
        room.setup();
      }
      scene.append(room.display);
      if (activeRoomIndex === roomIndex) {
        triggerActivation(room);
      }
    }
  }

  function triggerDeactivation() {
    activeRoom.active = false;
    activeRoom.display.hide();
    console.log(activeRoom);
    activeRoom.deactivateRoom();
  }

  function triggerActivation(room) {
    activeRoom = room;
    activeRoom.active = true;
    room.display.show();
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

  function setupOutputs(room) {
    for(let i = 0; i < room.outputs.length; i++) {
      let output = room.outputs[i];
      output.display = $(`<img id="${output.id}" class="icon ${output.classes}" ` +
          `src="assets/${room.id}-icon-${output.icon}.png"/>`);

      output.display.css({
        left: output.position[0],
        top: output.position[1],
      });

      output.display.hide();
      room.display.find(`#${room.id}-container`)
          .append(output.display);
    }
  }

  function showInputs(room) {
    this.console.log("show inputs:", room.id);
    for (let i = 0; i < room.inputs.length; i++) {
      room.inputs[i].display.show();
    }
  }

  function hideInputs(room) {
    this.console.log("hide inputs:", room.id);
    for (let i = 0; i < room.inputs.length; i++) {
      room.inputs[i].display.hide();
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

  function showArrows() {
    arrowRight.show();
    arrowLeft.show();
  }

  function hideArrows() {
    arrowLeft.hide();
    arrowRight.hide();
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

    if (accumulator > tickMillis) {
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