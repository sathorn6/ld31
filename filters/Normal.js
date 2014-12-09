
  Phaser.Filter.Normal = function (game) {

    Phaser.Filter.call(this, game);

    this.uniforms.posX = { type: '1f', value: 0 };
    this.uniforms.posY = { type: '1f', value: 0 };

    var src = game.cache.getText("normalshader");
    this.fragmentSrc = src.split('\n');
  };

  Phaser.Filter.Normal.prototype = Object.create(Phaser.Filter.prototype);
  Phaser.Filter.Normal.prototype.constructor = Phaser.Filter.Normal;
