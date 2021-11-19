type MyMatterBodyConfig = Phaser.Types.Physics.Matter.MatterBodyConfig & {
  shape?: any;
};

interface Props {
  scene: Phaser.Scene;
  x: number;
  y: number;
  key: string;
  frame?: number;
}

export class Player extends Phaser.Physics.Matter.Sprite {
  private speed = 7;
  private downBoost: 1 | 0 = 1;
  private isTouchingGround = true;
  private jumpVelocity = 15;
  private kick?: Phaser.Physics.Matter.Sprite;

  constructor({ scene, x, y, key }: Props) {
    super(scene.matter.world, x, y, key, "", {
      shape: scene.cache.json.get("shapes")["ghst-front"],
      density: Infinity,
      restitution: 1,
    } as MyMatterBodyConfig);

    // sprite
    this.setBounce(0);
    this.scene.matter.body.setInertia(this.body as MatterJS.BodyType, Infinity);
    this.addAnimations(key);

    scene.matter.world.on("collisionactive", () => {
      this.isTouchingGround = true;
      this.downBoost = 1;
    });
  }

  private addAnimations = (key: string) => {
    this.scene.anims.create({
      key: "idle",
      frames: this.scene.anims.generateFrameNumbers(key || "", {
        start: 0,
        end: 1,
      }),

      frameRate: 2,
      repeat: -1,
    });
    this.scene.anims.create({
      key: "left",
      frames: this.scene.anims.generateFrameNumbers(key || "", {
        frames: [2],
      }),
    });
    this.scene.anims.create({
      key: "right",
      frames: this.scene.anims.generateFrameNumbers(key || "", {
        frames: [4],
      }),
    });
    this.scene.anims.create({
      key: "up",
      frames: this.scene.anims.generateFrameNumbers(key || "", {
        frames: [6],
      }),
    });
  };

  public moveLeft = () => {
    this.setVelocityX(-this.speed);
    this.anims.play("left", true);
  };

  public moveRight = () => {
    this.setVelocityX(this.speed);
    this.anims.play("right", true);
  };

  public goIdle = () => {
    this.setVelocityX(0);
    this.anims.play("idle", true);
  };

  public jump = () => {
    if (this.isTouchingGround) {
      this.isTouchingGround = false;
      this.setVelocityY(-this.jumpVelocity);
    }
  };

  public boostDown = () => {
    if (!this.isTouchingGround && this.downBoost > 0) {
      this.downBoost--;
      this.setVelocityY(10);
    }
  };

  public handleKick(
    direction: "left" | "right",
    collisionFilter: { category: number; mask: number }
  ): void {
    const shapes = this.scene.cache.json.get("shapes");

    const originX = direction === "left" ? this.x + 50 : this.x - 50;
    const velocityX = direction === "left" ? -15 : 15;

    if (!this.kick) {
      this.kick = this.scene.matter.add.sprite(
        originX,
        this.y + 30,
        "kick",
        "",
        {
          ignoreGravity: true,
          restitution: 1,
          mass: 10000,
          torque: 100,
          collisionFilter,
          bounce: 0,
          shape: shapes["ball"],
        } as MyMatterBodyConfig
      );
      this.kick.setVelocityX(velocityX);

      setTimeout(() => {
        this.kick?.destroy();
        this.kick = undefined;
      }, 220);
    }
  }
}
