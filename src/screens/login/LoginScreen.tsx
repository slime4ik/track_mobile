import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Linking } from 'react-native';
import { AuthContext } from '../../context/AuthContext'


export default function LoginScreen({navigation}) {
    const [ username, setUsername ] = useState(null);
    const [ password, setPassword ] = useState(null);
    const {login} = useContext(AuthContext)


  return (
    <View style={styles.container}>
        <View style={styles.wrapper}>
            <Image source={require('../../images/logo-removebg-preview.png',)} style={styles.logo}/>
            <TextInput placeholder='Логин' style={styles.input} value={username} onChangeText={text => setUsername(text)}/>
            <TextInput placeholder='Пароль' secureTextEntry style={styles.input} value={password} onChangeText={text => setPassword(text)}/>
              <View style={{backgroundColor: '#00754A', height: '13%', justifyContent: 'center', marginHorizontal: '11%', borderRadius: 30, marginTop: 15}}>
                            <TouchableOpacity onPress={() => {
                login(username, password, navigation);
            }}>
                <Text style={{alignSelf: 'center', borderRadius: 20, color: '#FFFFFF' }}>Войти</Text>
                             </TouchableOpacity>
              </View>
            <View style={{flexDirection: 'column', marginTop: 15, alignSelf: 'center',}}>
              <View style={{flexDirection: 'row'}}>
                <Text style={{fontSize: 12}}>Нет аккаунта? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.link}> Зарегистрировать аккаунт</Text>
                </TouchableOpacity>
              </View>
              <View style={{flexDirection: 'row'}}>
                <Text style={{fontSize: 12}}>Забыли пароль?</Text>
                <TouchableOpacity onPress={() => Linking.openURL('https://wehelpy.ru/password_reset/')}>
                    <Text style={styles.link} > Восстановить аккаунт</Text>
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
    height: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    marginBottom: 12,
    borderRadius: 30,
    paddingHorizontal: 15,
    marginHorizontal: '11%',
    backgroundColor: '#D4E9E2',
    textAlign: 'center'
  },
  link: {
    color: 'blue',
    fontSize: 12
  },
  logo: {
    width: 150,
    height: 67,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 30
  }
});
