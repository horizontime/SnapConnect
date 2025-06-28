import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface TextEditorProps {
  visible: boolean;
  initialText?: string;
  initialColor?: string;
  initialFontSize?: number;
  initialFontFamily?: string;
  onSave: (text: string, color: string, fontSize: number, fontFamily: string) => void;
  onClose: () => void;
}

const FONT_FAMILIES = [
  { name: 'Default', value: 'System' },
  { name: 'Bold', value: 'System-Bold' },
  { name: 'Italic', value: 'System-Italic' },
  { name: 'Monospace', value: 'monospace' },
];

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#4B0082',
];

const FONT_SIZES = [12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64];

const BEIGE_COLOR = '#D4C4A8'; // Light beige color for selections

export default function TextEditor({
  visible,
  initialText = '',
  initialColor = '#FFFFFF',
  initialFontSize = 24,
  initialFontFamily = 'System',
  onSave,
  onClose,
}: TextEditorProps) {
  const [text, setText] = useState(initialText);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedFontSize, setSelectedFontSize] = useState(initialFontSize);
  const [selectedFontFamily, setSelectedFontFamily] = useState(initialFontFamily);

  const handleSave = () => {
    onSave(text, selectedColor, selectedFontSize, selectedFontFamily);
    onClose();
  };

  const getFontStyle = () => {
    switch (selectedFontFamily) {
      case 'System-Bold':
        return { fontWeight: 'bold' as const };
      case 'System-Italic':
        return { fontStyle: 'italic' as const };
      case 'monospace':
        return { fontFamily: 'monospace' };
      default:
        return {};
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Add Text</Text>
            <TouchableOpacity onPress={handleSave}>
              <Check size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.textInput,
              {
                color: selectedColor,
                fontSize: selectedFontSize,
                ...getFontStyle(),
              },
            ]}
            value={text}
            onChangeText={setText}
            placeholder="Enter text..."
            placeholderTextColor="#666"
            multiline
            autoFocus
          />

          <View style={styles.optionsContainer}>
            <Text style={styles.sectionTitle}>Font Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.fontRow}>
                {FONT_FAMILIES.map((font) => (
                  <TouchableOpacity
                    key={font.value}
                    style={[
                      styles.fontOption,
                      selectedFontFamily === font.value && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedFontFamily(font.value)}
                  >
                    <Text style={[
                      styles.fontOptionText,
                      selectedFontFamily === font.value && styles.selectedText,
                    ]}>
                      {font.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.sectionTitle}>Text Size</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.sizeRow}>
                {FONT_SIZES.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeOption,
                      selectedFontSize === size && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedFontSize(size)}
                  >
                    <Text style={[
                      styles.sizeOptionText,
                      selectedFontSize === size && styles.selectedText,
                    ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.sectionTitle}>Text Color</Text>
            <View style={styles.colorGrid}>
              {TEXT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  textInput: {
    minHeight: 100,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 15,
    marginBottom: 10,
  },
  fontRow: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  fontOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginRight: 10,
  },
  fontOptionText: {
    color: colors.text,
    fontSize: 14,
  },
  sizeRow: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  sizeOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    marginRight: 10,
  },
  sizeOptionText: {
    color: colors.text,
    fontSize: 14,
  },
  selectedOption: {
    backgroundColor: BEIGE_COLOR,
  },
  selectedText: {
    color: '#000',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
}); 