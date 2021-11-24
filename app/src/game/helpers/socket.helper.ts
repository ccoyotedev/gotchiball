import { GameScene } from "game/scenes/game-scene";

export const setSocketEventListeners = (scene: GameScene) => {
  scene.socket?.on("handleMoveLeft", (playerNo: 1 | 2) => {
    playerNo === 1 ? scene.player1.moveLeft() : scene.player2.moveLeft();
  });

  scene.socket?.on("handleMoveRight", (playerNo: 1 | 2) => {
    playerNo === 1 ? scene.player1.moveRight() : scene.player2.moveRight();
  });

  scene.socket?.on("handleGoIdle", (playerNo: 1 | 2) => {
    playerNo === 1 ? scene.player1.goIdle() : scene.player2.goIdle();
  });

  scene.socket?.on("handleJump", (playerNo: 1 | 2) => {
    playerNo === 1 ? scene.player1.jump() : scene.player2.jump();
  });

  scene.socket?.on("handleBoostDown", (playerNo: 1 | 2) => {
    playerNo === 1 ? scene.player1.boostDown() : scene.player2.boostDown();
  });

  scene.socket?.on("handlePlayerDisconnect", () => {
    scene.socket?.emit("handleDisconnect");
  });
};
