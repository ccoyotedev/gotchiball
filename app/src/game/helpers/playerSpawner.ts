import { getGameWidth, getGameHeight } from "../helpers";
import { AavegotchiGameObject } from "types";
import { Player } from "../objects/player";

export default class PlayerSpawner {
  scene: Phaser.Scene;
  public key: string;

  constructor(scene: Phaser.Scene, aavegotchi: AavegotchiGameObject) {
    this.scene = scene;
    this.key = aavegotchi.spritesheetKey;
  }

  spawn(): Player {
    const player = new Player({
      scene: this.scene,
      x: getGameWidth(this.scene) / 4,
      y: getGameHeight(this.scene) - 100,
      key: this.key,
    });

    this.scene.add.existing(player);

    return player;
  }
}
