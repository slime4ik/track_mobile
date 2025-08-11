import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  FlatList, 
  Modal, 
  Pressable,
  Dimensions,
  TextInput,
  Animated,
  Easing
} from 'react-native';
import api from "../api";
import { BASE_URL } from '../config';
import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';
import ImageViewer from 'react-native-image-zoom-viewer';
import moment from 'moment';
import 'moment/locale/ru';

moment.locale('ru');

const { width: screenWidth } = Dimensions.get('window');

export default function MainScreen({navigation}) {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useContext(AuthContext);
  const [creatorModalVisible, setCreatorModalVisible] = useState(false);
  const [currentCreator, setCurrentCreator] = useState(null);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImages, setCurrentImages] = useState([]);
  const [likedTracks, setLikedTracks] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const baseImageURL = BASE_URL.replace('/api', '');
  const pageRef = useRef(1);
  const allLoadedRef = useRef(false);
  const loadingRef = useRef(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchBarAnim = useRef(new Animated.Value(0)).current;

  // Анимация открытия/закрытия поиска
  const toggleSearch = () => {
    if (searchVisible) {
      Animated.parallel([
        Animated.timing(searchAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(searchBarAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        })
      ]).start(() => {
        setSearchVisible(false);
        setSearchQuery('');
        loadTracks(true);
      });
    } else {
      setSearchVisible(true);
      Animated.parallel([
        Animated.timing(searchAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(searchBarAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        })
      ]).start(() => {
        searchInputRef.current?.focus();
      });
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    return moment(dateString, 'DD-MM-YYYY HH:mm').fromNow();
  };

  // Загрузка профиля
  const getProfile = async () => {
    try {
      const res = await api.get(`${BASE_URL}/me/`);
      setUserInfo(res.data);
    } catch (e) {
      console.log('Ошибка получения профиля', e);
    }
  };

  // Загрузка информации о создателе
  const loadCreatorInfo = async (username) => {
    try {
      const res = await api.get(`${BASE_URL}/users/${username}/`);
      setCreatorInfo(res.data);
      setCreatorModalVisible(true);
    } catch (e) {
      console.log('Ошибка получения профиля создателя', e);
    }
  };

  // Открытие изображения в полноэкранном режиме
  const openImage = (images, index) => {
    const formattedImages = images.map(img => ({
      url: `${baseImageURL}${img.image}`,
      props: {}
    }));
    setCurrentImages(formattedImages);
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  // Загрузка треков
  const loadTracks = useCallback(async (refresh = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    if (refresh) {
      setRefreshing(true);
      setHasMore(true);
      allLoadedRef.current = false;
      pageRef.current = 1;
    } else {
      if (allLoadedRef.current || isLoadingMore) {
        loadingRef.current = false;
        return;
      }
      setIsLoadingMore(true);
    }

    try {
      let url = `${BASE_URL}/tracks/?page=${pageRef.current}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
        setIsSearching(true);
      } else {
        setIsSearching(false);
      }

      const res = await api.get(url);
      
      if (refresh) {
        setTracks(res.data.results);
      } else {
        const newTracks = res.data.results.filter(
          newTrack => !tracks.some(existingTrack => existingTrack.id === newTrack.id)
        );
        setTracks(prev => [...prev, ...newTracks]);
      }
      
      setHasMore(!!res.data.next);
      
      if (!res.data.next) {
        allLoadedRef.current = true;
      } else {
        pageRef.current += 1;
      }
    } catch (e) {
      console.log('Ошибка загрузки треков:', e);
    } finally {
      loadingRef.current = false;
      if (refresh) {
        setRefreshing(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [tracks, isLoadingMore, searchQuery]);

  // Обработчик поиска
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      loadTracks(true);
    }, 500);
  };

  // Сброс поиска
  const resetSearch = () => {
    setSearchQuery('');
    loadTracks(true);
  };

  // Инициализация
  useEffect(() => {
    const initialize = async () => {
      await getProfile();
      await loadTracks(true);
      setLoading(false);
    };
    initialize();
  }, []);

  const renderTrackItem = ({item}) => (
    <View style={[
      styles.trackCard,
      item.completed && styles.completedTrack
    ]}>
      <View style={styles.trackHeader}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity onPress={() => loadCreatorInfo(item.creator)}>
            <Image
              source={
                item.creator_avatar
                  ? { uri: `${baseImageURL}${item.creator_avatar}` }
                  : require('../images/default-avatar.png')
              }
              style={styles.creatorAvatar}
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.creatorName}>{item.creator}</Text>
            <Text style={styles.trackDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        
        {item.completed && (
          <View style={styles.solvedBadge}>
            <Text style={styles.solvedText}>Решено</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity onPress={() => navigation.navigate('TrackDetail', {trackId: item.id})}>
        <Text style={styles.trackTitle}>{item.subject}</Text>
      </TouchableOpacity>
      
      {item.category?.length > 0 && (
        <View style={styles.categoriesContainer}>
          {item.category.map((category, index) => (
            <View key={`${item.id}-${index}`} style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ))}
        </View>
      )}
      
      <Text 
        style={styles.trackDescription}
        numberOfLines={expandedDescriptions[item.id] ? undefined : 3}
      >
        {item.description}
      </Text>
      
      {item.description?.length > 100 && (
        <TouchableOpacity 
          onPress={() => toggleDescription(item.id)}
          style={styles.showMoreButton}
        >
          <Text style={styles.showMoreText}>
            {expandedDescriptions[item.id] ? 'Свернуть' : 'Показать больше...'}
          </Text>
        </TouchableOpacity>
      )}
      
      {item.images?.length > 0 && (
        <FlatList
          horizontal
          data={item.images}
          keyExtractor={(img, index) => `img-${item.id}-${index}`}
          renderItem={({item: image, index}) => (
            <TouchableOpacity onPress={() => openImage(item.images, index)}>
              <Image 
                source={{ uri: `${baseImageURL}${image.thumbnail || image.image}`}} 
                style={styles.trackImage}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.imagesContainer}
          showsHorizontalScrollIndicator={false}
        />
      )}
      
      <View style={styles.statsContainer}>
        <View style={styles.likeButton}>
          <Ionicons 
            name={likedTracks[item.id] ? "heart" : "heart-outline"} 
            size={20} 
            color={likedTracks[item.id] ? "#ff4747" : "#424242"} 
          />
          <Text style={styles.statText}>{item.total_likes || 0}</Text>
        </View>
        
        <View style={styles.viewStat}>
          <Ionicons name="eye-outline" size={20} color="#424242" />
          <Text style={styles.statText}>{item.views || 0}</Text>
        </View>
      </View>
    </View>
  );

  if (loading && !userInfo) {
    return (
      <View style={styles.container}>
        <Spinner visible={true} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Шапка с анимацией */}
        <Animated.View style={[
          styles.topBar,
          {
            transform: [{
              translateY: searchBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -60]
              })
            }],
            opacity: searchBarAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0]
            })
          }
        ]}>
          <TouchableOpacity style={styles.logoutButton} onPress={() => logout()}>
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
          <View style={styles.rightIcons}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Image
                source={
                  userInfo?.avatar
                    ? { uri: userInfo.avatar }
                    : require('../images/default-avatar.png')
                }
                style={styles.avatar}
              />
            </TouchableOpacity>
            <View style={styles.favContainer}>
              <Fontisto name="favorite" size={24} color="black" />
            </View>
          </View>
        </Animated.View>

        {/* Поисковая строка с анимацией */}
        {searchVisible && (
          <Animated.View style={[
            styles.searchContainer,
            {
              transform: [{
                translateY: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-60, 0]
                })
              }],
              opacity: searchAnim
            }
          ]}>
            <View style={styles.searchInputContainer}>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Поиск треков..."
                placeholderTextColor="#757575"
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoFocus={true}
              />
              {searchQuery ? (
                <TouchableOpacity 
                  style={styles.clearSearchButton} 
                  onPress={resetSearch}
                >
                  <Ionicons name="close-circle" size={22} color="#757575" />
                </TouchableOpacity>
              ) : (
                <View style={styles.searchIcon}>
                  <Ionicons name="search" size={20} color="#757575" />
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.cancelSearchButton}
              onPress={toggleSearch}
            >
              <Text style={styles.cancelSearchText}>Отмена</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Список треков */}
        <View style={styles.contentWrapper}>
          <FlatList
            data={tracks}
            renderItem={renderTrackItem}
            keyExtractor={item => `track-${item.id}`}
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => loadTracks()}
            onEndReachedThreshold={0.5}
            refreshing={refreshing}
            onRefresh={() => loadTracks(true)}
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator style={{padding: 10}}/>
              ) : !hasMore ? (
                <Text style={styles.endOfList}>
                  {isSearching && tracks.length === 0 
                    ? 'Ничего не найдено' 
                    : 'Все треки загружены'}
                </Text>
              ) : null
            }
          />
        </View>

        {/* Модальное окно создателя */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={creatorModalVisible}
          onRequestClose={() => setCreatorModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.creatorModalView}>
              <Pressable
                style={styles.closeButton}
                onPress={() => setCreatorModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
              
              {creatorInfo && (
                <>
                  <Image
                    source={
                      creatorInfo.avatar
                        ? { uri: `${baseImageURL}${creatorInfo.avatar}` }
                        : require('../images/default-avatar.png')
                    }
                    style={styles.creatorModalAvatar}
                  />
                  <Text style={styles.creatorModalName}>{creatorInfo.username}</Text>
                  <Text style={styles.creatorModalBio}>{creatorInfo.bio || 'Нет информации'}</Text>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Просмотр изображений */}
        <Modal visible={imageViewerVisible} transparent={true}>
          <ImageViewer 
            imageUrls={currentImages}
            index={currentImageIndex}
            enableSwipeDown
            onSwipeDown={() => setImageViewerVisible(false)}
            onClick={() => setImageViewerVisible(false)}
            enableImageZoom
            saveToLocalByLongPress={false}
          />
        </Modal>

        {/* Нижнее меню */}
        <View style={styles.bottomMenu}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={toggleSearch}
          >
            <Image 
              source={require('../images/search.png')} 
              style={[
                styles.menuIcon,
                searchVisible && styles.activeMenuIcon
              ]}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => navigation.navigate('CreateTrack')}
          >
            <Image source={require('../images/add.png')} style={styles.menuIcon}/>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => navigation.push('Home')}
          >
            <Image source={require('../images/home.png')} style={styles.menuIcon}/>
          </TouchableOpacity>
        </View>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D4E9E2',
  },
  container: {
    flex: 1,
    backgroundColor: '#D4E9E2',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 15,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#D4E9E2',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#ff4747',
    fontSize: 16,
    fontWeight: '500',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
    marginLeft: 10,
  },
  favContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  searchContainer: {
    position: 'absolute',
    top: 15,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4E9E2',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#424242',
  },
  clearSearchButton: {
    padding: 5,
    marginLeft: 5,
  },
  searchIcon: {
    padding: 5,
    marginLeft: 5,
  },
  cancelSearchButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
  },
  cancelSearchText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '500',
  },
  contentWrapper: {
    flex: 1,
    marginTop: 80,
    marginHorizontal: 15,
    marginBottom: 80,
  },
  scrollContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10
  },
  scrollContent: {
    padding: 15,
  },
  trackCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  completedTrack: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'white',
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
  solvedBadge: {
    backgroundColor: '#4caf50ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  solvedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#1B5E20',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 5,
  },
  categoryBadge: {
    backgroundColor: '#BBDEFB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 5,
    marginBottom: 5,
  },
  categoryText: {
    color: '#0D47A1',
    fontSize: 12,
  },
  trackDescription: {
    fontSize: 14,
    color: '#424242',
    marginTop: 5,
    lineHeight: 20,
  },
  showMoreButton: {
    marginTop: 5,
  },
  showMoreText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
  },
  imagesContainer: {
    marginTop: 10,
  },
  trackImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  viewStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 5,
    color: '#424242',
    fontSize: 14,
  },
  endOfList: {
    textAlign: 'center',
    color: '#757575',
    padding: 10,
  },
  bottomMenu: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  menuButton: {
    padding: 5,
  },
  menuIcon: {
    width: 30,
    height: 30,
    opacity: 0.7,
  },
  activeMenuIcon: {
    opacity: 1,
    tintColor: '#2E7D32',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  creatorModalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
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
  creatorModalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#E8F5E9',
  },
  creatorModalName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1B5E20',
  },
  creatorModalBio: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
});