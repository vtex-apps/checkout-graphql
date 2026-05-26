import { fixImageUrl } from '../utils/image'

const VTEX_URL_SIZED = '//host.vteximg.com.br/arquivos/ids/123-100-200/foo.jpg'
const VTEX_URL_PLAIN = '//host.vteximg.com.br/arquivos/ids/456/foo.jpg'

describe('utils/image — fixImageUrl', () => {
  describe('platform: vtex', () => {
    it('strips existing -W-H size and rebuilds 1x/2x/3x derived URLs', () => {
      expect(fixImageUrl(VTEX_URL_SIZED, 'vtex')).toEqual({
        at1x: '//host.vteximg.com.br/arquivos/ids/123-96-auto',
        at2x: '//host.vteximg.com.br/arquivos/ids/123-192-auto',
        at3x: '//host.vteximg.com.br/arquivos/ids/123-288-auto',
      })
    })

    it('appends sizes when the URL does not already carry one', () => {
      expect(fixImageUrl(VTEX_URL_PLAIN, 'vtex')).toEqual({
        at1x: '//host.vteximg.com.br/arquivos/ids/456-96-auto',
        at2x: '//host.vteximg.com.br/arquivos/ids/456-192-auto',
        at3x: '//host.vteximg.com.br/arquivos/ids/456-288-auto',
      })
    })

    it('rewrites http:// and https:// to relative protocol', () => {
      const result = fixImageUrl(
        'http://host.vteximg.com.br/arquivos/ids/789/foo.jpg',
        'vtex'
      )

      expect(result).toEqual({
        at1x: '//host.vteximg.com.br/arquivos/ids/789-96-auto',
        at2x: '//host.vteximg.com.br/arquivos/ids/789-192-auto',
        at3x: '//host.vteximg.com.br/arquivos/ids/789-288-auto',
      })
    })

    it('returns undefined for URLs that do not match the ids/<n>/ pattern', () => {
      expect(
        fixImageUrl('//cdn.example.com/some/other/path.jpg', 'vtex')
      ).toBeUndefined()
    })
  })

  describe('platform: gocommerce', () => {
    it('drops the querystring and rebuilds 1x/2x/3x via width param', () => {
      expect(
        fixImageUrl('//cdn.example.com/image.jpg?token=abc', 'gocommerce')
      ).toEqual({
        at1x: '//cdn.example.com/image.jpg?width=96&height=auto&aspect=true',
        at2x: '//cdn.example.com/image.jpg?width=192&height=auto&aspect=true',
        at3x: '//cdn.example.com/image.jpg?width=288&height=auto&aspect=true',
      })
    })

    it('rewrites https:// to relative protocol before applying sizing', () => {
      expect(
        fixImageUrl('https://cdn.example.com/image.jpg', 'gocommerce')
      ).toEqual({
        at1x: '//cdn.example.com/image.jpg?width=96&height=auto&aspect=true',
        at2x: '//cdn.example.com/image.jpg?width=192&height=auto&aspect=true',
        at3x: '//cdn.example.com/image.jpg?width=288&height=auto&aspect=true',
      })
    })
  })

  describe('platform fallback', () => {
    it('returns the relative-protocol URL untouched for unknown platforms', () => {
      const result = fixImageUrl(
        'https://cdn.example.com/image.jpg',
        'unknown-platform'
      )

      expect(result).toEqual({
        at1x: '//cdn.example.com/image.jpg',
        at2x: '//cdn.example.com/image.jpg',
        at3x: '//cdn.example.com/image.jpg',
      })
    })
  })

  describe('falsy inputs', () => {
    it('returns undefined when imageUrl is undefined', () => {
      expect(fixImageUrl(undefined as any, 'vtex')).toBeUndefined()
    })

    it('returns undefined when imageUrl is an empty string', () => {
      expect(fixImageUrl('', 'vtex')).toBeUndefined()
    })
  })
})
