export type AssetDestPathResolver = 'android' | 'generic';
export type PackagerAsset = {
  __packager_asset: boolean;
  fileHashes: Array<string>;
  httpServerLocation: string;
  width?: number;
  height?: number;
  scales: Array<number>;
  hash: string;
  name: string;
  type: string;
};

const assets: PackagerAsset[] = [];

export function registerAsset(asset: PackagerAsset): number {
  return assets.push(asset);
}

export function getAssetByID(assetId: number): PackagerAsset {
  return assets[assetId - 1];
}

export default {
  registerAsset,
  getAssetByID,
};
