import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

interface Category {
  id: number;
  name: string;
}

interface FormData {
  subject: string;
  description: string;
  category_ids: number[];
  privacy: 'PB' | 'PR';
  images: { uri: string, name: string, type: string }[];
}

export default function CreateScreen({ navigation }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    description: '',
    category_ids: [],
    privacy: 'PB',
    images: []
  });

  // Загрузка категорий
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/home/');
      
      if (!response.data?.categories) {
        throw new Error('Некорректный ответ сервера');
      }

      const formattedCategories = response.data.categories.map((cat: any, index: number) => ({
        id: index,
        name: cat.name
      }));

      setCategories(formattedCategories);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    requestMediaPermission();
  }, []);

  const requestMediaPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Требуется доступ', 'Необходимо разрешение для доступа к галерее');
    }
  };

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    const selectedIndex = parseInt(value, 10);
    if (!isNaN(selectedIndex)) {
      setFormData(prev => ({
        ...prev,
        category_ids: [selectedIndex]
      }));
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg'
        }));
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      }
    } catch (error) {
      console.error('Ошибка выбора изображений:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображения');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const updatedImages = [...prev.images];
      updatedImages.splice(index, 1);
      return { ...prev, images: updatedImages };
    });
  };

  const validateForm = () => {
    if (!formData.subject.trim()) {
      Alert.alert('Ошибка', 'Укажите тему трека');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Ошибка', 'Введите описание');
      return false;
    }
    if (formData.category_ids.length === 0) {
      Alert.alert('Ошибка', 'Выберите категорию');
      return false;
    }
    return true;
  };

  const submitForm = async () => {
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);

      // Создаем FormData
      const formDataToSend = new FormData();

      // Добавляем текстовые данные
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('privacy', formData.privacy);
      
      // Добавляем категории (каждую отдельно)
      formData.category_ids.forEach(id => {
        formDataToSend.append('category_ids', String(id));
      });

      // Добавляем картинки в нужном формате
      formData.images.forEach((img, index) => {
        formDataToSend.append(`images[${index}][image]`, {
          uri: img.uri,
          type: img.type,
          name: img.name
        } as any);
      });

      console.log('Отправка данных:', formDataToSend);

      const response = await api.post('/tracks/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data,
      });

      console.log('Ответ сервера:', response.data);

      if (response.status === 201) {
        Alert.alert('Успех', 'Трек успешно создан', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Ошибка создания:', error);
      Alert.alert('Ошибка', 'Не удалось создать трек. Попробуйте позже.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading && categories.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Создание трека</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Тема*</Text>
          <TextInput
            style={styles.input}
            value={formData.subject}
            onChangeText={(text) => handleInputChange('subject', text)}
            placeholder="Кратко опишите проблему"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Описание*</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            placeholder="Подробно опишите ваш вопрос"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Категория*</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={formData.category_ids[0]?.toString() || ''}
              onValueChange={handleCategoryChange}
              style={styles.picker}
              dropdownIconColor="#4A90E2"
            >
              <Picker.Item label="Выберите категорию" value="" enabled={false} />
              {categories.map((category, index) => (
                <Picker.Item 
                  key={category.id} 
                  label={category.name} 
                  value={index.toString()} 
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Приватность</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={formData.privacy}
              onValueChange={(value) => handleInputChange('privacy', value as 'PB' | 'PR')}
              style={styles.picker}
              dropdownIconColor="#4A90E2"
            >
              <Picker.Item label="Публичный" value="PB" />
              <Picker.Item label="Приватный" value="PR" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Изображения (максимум 5)</Text>
          <TouchableOpacity 
            style={styles.imageButton}
            onPress={pickImages}
            disabled={formData.images.length >= 5}
          >
            <Text style={styles.imageButtonText}>Выбрать изображения ({formData.images.length}/5)</Text>
          </TouchableOpacity>

          <View style={styles.imagePreviewContainer}>
            {formData.images.map((image, index) => (
              <View key={index} style={styles.imagePreviewWrapper}>
                <Image 
                  source={{ uri: image.uri }} 
                  style={styles.imagePreview} 
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close" size={18} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.submitButton, submitLoading && styles.submitButtonDisabled]}
            onPress={submitForm}
            disabled={submitLoading}
          >
            {submitLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Создать трек</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
  },
  container: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  picker: {
    width: '100%',
    color: '#333',
  },
  imageButton: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imageButtonText: {
    color: '#4A90E2',
    fontWeight: '500',
    fontSize: 16,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  imagePreviewWrapper: {
    width: 80,
    height: 80,
    marginRight: 12,
    marginBottom: 12,
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGroup: {
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 16,
  },
});