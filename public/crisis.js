
(function() {

  // lounge
  let loungeBaseCounterValue = 50.0;
  let loungeRewardValues = [1, 2, 3];
  let loungeBaseScaleFactor = 1;
  let loungeScaleFactorIncrement = 1;
  let loungeTalkEventDelay = 2;
  let loungeResponseEventDelay = 1;
  let loungeTickDecrementValue = 1;

  // kitchen
  let kitchenBaseCounterValue = 50.0;
  let kitchenAttentionTickIntervals = [3, 5, 10];
  let kitchenPotStirredReward = 10;
  let kitchenPotReadyIncrement = 0.1;
  let kitchenBaseDecrementCounter = 0;
  let kitchenPotStirredEventDelay = 0;
  let kitchenPotReadyEventDelay = 0;
  let kitchenPotStirredTickDecrementValue = 1;

  // dining
  let diningBaseCounterValue = 50.0;
  let diningInitialLiftCounter = 0;
  let diningLiftCounterThreshold = 30;
  let diningFlippedIntervalTickDelays = [3, 7, 10];
  let diningFlipChairEventDelay = 0;
  let diningCheckLiftEventDelay = 0;
  let diningLiftBaseTickReward = 6;
  let diningBaseCounterTickDecrement = 1;
  let diningKnockedCounterTickDecrement = 2;

  // kid
  let kidBaseCounterTicks = 50.0;
  let kidRewardTicksForCorrect = 2;
  let kidRewardTicksForInCorrect = 0;
  let kidDrawPickedEventDelay = 0;
  let kidHidePickedEventDelay = 2;
  let kidHideOutputsEventDelay = 2;
  let kidNeedsEventDelay = 0;
  let kidFlashInfoEventDelay = 1;
  let kidNeedsEventIntervals = [2, 2, 2];
  let kidBaseDecrementTick = 1;

  // game vars
  let gameTime = (new Date()).getTime();
  let tickMillis = 250;
  let timeScale = 1000 / tickMillis;

  // game view
  let gameContainer;
  let scene;
  let timerContainer;
  let scoreTimer;
  let arrowLeft;
  let arrowRight;

  let events = [];

  let transitionTicks = 0.25;
  let transitionRoom = {
    id: 'transition',
    name: 'transition',
    display: $('<h1>transition</h1>'),
    inputs: [],
    outputs: [],
    events: {
      "transition" : {
        ticks: transitionTicks * timeScale,
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

  let rooms = [
    {
      id: 'lounge',
      name: 'Lounge',
      counter: loungeBaseCounterValue * timeScale,
      scalefactor: loungeBaseScaleFactor,
      rewardValues: loungeRewardValues,
      loseMessage: "Your partner left you!",
      speech: true,
      characters: true,
      active: false,
      inputs: [
        {
          id: "talk1",
          icon: "heart",
          classes: "",
          position: [322, 171]
        },
        {
          id: "talk2",
          icon: "pot",
          classes: "",
          position: [415, 171]
        },
        {
          id: "talk3",
          icon: "dining",
          classes: "",
          position: [322, 239]
        },
        {
          id: "talk4",
          icon: "kids",
          classes: "",
          position: [415, 239]
        },
      ],
      outputs: [
        {
          id: "talk-back",
          icon: "heart",
          position: [204, 254]
        },
      ],
      events: {
        "talk-event": {
          ticks: loungeTalkEventDelay * timeScale,
          action: function () {
            console.log("talk event!")
            this.room.outputs[0].display.show();
            modifyRoomScore(this.room, this.room.calculateScore());
            this.room.roomUpkeep();

            let responseEvent = $.extend({}, this.room.events["response-event"]);
            responseEvent.room = this.room;
            events.push(responseEvent);
          }
        },
        "response-event": {
          ticks: loungeResponseEventDelay * timeScale,
          action: function() {
            console.log("response event!");
            this.room.outputs[0].display.hide();
            showInputs(this.room);
          }
        }
      },
      inputCall: function(room, input) {
        // console.log(input);
        // console.log(room.name, room.counter + " : " + room.active);
        hideInputs(room);
        let talkEvent = $.extend({}, this.events["talk-event"]);
        talkEvent.room = this;
        events.push(talkEvent);
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
        this.scalefactor += loungeScaleFactorIncrement;
      },
      activateRoom: function() {
        // showInputs(this);
      },
      deactivateRoom: function() {
        this.scalefactor = loungeBaseScaleFactor;
      },
      setup: function() {
        setupOutputs(this);
        setupInputs(this);
      },
      update: function (delta, active) {
        // console.log(room.name, room.counter + " : " + room.active);
        this.counter = this.counter - loungeTickDecrementValue;
      }
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      loseMessage: "Your kitchen blew up!",
      counter: kitchenBaseCounterValue * timeScale,
      active: false,
      intervals: kitchenAttentionTickIntervals,
      potReadyCount: kitchenBaseDecrementCounter,
      potReady: true,
      potStirredReward: kitchenPotStirredReward,
      potReadyIncrement: kitchenPotReadyIncrement,
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
          ticks: kitchenPotStirredEventDelay,
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
          ticks: kitchenPotReadyEventDelay,
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
          this.potReadyCount += this.potReadyIncrement;
          this.counter = this.counter - this.potReadyCount;
          // console.log("pot counter: ", this.potReadyCount);
          // console.log("advanced decrement: ", this.counter + " : " + this.active);
          // console.log(this.counter);
        } else {
          // console.log(this.counter);
          this.potReadyCount = 0;
          this.counter = this.counter - kitchenPotStirredTickDecrementValue;
          // console.log("regular decrement: ", this.counter + " : " + this.active);
          // console.log(this.counter);
        }
      }
    },
    {
      id: 'dining',
      name: 'Dining',
      loseMessage: "Your cat is evil!",
      counter: diningBaseCounterValue * timeScale,
      liftCounter: diningInitialLiftCounter,
      liftThreshold: diningLiftCounterThreshold,
      knockedOverTickIntervals: diningFlippedIntervalTickDelays,
      baseDecrement: diningBaseCounterTickDecrement,
      knockedDecrement: diningKnockedCounterTickDecrement,
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
          ticks: diningFlipChairEventDelay,
          action: function() {
            console.log('knock-down');
            showInputs(this.room);
            this.room.knockedOver = true;
            this.room.scheduleLift();
          }
        },
        'check-lift' : {
          ticks: diningCheckLiftEventDelay,
          action: function() {
            console.log('check-lift');
            if(this.room.liftThreshold < this.room.liftCounter) {
              console.log('release');
              this.room.liftCounter = diningInitialLiftCounter;
              modifyRoomScore(this.room, diningLiftBaseTickReward * timeScale);
              hideInputs(this.room);
              this.room.scheduleKnockdown();
            } else {
              console.log('persist');
              this.room.scheduleLift();
            }
          }
        }
      },
      scheduleKnockdown: function() {
        let knockEvent = $.extend({}, this.events["knockdown-chair"]);
        knockEvent.room = this;
        knockEvent.ticks = this.knockedOverTickIntervals[Math.floor(Math.random()*this.knockedOverTickIntervals.length)] * timeScale;
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
        if (this.knockedOver) {
          this.counter = this.counter - this.knockedDecrement;
        } else {
          this.counter = this.counter - this.baseDecrement;
        }
      }
    },
    {
      id: 'kids',
      name: 'Kids Room',
      loseMessage: "Where's my toy!?",
      counter: kidBaseCounterTicks * timeScale,
      active: false,
      toys: ['a', 'b', 'c', 'd', 'e'],
      draws: ['a', 'b', 'c', 'd', 'e', 'x', 'x', 'x', 'x', 'x'],
      correctMatchReward: kidRewardTicksForCorrect * timeScale,
      incorrectMatchReward: kidRewardTicksForInCorrect * timeScale,
      childNeedsEventIntervals: kidNeedsEventIntervals,
      inputs: [
        {
          id: "draw-0",
          value: 0,
          icon: "x",
          position: [0*0, 0]
        },
        {
          id: "draw-1",
          value: 1,
          icon: "x",
          position: [1*65, 0]
        },
        {
          id: "draw-2",
          value: 2,
          icon: "x",
          position: [2*65, 0]
        },
        {
          id: "draw-3",
          value: 3,
          icon: "x",
          position: [3*65, 0]
        },
        {
          id: "draw-4",
          value: 4,
          icon: "x",
          position: [4*65, 0]
        },
        {
          id: "draw-5",
          value: 5,
          icon: "x",
          position: [5*65, 0]
        },
        {
          id: "draw-6",
          value: 6,
          icon: "x",
          position: [6*65, 0]
        },
        {
          id: "draw-7",
          value: 7,
          icon: "x",
          position: [7*65, 0]
        },
        {
          id: "draw-8",
          value: 8,
          icon: "x",
          position: [8*65, 0]
        },
        {
          id: "draw-9",
          value: 9,
          icon: "x",
          position: [9*65, 0]
        }
      ],
      outputs: [
        {
          id: "draw-output",
          icon: "x",
          position: [0, 58]
        },
        {
          id: "draw-output",
          icon: "x",
          position: [0, 58*2]
        }
      ],
      events: {
        "draw-picked": {
          ticks: kidDrawPickedEventDelay * timeScale,
          action: function() {
            console.log('draw picked!');
            $.each(this.room.inputs, function(index, input) {
              input.display.hide();
            });
            this.room.outputs[0].icon = this.room.draws[this.input.value];
            this.room.outputs[0].display
                .attr('src', `assets/${this.room.id}-icon-${this.room.draws[this.input.value]}.png`);
            this.room.outputs[0].display.show();

            if (this.room.outputs[0].icon === this.room.outputs[1].icon) {
              console.log('correct!');
              modifyRoomScore(this.room, this.room.correctMatchReward);
              hideInputs(this.room);
              this.room.scheduleHideOutputs();
            } else {
              console.log('incorrect!');
              modifyRoomScore(this.room, this.room.incorrectMatchReward);
              this.room.scheduleHidePicked();
            }
          }
        },
        "hide-picked": {
          ticks: kidHidePickedEventDelay * timeScale,
          action: function() {
            console.log('hide picked!');
            this.room.outputs[0].display.hide();
            $.each(this.room.inputs, function(index, input) {
              input.display.show();
            });
          }
        },
        "hide-outputs": {
          ticks: kidHideOutputsEventDelay * timeScale,
          action: function() {
            console.log('hide picked!');
            $.each(this.room.outputs, function(index, output) {
              output.display.hide();
            });
            this.room.scheduleChildNeedsEvent();
          }
        },
        "child-needs": {
          ticks: kidNeedsEventDelay,
          action: function() {
            console.log('child needs!');
            let toyIndex = Math.floor(Math.random() * this.room.toys.length);
            this.room.outputs[1].icon = this.room.toys[toyIndex];
            this.room.outputs[1].display
                .attr('src', `assets/${this.room.id}-icon-${this.room.toys[toyIndex]}.png`);
            this.room.outputs[1].display.show();
            $.each(this.room.inputs, function(index, input) {
              input.display.show();
            });
          },
        },
        "flash-info": {
          ticks: kidFlashInfoEventDelay * timeScale,
          action: function() {
            console.log('flash info!');
            if (this.startIndex !== 0) {
              console.log('clear last:', this.startIndex);
              for(let i = 0; i < this.room.inputs.length; i++) {
                let content = 'x';
                this.room.inputs[i].display.hide();
                this.room.inputs[i].display
                    .attr('src', `assets/${this.room.id}-icon-${content}.png`);
              }
              this.room.scheduleChildNeedsEvent();
              this.room.flashed=true;
            } else {
              console.log('show next:', this.startIndex);
              for(let i=0; i < this.room.inputs.length; i++) {
                let content = this.room.draws[this.room.inputs[i].value];
                this.room.inputs[i].display
                    .attr('src', `assets/${this.room.id}-icon-${content}.png`);
                this.room.inputs[i].display.show();
              }
              this.room.scheduleFlash(-1);
            }
          },
        },
        "flash-info-split": {
          ticks: 1 * timeScale,
          action: function() {
            console.log('flash info!');
            if (this.startIndex !== 0) {
              console.log('clear last:', this.startIndex);
              for(let i = this.startIndex === -1 ? 5 : 0;
                  i < (this.startIndex === -1 ? 5 : 0) + 5;
                  i++) {
                let content = 'x';
                this.room.inputs[i].display.hide();
                this.room.inputs[i].display
                    .attr('src', `assets/${this.room.id}-icon-${content}.png`);
              }
            }

            if (this.startIndex !== -1) {
              console.log('show next:', this.startIndex);
              for(let i=this.startIndex; i < this.startIndex+5; i++) {
                let content = this.room.draws[this.room.inputs[i].value];
                this.room.inputs[i].display
                    .attr('src', `assets/${this.room.id}-icon-${content}.png`);
                this.room.inputs[i].display.show();
              }
            }

            if (this.startIndex === 0) {
              this.room.scheduleFlash(5);
            } else if (this.startIndex === 5) {
              this.room.scheduleFlash(-1);
            } else {
              this.room.scheduleChildNeedsEvent();
            }
          },
        }
      },
      scheduleHidePicked: function() {
        let hidePickedEvent = $.extend({}, this.events["hide-picked"]);
        hidePickedEvent.room = this;
        events.push(hidePickedEvent);
      },
      scheduleHideOutputs: function() {
        let hidePickedEvent = $.extend({}, this.events["hide-outputs"]);
        hidePickedEvent.room = this;
        events.push(hidePickedEvent);
      },
      inputCall: function(room, input) {
        let drawPickedEvent = $.extend({}, this.events["draw-picked"]);
        drawPickedEvent.room = this;
        drawPickedEvent.input = input;
        events.push(drawPickedEvent);
      },
      scheduleChildNeedsEvent: function () {
        let childNeedsEvent = $.extend({}, this.events["child-needs"]);
        childNeedsEvent.ticks = this.childNeedsEventIntervals[Math.floor(Math.random()*this.childNeedsEventIntervals.length)] * timeScale;
        childNeedsEvent.room = this;
        events.push(childNeedsEvent);
      },
      scheduleFlash: function(startIndex) {
        let flashInfoEvent = $.extend({}, this.events["flash-info"]);
        flashInfoEvent.room = this;
        flashInfoEvent.startIndex = startIndex;
        events.push(flashInfoEvent);
      },
      shuffleDraws: function() {
        let j, x, i;
        for (i = this.draws.length - 1; i > 0; i--) {
          j = Math.floor(Math.random() * (i + 1));
          x = this.draws[i];
          this.draws[i] = this.draws[j];
          this.draws[j] = x;
        }
      },
      setup: function() {
        setupOutputs(this);
        setupInputs(this);
        hideInputs(this);
        this.shuffleDraws();
      },
      activateRoom: function() {
        if (!this.flashed) {
          this.scheduleFlash(0);
        }
      },
      deactivateRoom: function() {

      },
      update: function (delta, active) {
        console.log(this.name, this.counter + " : " + this.active);
        this.counter = this.counter - kidBaseDecrementTick;
      }
    }
  ];

  let activeRoom;
  // let activeRoomIndex = 0;
  let activeRoomIndex = Math.floor(Math.random() * rooms.length);

  function setup() {
    gameContainer = $('#game-container');
    timerContainer = $('#timers-container');
    scoreTimer = $('#score-timer');
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
      if (room.characters) {
        room.container.append(`<img class="characters" src="assets/${room.id}-characters.png"/>`)
      }
      if (room.speech) {
        room.container.append(`<img class="speech" src="assets/${room.id}-speech.png"/>`)
      }
      room.display.hide();
      if (room.setup) {
        room.setup();
      }

      room.counterDisplay = $(`
        <div id="${room.id}-timer">
          <h4>${room.name}</h4>
          <h3><b id="${room.id}-timer-value">${room.counter}</b></h3>
        </div>
      `);
      room.counterValueDisplay = room.counterDisplay.find(`#${room.id}-timer-value`);
      timerContainer.append(room.counterDisplay);

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

  function showOutputs(room) {
    this.console.log("show outputs:", room.id);
    for (let i = 0; i < room.outputs.length; i++) {
      room.outputs[i].display.show();
    }
  }

  function hideOutputs(room) {
    this.console.log("hide outputs:", room.id);
    for (let i = 0; i < room.outputs.length; i++) {
      room.outputs[i].display.hide();
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

    $.each(rooms, function(index, room) {
      updateTimers(room);
    });

    if (accumulator > tickMillis) {
      processEvents();
      for(var roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
        rooms[roomIndex].update(delta, false);
      }
      if (!gameOver) {
        checkGameState();
      }
      accumulator = 0;
    } else {
      accumulator = accumulator + delta;
    }

    if (!gameOver) {
      updateScoreTimer(delta);
    }
    gameTime = stepTime;

    window.requestAnimationFrame(loop);
  }

  let timeTally = 0;
  function updateScoreTimer(delta) {
    console.log(delta);
    console.log(timeTally);
    timeTally = timeTally + delta;
    scoreTimer.html(`${(timeTally/1000/60).toFixed(0)}m ${((timeTally/1000)%60).toFixed(0)}.${((timeTally)%1000).toFixed(0)}s `);
  }

  function updateTimers(room) {
    room.counterValueDisplay.html(Math.floor(room.counter).toFixed(0));
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

  let deadRoom;
  let gameOver = false;
  function checkGameState() {
    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
      let room = rooms[roomIndex];
      if (room.counter <= 0) {
        scene.html(`<h1>Game Over</h1><br/><h3><i>${room.loseMessage}</i></h3>`);
        timerContainer.hide();
        deadRoom = room.name;
        gameOver = true;
      }
    }
  }

  setup();
  start();
})();