import { getGameWidth, getGameHeight } from '../helpers';
import { BALL } from '../assets';

type MyMatterBodyConfig = Phaser.Types.Physics.Matter.MatterBodyConfig & {
  shape?: any;
};

export default class VolleyballSpawner {
  scene: Phaser.Scene;
  public key: string;

  constructor(scene: Phaser.Scene, volleyballKey = BALL) {
    this.scene = scene;
    this.key = volleyballKey;
  }

  spawn(): Phaser.Physics.Matter.Sprite {
    const shapes = this.scene.cache.json.get('shapes');
    const volleyball = this.scene.matter.add.sprite(
      getGameWidth(this.scene) / 2,
      getGameHeight(this.scene) / 4,
      this.key,
      '',
      { shape: shapes[this.key] } as MyMatterBodyConfig,
    );
    volleyball.setBounce(1);
    volleyball.setVelocity(Phaser.Math.Between(-3, 3), -5);

    return volleyball;
  }
}
