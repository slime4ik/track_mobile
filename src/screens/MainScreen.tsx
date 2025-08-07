import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import api from "../api";
import { BASE_URL } from '../config';
import { useState, useEffect, useContext } from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Fontisto from '@expo/vector-icons/Fontisto';

export default function MainScreen({navigation}) {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [creatorInfo, setCreatorInfo] = useState(null)
  // const [userTracks, setTracks] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { logout } = useContext(AuthContext);
  const [isCreatorDetail, setIsCreatorDetail] = useState(null)
  const baseImageURL = BASE_URL.replace('/api', '')

  const getProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`${BASE_URL}/me/`);
      setUserInfo(res.data);
    } catch (e) {
      console.log('Ошибка получения профиля', e);
    } finally {
      setLoading(false);
    }
  };

  const getCreatorProfile = (username) => {
    try {
      setIsCreatorDetail(`${username}`)
      console.log(isCreatorDetail)
      if (isCreatorDetail === username) {
      const url = (`${BASE_URL}/users/${username}/`)
      console.log(`${url}`)
      const res = api.get(`${BASE_URL}/users/${username}/`)
      setCreatorInfo(res.data)
      console.log(creatorInfo)
      }
    } catch (e) {
      console.log('Произошла обибка получения профиля создателя трека', e);
    } finally{

    }
  }

const loadTracks = async (refresh = false) => {
  if (refresh) {
    setHasMore(true);
    setIsLoadingMore(false);
  }

  if (isLoadingMore || !hasMore) return;

  setIsLoadingMore(true);
  
  try {
    const url = refresh 
      ? `${BASE_URL}/tracks/` 
      : `${BASE_URL}/tracks/?page=${Math.floor(tracks.length / 5) + 1}`;
    
    const res = await api.get(url);
    
    setTracks(prev => refresh ? res.data.results : [...prev, ...res.data.results]);
    setHasMore(!!res.data.next);
  } catch (e) {
    console.log('Ошибка загрузки треков:', e);
  } finally {
    setIsLoadingMore(false);
    console.log(baseImageURL)
  }
};

  useEffect(() => {
    getProfile();
    loadTracks(true); // Первоначальная загрузка
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.log('Ошибка при выходе:', error);
    }
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Spinner visible={true} />
      </View>
    );
  }
const TrackCard = ({ track }) => (
  <View style={styles.trackCard}>
    {isCreatorDetail === `${track.username}` && (
      <View style={styles.CreatorCatd}>
        
      </View>
    )} 
    
    <View style={{flexDirection: 'row'}}>
      <TouchableOpacity onPress={() => getCreatorProfile(track.creator)}>
      <Image source={{ uri: `${baseImageURL}${track.creator_avatar}`}} style={styles.creatoravatar}/>
      </TouchableOpacity>
      <Text style={{alignSelf: 'center'}}>{track.creator}</Text>
    </View>
    <Text style={styles.trackTitle}>{track.subject}</Text>
    <Text style={styles.trackDescription}>{track.description}</Text>
    {/* Доп. элементы (лайки, категории и т.д.) */}
  </View>
)
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Верхняя панель с аватаром (без изменений) */}
        <View style={styles.topBar}>
          <View style={styles.rightIcons}>
            <TouchableOpacity onPress={handleProfilePress}>
              <Image source={{ uri: userInfo.avatar }} style={styles.avatar} />
            </TouchableOpacity>
            <View style={styles.favContainer}>
              <Fontisto name="favorite" size={24} color="black" />
            </View>
          </View>
        </View>

        {/* Заменяем ScrollView на FlatList */}
        <View style={styles.contentWrapper}>
<FlatList
  data={tracks}
  renderItem={({item}) => (
    <>
      <TrackCard 
        track={item} 
        onPress={() => navigation.navigate('TrackDetail', { track: item })}
      />
      {/* <View style={styles.trackSeparator}/> */}
    </>
  )}
  keyExtractor={item => item.id}
  style={styles.scrollContainer}
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={false}
  onEndReached={() => loadTracks()}
  onEndReachedThreshold={0.5}
  refreshing={isLoadingMore}
  onRefresh={() => loadTracks(true)}
  ListFooterComponent={
    isLoadingMore && <ActivityIndicator style={{padding: 10}}/>
  }
/>
        </View>

        {/* Остальной код (кнопка выхода и нижнее меню) без изменений */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>

        <View style={styles.bottomMenu}>
          <TouchableOpacity style={styles.menuButton}>
            <Image source={require('../images/search.png')} style={styles.menuIcon}/>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
            <Image source={require('../images/add.png')} style={styles.menuIcon}/>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
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
  trackCard: {
    backgroundColor: 'green',
    height: 200,
    borderWidth: 2,
    borderColor: '#000000',
    marginBottom: 20,
    borderRadius: 15,
    padding: 5
  },
  topBar: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  rightIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  avatar: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: 'green',
    marginLeft: 15,
    borderColor: '#FFFFFF',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  creatoravatar: {
    height: 38,
    width: 38,
    borderRadius: 25,
    backgroundColor: 'green',
    borderColor: '#FFFFFF',
    borderWidth: 1,
    marginRight: 4
  },
  favContainer: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    borderColor: '#FFFFFF',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  contentWrapper: {
    flex: 1,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 95, // Отступ для нижнего меню
  },
  scrollContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scrollContent: {
    padding: 15,
  },
  trackItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  logoutText: {
    color: '#ff4747',
    fontSize: 16,
  },
  bottomMenu: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
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
  },
  trackSeparator: {
    backgroundColor: '#000000', 
    height: 2, 
    width: '20%', 
    alignSelf: 'center'
  },
  CreatorCatd: {
    backgroundColor: '#FFFFFF',
    width: '90%',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  }
});