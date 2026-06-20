import type { ShapeType } from '../store'

export interface BadgeParams {
  shape: ShapeType
  icon: string
  backgroundColor: string
  foregroundColor: string
  borderColor: string
  borderWidth: number
  borderRadius: number
  scale: number
}

export interface IconDef {
  id: string
  name: string
  faClass: string
  viewBox: string
  path: string
}

export const ICONS: IconDef[] = [
  {
    id: 'star',
    name: '星形',
    faClass: 'fa-solid fa-star',
    viewBox: '0 0 576 512',
    path: 'M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0z',
  },
  {
    id: 'heart',
    name: '心形',
    faClass: 'fa-solid fa-heart',
    viewBox: '0 0 512 512',
    path: 'M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z',
  },
  {
    id: 'gear',
    name: '齿轮',
    faClass: 'fa-solid fa-gear',
    viewBox: '0 0 512 512',
    path: 'M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336c44.2 0 80-35.8 80-80s-35.8-80-80-80s-80 35.8-80 80s35.8 80 80 80z',
  },
  {
    id: 'user',
    name: '用户',
    faClass: 'fa-solid fa-user',
    viewBox: '0 0 448 512',
    path: 'M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z',
  },
  {
    id: 'question',
    name: '问号',
    faClass: 'fa-solid fa-circle-question',
    viewBox: '0 0 512 512',
    path: 'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM169.8 165.3c7.9-22.3 29.1-37.3 52.8-37.3h58.3c34.9 0 63.1 28.3 63.1 63.1c0 22.6-12.1 43.5-31.7 54.8L280 264.4c-.2 13-10.9 23.6-24 23.6c-13.3 0-24-10.7-24-24V250.5c0-8.6 4.6-16.5 12.1-20.8l44.3-25.4c4.7-2.7 7.6-7.7 7.6-13.1c0-8.4-6.8-15.1-15.1-15.1H222.6c-8.8 0-16 7.2-16 16v5.3c0 8.4-6.8 15.2-15.2 15.2c-8 0-14.7-6.1-15.1-14.1l-.6-15.6zm38.2 354.1c6.9-14.2 21-23.9 38-23.9s31.1 9.7 38 23.9c3 6.2 4.6 13.1 4.6 20.2c0 24.2-19.6 43.9-43.8 43.9c-24.1 0-43.8-19.7-43.8-43.9c0-7.1 1.6-14 4.6-20.2z',
  },
  {
    id: 'exclamation',
    name: '感叹号',
    faClass: 'fa-solid fa-circle-exclamation',
    viewBox: '0 0 512 512',
    path: 'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z',
  },
  {
    id: 'check',
    name: '对勾',
    faClass: 'fa-solid fa-check',
    viewBox: '0 0 448 512',
    path: 'M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z',
  },
  {
    id: 'xmark',
    name: '关闭',
    faClass: 'fa-solid fa-xmark',
    viewBox: '0 0 384 512',
    path: 'M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z',
  },
  {
    id: 'home',
    name: '首页',
    faClass: 'fa-solid fa-house',
    viewBox: '0 0 576 512',
    path: 'M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V455.8c-.3-2.7-.5-5.4-.5-8.1L64 287.5h-32C14.9 287.5 0 273.5 0 255.5c0-8.9 3.6-86.6 36-152.7L256 16.1c12-10.7 28.9-16.1 46.1-16.1s34.1 5.4 46.1 16.1l164.5 164.5c4.6 4.6 8.2 10.6 10.5 17.2.8 2.2 1.5 4.5 1.6 6.8.2 2.7-.2 5.5-.2 8.1 0 13.3 10.7 24.1 24 24.1 13.2 0 24-10.8 24-24.1 0-13.9 2.2-27.2 6.2-39.5 5.6-17.4 8.2-36.4 8.2-56.1 0-54.1-21.5-105.9-57.4-144.8-8-8.7-19.8-13.1-32-13.1zM288 96c-8.8 0-16 7.2-16 16s7.2 16 16 16s16-7.2 16-16s-7.2-16-16-16z',
  },
  {
    id: 'bell',
    name: '铃铛',
    faClass: 'fa-solid fa-bell',
    viewBox: '0 0 448 512',
    path: 'M224 0c-17.7 0-32 14.3-32 32V49.9C119.5 61.4 64 124.2 64 200v33.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V200c0-75.8-55.5-138.6-128-150.1V32c0-17.7-14.3-32-32-32zm0 96h8c57.4 0 104 46.6 104 104v33.4c0 47.9 13.9 94.6 39.7 134.6H72.3C98.1 328 112 281.3 112 233.4V200c0-57.4 46.6-104 104-104h8zm64 352H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z',
  },
  {
    id: 'bolt',
    name: '闪电',
    faClass: 'fa-solid fa-bolt',
    viewBox: '0 0 448 512',
    path: 'M349.4 44.6l128 192c5.5 8.2 5 19-1.2 26.5S457 288 448 288H304v192c0 7.4-4.2 14.2-10.9 17.5s-14.3 2.1-19.7-4.4l-128-192c-5.5-8.2-5-19 1.2-26.5S153.6 256 162.6 256H304V64c0-7.4 4.2-14.2 10.9-17.5s14.3-2.1 19.7 4.4z',
  },
  {
    id: 'bookmark',
    name: '书签',
    faClass: 'fa-solid fa-bookmark',
    viewBox: '0 0 384 512',
    path: 'M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.9 13.6-5.3L192 369.5 346.1 506.7c3.6 3.4 8.5 5.3 13.6 5.3C373.1 512 384 501.1 384 487.7V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z',
  },
  {
    id: 'camera',
    name: '相机',
    faClass: 'fa-solid fa-camera',
    viewBox: '0 0 512 512',
    path: 'M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 317.4 32H194.6c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z',
  },
  {
    id: 'download',
    name: '下载',
    faClass: 'fa-solid fa-download',
    viewBox: '0 0 512 512',
    path: 'M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64z',
  },
  {
    id: 'envelope',
    name: '邮件',
    faClass: 'fa-solid fa-envelope',
    viewBox: '0 0 512 512',
    path: 'M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z',
  },
  {
    id: 'flag',
    name: '旗帜',
    faClass: 'fa-solid fa-flag',
    viewBox: '0 0 448 512',
    path: 'M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32V64 368 480c0 17.7 14.3 32 32 32s32-14.3 32-32V352l64.3-16.1c41.1-10.3 84.3-27.5 124-9.6c40.6 18.2 83.3 15.5 121.9-6.6l1.8-1.1c20.5-12.8 35.9-33 42.5-56.5l2.8-10.2c6.4-22.8-3.2-47-24.5-60L344.9 176l50.9-32.2c21.4-13.5 30.9-38.3 24.5-60.9l-2.8-10.1c-6.6-23.7-22-44-42.5-56.8l-1.8-1.1c-38.6-22.1-81.3-24.8-121.9-6.6c-39.7 17.9-82.9 35.1-124 24.8L64 20.7V32z',
  },
  {
    id: 'lock',
    name: '锁',
    faClass: 'fa-solid fa-lock',
    viewBox: '0 0 448 512',
    path: 'M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z',
  },
  {
    id: 'search',
    name: '搜索',
    faClass: 'fa-solid fa-magnifying-glass',
    viewBox: '0 0 512 512',
    path: 'M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z',
  },
  {
    id: 'shield',
    name: '盾牌',
    faClass: 'fa-solid fa-shield-halved',
    viewBox: '0 0 512 512',
    path: 'M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 66.8V444.8C394 378 431.1 230.1 432 141.4L256 66.8l0 0z',
  },
  {
    id: 'music',
    name: '音乐',
    faClass: 'fa-solid fa-music',
    viewBox: '0 0 512 512',
    path: 'M499.1 6.3c8.1 6 12.9 15.6 12.9 25.7v72V368c0 44.2-43 80-96 80s-96-35.8-96-80s43-80 96-80c11.2 0 22 1.6 32 4.6V147L192 223.8V432c0 44.2-43 80-96 80s-96-35.8-96-80s43-80 96-80c11.2 0 22 1.6 32 4.6V280.1c0-10.1 4.8-19.7 12.9-25.7l224-176c8.1-6.4 18.9-8.7 28.8-6s18.7 10.5 23.4 20z',
  },
]

export function getIconById(id: string): IconDef {
  return ICONS.find((i) => i.id === id) || ICONS[0]
}

export function generateBadgeSVG(params: BadgeParams): string {
  return generateSimpleBadgeSVG(params)
}

export function generateSimpleBadgeSVG(params: BadgeParams): string {
  const vb = 200
  const shapeSize = vb * 0.96
  const offset = (vb - shapeSize) / 2
  const isCircle = params.shape === 'circle'
  const iconDef = getIconById(params.icon)

  let shapeEl = ''
  let borderEl = ''

  if (isCircle) {
    const cx = vb / 2
    const cy = vb / 2
    const r = shapeSize / 2 - params.borderWidth
    shapeEl = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${params.backgroundColor}"/>`
    if (params.borderWidth > 0) {
      borderEl = `<circle cx="${cx}" cy="${cy}" r="${shapeSize / 2 - params.borderWidth / 2}" fill="none" stroke="${params.borderColor}" stroke-width="${params.borderWidth}"/>`
    }
  } else if (params.shape === 'roundedRect') {
    const inset = params.borderWidth
    const maxR = shapeSize / 2
    const r = Math.min(params.borderRadius * (shapeSize / 120), maxR)
    shapeEl = `<rect x="${offset + inset}" y="${offset + inset}" width="${shapeSize - inset * 2}" height="${shapeSize - inset * 2}" rx="${r}" ry="${r}" fill="${params.backgroundColor}"/>`
    if (params.borderWidth > 0) {
      borderEl = `<rect x="${offset + inset / 2}" y="${offset + inset / 2}" width="${shapeSize - inset}" height="${shapeSize - inset}" rx="${r}" ry="${r}" fill="none" stroke="${params.borderColor}" stroke-width="${params.borderWidth}"/>`
    }
  } else if (params.shape === 'hexagon') {
    const cx = vb / 2
    const cy = vb / 2
    const outerR = shapeSize / 2
    const innerR = outerR - params.borderWidth
    const makePoly = (r: number) => {
      const pts: string[] = []
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2
        pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`)
      }
      return pts.join(' ')
    }
    shapeEl = `<polygon points="${makePoly(innerR)}" fill="${params.backgroundColor}"/>`
    if (params.borderWidth > 0) {
      borderEl = `<polygon points="${makePoly(outerR - params.borderWidth / 2)}" fill="none" stroke="${params.borderColor}" stroke-width="${params.borderWidth}"/>`
    }
  }

  const ivb = iconDef.viewBox.split(' ').map(Number)
  const iw = ivb[2]
  const ih = ivb[3]
  const it = vb * 0.48
  const is2 = it / Math.max(iw, ih)
  const idw = iw * is2
  const idh = ih * is2
  const ix = (vb - idw) / 2
  const iy = (vb - idh) / 2

  const finalSize = Math.round(vb * (params.scale / 100))

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" width="${finalSize}" height="${finalSize}">
${shapeEl}
${borderEl}
<g transform="translate(${ix} ${iy}) scale(${is2})" fill="${params.foregroundColor}">
<path d="${iconDef.path}"/>
</g>
</svg>`
}
