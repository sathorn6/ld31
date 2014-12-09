

  Phaser.Filter.ReallyNormal = function (game) {

    Phaser.Filter.call(this, game);

    this.uniforms.dist = { type: '1f', value: 0 };

    var src = game.cache.getText("reallynormalshader");
    this.fragmentSrc = src.split('\n');
  };

  Phaser.Filter.ReallyNormal.prototype = Object.create(Phaser.Filter.prototype);
  Phaser.Filter.ReallyNormal.prototype.constructor = Phaser.Filter.ReallyNormal;
