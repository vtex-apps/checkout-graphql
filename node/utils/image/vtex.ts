import { DEFAULT_HDF, DEFAULT_WIDTH } from './constants'

const baseUrlRegex = new RegExp(/.+ids\/(\d+)(?:-(\d+)-(\d+)|)\//)
const sizeRegex = new RegExp(/-(\d+)-(\d+)/)

const cleanImageUrl = (imageUrl: string | undefined) => {
  if (!imageUrl) {
    return undefined
  }

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
  {
    highDensityFactor = DEFAULT_HDF,
    width = DEFAULT_WIDTH,
  } = {}
) => {
  if (!imageUrl) {
    return undefined
  }
  const widthCalc = width * highDensityFactor
  const resizedImageUrl = imageUrl.slice(0, -1) // Remove last "/"
  return `${resizedImageUrl}-${widthCalc}-auto`
}

export default {
  changeImageUrlSize,
  cleanImageUrl,
}
