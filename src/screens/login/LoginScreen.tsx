// LoginScreen.tsx
import { useContext, useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Linking, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Spinner from 'react-native-loading-spinner-overlay';

export default function LoginScreen({navigation}) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const {login, error, clearError, isLoading} = useContext(AuthContext);

    // Обработчик ошибок
    useEffect(() => {
      if (error?.type === 'login') {
        Alert.alert(
          'Ошибка входа',
          error.message || 'Неверные учетные данные',
          [{ text: 'OK', onPress: () => clearError() }]
        );
      }
    }, [error]);

    const handleLogin = async () => {
      try {
        if (!username || !password) {
          throw new Error('Заполните все поля');
        }
        await login(username, password, navigation);
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
            placeholder='Логин' 
            style={styles.input} 
            value={username} 
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <TextInput 
            placeholder='Пароль' 
            secureTextEntry 
            style={styles.input} 
            value={password} 
            onChangeText={setPassword}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.buttonText}>Войти</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Нет аккаунта? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Зарегистрировать аккаунт</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Забыли пароль? </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://wehelpy.ru/password_reset/')}>
                <Text style={styles.footerLink}>Восстановить аккаунт</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
}

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
    marginTop: 15,
    alignItems: 'center'
  },
  footerRow: {
    flexDirection: 'row',
    marginBottom: 5
  },
  footerText: {
    fontSize: 12
  },
  footerLink: {
    color: 'blue',
    fontSize: 12
  }
});