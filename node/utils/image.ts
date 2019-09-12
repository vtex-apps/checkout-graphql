const DEFAULT_WIDTH = 96
const DEFAULT_HDF = 1

const baseUrlRegex = new RegExp(/.+ids\/(\d+)(?:-(\d+)-(\d+)|)\//)
const sizeRegex = new RegExp(/-(\d+)-(\d+)/)

const cleanImageUrl = (imageUrl: string) => {
  let resizedImageUrl = imageUrl
  const result = baseUrlRegex.exec(imageUrl)
  if (result && result.length > 0) {
    if (
      result.length === 4 &&
        result[2] !== undefined &&
        result[3] !== undefined
    ) {
      resizedImageUrl = result[0].replace(sizeRegex, '')
    } else {
      resizedImageUrl = result[0]
    }
    return resizedImageUrl
  }
  return undefined
}

const changeImageUrlSize = (
  imageUrl: string | undefined,
  width = DEFAULT_WIDTH,
  highDensityFactor = DEFAULT_HDF
) => {
  if (!imageUrl) {
    return undefined
  }
  const widthCalc = width * highDensityFactor
  const resizedImageUrl = imageUrl.slice(0, -1) // Remove last "/"
  return `${resizedImageUrl}-${widthCalc}-auto`
}

const replaceHttpToRelativeProtocol = (url: string | undefined) => {
  if (!url) {
    return undefined
  }
  return url.replace(/https:\/\/|http:\/\//, '//')
}

export const fixImageUrl = (imageUrl: string) => {
  return changeImageUrlSize(
    replaceHttpToRelativeProtocol(cleanImageUrl(imageUrl))
  )
}
