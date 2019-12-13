import gocommerce from './gocommerce'
import none from './none'
import vtex from './vtex'

interface ImageOptions {
  width?: number
  highDensityFactor?: number
}

interface Module {
  cleanImageUrl: (imageUrl: string | undefined) => string | undefined
  changeImageUrlSize: (
    imageUrl: string | undefined,
    options?: ImageOptions
  ) => string | undefined
}

const replaceHttpToRelativeProtocol = (url: string | undefined) => {
  if (!url) {
    return undefined
  }
  return url.replace(/https:\/\/|http:\/\//, '//')
}

export const fixImageUrl = (imageUrl: string, platform: string) => {
  const modules: Record<string, Module> = {
    default: none,
    gocommerce,
    vtex,
  }

  const adjust = modules[platform] || modules.default

  const cleanImageUrl = adjust.cleanImageUrl(
    replaceHttpToRelativeProtocol(imageUrl)
  )

  const [at1x, at2x, at3x] = [1, 2, 3].map(hdf =>
    adjust.changeImageUrlSize(cleanImageUrl, { highDensityFactor: hdf })
  )

  if (!at1x || !at2x || !at3x) {
    return undefined
  }

  return { at1x, at2x, at3x }
}
