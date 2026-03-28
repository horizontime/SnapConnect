import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps
} from 'react-native';
import { colors } from '@/constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  ...rest
}) => {
  const getButtonStyle = (): ViewStyle[] => {
    const buttonStyles: ViewStyle[] = [styles.button];
    
    // Variant styles
    if (variant === 'primary') {
      buttonStyles.push(styles.primaryButton);
    } else if (variant === 'secondary') {
      buttonStyles.push(styles.secondaryButton);
    } else if (variant === 'outline') {
      buttonStyles.push(styles.outlineButton);
    } else if (variant === 'text') {
      buttonStyles.push(styles.textButton);
    }
    
    // Size styles
    if (size === 'small') {
      buttonStyles.push(styles.smallButton);
    } else if (size === 'large') {
      buttonStyles.push(styles.largeButton);
    }
    
    // Full width
    if (fullWidth) {
      buttonStyles.push(styles.fullWidth);
    }
    
    // Disabled state
    if (disabled || loading) {
      buttonStyles.push(styles.disabledButton);
    }
    
    return buttonStyles;
  };
  
  const getTextStyle = (): TextStyle[] => {
    const textStyles: TextStyle[] = [styles.buttonText];
    
    // Variant text styles
    if (variant === 'primary') {
      textStyles.push(styles.primaryButtonText);
    } else if (variant === 'secondary') {
      textStyles.push(styles.secondaryButtonText);
    } else if (variant === 'outline') {
      textStyles.push(styles.outlineButtonText);
    } else if (variant === 'text') {
      textStyles.push(styles.textButtonText);
    }
    
    // Size text styles
    if (size === 'small') {
      textStyles.push(styles.smallButtonText);
    } else if (size === 'large') {
      textStyles.push(styles.largeButtonText);
    }
    
    // Disabled text
    if (disabled || loading) {
      textStyles.push(styles.disabledButtonText);
    }
    
    return textStyles;
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[...getButtonStyle(), style]}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? colors.card : colors.primary} 
        />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  largeButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  fullWidth: {
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: colors.card,
  },
  secondaryButtonText: {
    color: colors.card,
  },
  outlineButtonText: {
    color: colors.primary,
  },
  textButtonText: {
    color: colors.primary,
  },
  smallButtonText: {
    fontSize: 14,
  },
  largeButtonText: {
    fontSize: 18,
  },
  disabledButtonText: {
    opacity: 0.8,
  },
});