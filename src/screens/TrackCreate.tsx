import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StatusBar,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox } from 'react-native-paper';
import api from '../api';
import { SafeAreaView } from 'react-native-safe-area-context';

const CreateTrackScreen = ({ navigation }) => {
  // Состояния
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_ids: []
  });

  // Загрузка категорий
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/home/');
        if (response.data?.categories) {
          // Добавляем id от 1 до количества категорий
          const categoriesWithIds = response.data.categories.map((cat, index) => ({
            ...cat,
            id: index + 1
          }));
          setCategories(categoriesWithIds);
        } else {
          throw new Error('Некорректный формат данных');
        }
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить категории');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Обработчики изменений
  const handleInputChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (categoryId) => {
    setForm(prev => {
      const newCategories = prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId];
      return { ...prev, category_ids: newCategories };
    });
  };

  // Отправка формы
  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Ошибка', 'Введите название трека');
      return;
    }

    if (!form.description.trim()) {
      Alert.alert('Ошибка', 'Введите описание трека');
      return;
    }

    if (form.category_ids.length === 0) {
      Alert.alert('Ошибка', 'Выберите хотя бы одну категорию');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await api.post('/tracks/', {
        subject: form.title,
        description: form.description,
        category_ids: form.category_ids
      });

      if (response.status === 201) {
        Alert.alert('Успех', 'Трек успешно создан', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Ошибка создания трека:', error);
      Alert.alert(
        'Ошибка', 
        error.response?.data?.message || 
        error.message || 
        'Не удалось создать трек'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Рендер элемента категории
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => handleCategoryToggle(item.id)}
    >
      <Checkbox
        status={form.category_ids.includes(item.id) ? 'checked' : 'unchecked'}
        color="#4A90E2"
      />
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Шапка */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Создать трек</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Поле названия */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Название трека*</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(text) => handleInputChange('title', text)}
            placeholder="Введите название трека"
            placeholderTextColor="#999"
          />
        </View>

        {/* Поле описания */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Описание*</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description}
            onChangeText={(text) => handleInputChange('description', text)}
            placeholder="Опишите ваш трек..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Выбор категорий */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Категории*</Text>
          <Text style={styles.hint}>Выберите подходящие категории</Text>
          
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            style={styles.categoryList}
          />
        </View>

        {/* Кнопка отправки */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Создать трек</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Стили (остаются без изменений)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  backButton: {
    padding: 8,
    marginRight: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333'
  },
  container: {
    padding: 16,
    paddingBottom: 24
  },
  inputGroup: {
    marginBottom: 24
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#333'
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top'
  },
  categoryList: {
    marginTop: 8
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  categoryText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333'
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  }
});

export default CreateTrackScreen;