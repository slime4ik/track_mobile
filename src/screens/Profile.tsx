import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity, Button, TextInput, Alert } from 'react-native';
import api from "../api";
import { BASE_URL } from '../config';
import { useState, useEffect, useContext } from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function ProfileScreen({navigation}) {
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [avatar, setAvatar] = useState(null);
    const { logout } = useContext(AuthContext);

    const getProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${BASE_URL}/me/`);
            setUserInfo(res.data);
            setUsername(res.data.username);
            setBio(res.data.bio || '');
            setAvatar(res.data.avatar || null);
        } catch (e) {
            console.log('Ошибка получения профиля', e);
            Alert.alert('Ошибка', 'Не удалось загрузить профиль');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getProfile();
    }, []);

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Ошибка', 'Нужен доступ к галерее');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0].uri) {
                setAvatar(result.assets[0].uri);
            }
        } catch (error) {
            console.log('Ошибка выбора изображения', error);
            Alert.alert('Ошибка', 'Не удалось выбрать изображение');
        }
    };

    const saveProfile = async () => {
        try {
            setLoading(true);
            const formData = new FormData();

            // Добавляем текстовые данные
            formData.append('username', username);
            formData.append('bio', bio);

            // Добавляем аватар, если он был изменен
            if (avatar && (avatar !== userInfo?.avatar)) {
                // Если это новая локальная URI (начинается с file://)
                if (avatar.startsWith('file://')) {
                    const fileInfo = await FileSystem.getInfoAsync(avatar);
                    if (fileInfo.exists) {
                        formData.append('avatar', {
                            uri: avatar,
                            name: `avatar_${Date.now()}.jpg`,
                            type: 'image/jpeg',
                        } as any);
                    }
                } else if (avatar.startsWith('http')) {
                    // Если это URL с сервера, но пользователь хочет удалить аватар
                    formData.append('avatar', ''); // Отправляем пустую строку для удаления
                }
            } else if (!avatar && userInfo?.avatar) {
                // Если аватар был удален
                formData.append('avatar', '');
            }

            const response = await api.patch(`${BASE_URL}/me/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setUserInfo(response.data);
            setIsEditing(false);
            Alert.alert('Успех', 'Профиль обновлен');
        } catch (error) {
            console.log('Ошибка обновления профиля', error.response?.data || error);
            Alert.alert(
                'Ошибка', 
                error.response?.data?.avatar?.[0] || 
                error.response?.data?.username?.[0] || 
                'Не удалось обновить профиль'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigation.navigate('Login');
        } catch (error) {
            console.log('Ошибка выхода', error);
            Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
        }
    };

    if (loading && !userInfo) {
        return (
            <View style={styles.container}>
                <Spinner visible={true} />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={30} color="white" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.container}>
                <View style={styles.profileCard}>
                    <View style={styles.avatarSection}>
                        <TouchableOpacity 
                            onPress={isEditing ? pickImage : null}
                            disabled={!isEditing}
                        >
                            <Image
                                source={
                                    avatar 
                                        ? { uri: avatar }
                                        : userInfo?.avatar
                                            ? { uri: userInfo.avatar }
                                            : require('../images/default-avatar.png')
                                }
                                style={styles.avatar}
                            />
                            {isEditing && (
                                <Text style={styles.avatarEditText}>Изменить фото</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoSection}>
                        {isEditing ? (
                            <>
                                <TextInput
                                    style={styles.usernameInput}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Ваш ник"
                                />
                                <TextInput
                                    style={styles.bioInput}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Расскажите о себе"
                                    multiline
                                    numberOfLines={3}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={styles.usernameText}>{userInfo?.username}</Text>
                                <Text style={styles.bioText}>{userInfo?.bio || 'Нет информации'}</Text>
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.buttonsContainer}>
                    <TouchableOpacity 
                        style={[styles.button, styles.editButton]}
                        onPress={() => {
                            if (isEditing) {
                                saveProfile();
                            } else {
                                setIsEditing(true);
                            }
                        }}
                    >
                        <Text style={styles.buttonText}>
                            {isEditing ? 'Сохранить' : 'Редактировать'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.logoutButton]}
                        onPress={handleLogout}
                    >
                        <Text style={styles.buttonText}>Выйти</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView> 
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        paddingTop: 20,
    },
    header: {
        backgroundColor: '#6C63FF',
        width: '100%',
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileCard: {
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
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        height: 120,
        width: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#6C63FF',
    },
    avatarEditText: {
        marginTop: 8,
        color: '#6C63FF',
        textAlign: 'center',
        fontSize: 14,
    },
    infoSection: {
        width: '100%',
    },
    usernameText: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#333',
    },
    usernameInput: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#333',
        borderBottomWidth: 1,
        borderBottomColor: '#6C63FF',
        paddingVertical: 5,
    },
    bioText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        paddingHorizontal: 20,
    },
    bioInput: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        borderBottomWidth: 1,
        borderBottomColor: '#6C63FF',
        paddingVertical: 5,
        minHeight: 80,
        paddingHorizontal: 20,
    },
    buttonsContainer: {
        width: '90%',
        marginTop: 20,
    },
    button: {
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 15,
    },
    editButton: {
        backgroundColor: '#6C63FF',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});