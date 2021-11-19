import { getGameWidth, getGameHeight } from "../helpers";
import { AavegotchiGameObject } from "types";

import VolleyballSpawner from "../helpers/volleyballSpawner";
import PlayerSpawner from "../helpers/playerSpawner";
import { Player } from "game/objects";
import ScoreLabel from "../ui/score-label";
import GoalText from "../ui/goalText";

type MyMatterBodyConfig = Phaser.Types.Physics.Matter.MatterBodyConfig & {
  shape?: any;
};

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: "Game",
};

interface Goal {
  post: Phaser.Physics.Matter.Sprite;
  bounds: {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
  };
}

export class GameScene extends Phaser.Scene {
  private selectedGotchi!: AavegotchiGameObject;

  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private player!: Player;
  private volleyball!: Phaser.Physics.Matter.Sprite;
  private volleyballSpawner!: VolleyballSpawner;
  private playerSpawner!: PlayerSpawner;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private playerOneGoal!: Goal;
  private playerTwoGoal!: Goal;

  // Scores
  private playerOneScoreLabel!: ScoreLabel;
  private playerTwoScoreLabel!: ScoreLabel;

  private goalScored!: boolean;
  private goalText!: GoalText;

  // Categories
  private playerCat!: number;
  private volleyballCat!: number;

  constructor() {
    super(sceneConfig);
  }

  init = (data: { selectedGotchi: AavegotchiGameObject }): void => {
    this.selectedGotchi = data.selectedGotchi;
  };

  public create(): void {
    // Create scene
    this.matter.world.setBounds(
      0,
      -200,
      getGameWidth(this),
      getGameHeight(this) + 200 - 75
    );
    this.add.image(getGameWidth(this) / 2, getGameHeight(this) / 2, "bg");
    this.add
      .image(getGameWidth(this) / 2, getGameHeight(this) - 37.5, "ground")
      .setScale(2.5, 1);

    // Create goals
    this.playerOneGoal = this.createGoal(1);
    this.playerTwoGoal = this.createGoal(2);

    // Create player
    this.playerSpawner = new PlayerSpawner(this, this.selectedGotchi);
    this.player = this.playerSpawner.spawn();

    this.playerCat = this.matter.world.nextCategory();
    this.player.setCollisionCategory(this.playerCat);

    // Create volleyball
    this.volleyballSpawner = new VolleyballSpawner(this, "ball");
    this.volleyball = this.volleyballSpawner.spawn();
    this.volleyballCat = this.matter.world.nextCategory();
    this.volleyball.setCollisionCategory(this.volleyballCat);

    // Create scoreboard
    this.playerOneScoreLabel = this.createScoreLabel(
      getGameWidth(this) / 4,
      32,
      0
    );
    this.playerTwoScoreLabel = this.createScoreLabel(
      (3 * getGameWidth(this)) / 4 - 32,
      32,
      0
    );

    // This is a nice helper Phaser provides to create listeners for some of the most common keys.
    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey("SPACE");

    this.matter.setCollisionGroup(
      [
        this.player.body as MatterJS.BodyType,
        this.volleyball.body as MatterJS.BodyType,
      ],
      1
    );
  }

  private createScoreLabel(x: number, y: number, score: number) {
    const style = { fontSize: "72px", fill: "#fff", backgroundColor: "#000" };
    const label = new ScoreLabel(this, x, y, score, style);

    this.add.existing(label);
    return label;
  }

  private createGoal(player: 1 | 2): Goal {
    const shapes = this.cache.json.get("shapes");
    const post = this.matter.add.sprite(
      player === 1 ? 0 : getGameWidth(this),
      (3 * getGameHeight(this)) / 5,
      "bar",
      "",
      {
        shape: shapes["bar"],
      } as MyMatterBodyConfig
    );
    post.setScale(2);

    const bounds = {
      x_min: player === 1 ? 0 : getGameWidth(this) - post.width / 2,
      x_max: player === 1 ? post.width / 2 : getGameWidth(this),
      y_min: (3 * getGameHeight(this)) / 5,
      y_max: getGameHeight(this),
    };

    return {
      post,
      bounds,
    };
  }

  private handleGoalScored() {
    this.goalScored = true;
    const style = {
      fontSize: "144px",
      fill: "#fff",
      boundsAlignH: "center",
      boundsAlignV: "middle",
    };
    const label = new GoalText(
      this,
      getGameWidth(this) / 2,
      getGameHeight(this) / 2,
      style
    ).setOrigin(0.5);

    this.add.existing(label);
    this.goalText = label;

    setTimeout(() => {
      this.volleyball.destroy();
      this.volleyball = this.volleyballSpawner.spawn();
      this.volleyball.setCollisionCategory(this.volleyballCat);
      this.goalScored = false;
      this.goalText.destroy();
      this.player.winningState = false;
    }, 3000);
  }

  private isGoal() {
    if (
      this.volleyball.x < this.playerOneGoal.bounds.x_max &&
      this.volleyball.x > this.playerOneGoal.bounds.x_min &&
      this.volleyball.y < this.playerOneGoal.bounds.y_max &&
      this.volleyball.y > this.playerOneGoal.bounds.y_min
    ) {
      this.playerTwoScoreLabel.add(1);
      this.handleGoalScored();
    }

    if (
      this.volleyball.x < this.playerTwoGoal.bounds.x_max &&
      this.volleyball.x > this.playerTwoGoal.bounds.x_min &&
      this.volleyball.y < this.playerTwoGoal.bounds.y_max &&
      this.volleyball.y > this.playerTwoGoal.bounds.y_min
    ) {
      this.playerOneScoreLabel.add(1);
      this.player.winningState = true;
      this.handleGoalScored();
    }
  }

  public update(): void {
    if (!this.goalScored) {
      this.isGoal();
    }

    switch (true) {
      case this.cursorKeys.left.isDown:
        this.player.moveLeft();
        break;
      case this.cursorKeys.right.isDown:
        this.player.moveRight();
        break;
      default:
        this.player.goIdle();
    }

    if (this.cursorKeys.up.isDown) {
      this.player.jump();
    }

    if (this.cursorKeys.down.isDown) {
      this.player.boostDown();
    }

    if (this.spaceKey.isDown) {
      this.player.handleKick(this.cursorKeys.left.isDown ? "left" : "right", {
        category: this.playerCat,
        mask: this.volleyballCat,
      });
    }
  }
}
