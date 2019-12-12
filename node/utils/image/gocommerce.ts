import { DEFAULT_HDF, DEFAULT_WIDTH } from './constants'

const cleanImageUrl = (imageUrl: string | undefined) => {
  if (!imageUrl) {
    return undefined
  }

  return imageUrl.split('?')[0]
}

const changeImageUrlSize = (
  imageUrl: string | undefined,
  { width = DEFAULT_WIDTH, highDensityFactor = DEFAULT_HDF } = {}
) => {
  if (!imageUrl) {
    return undefined
  }

  const widthCalc = width * highDensityFactor
  return `${imageUrl}?width=${widthCalc}&height=auto&aspect=true`
}

export default {
  changeImageUrlSize,
  cleanImageUrl,
}
