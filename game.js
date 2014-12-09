/*
    Go away. You don't want to read this.
 */

function GameState() {}

GameState.prototype.preload = function() {
    game.load.image('flake', '/assets/beautifulflake.png');
    game.load.image('blood', '/assets/blood.png');
    game.load.image('bg', '/assets/bg-3.png');
    game.load.spritesheet('ss', '/assets/sms-1.png', 32, 32);
    game.load.spritesheet('human', '/assets/human-3.png', 32, 32);
    game.load.image('monad', '/assets/monad.png');
    game.load.script('soul', '/filters/Soul.js');
    game.load.text("soulshader", "/filters/shaders/Soul.fs");
    game.load.script('normal', '/filters/Normal.js');
    game.load.text("normalshader", "/filters/shaders/Normal.fs");
    game.load.script('reallynormal', '/filters/ReallyNormal.js');
    game.load.text("reallynormalshader", "/filters/shaders/ReallyNormal.fs");
    game.load.audio('posess', '/assets/slurp2.wav');
    game.load.audio('unposess', '/assets/exhale-1.wav');
    game.load.audio('melt', '/assets/melt-1.wav');
    game.load.audio('attack', '/assets/attack.wav');
    game.load.audio('ambient', '/assets/soul.wav');
    game.load.audio('ambientSoul', '/assets/actualrealsoul-1.wav');
};

var cursors, fpsText, ground, emitter, soul, explode, posess, unposess;

var player, sms, humans, meltBar, ttl;

var soulFilter, normFilter, rnormFilter;

var ambient, ambientSoul;

var space;

var border = {
    top: 150,
    bottom: 620,
    left: 150,
    right: 1280
};

function dist(a, b) {
    return vec2.from(a).dist(b);
}
function setupSound(sound) {
    var panner = sound.context.createPanner();
    sound.externalNode = panner;
    panner.connect(sound.gainNode);
}

function playSoundAt(sound, x, y) {
    sound.externalNode.setPosition((x - 640)/640 * 0.8, (y - 360)/360 * -0.8, player == soul ? -10 : -1);
    sound.play();
}

function Human(x, y) {
    this.sprite = game.add.sprite(x, y, 'human', 0);
    this.sprite.anchor.setTo(0.5, 0.5);
    game.physics.enable(this.sprite, Phaser.Physics.ARCADE);
    this.sprite.body.collideWorldBounds = true;
    this.sprite.body.immovable = false;

    this.speed = game.rnd.integerInRange(50, 60);

    this.sprite.animations.add('walk', [1, 2, 1, 3], 3);
    this.sprite.animations.add('angrywalk', [13, 14, 13, 15], 3);
    this.sprite.animations.add('death', [4, 5, 6, 7, 8, 9, 10, 11], 12);

    this.sprite.human = this;
    humans.group.add(this.sprite);

    this.dir = 0;

    this.enter(ESCAPING);
}

Human.prototype.die = function() {

    if(!this.sprite.alive)
        return;

    this.enter(IS_KILL);
    this.sprite.alive = false;

    var blood = game.add.emitter(this.sprite.x, this.sprite.y, 400);

    blood.makeParticles('blood');

    blood.gravity = 0;
    blood.setAlpha(0.8, 0, 1000);
    blood.setScale(1, 0, 0.7, 0, 1000);
    blood.setXSpeed(-100, 100);
    blood.setYSpeed(-10, 50);

    blood.explode(1000, 100);

    setTimeout(function() {
        blood.destroy();
    }, 1000);

    humans.splice(humans.indexOf(this), 1);
    humans.group.remove(this.sprite);
    game.add.existing(this.sprite);
};


// Professional grade fsm

var IS_KILL = 10;
var AFK = 0;
Human.prototype.live0 = function() {
    if(this.isAngry && player != soul && dist(this.sprite, player) < 80)
        return this.enter(FLEE);
};

var ESCAPING = 1;
Human.prototype.enter1 = function() {
    this.sprite.animations.play('walk', 3, true);
    this.sprite.body.velocity.x = this.speed;
    //game.physics.arcade.moveToXY(this.sprite, 1280, this.sprite.y);
};
Human.prototype.live1 = function() {
    if(this.sprite.x > 1280 - 34)
        return this.enter(CONFUSED);
    if(player != soul && dist(this.sprite, player) < 80) {
        this.enter(FLEE);
    } else {
        this.sprite.body.velocity.x = this.speed;
        this.sprite.body.velocity.y = 0;

        game.physics.arcade.collide(this.sprite, sms, function(_, it) {
            this.sprite.body.velocity.x = 0;
            this.sprite.body.velocity.y = this.speed * (this.sprite.y > it.y ? 1 : -1);
        }.bind(this));
            //this.dir = 0;
        /*} else {
            if(this.sprite.body.touching.right) {
                this.startX = this.sprite.x;
                if(this.sprite.y > 360)
                    this.dir = -this.speed;
                else
                    this.dir = this.speed;
            } else if(this.sprite.x > this.startX)
                this.dir = 0;
        }*/

        //this.sprite.body.velocity.y = this.dir;
    }
};
Human.prototype.leave1 = function() {
    this.sprite.frame = 0;
    this.sprite.animations.stop('walk');
    this.sprite.body.velocity.x = 0;
    this.sprite.body.velocity.y = 0;
};

var FLEE = 2;
Human.prototype.enter2 = function() {
    this.sprite.animations.play('walk', 6, true);
    //playSoundAt(scream, this.sprite.x, this.sprite.y);
    //this.sprite.body.velocity.x = 100;
    //game.physics.arcade.moveToXY(this.sprite, 1280, this.sprite.y);*/
    if(this.isAngry) this.live2(); // speed boost
};
Human.prototype.live2 = function() {
    game.physics.arcade.collide(this.sprite, sms);

    if(player != soul && dist(this.sprite, player) < 80) {
        var fleespeed = 72;
        if(this.isAngry) fleespeed = 85;
        this.panic = 60;

        var pos = vec2.from(this.sprite);
        var danger = vec2.from(player);

        var pressure = pos.minus(danger).norm().times(100 - pos.dist(danger)).plus(new vec2(10, 0));

        humans.group.forEachAlive(function(human) {
            if(human == this.sprite) return;
            var him = vec2.from(human);
            var diff = pressure.minus(him);
            if(diff.len() < 80)
                pressure = pressure.plus(diff.norm().times(80 - diff.len()));
        }.bind(this));

        sms.forEachAlive(function(human) {
            if(human == this.sprite) return;
            var him = vec2.from(human);
            var diff = pressure.minus(him);
            if(diff.len() < 80)
                pressure = pressure.plus(diff.norm().times(80 - diff.len()));
        }.bind(this));

        var move = pressure.norm().times(fleespeed);

        if((pos.y < border.top + 17) || (pos.y > border.right - 17)) {
            move.y = 0;
            move = move.norm().times(fleespeed);
        }

        this.sprite.body.velocity.x = move.x;
        this.sprite.body.velocity.y = move.y;
        //game.physics.arcade.moveToXY(this.sprite, move.x, move.y, this.speed);
    }

    if(this.panic-- == 0) {
        this.enter(this.isAngry ? ANGRY : ESCAPING);
    }
};
Human.prototype.leave2 = function() {
    this.sprite.frame = 0;
    this.sprite.animations.stop('walk');
    this.sprite.body.velocity.x = 0;
    this.sprite.body.velocity.y = 0;
};

var monolog_started, monolog_done, monolog_step = 2500;

var CONFUSED = 3;
Human.prototype.enter3 = function() {
    if(!monolog_started) {
        this.ctext = game.add.text(
            this.sprite.x, this.sprite.y - 16 - 50, "Yay i escaped!", {
                font: '40px Arial',
                fill: '#ffffff',
                shadowColor: '#000000',
                shadowBlur: 10
            }
        );
        this.ctext.anchor.x = 1;
        monolog_started = true;
        monolouger = this;
        this.ct = 0;
        var prevf = game.stage.filters;
        rnormFilter.uniforms.dist.value = 0.3;
        game.stage.filters = [rnormFilter];
        var self = this;
        setTimeout(function() {
            self.ctext.setText("No wait...");
            game.step();
        }, monolog_step);
        setTimeout(function() {
            self.ctext.setText("The theme... I can't leave the screen.");
            game.step();
        }, monolog_step * 2);
        setTimeout(function() {
            self.ctext.setText("...");
            game.step();
        }, monolog_step * 3);
        setTimeout(function() {
            self.ctext.setText("This is stupid. I should have voted for ☃...");
            game.step();
        }, monolog_step * 4);
        setTimeout(function() {
            self.ctext.setText("Well, i can't escape now, but i can still fight!");
            game.step();
        }, monolog_step * 5);
        setTimeout(function() {
            monolog_done = true;
            game.paused = false;
            game.stage.filters = prevf;
        }, monolog_step * 7);

        game.paused = true;
    } else this.ct = -1;
};
Human.prototype.live3 = function() {
    if(monolog_done) {
        this.enter(ANGRY);
        return;
    }
};
Human.prototype.leave3 = function() {
    if(this.ctext)
        this.ctext.destroy();
};

function getClosesetSM(human, more) {
    var closest = null;
    var pos = vec2.from(human.sprite);
    sms.forEachAlive(function(sm) {
        if(!more && sm.hunter && sm.hunter.target == sm && sm.hunter.sprite.alive)
            return;
        if(!closest || pos.dist(closest) > pos.dist(sm))
            closest = sm;
    });
    return closest;
}

var ANGRY = 4;
Human.prototype.enter4 = function() {
    this.sprite.animations.play('angrywalk', 3, true);
    this.isAngry = true;
};
Human.prototype.live4 = function() {
    if(player != soul && dist(this.sprite, player) < 80)
        return this.enter(FLEE);
    if(!this.target || !this.target.alive || this.target == player) this.target = getClosesetSM(this);
    if(!this.target) this.target = getClosesetSM(this, true);
    if(!this.target) return this.enter(AFK);

    this.target.hunter = this;

    game.physics.arcade.moveToXY(this.sprite, this.target.x, this.target.y);

    if(vec2.from(this.sprite).dist(this.target) < 40) {
        sms.remove(this.target);
        game.add.existing(this.target);
        this.target.animations.play('melt');
        this.target.alive = false;
        playSoundAt(melt, this.target.x, this.target.y);
        this.enter(ANGRY);
    }
};
Human.prototype.leave4 = function() {
    this.sprite.animations.stop('angrywalk');
    this.sprite.body.velocity.x = 0;
    this.sprite.body.velocity.y = 0;
};

Human.prototype.enter10 = function() {
    this.sprite.animations.play('death');
    this.sprite.body.immovable = true;
    this.sprite.body.velocity.setTo(0, 0);
};

Human.prototype.enter = function(state) {
    if(this["leave" + this.state])
        this["leave" + this.state]();
    this.state = state;
    if(this["enter" + state])
        this["enter" + state]();
};

Human.prototype.live = function() {
    /*if(!this.sprite.alive)
        this.enter(IS_KILL);*/

    if(!this.sprite.alive)
        return;

    //game.physics.arcade.collide(this.sprite, sms);
    if(this.sprite.body.velocity.x < 0)
        this.sprite.scale.x = -1;
    else if(this.sprite.body.velocity.x > 0)
        this.sprite.scale.x = 1;

    if(this["live" + this.state])
        this["live" + this.state]();
};


function switchToSoul(melted) {
    if(player) {
        var blood = game.add.emitter(player.x, player.y, 400);

        blood.makeParticles('monad');

        blood.gravity = 0;
        blood.setAlpha(0.8, 0, 800);
        blood.setScale(0.8, 0, 0.5, 0, 800);
        blood.setXSpeed(-300, 300);
        blood.setYSpeed(-100, 200);

        blood.explode(800, 200);

        setTimeout(function() {
            blood.destroy();
        }, 1000);

        playSoundAt(melt, player.x, player.y);
        playSoundAt(unposess, player.x, player.y);

        soul.x = player.x //+ 12;
        soul.y = player.y //+ 12;

        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        player.animations.play('melt');
        player.alive = false;
    }

    /*humans.forEach(function(human) {
        if(dist(human.sprite, player) < 70)
            human.die();
    });*/

    soul.visible = true;
    soul.body.immovable = false;
    player = soul;

    emitter.start(false, 3000, 15);
    speed = 300;

    game.stage.filters = soulFilter;

    meltBar.visible = false;

    ambient.stop();
    ambientSoul.play();
}

var victory;
function checkIfEnd() {
    if(!humans.length)
        victory = true;
    else if(!sms.children.length && player == soul)
        victory = false;
    else return;

    ambientSoul.stop();
    ambient.stop();
    player = null;
    game.stage.filters = null;
    game.state.start('outro', true);
}


GameState.prototype.create = function() {
    humans = [];

    game.stage.backgroundColor = 0x000000;
    if(!rnormFilter) rnormFilter = game.add.filter("ReallyNormal");
    game.add.sprite(0, 0, 'bg');

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.bounds.setTo(border.left, border.top, border.right - border.left, border.bottom - border.top);

    // Sounds
    
    explode = game.add.audio('slash');
    setupSound(explode);
    posess = game.add.audio('posess');
    setupSound(posess);
    unposess = game.add.audio('unposess');
    setupSound(unposess);
    scream = game.add.audio('scream');
    setupSound(scream);
    melt = game.add.audio('melt');
    setupSound(melt);
    attack = game.add.audio('attack');
    setupSound(attack);

    ambient = game.add.audio('ambient');
    ambient.loop = true;
    ambientSoul = game.add.audio('ambientSoul');
    ambientSoul.loop = true;
    ambientSoul.play();


    // Soul

    emitter = game.add.emitter(game.world.centerX, game.world.centerY, 400);
    emitter.makeParticles( 'monad' );

    emitter.gravity = 0;
    emitter.setAlpha(0.4, 0, 3000);
    emitter.setScale(0.8, 0, 0.8, 0, 3000);
    emitter.setXSpeed(-50, 50);
    emitter.setYSpeed(-50, 50);

    soul = game.add.sprite(game.width/2, game.height - 200, 'monad');
    soul.anchor.setTo(0.5, 0.5);
    game.physics.arcade.enable(soul);


    // Snowmen

    sms = game.add.group();

    function tooClose(pos, things, distance) {
        for(var i = 0; i < things.length; i++) {
            if(pos.dist(things[i]) < distance)
                return true;
        }
    }

    for(var x = 0; x < 10; x++) {
        var pos;

        while(!pos || tooClose(pos, sms.children, 100))
            pos = new vec2(game.rnd.integerInRange(330, border.right), game.rnd.integerInRange(border.top + 65, border.bottom - 65));
        
        sm = game.add.sprite(pos.x, pos.y, 'ss', 0);
        sm.anchor.setTo(0.5, 0.5);
        game.physics.enable(sm, Phaser.Physics.ARCADE);
        sm.body.immovable = true;
        sm.animations.add('die', [2, 3, 4, 5, 6, 7, 8, 9], 15);
        sm.animations.add('melt', [10, 11, 12, 13, 14, 15], 6);
        sms.add(sm);
    }


    // Melting indicator

    meltBar = game.add.graphics(0, 700);

    meltBar.beginFill(0xffffff);
    meltBar.drawRect(0, 0, 1280, 20);
    meltBar.endFill();

    meltBar.alpha = 0.8;
    meltBar.visible = false;


    // Humans
    
    humans.group = game.add.group();

    for(var i = 0; i < 10; i++) {
        var pos = null;;
        while(!pos || tooClose(pos, humans.group.children, 50))
            pos = new vec2(game.rnd.integerInRange(150, 300), game.rnd.integerInRange(border.top, border.bottom));
        
        humans.push(new Human(pos.x, pos.y));
    }


    // Snow
    
    var rain = game.add.emitter(game.world.centerX, 0, 400);

    rain.width = game.world.width;
    // rain.angle = 30; // uncomment to set an angle for the rain.

    rain.makeParticles('flake');

    rain.minParticleScale = 0.1;
    rain.maxParticleScale = 0.3;

    rain.setAlpha(0.2, 0.7);
    rain.setYSpeed(100, 150);
    rain.setXSpeed(-30, 30);

    rain.minRotation = 10;
    rain.maxRotation = 100;

    rain.start(false, 3200, 1, 0);


    // Filters
    
    var filter = game.add.filter("Soul");
    game.stage.filters = soulFilter = [filter];

    normFilter = [game.add.filter("Normal")];


    // Stuff

    game.time.advancedTiming = true;
    fpsText = game.add.text(
        20, 20, '', { font: '16px Arial', fill: '#ffffff' }
    );


    // Input

    cursors = game.input.keyboard.createCursorKeys();
    space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    space.onDown.add(function() {
        if(player != soul) {
            switchToSoul();
        }
    }, this);


    switchToSoul();
};

var speed = 300;

GameState.prototype.update = function() {
    if (game.time.fps !== 0) {
        fpsText.setText(game.time.fps + ' FPS');
    }

    for(var i = 0; i < humans.length; i++) {
        humans[i].live();
    }

    if(monolog_started && !monolog_done)
        return monolouger.live();

    meltBar.scale.x = ttl/120;


    // Movement
    if (cursors.left.isDown) {
        player.body.velocity.x = -speed;
    } else if (cursors.right.isDown) {
        player.body.velocity.x = speed;
    } else {
        player.body.velocity.x = 0;
    }

    if (cursors.up.isDown){
        player.body.velocity.y = -speed;
    } else if (cursors.down.isDown){
        player.body.velocity.y = speed;
    } else {
        player.body.velocity.y = 0;
    }


    // Action

    if(player == soul)
        game.physics.arcade.collide(player, sms, function(_, sm) {
            //player.body.immovable = true;
            player.body.velocity.x = 0;
            player.body.velocity.y = 0;
            player.visible = false;

            player = sm;
            player.frame = 2;
            player.body.immovable = false;
            player.body.collideWorldBounds = true;
            ttl = 120;
            meltBar.visible = true;
            sms.remove(player);
            game.add.existing(player);

            speed = 100;

            emitter.kill();
            game.stage.filters = normFilter;

            posess.play();
            ambient.play();
            ambientSoul.stop();
        });

    if(player != soul) {
        game.physics.arcade.collide(player, humans.group, function(_, human) {
            attack.play();
            human.human.die();
        });

        game.physics.arcade.collide(player, sms);

        if(ttl-- < 0) {
            switchToSoul(true);
        }
    }

    //game.physics.arcade.collide(humans.group, sms);

    // Copying stuff

    emitter.x = player.x// + 4;
    emitter.y = player.y// + 4;

    game.stage.filters[0].uniforms.posX.value = emitter.x;
    game.stage.filters[0].uniforms.posY.value = emitter.y;

    checkIfEnd();
};

GameState.prototype.render = function() {
    //game.debug.bodyInfo(player);
    /*if(sms[0])
        game.debug.body(sms[0]);*/
};

function Intro() {
    this.t = 0;
}

Intro.prototype.preload = GameState.prototype.preload;

Intro.prototype.create = function() {
    game.stage.backgroundColor = 0x000000;
    if(!rnormFilter) rnormFilter = game.add.filter("ReallyNormal");
    var bg = game.add.sprite(0, 0, 'bg');
    
    rnormFilter.uniforms.dist.value = 0.5;
    bg.filters = [rnormFilter];

    //bg.filter = rnormFilter;

    this.text1 = game.add.text(640, 150, '☃s Revenge', { font: '150px Arial', fill: '#ffffff' });
    this.text1.anchor.x = 0.5;
};

Intro.prototype.update = function() {
    var step = 110;

    if(this.t == step) {
        this.text2 = game.add.text(640, 360, 'Story: ', { font: '30px Arial', fill: '#ffffff' });
        this.text2.anchor.x = 0.5;
    }
    if(this.t == step*2) this.text2.setText("The humans have betrayed ☃.");
    if(this.t == step*3) this.text2.setText("☃ is angry.");

    if(this.t == step*4) {
        this.text3 = game.add.text(640, 420, 'Your mission:', { font: '30px Arial', fill: '#ffffff' });
        this.text3.anchor.x = 0.5;
    }
    if(this.t == step*5) {
        this.text3.destroy();
        this.textblood = game.add.text(640, 420, 'Kill all humans.', { font: '30px Arial', fill: '#cb3030' });
        this.textblood.anchor.x = 0.5;
    }

    if(this.t == step*6) {
        this.text4 = game.add.text(640, 480, 'How to play:', { font: '30px Arial', fill: '#ffffff' });
        this.text4.anchor.x = 0.5;
    }
    if(this.t == step*7) this.text4.setText('Move with arrow keys.');
    if(this.t == step*8) this.text4.setText('Move into snowman to control.');
    if(this.t == step*9) this.text4.setText('Move snowman into human to kill.');
    if(this.t == step*10) this.text4.setText('Melt your snowman with SPACE.');
    if(this.t == step*11) {
        this.text5 = game.add.text(640, 540, 'Good luck.', { font: '30px Arial', fill: '#ffffff' });
        this.text5.anchor.x = 0.5;
    }
    if(this.t++ > step*12) {
        game.state.start('game', true);
    }
};

var wasInOutro;
function Outro() {

}

Outro.prototype.create = function() {
    game.stage.backgroundColor = 0x000000;
    if(!rnormFilter) rnormFilter = game.add.filter("ReallyNormal");
    var bg = game.add.sprite(0, 0, 'bg');
    rnormFilter.uniforms.dist.value = 0.7;
    bg.filters = [rnormFilter];

    this.t = 0;
};

Outro.prototype.update = function() {
    var step = 110;

    if(this.t == step) {
        this.text1 = game.add.text(640, 50, '☃s Revenge', { font: '80px Arial', fill: '#ffffff' });
        this.text1.anchor.x = 0.5;

        if(wasInOutro) {
            var info = game.add.text(640, 666, 'Press SPACE to skip.', { font: '11px Arial', fill: '#ffffff' });
            info.anchor.x = 0.5;
        }
    }
    if(this.t == step * 2) {
        this.text2 = game.add.text(640, 240, 'Story: ', { font: '30px Arial', fill: '#ffffff' });
        this.text2.anchor.x = 0.5;
    }
    if(this.t == step*3)
        if(victory) this.text2.setText("You won.");
        else this.text2.setText("You lost.");

    if(this.t == step*4)
        if(victory) this.text2.setText("☃ is happy.");
        else this.text2.setText("☃ is disappointed.");

    if(this.t == step*5) {
        this.text3 = game.add.text(640, 300, 'This game is very bad.', { font: '30px Arial', fill: '#ffffff' });
        this.text3.anchor.x = 0.5;
    }

    if(this.t == step*6) this.text3.setText('This game will now restart.');

    if(this.t == step*7) {
        this.text5 = game.add.text(640, 360, 'Good luck.', { font: '30px Arial', fill: '#ffffff' });
        this.text5.anchor.x = 0.5;
    }
    if(this.t++ > step*8 || (this.t > 98 && space.isDown) ){
        game.state.start('game', true);
        wasInOutro = true;
    }
};


// Start the game

var game = new Phaser.Game(1280, 720, Phaser.AUTO, 'game');
game.state.add('intro', Intro, true);
game.state.add('game', GameState);
game.state.add('outro', Outro);

//game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;

    //Keep original size
    // game.scale.fullScreenScaleMode = Phaser.ScaleManager.NO_SCALE;

    // Maintain aspect ratio
    // 
document.getElementById("fs").addEventListener("click", function() {
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

    if (game.scale.isFullScreen)
    {
        game.scale.stopFullScreen();
    }
    else
    {
        game.scale.startFullScreen(false);
    }
});
document.getElementById("pause").addEventListener("click", function() {
    game.paused = true;
});
document.getElementById("play").addEventListener("click", function() {
    game.paused = false;
});
window.addEventListener("blur", function() {
    //game.paused = true;
});

function ignore(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
}

document.addEventListener("keypress", ignore);

if(navigator.userAgent.indexOf("Chrome") == -1) {
    alert("The game doesn't work very well in non-Chrome browsers (yet). You should use Chrome to play it.")
}