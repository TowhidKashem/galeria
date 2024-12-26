import { ViewStyle } from 'react-native'

export type ChangeEventPayload = {
  value: string
}

export type GaleriaViewProps = {
  index?: number
  id?: string
  children: React.ReactElement
  style?: ViewStyle
  dynamicAspectRatio?: boolean
}
