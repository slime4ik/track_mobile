import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Dimensions,
  Pressable,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/ru';
import api from '../api';
import { BASE_URL } from '../config';
import { SafeAreaView } from 'react-native-safe-area-context';

moment.locale('ru');

const { width } = Dimensions.get('window');

export default function TrackDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { trackId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [track, setTrack] = useState(null);
  const [creatorModalVisible, setCreatorModalVisible] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [descriptionLines, setDescriptionLines] = useState(3);
  const [trackAnswers, setTrackAnswers] = useState([]);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const baseImageURL = BASE_URL.replace('/api', '');

  const fetchTrack = async () => {
    try {
      const { data } = await api.get(`/track/${trackId}/`);
      setTrack(data);
    } catch (error) {
      console.error('Failed to fetch track:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCreatorInfo = async (creatorId) => {
    try {
      const { data } = await api.get(`/users/${creatorId}/`);
      setCreatorInfo(data);
      setCreatorModalVisible(true);
    } catch (error) {
      console.error('Failed to fetch creator info:', error);
    }
  };

  const getTrackAnswers = async (url = null) => {
    try {
      const endpoint = url || `/answers/${trackId}/`;
      const { data } = await api.get(endpoint);
      
      if (url) {
        setTrackAnswers(prev => [...prev, ...data.results]);
      } else {
        setTrackAnswers(data.results || []);
      }
      
      setNextPage(data.next);
    } catch (e) {
      console.log('Ошибка загрузки ответов', e);
      setTrackAnswers([]);
    }
  };

  const markAsSolution = async (answerId) => {
    try {
      await api.patch(`/track-answers/${answerId}/`, { solution: true });
      
      const updatedAnswers = trackAnswers.map(answer => {
        if (answer.id === answerId) {
          return { ...answer, solution: true };
        }
        return answer;
      });
      setTrackAnswers(updatedAnswers);
    } catch (error) {
      console.error('Error marking as solution:', error);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('comment', answerText);
      formData.append('solution', false);
      
      const { data } = await api.post(`/answers/${trackId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setTrackAnswers(prev => [data, ...prev]);
      setAnswerText('');
      setShowAnswerForm(false);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadMoreAnswers = () => {
    if (nextPage) {
      getTrackAnswers(nextPage);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrack();
    getTrackAnswers();
  };

  const toggleLike = async () => {
    try {
      setTrack(prev => ({
        ...prev,
        already_liked: !prev.already_liked,
        total_likes: prev.already_liked ? prev.total_likes - 1 : prev.total_likes + 1
      }));
      
      await api.post(`/tracks/${trackId}/like/`);
    } catch (error) {
      console.error('Like error:', error);
      setTrack(prev => ({
        ...prev,
        already_liked: !prev.already_liked,
        total_likes: prev.already_liked ? prev.total_likes + 1 : prev.total_likes - 1
      }));
    }
  };

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
    setDescriptionLines(showFullDescription ? 3 : 0);
  };

  useEffect(() => {
    fetchTrack();
    getTrackAnswers();
  }, [trackId]);

  const AnswerCard = ({ item }) => (
    <View style={styles.answerCard}>
      <View style={styles.answerHeader}>
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={() => fetchCreatorInfo(item.creator)}
        >
          <Image 
            source={item.creator_avatar ? { uri: `${baseImageURL}${item.creator_avatar}` } : require('../images/default-avatar.png')}
            style={styles.answerAvatar}
            onError={() => console.log("Ошибка загрузки аватара")}
          />
          <Text style={styles.answerCreator}>{item.creator}</Text>
        </TouchableOpacity>
        
        {item.solution && (
          <View style={styles.solutionBadge}>
            <Text style={styles.solutionText}>Ответ</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.answerComment}>{item.comment}</Text>
      
      <View style={styles.answerFooter}>
        <Text style={styles.answerDate}>
          {moment(item.created_at, 'DD-MM-YYYY HH:mm').fromNow()}
        </Text>
        
        {item.can_manage && !item.solution && (
          <TouchableOpacity 
            style={styles.solutionButton}
            onPress={() => markAsSolution(item.id)}
          >
            <Text style={styles.solutionButtonText}>Пометить как ответ</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!track) {
    return (
      <View style={styles.container}>
        <Text>Не удалось загрузить трек</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1B5E20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Детали трека</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
        >
          {/* Compact Track Card */}
          <View style={styles.trackCard}>
            {/* Creator Info */}
            <TouchableOpacity 
              style={styles.creatorContainer}
              onPress={() => fetchCreatorInfo(track.creator)}
            >
              <Image
                source={track.creator_avatar ? { uri: `${baseImageURL}${track.creator_avatar}` } : require('../images/default-avatar.png')}
                style={styles.creatorAvatar}
                onError={() => console.log("Ошибка загрузки аватара")}
              />
              <View>
                <Text style={styles.creatorName}>{track.creator}</Text>
                <Text style={styles.trackDate}>
                  {moment(track.created_at, 'DD-MM-YYYY HH:mm').fromNow()}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Track Content */}
            <Text style={styles.trackTitle}>{track.subject}</Text>
            
            {track.category?.length > 0 && (
              <View style={styles.categories}>
                {track.category.map((cat, i) => (
                  <Text key={i} style={styles.category}>{cat}</Text>
                ))}
              </View>
            )}

            <View>
              <Text 
                style={styles.description}
                numberOfLines={descriptionLines}
                ellipsizeMode="tail"
              >
                {track.description}
              </Text>
              {track.description?.length > 200 && (
                <TouchableOpacity onPress={toggleDescription}>
                  <Text style={styles.showMoreText}>
                    {showFullDescription ? 'Скрыть' : 'Показать больше...'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Stats */}
            <View style={styles.stats}>
              <TouchableOpacity style={styles.statItem} onPress={toggleLike}>
                <Ionicons
                  name={track.already_liked ? "heart" : "heart-outline"}
                  size={20}
                  color={track.already_liked ? "#ff4747" : "#666"}
                />
                <Text style={styles.statText}>{track.total_likes}</Text>
              </TouchableOpacity>
              
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={20} color="#666" />
                <Text style={styles.statText}>{track.views}</Text>
              </View>
            </View>
          </View>

          {/* Answers Section */}
          <View style={styles.answersContainer}>
            <View style={styles.answersHeader}>
              <Text style={styles.answersTitle}>Ответы ({trackAnswers.length})</Text>
              <TouchableOpacity 
                style={styles.addAnswerButton}
                onPress={() => setShowAnswerForm(!showAnswerForm)}
              >
                <Ionicons 
                  name={showAnswerForm ? "chevron-up" : "add"} 
                  size={24} 
                  color="#4CAF50" 
                />
              </TouchableOpacity>
            </View>
            
            {trackAnswers.length > 0 ? (
              <FlatList
                data={trackAnswers}
                renderItem={({ item }) => <AnswerCard item={item} />}
                keyExtractor={item => item.id.toString()}
                scrollEnabled={false}
                ListFooterComponent={
                  nextPage ? (
                    <TouchableOpacity 
                      style={styles.loadMoreButton}
                      onPress={loadMoreAnswers}
                    >
                      <Text style={styles.loadMoreText}>Показать еще</Text>
                    </TouchableOpacity>
                  ) : null
                }
              />
            ) : (
              <Text style={styles.noAnswersText}>Пока нет ответов. Будьте первым!</Text>
            )}
          </View>
        </ScrollView>

        {/* Answer Form */}
        {showAnswerForm && (
          <View style={styles.answerFormContainer}>
            <Text style={styles.answerFormTitle}>Ваш ответ</Text>
            <TextInput
              style={styles.answerInput}
              multiline
              placeholder="Напишите ваш ответ..."
              value={answerText}
              onChangeText={setAnswerText}
            />
            
            <View style={styles.formButtonsContainer}>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmitAnswer}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Отправить ответ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Creator Profile Modal */}
      <Modal
        visible={creatorModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCreatorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setCreatorModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
            
            {creatorInfo && (
              <>
                <Image 
                  source={creatorInfo.avatar ? { uri: `${baseImageURL}${creatorInfo.avatar}` } : require('../images/default-avatar.png')}
                  style={styles.modalAvatar}
                  onError={() => console.log("Ошибка загрузки аватара")}
                />
                <Text style={styles.modalName}>{creatorInfo.username}</Text>
                <Text style={styles.modalBio}>{creatorInfo.bio || 'Нет информации'}</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D4E9E2',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D4E9E2',
  },
  container: {
    flex: 1,
    backgroundColor: '#D4E9E2',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#D4E9E2',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  trackCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  trackDate: {
    fontSize: 12,
    color: '#757575',
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1B5E20',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  category: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 12,
    color: '#2E7D32',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#424242',
    marginBottom: 4,
  },
  showMoreText: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  modalName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1B5E20',
  },
  modalBio: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  // Answer styles
  answerFormContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  answerFormTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1B5E20',
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  formButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 150,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  answersContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  answersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  addAnswerButton: {
    padding: 4,
  },
  noAnswersText: {
    textAlign: 'center',
    color: '#757575',
    marginVertical: 16,
  },
  answerCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  answerCreator: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  solutionBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  solutionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  answerComment: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
    lineHeight: 20,
  },
  answerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerDate: {
    fontSize: 12,
    color: '#757575',
  },
  solutionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  solutionButtonText: {
    color: 'white',
    fontSize: 12,
  },
  loadMoreButton: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginTop: 10,
  },
  loadMoreText: {
    color: '#2E7D32',
    fontWeight: '500',
  },
});