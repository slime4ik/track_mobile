// RegisterScreen.tsx
import { useContext, useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Spinner from 'react-native-loading-spinner-overlay';

export default function RegisterScreen({navigation}) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const {isLoading, register, error, clearError} = useContext(AuthContext);
  
    // Обработчик ошибок
    useEffect(() => {
      if (error?.type === 'register') {
        Alert.alert(
          'Ошибка регистрации',
          error.message || 'Не удалось зарегистрироваться',
          [{ text: 'OK', onPress: () => clearError() }]
        );
      }
    }, [error]);

    const handleRegister = async () => {
      try {
        if (!email || !username) {
          throw new Error('Заполните все поля');
        }
        await register(email, username, navigation);
      } catch (err) {
        // Ошибка уже обработана в контексте
      }
    };

    return (
      <View style={styles.container}>
        <Spinner visible={isLoading}/>
        <View style={styles.wrapper}>
          <Image source={require('../../images/logo-removebg-preview.png')} style={styles.logo}/>
          
          <TextInput 
            placeholder='Почта' 
            style={styles.input} 
            value={email} 
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput 
            placeholder='Придумайте ник' 
            style={styles.input} 
            value={username} 
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.buttonText}>Зарегистрироваться</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Есть аккаунт? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Войти</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4E9E2'
  },
  wrapper: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    justifyContent: 'center'
  },
  input: {
    marginBottom: 12,
    borderRadius: 30,
    padding: 15,
    marginHorizontal: '11%',
    backgroundColor: '#D4E9E2',
    textAlign: 'center'
  },
  logo: {
    width: 150,
    height: 67,
    alignSelf: 'center',
    marginBottom: 30
  },
  buttonContainer: {
    backgroundColor: '#00754A', 
    height: 50, 
    justifyContent: 'center', 
    marginHorizontal: '11%', 
    borderRadius: 30, 
    marginTop: 15
  },
  buttonText: {
    alignSelf: 'center', 
    color: '#FFFFFF'
  },
  footer: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 15
  },
  footerText: {
    fontSize: 12
  },
  footerLink: {
    color: 'blue',
    fontSize: 12
  }
});