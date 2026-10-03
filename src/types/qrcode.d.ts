declare module "qrcode" {
  export function toDataURL(text: string, options?: { width?: number; margin?: number; errorCorrectionLevel?: string }): Promise<string>;
  export function toString(text: string, options?: { type?: "svg"; margin?: number; errorCorrectionLevel?: string }): Promise<string>;
}
