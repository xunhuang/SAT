declare module 'svg2img' {
  interface Options {
    format?: 'png' | 'jpg' | 'jpeg';
    quality?: number;
    width?: number;
    height?: number;
    preserveAspectRatio?: boolean;
  }

  type Callback = (err: Error | null, buffer: Buffer) => void;

  function svg2img(svg: string, callback: Callback): void;
  function svg2img(svg: string, options: Options, callback: Callback): void;

  export = svg2img;
}