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
  Pressable
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ImageViewer from 'react-native-image-zoom-viewer';
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
  const [track, setTrack] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [creatorModalVisible, setCreatorModalVisible] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [descriptionLines, setDescriptionLines] = useState(3); // Ограничение по умолчанию
  const [trackAnswers, setTrackAnswers] = useState(null)
  const baseImageURL = BASE_URL.replace('/api', '');

  const fetchTrack = async () => {
    try {
      const { data } = await api.get(`/track/${trackId}/`);
      setTrack(data);
    } catch (error) {
      console.error('Failed to fetch track:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatorInfo = async () => {
    if (!track) return;
    try {
      const { data } = await api.get(`/users/${track.creator}/`);
      setCreatorInfo(data);
      setCreatorModalVisible(true);
    } catch (error) {
      console.error('Failed to fetch creator info:', error);
    }
  };

  const getTrackAnswers = async () => {
    try {
      const { data } = await api.get(`/answers/${trackId}/`); // Убрал BASE_URL, т.к. он уже есть в api
      setTrackAnswers(data);
      console.log(data);
    } catch (e) {
      console.log('Ошибка загрузки ответов', e);
    }
  };

  const AnswerCard = ({item}) => (
    <View styles={styles.answerCard}>
      <View>
        <Image source={{ uri: `${baseImageURL}${item.creator_avatar}`}} style={styles.answerAvatar}/>
        <Text>{item.creator}</Text>

        {item.solution && (
          <View>
            <Text>Ответ</Text>
          </View>
        )}

      </View>
      <Text>{item.comment}</Text>
    </View>
  )

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
    setDescriptionLines(showFullDescription ? 3 : 0); // 0 означает неограниченное количество строк
  };

  useEffect(() => {
    fetchTrack();
    getTrackAnswers();
  }, [trackId]);

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
        <Text>Failed to load track</Text>
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
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Compact Track Card */}
        <View style={styles.trackCard}>
          {/* Creator Info */}
          <TouchableOpacity 
            style={styles.creatorContainer}
            onPress={fetchCreatorInfo}
          >
            <Image
              source={{ uri: `${baseImageURL}${track.creator_avatar}` }}
              style={styles.creatorAvatar}
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

          {/* Images - using thumbnails first */}
          {track.images?.length > 0 && (
            <FlatList
              horizontal
              data={track.images}
              keyExtractor={(_, i) => `img-${i}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => {
                  setCurrentImageIndex(index);
                  setImageViewerVisible(true);
                }}>
                  <Image
                    source={{ uri: `${baseImageURL}${item.thumbnail || item.image}` }}
                    style={styles.image}
                  />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.imagesContainer}
              showsHorizontalScrollIndicator={false}
            />
          )}

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
      </ScrollView>

      {/* Image Viewer */}
      <Modal visible={imageViewerVisible} transparent={true}>
        <ImageViewer
          imageUrls={track.images?.map(img => ({
            url: `${baseImageURL}${img.image}`,
            props: {}
          }))}
          index={currentImageIndex}
          enableSwipeDown
          onSwipeDown={() => setImageViewerVisible(false)}
          onClick={() => setImageViewerVisible(false)}
          enableImageZoom
        />
      </Modal>
        // Ответы на трек
          <FlatList
          data={trackAnswers}
          renderItem={({item}) => <AnswerCard item={item.id}/>}
          showsVerticalScrollIndicator={false}
          onEndReached={getTrackAnswers}
          keyExtractor={item => `${item.id}`}
          />

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
                  source={{ uri: `${baseImageURL}${creatorInfo.avatar}` }} 
                  style={styles.modalAvatar}
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
  imagesContainer: {
    marginBottom: 16,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
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
  creatorStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  viewProfileButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewProfileText: {
    color: 'white',
    fontWeight: '600',
  },
});