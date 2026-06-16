export interface BannerSize {
  id: string
  name: string
  width: number
  height: number
}

export interface GradientColor {
  start: string
  end: string
  direction?: 'vertical' | 'horizontal' | 'diagonal'
}

export interface TextStyle {
  color: string
  fontSizePercent: number
  fontWeight: number
  shadowColor?: string
  shadowOffsetX?: number
  shadowOffsetY?: number
  shadowBlur?: number
  useGradient?: boolean
  gradientStart?: string
  gradientEnd?: string
}

export interface LayoutPosition {
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
}

export interface ImageStyle {
  borderRadius: number
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  shadowColor: string
}

export interface ButtonStyle {
  backgroundColor: string
  textColor: string
  borderRadius: number
  paddingX: number
  paddingY: number
}

export interface Template {
  id: string
  name: string
  background: GradientColor
  titleStyle: TextStyle
  subtitleStyle: TextStyle
  buttonTextStyle: TextStyle
  buttonStyle: ButtonStyle
  imageLayout: LayoutPosition
  titleLayout: LayoutPosition
  subtitleLayout: LayoutPosition
  buttonLayout: LayoutPosition
  imageStyle: ImageStyle
  accentColor: string
}

export interface UserInput {
  imageUrl: string
  title: string
  subtitle: string
  buttonText: string
}

export interface BannerOutput {
  id: string
  sizeId: string
  dataUrl: string
  createdAt: number
}

export interface AppState {
  selectedTemplateId: string
  selectedSizeId: string
  userInput: UserInput
  banners: BannerOutput[]
  isDownloading: boolean
  isImageLoading: boolean
  setSelectedTemplateId: (id: string) => void
  setSelectedSizeId: (id: string) => void
  setUserInput: (input: Partial<UserInput>) => void
  setDownloading: (loading: boolean) => void
  setImageLoading: (loading: boolean) => void
  addBanner: (banner: BannerOutput) => void
  clearBanners: () => void
}
