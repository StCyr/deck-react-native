import React from 'react'
import { createIconSetFromFontello } from '@expo/vector-icons'
import fontelloConfig from '../assets/fonts/deck/config.json'

const CreateIcon = createIconSetFromFontello(
  fontelloConfig,
  'deck',
  'deck.ttf'
)

const Icon = ({ size = 24, name = 'right-open', style }) => {
  return <CreateIcon name={name} size={size} style={style} />
}

export default Icon