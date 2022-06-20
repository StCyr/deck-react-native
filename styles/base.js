import {StyleSheet, Dimensions} from 'react-native'

// ----------- Basics ----------- //
export const dimensions = {
  fullHeight: Dimensions.get('window').height,
  fullWidth: Dimensions.get('window').width
}

export const getColors = (theme) => {
  const palette = {
    light: {
      bg: '#fff',
      bgDefault: '#f2f2f2',
      text: '#000',
      border: '#E5E5E5',
      // blueish
      bgInteract: '#D8E6FF',
      textInteract: '#005DFF',
      // reddish
      bgDestruct: '#FFCAC9',
      textDestruct: '#FF0300',
    },
    dark: {
      bg: '#181818',
      bgDefault: '#222',
      text: '#d8d8d8',
      border: '#2a2a2a',
      // blueish
      bgInteract: '#001B4A',
      textInteract: '#D8E6FF',
      // reddish
      bgDestruct: '#3D0100',
      textDestruct: '#FFCAC9',
    }
  }
  return palette[theme]
}

export const padding = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32
}

export const fonts = {
  xs: 12,
  s: 15,
  m: 17,
  l: 19,
  xl: 23,
}

export const dropShadow = {
  shadowColor: '#000',
  shadowOffset: {width: 0, height: padding.xs},
  shadowOpacity: 0.05,
  shadowRadius: padding.s,
  elevation: 3,
}

const containerStyles = {
  padding: padding.m,
}

const baseStyles = (theme) => {
  const colors = getColors(theme)
  return {
    boardDetailsContainer: {
      ...containerStyles,
      paddingTop: 0,
    },
    button: {
      width: '100%',
      borderRadius: padding.m,
      padding: padding.m,
      marginVertical: padding.s,
      backgroundColor: colors.bgInteract,
    },
    buttonDestruct: {
      backgroundColor: colors.bgDestruct,
    },
    buttonTitle: {
      textAlign: 'center',
      fontSize: fonts.l,
      fontWeight: '600',
      color: colors.textInteract,
    },
    buttonTitleDestruct: {
      color: colors.textDestruct,
    },
    card: {
      backgroundColor: colors.bg,
      borderRadius: padding.m,
      padding: padding.m,
      marginBottom: padding.m,
      flexDirection: 'row',
      alignItems: 'center',
      ...dropShadow,
    },
    cardColor: {
      width: padding.m,
      height: padding.m,
      borderRadius: padding.m / 2,
      marginRight: padding.m
    },
    cardDetailsLabel: {
      borderRadius: padding.l,
      marginRight: padding.s,
      minWidth: 0,
      paddingLeft: padding.s,
      paddingRight: padding.s,
    },
    cardDetailsLabelText: {
      fontSize: fonts.m,
      justifyContent: 'center',
      textAlign: 'center',
    },
    cardLabel: {
      borderRadius: padding.s,
      marginRight: padding.xxs,
      minWidth: 0,
      paddingLeft: padding.xs,
      paddingRight: padding.xs,
    },
    cardLabelContainer: {
      flex: 1,
      flexDirection: 'row',
      marginTop: padding.xs,
    },
    cardLabelText: {
      fontSize: fonts.xs,
      justifyContent: 'center',
      textAlign: 'center',
    },
    cardTitle: {
      color: colors.text,
      flex: 1,
      fontSize: fonts.xl
    },
    comment: {
      marginBottom: padding.s
    },
    commentAuthor: {
      fontSize: fonts.m
    },
    commentCreationDate: {      
      fontSize: fonts.xs,
      marginLeft: padding.s
    },
    commentHeader: {
      alignItems: 'baseline',
      flexDirection: 'row',
      marginBottom: padding.xs
    },
    container: {
      ...containerStyles
    },
    descriptionInput: {
      minHeight: 120,
    },
    dueDate: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      paddingTop: 5,
    },
    dueDateText: {
      fontWeight: 'bold',
      fontSize: fonts.xs
    },
    icon: {
      color: colors.text,
    },
    input: {
      color: colors.text,
      width: '100%',
      flexDirection: 'row',
      backgroundColor: colors.bg,
      borderColor: colors.border,
      fontSize: fonts.m,
      borderWidth: 1,
      borderRadius: padding.s,
      marginVertical: padding.s,
      padding: padding.m,
    },
    inputReadMode: {
      color: colors.text,
      width: '100%',
      flexDirection: 'row',
      fontSize: fonts.m,
    },
    inputButton: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      borderRadius: padding.m,
      padding: padding.m,
      marginVertical: padding.s,
      backgroundColor: colors.bgInteract,
    },
    inputText: {
      textAlign: 'center',
      fontSize: fonts.m,
      color: colors.textInteract,
    },
    inputField: {
      marginVertical: padding.s,
    },
    spinnerContainer: {
      position: 'absolute',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      zIndex: 10000
    },
    spinnerText: {
      textAlign: 'center',
      fontSize: fonts.xl,
      color: '#666666',
      marginBottom: 5
    },
    stackBar: {
      flex: 1,
      flexDirection: 'row',
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      marginBottom: padding.m,
      backgroundColor: colors.bgDefault,
      width: '100%',
    },
    stackBarScrollInner: {
      paddingRight: padding.m,
      paddingLeft: padding.m,
      minWidth: '100%',
    },
    stackTab: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    stackTabDraggedOver: {
      backgroundColor: colors.bgInteract,
    },
    stackTabText: {
      textAlign: 'center',
      textTransform: 'uppercase',
      color: colors.text,
      padding: padding.m,
    },
    stackTabTextSelected: {
      fontWeight: 'bold'
    },
    stackTabTextNormal: {
      fontWeight: 'normal'
    },
    textWarning: {
      color: colors.text,
      textAlign: 'center',
      fontSize: fonts.l,
    },
    textCheckbox: {
      color: colors.text,
      marginLeft: 5,
    },
    title: {
      color: colors.text,
      fontSize: fonts.xl,
      fontWeight: '600',
      marginTop: padding.m,
      marginBottom: padding.s,
    },
  }
}

const createStyles = (theme = 'light', overrides = {}) => {
  const styles = baseStyles(theme)
  return StyleSheet.create({...styles, ...overrides})
}

export default createStyles