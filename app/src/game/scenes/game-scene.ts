import { getGameWidth, getGameHeight } from "../helpers";
import { AavegotchiGameObject } from "types";

import VolleyballSpawner from "../helpers/volleyballSpawner";
import { Player } from "game/objects";
import ScoreLabel from "../ui/score-label";
import GoalText from "../ui/goalText";
import { Socket } from "socket.io-client";
import { setSocketEventListeners } from "../helpers/socket.helper";
import { ServerGotchiObject } from "./boot-scene";

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
  public socket?: Socket;
  private selectedGotchi!: AavegotchiGameObject;
  private opponentGotchi!: ServerGotchiObject;
  private playerNo!: 1 | 2;

  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  public player1!: Player;
  public player2!: Player;

  private volleyball!: Phaser.Physics.Matter.Sprite;
  private volleyballSpawner!: VolleyballSpawner;
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

  init = (data: {
    selectedGotchi: AavegotchiGameObject;
    playerNo: 1 | 2;
    opponent: ServerGotchiObject;
  }): void => {
    console.log(data.selectedGotchi);
    this.selectedGotchi = data.selectedGotchi;
    this.playerNo = data.playerNo;
    this.opponentGotchi = data.opponent;
  };

  public create(): void {
    this.socket = this.game.registry.values.socket;
    setSocketEventListeners(this);

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

    // Create player 1
    this.player1 = new Player({
      scene: this,
      x: getGameWidth(this) / 4,

      y: getGameHeight(this) - 100,
      key:
        this.playerNo === 1
          ? this.selectedGotchi.spritesheetKey
          : (this.opponentGotchi.key as string),
    });
    this.add.existing(this.player1);

    // Create player 2
    this.player2 = new Player({
      scene: this,
      x: (3 * getGameWidth(this)) / 4,
      y: getGameHeight(this) - 100,
      key:
        this.playerNo === 1
          ? (this.opponentGotchi.key as string)
          : this.selectedGotchi.spritesheetKey,
    });
    this.add.existing(this.player2);

    this.playerCat = this.matter.world.nextCategory();
    this.player1.setCollisionCategory(this.playerCat);

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
        this.player1.body as MatterJS.BodyType,
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
      this.player1.winningState = false;
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
      this.player1.winningState = true;
      this.handleGoalScored();
    }
  }

  public update(): void {
    if (!this.goalScored) {
      this.isGoal();
    }

    switch (true) {
      case this.cursorKeys.left.isDown:
        this.socket?.emit("moveLeft", this.playerNo);
        break;
      case this.cursorKeys.right.isDown:
        this.socket?.emit("moveRight", this.playerNo);
        break;
      default:
        this.socket?.emit("goIdle", this.playerNo);
    }

    if (this.cursorKeys.up.isDown) {
      this.socket?.emit("jump", this.playerNo);
    }

    if (this.cursorKeys.down.isDown) {
      this.socket?.emit("boostDown", this.playerNo);
    }

    if (this.spaceKey.isDown) {
      this.player1.handleKick(this.cursorKeys.left.isDown ? "left" : "right", {
        category: this.playerCat,
        mask: this.volleyballCat,
      });
    }
  }
}
