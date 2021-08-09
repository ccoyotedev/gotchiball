import { getGameWidth, getGameHeight } from '../helpers';

type MyMatterBodyConfig = Phaser.Types.Physics.Matter.MatterBodyConfig & {
  shape?: any;
};

export type Player = Phaser.Physics.Matter.Sprite & {
  sayHello?: () => void;
  isTouchingGround?: boolean;
  downBoost: 1 | 0;
};

export default class PlayerSpawner {
  scene: Phaser.Scene;
  public key: string;

  constructor(scene: Phaser.Scene, playerKey = 'character') {
    this.scene = scene;
    this.key = playerKey;
  }

  spawn(): Player {
    const player = this.constructSprite();
    this.addAnimations();

    return player;
  }

  private constructSprite = () => {
    const shapes = this.scene.cache.json.get('shapes');

    const player = this.scene.matter.add.sprite(
      getGameWidth(this.scene) / 4,
      getGameHeight(this.scene) - 100,
      this.key,
      '',
      {
        shape: shapes['ghst-front'],
        density: Infinity,
        restitution: 1,
      } as MyMatterBodyConfig,
    ) as Player;

    player.setBounce(0);
    player.setScale(2.5);
    player.downBoost = 1;

    return player;
  };

  private addAnimations = () => {
    this.scene.anims.create({
      key: 'left',
      frames: this.scene.anims.generateFrameNumbers('character', { start: 12, end: 17 }),
      frameRate: 10,
      repeat: -1,
    });

    this.scene.anims.create({
      key: 'turn',
      frames: this.scene.anims.generateFrameNumbers('character', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });

    this.scene.anims.create({
      key: 'right',
      frames: this.scene.anims.generateFrameNumbers('character', { start: 24, end: 29 }),
      frameRate: 10,
      repeat: -1,
    });
  };
}
