import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity, Button, TextInput } from 'react-native';
import api from "../api";
import { BASE_URL } from '../config';
import { useState, useEffect, useContext } from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({navigation}) {
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [isEditing, setIsEditing] = useState(false)
    const [avatar, setAvatar] = useState(null);

    const getProfile = async () => {
        setLoading(true)
        try {
            const res = await api.get(`${BASE_URL}/me/`);
            setUserInfo(res.data);
        } catch (e) {
            console.log('Ошибка получения профиля', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getProfile();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <Spinner visible={true} />
            </View>
        );
    }

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            alert("Нужен доступ к фото!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    const saveProfile = async () => {
        const formData = new FormData();

        formData.append('username', username);
        formData.append('bio', bio);

        if (avatar) {
            formData.append('avatar', {
                uri: avatar,
                name: `avatar_${Date.now()}.jpg`,
                type: 'image/jpeg',
            });
        }

        try {
            const res = await api.patch(`${BASE_URL}/me/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setUserInfo(res.data);
            setIsEditing(false);
        } catch (e) {
            console.log('Ошибка обновления профиля', e);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={40} color="white" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.container}>
                <View style={styles.profileCard}>
                    {/* Общая часть для обоих режимов */}
                    <View style={styles.avatarSection}>
                        {isEditing ? (
                            <TouchableOpacity onPress={pickImage}>
                                {avatar ? (
                                    <Image source={{ uri: avatar }} style={styles.avatar} />
                                ) : (
                                    <Image source={{ uri: userInfo.avatar }} style={styles.avatar} />
                                )}
                            </TouchableOpacity>
                        ) : (
                            <Image source={{ uri: userInfo.avatar }} style={styles.avatar} />
                        )}
                    </View>

                    {/* Разные части для режимов */}
                    <View style={styles.infoSection}>
                        {isEditing ? (
                            <>
                                <TextInput
                                    style={styles.usernameInput}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Ваш ник"
                                    defaultValue={userInfo.username}
                                />
                                <TextInput
                                    style={styles.bioInput}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Расскажите о себе"
                                    multiline
                                    defaultValue={userInfo.bio}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={styles.usernameText}>{userInfo.username}</Text>
                                <Text style={styles.bioText}>{userInfo.bio}</Text>
                            </>
                        )}
                    </View>
                </View>

                <Button 
                    title={isEditing ? 'Сохранить изменения' : 'Редактировать'} 
                    onPress={() => {
                        if (isEditing) {
                            saveProfile();
                        } else {
                            setUsername(userInfo.username);
                            setBio(userInfo.bio || '');
                            setAvatar(userInfo.avatar || null);
                            setIsEditing(true);
                        }
                    }} 
                />
            </View>
        </SafeAreaView> 
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5', // Измененный цвет фона
        alignItems: 'center',
        paddingTop: 20,
    },
    header: {
        backgroundColor: '#6C63FF',
        width: '100%',
        padding: 15,
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
        height: 100,
        width: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#6C63FF',
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
    },
    bioInput: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        borderBottomWidth: 1,
        borderBottomColor: '#6C63FF',
        paddingVertical: 5,
        minHeight: 80,
    },
});