export default class GoalText extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number, style: Phaser.Types.GameObjects.Text.TextStyle) {
    super(scene, x, y, 'Goal!', style);
  }
}
