
require('pixi-sound');

var WebFont = require('webfontloader');

var particles = require('./particles.js');
var utils = require('./utils.js');
var actor = require('./actor.js');

WebFont.load({
  google: {
    families: ['Encode Sans Expanded:900']
  }
});


class Board extends PIXI.Container {

  constructor() {
    super();
    var board = this;
    var i;
    this.numbers = [];

    this.state = 'loading';

    var style = {
      fontFamily: 'Encode Sans Expanded',
      fontSize: 32,
      fontWeight: 900,
      fill: 'white',
    };

    var onTextDown = function () { board.state == 'playing' && board.onTextDown(this); };
    var onTextUp = function () { board.state == 'playing' && board.onTextUp(this); };
    var onTextOver = function () { board.state == 'playing' && board.onTextOver(this); };
    var onTextOut = function () { board.state == 'playing' && board.onTextOut(this); };

    // width is 768
    // x margin is 34/34, grid is 700

    for ( i = 0 ; i<100 ; i++ ) {
      var t = new PIXI.Text(''+(1+i), style); //Object.assign({}, style));
      t.resolution = 2;
      t.num = i;
      this.addChild(t);
      this.numbers[i] = t;
      t.hitArea = new PIXI.Rectangle(-35, -35, 70, 70);
      t.x = 0+70*(1+i%10);
      t.y = 15+70*Math.floor(1+i/10);
      t.anchor.set(0.5,0.5);
      t.interactive = true;
      t.on('pointerdown', onTextDown )
        .on('pointerup', onTextUp)
        .on('pointerupoutside', onTextUp)
        .on('pointerover', onTextOver)
        .on('pointerout', onTextOut);
    }

    var gfx = new PIXI.Graphics();

    gfx.lineStyle(4, 0xffffff, 1);

    for ( i = 0 ; i < 11 ; i++) {
      var y = 50+70*i;
      gfx.moveTo(34, y);
      gfx.lineTo(734, y);
    }
    for ( i = 0 ; i < 11 ; i++) {
      var x = 34+70*i;
      gfx.moveTo(x, 50);
      gfx.lineTo(x, 750);
    }

    this.addChild(gfx);

    var grass = new PIXI.Sprite.fromImage('images/grass.png');
    grass.y = 920;
    this.addChild(grass);


    var evilSVG = require('pixi-svg-loader!../images/evil.svg');
    this.evil = new actor.SVGActor(evilSVG, {
      idle: {
        head: {
          rotation: t => 0.1*Math.sin(t*0.001)
        },
        lowerbody: {
          rotation: t => 0.1*Math.sin(t*0.0012),
          position: (t, _, p, o) => new PIXI.Point(p.x, o.y+10*Math.sin(t*0.003))
        }
      },
      jump: {
        _duration: 500,
        _next: 'idle',
        rotation: t => 0.2*Math.sin(0.001*t*5*Math.PI/0.5),
        position: (t, e, p, o) => new PIXI.Point(p.x+e*60/0.5, o.y-10*Math.sin(10*Math.PI*t/500))
      }
    }, {
      scale: new PIXI.Point(0.4, 0.4),
      y: 880,
      x: 50,
    });
    this.addChild(this.evil);
    game.actors.push(this.evil);

    var fairySVG = require('pixi-svg-loader!../images/fairy.svg');
    this.fairy = new actor.SVGActor(fairySVG, {
      idle: {
        lwing: {
          rotation: t => 0.3*Math.sin(t*0.01)
        },
        rwing: {
          rotation: t => 0.3*Math.cos(t*0.01)
        },
      },
      jump: {
        _duration: 500,
        _next: 'idle',
        rotation: t => 0.001*t*2*Math.PI/0.5,
        position: (t, e, p, o) => new PIXI.Point(p.x+e*60/0.5, o.y-100*Math.sin(Math.PI*t/500))
      },

    }, {
      scale: new PIXI.Point(-0.4, 0.4),
      y: 880,
      x: 80,
    });

    this.addChild(this.fairy);
    game.actors.push(this.fairy);

    var unicornSVG = require('pixi-svg-loader!../images/unicorn.svg');
    this.unicorn = new actor.SVGActor(unicornSVG, {
      idle: {
        tail: {
          rotation: t => 0.3*Math.sin(t*0.001)
        },
        head: {
          rotation: t => 0.2*Math.sin(t*0.0003)
        }
      }
    });
    this.unicorn.scale.x = 0.4;
    this.unicorn.scale.y = 0.4;
    this.unicorn.y = 880;
    this.unicorn.x = 768-this.unicorn.width/2;
    this.addChild(this.unicorn);
    game.actors.push(this.unicorn);

    this.reset();
  }

  reset() {
    this.fairy.position.x = 80;
    this.evil.x = 50;
    if (game.sounds.start)
      game.sounds.start.play();
    this.state = 'playing';
  }

  update() {
    if (this.state != 'playing') return;
    if (this.evil.x > this.unicorn.x-this.unicorn.width/2) this.fail();
    if (this.fairy.x > this.unicorn.x-this.unicorn.width/2) this.win();
  }

  correct() {
    if (game.sounds.success)
      game.sounds.success.play();
    this.fairy.setState('jump');
    this.state = 'anim';
    setTimeout(() => this.state = 'playing', 500);
  }
  wrong() {
    if (game.sounds.fail)
      game.sounds.fail.play();
    this.evil.setState('jump');
    this.state = 'anim';
    setTimeout(() => this.state = 'playing', 500);
  }



  win() {
    this.state = 'finished';
    if (game.sounds.win)
      game.sounds.win.play();
    if (game.sounds.horse)
      game.sounds.horse.play();

    game.hearts(768/2, 800/3);
    setTimeout(() => this.reset(), 5000);
  }

  fail() {
    this.state = 'finished';
    if (game.sounds.alert)
      game.sounds.alert.play();
    if (game.sounds.haha)
      game.sounds.haha.play();

    game.rain();
    setTimeout(() => this.reset(), 7000);
  }

  onTextOut(t) {
  }
  onTextOver(t) {
  }
  onTextUp(t) {
  }
  onTextDown(t) {
  }


}

class Board1 extends Board {
  onTextOut(t) {
    t.style.fill='white';
  }
  onTextOver(t) {
    t.style.fill='red';
  }
  onTextUp(t) {
  }
  onTextDown(t) {
    this.success();
  }
}


class Board2 extends Board {
  constructor() {
    super();

    var style = {
      fontFamily: 'Encode Sans Expanded',
      fontSize: 32,
      fontWeight: 900,
      fill: 'yellow',
    };


    this.text = new PIXI.Text('Wo ist ?', style);
    this.text.x = 400;
    this.text.y = 780;
    this.text.anchor.set(0.5, 0.5);
    this.addChild(this.text);

    this.next();

  }

  reset() {
    super.reset();
    this.numbers.forEach( n => n.style.fill = null );

    this.targets = Array.from(Array(100).keys());
    utils.shuffle(this.targets);

    for (var i=0 ; i<10 ; i++) {
      var x = this.targets.pop();
      this.numbers[x].style.fill = 'white';
    }
    if (this.text) this.next(); // initially not created yet!

  }

  next() {
    this.target = this.targets.pop();
    this.text.text = 'Wo ist '+(this.target+1)+'?';
  }

  onTextOut(t) {
    //this.style.fill='white';
  }
  onTextOver(t) {
    //this.style.fill='red';
  }
  onTextUp(t) {
  }
  onTextDown(t) {
    if (this.target == t.num) {
      t.style.fill='white';
      game.stars(t.x, t.y);
      this.correct();
      this.target = this.targets.pop();
      this.next();
    } else {
      this.wrong();
    }

  }
}


class Game {


  load() {

    // TODO: no real need to reassign these? Just use loader?

    this.sounds = {};
    var sounds = [
      {name:"start", url:"./sounds/322929__rhodesmas__success-04.wav" },
      {name:"win", url:"./sounds/320653__rhodesmas__success-01.wav" },
      {name:"success", url:"./sounds/342751__rhodesmas__coins-purchase-3.wav" },
      {name:"alert", url:"./sounds/380265__rhodesmas__alert-02.wav" },
      {name:"fail", url:"./sounds/342756__rhodesmas__failure-01.wav" },
      {name:"haha", url:"./sounds/219110__zyrytsounds__evil-laugh.wav" },
      {name:"horse", url:"./sounds/59569__3bagbrew__horse.wav" },

    ];
    PIXI.loader.add(sounds).load((_, resources) => {

      sounds.forEach( s => this.sounds[s.name] = resources[s.name].sound );

      //this.sounds.success.volume = 0.5;
    });
  }

  constructor() {
    this.load();

    var targetWidth = 768;
    var targetHeight = 1024;


    var rendererResize = () => {
      var width = window.innerWidth,
          height = window.innerHeight,
          canvas = this.app.view;

      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      this.app.renderer.resize(canvas.width, canvas.height);

      if (height / targetHeight < width / targetWidth) {
        this.main.scale.x = this.main.scale.y = window.devicePixelRatio * height / targetHeight;

      } else {
        this.main.scale.x = this.main.scale.y = window.devicePixelRatio * width / targetWidth;
      }

      this.main.y = canvas.height /2 - (this.main.scale.x)*targetHeight/2;
      this.main.x = canvas.width /2 - (this.main.scale.x)*targetWidth/2;

      console.log('canvas wh sw sh', canvas.width, canvas.height, canvas.style.width, canvas.style.height);
      console.log('stage xys', this.main.x, this.main.y, this.main.scale.x);
      console.log('renderer wh', this.app.renderer.width, this.app.renderer.height);

      window.scrollTo(0, 0);
    };

    window.addEventListener('resize', rendererResize);
    window.addEventListener('deviceOrientation', rendererResize);

    this.app = new PIXI.Application({backgroundColor: 0x1099bb, antialias: true});

    document.body.appendChild(this.app.view);

    this.main = new PIXI.Container();

    this.app.stage.addChild(this.main);

    setTimeout(rendererResize, 200);

    this.last_time = 0;

    this.actors = [];


  }

  stars(x,y) {
    this.main.addChild(new particles.Stars(x, y));
  }
  rain() {
    this.main.addChild(new particles.Rain());
  }
  hearts(x,y) {
    this.main.addChild(new particles.Hearts(x, y));
  }

  update(t) {

	// Update the next frame
	requestAnimationFrame((t) => this.update(t));

    if (!this.last_time) {
      this.last_time = t;
      return;
    }

    var delta = (t - this.last_time);
    this.last_time = t;

    this.actors.forEach(actor => actor.update(t, delta*0.001));
	// this.app.renderer.render(this.main);
  }

}


var game = new Game();
game.update();

var b = new Board2();

game.main.addChild(b);
game.actors.push(b);
