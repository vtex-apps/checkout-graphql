import gocommerce from './gocommerce'
import none from './none'
import vtex from './vtex'

interface Module {
  cleanImageUrl: (imageUrl: string | undefined) => string | undefined
  changeImageUrlSize: (imageUrl: string | undefined) => string | undefined
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

  const fixedUrl = adjust.changeImageUrlSize(
    adjust.cleanImageUrl(
      replaceHttpToRelativeProtocol(imageUrl)
    )
  )

  if (!fixedUrl) {
    return imageUrl
  }

  return fixedUrl
}
