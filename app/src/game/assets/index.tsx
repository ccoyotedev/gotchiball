export interface Asset {
  key: string;
  src: string;
  type:
    | "IMAGE"
    | "SVG"
    | "SPRITESHEET"
    | "AUDIO"
    | "JSON"
    | "TILEMAP_TILES"
    | "TILEMAP_MAP";
  data?: {
    frameWidth?: number;
    frameHeight?: number;
  };
}

export interface SpritesheetAsset extends Asset {
  type: "SPRITESHEET";
  data: {
    frameWidth: number;
    frameHeight: number;
  };
}

export const BG = "bg";
export const CLICK = "click";
export const SHAPES = "shapes";
export const GROUND = "ground";
export const BALL = "ball";
export const KICK = "kick";
export const BAR = "bar";
export const CHARACTER = "character";

// Save all in game assets in the public folder
export const assets: Array<Asset | SpritesheetAsset> = [
  {
    key: BG,
    src: "assets/images/bg.png",
    type: "IMAGE",
  },
  {
    key: CLICK,
    src: "assets/sounds/click.mp3",
    type: "AUDIO",
  },
  {
    key: SHAPES,
    src: "assets/shapes.json",
    type: "JSON",
  },
  {
    key: GROUND,
    src: "assets/platform.png",
    type: "IMAGE",
  },
  {
    key: BALL,
    src: "assets/volleyball.png",
    type: "IMAGE",
  },
  {
    key: KICK,
    src: "assets/volleyball.png",
    type: "IMAGE",
  },
  {
    key: BAR,
    src: "assets/bar.png",
    type: "IMAGE",
  },
  {
    key: CHARACTER,
    src: "assets/sprites/ghostSheet.png",
    type: "SPRITESHEET",
    data: {
      frameWidth: 576 / 12,
      frameHeight: 384 / 8,
    },
  },
];
