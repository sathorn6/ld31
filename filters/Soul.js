

  Phaser.Filter.Soul = function (game) {

    Phaser.Filter.call(this, game);

    this.uniforms.posX = { type: '1f', value: 0 };
    this.uniforms.posY = { type: '1f', value: 0 };

    var src = game.cache.getText("soulshader");
    this.fragmentSrc = src.split('\n');
  };

  Phaser.Filter.Soul.prototype = Object.create(Phaser.Filter.prototype);
  Phaser.Filter.Soul.prototype.constructor = Phaser.Filter.Soul;
