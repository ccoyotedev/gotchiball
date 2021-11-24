import { AavegotchiGameObject, AavegotchiObject, Tuple } from "types";
import { getGameHeight, getGameWidth } from "game/helpers";
import { assets, SpritesheetAsset } from "game/assets";
import { constructSpritesheet } from "../helpers/spritesheet";
import { customiseSvg } from "helpers/aavegotchi";
import { Socket } from "socket.io-client";
import { useDiamondCall } from "web3/actions";
import { providers } from "ethers";

interface AavegotchiWithSvg extends AavegotchiObject {
  svg: Tuple<string, 4>;
}

export interface ServerGotchiObject {
  name: string;
  tokenId: string;
  hauntId: string;
  collateralAddress: string;
  numericTraits: Tuple<number, 6>;
  equippedWearables: Tuple<number, 16>;
  key?: string;
}

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: "Boot",
};

/**
 * The initial scene that loads all necessary assets to the game.
 */
export class BootScene extends Phaser.Scene {
  private socket!: Socket;
  private provider!: providers.Provider;
  private connected?: boolean;
  private assetsLoaded?: boolean;
  private gotchi!: AavegotchiGameObject;
  private loadIndex: number;
  private progressBarContainer?: Phaser.GameObjects.Rectangle;
  private progressBar?: Phaser.GameObjects.Rectangle;
  private loadingText?: Phaser.GameObjects.Text;
  private opponentFound?: boolean;
  private opponent?: ServerGotchiObject;
  private opponentLoaded?: boolean;
  private playerNo?: 1 | 2;

  constructor() {
    super(sceneConfig);
    this.loadIndex = 0;
  }

  public preload = (): void => {
    // Construct progress bar
    this.createProgressBar();

    // Set provider
    this.provider = this.game.registry.values.provider as providers.Provider;

    // Construct gotchi game object from registry
    const selectedGotchi = this.game.registry.values
      .selectedGotchi as AavegotchiWithSvg;
    this.gotchi = {
      ...selectedGotchi,
      spritesheetKey: "PLAYER",
    };

    // Checks connection to the server
    this.socket = this.game.registry.values.socket;
    !this.socket?.connected
      ? this.socket?.on("connect", () => {
          this.handleConnection();
        })
      : this.handleConnection();

    // Listens to see if opponent is found
    this.socket?.on(
      "handleMatchMade",
      (players: Tuple<ServerGotchiObject, 2>) => {
        console.log(players);
        this.opponentFound = true;
        this.playerNo = (players.findIndex(
          (item) => item.tokenId === this.gotchi.id
        ) + 1) as 1 | 2;

        this.constructOpponent(players[this.playerNo % 2]);
      }
    );

    // Listener that triggers when an asset has loaded
    this.load.on(
      "filecomplete",
      (key: string) => {
        console.log(key);
        // As the spritesheet is the last asset to load in, we can attempt to start the game
        if (key === "OPPONENT") {
          this.opponentLoaded = true;
          this.startGame();
        }
        if (key === "PLAYER") {
          this.assetsLoaded = true;
          this.startGame();
        }
        if (this.loadIndex === assets.length && this.gotchi) {
          this.loadInGotchiSpritesheet(
            this.gotchi.svg,
            this.gotchi.spritesheetKey
          );
        } else {
          this.loadNextFile(this.loadIndex);
        }
      },
      this
    );
    this.loadNextFile(0);
  };

  /**
   * Submits gotchi data to the server and attempts to start game
   */
  private handleConnection = () => {
    const gotchi = this.game.registry.values.selectedGotchi as AavegotchiObject;
    this.connected = true;
    this.socket?.emit("setGotchiData", {
      name: gotchi.name,
      tokenId: gotchi.id,
      hauntId: gotchi.hauntId,
      collateralAddress: gotchi.collateral,
      numericTraits: gotchi.withSetsNumericTraits,
      equippedWearables: gotchi.equippedWearables,
    });
  };

  /**
   * If all the assets are loaded in, and user is connected to server, start game
   */
  private startGame = () => {
    if (this.assetsLoaded && !this.connected)
      this.loadingText?.setText(`Connecting to server...`);
    if (this.assetsLoaded && this.connected && !this.opponentFound)
      this.loadingText?.setText(`Looking for opponent...`);
    if (
      this.assetsLoaded &&
      this.connected &&
      this.opponentFound &&
      !this.opponentLoaded
    )
      this.loadingText?.setText(`Constructing opponent...`);
    if (
      this.assetsLoaded &&
      this.connected &&
      this.opponentFound &&
      this.opponentLoaded
    ) {
      this.scene.start("Game", {
        selectedGotchi: this.gotchi,
        playerNo: this.playerNo,
        opponent: this.opponent,
      });
    }
  };

  /**
   * Renders UI component to display loading progress
   */
  private createProgressBar = () => {
    const width = getGameWidth(this) * 0.5;
    const height = 12;
    this.progressBarContainer = this.add
      .rectangle(
        getGameWidth(this) / 2,
        getGameHeight(this) / 2,
        width,
        height,
        0x12032e
      )
      .setOrigin(0.5);

    this.progressBar = this.add
      .rectangle(
        (getGameWidth(this) - width) / 2,
        getGameHeight(this) / 2,
        0,
        height,
        0x6d18f8
      )
      .setOrigin(0, 0.5);

    this.loadingText = this.add
      .text(getGameWidth(this) / 2, getGameHeight(this) / 2 - 32, "Loading...")
      .setFontSize(24)
      .setOrigin(0.5);
  };

  /**
   * Iterates through each file in the assets array
   */
  private loadNextFile = (index: number) => {
    const file = assets[index];
    this.loadIndex++;

    if (this.loadingText && this.progressBar && this.progressBarContainer) {
      this.loadingText.setText(`Loading: ${file.key}`);
      this.progressBar.width =
        (this.progressBarContainer.width / assets.length) * index;
    }

    switch (file.type) {
      case "IMAGE":
        this.load.image(file.key, file.src);
        break;
      case "SVG":
        this.load.svg(file.key, file.src);
        break;
      case "AUDIO":
        this.load.audio(file.key, [file.src]);
        break;
      case "SPRITESHEET":
        this.load.spritesheet(
          file.key,
          file.src,
          (file as SpritesheetAsset).data
        );
        break;
      case "TILEMAP_TILES":
        this.load.image(file.key, file.src);
        break;
      case "TILEMAP_MAP":
        this.load.tilemapTiledJSON(file.key, file.src);
        break;
      case "JSON":
        this.load.json(file.key, file.src);
        break;
      default:
        break;
    }
  };

  /**
   * Constructs and loads in the Aavegotchi spritesheet, you can use customiseSVG() to create custom poses and animations
   */
  private loadInGotchiSpritesheet = async (
    svgArray: Tuple<string, 4>,
    key: string
  ) => {
    const spriteMatrix = [
      [
        customiseSvg(svgArray[0], { removeBg: true }),
        customiseSvg(svgArray[0], {
          armsUp: true,
          eyes: "happy",
          float: true,
          removeBg: true,
        }),
      ],
      // Left
      [customiseSvg(svgArray[1], { removeBg: true })],
      // Right
      [customiseSvg(svgArray[2], { removeBg: true })],
      // Right
      [customiseSvg(svgArray[3], { removeBg: true })],
    ];
    const { src, dimensions } = await constructSpritesheet(spriteMatrix);
    this.load.spritesheet(key, src, {
      frameWidth: dimensions.width / dimensions.x,
      frameHeight: dimensions.height / dimensions.y,
    });
    this.load.start();
  };

  /**
   *
   * Fetch opponents Aavegotchi
   */
  private fetchOpponentSVG = async (
    provider: providers.Provider,
    opponent: {
      hauntId: string;
      collateralAddress: string;
      numericTraits: Tuple<number, 6>;
      equippedWearables: Tuple<number, 16>;
    }
  ) => {
    const { hauntId, collateralAddress, numericTraits, equippedWearables } =
      opponent;
    const res = await useDiamondCall<Tuple<string, 4>>(provider, {
      name: "previewSideAavegotchi",
      parameters: [
        hauntId,
        collateralAddress,
        numericTraits,
        equippedWearables,
      ],
    });
    return res;
  };

  /**
   * Construct opponent
   */
  private constructOpponent = async (opponent: ServerGotchiObject) => {
    console.log("Opponent: ", opponent.name);
    const key = "OPPONENT";
    const opponentSvg = await this.fetchOpponentSVG(this.provider, opponent);
    this.loadInGotchiSpritesheet(opponentSvg, key);
    this.opponent = {
      ...opponent,
      key,
    };
  };
}
