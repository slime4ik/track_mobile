import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { AuthContext } from '../../context/AuthContext'
import Spinner from 'react-native-loading-spinner-overlay';
import Ionicons from '@expo/vector-icons/Ionicons';


export default function RegisterScreen({navigation}) {
    const [ username, setUsername ] = useState(null);
    const [ email, setEmail ] = useState(null);
    const [regstep, setRegtep] = useState(null);
    const {isLoading, register} = useContext(AuthContext);
  
  return (
    <View style={styles.container}>
      <Spinner visible={isLoading}/>
        <View style={styles.wrapper}>
        <Image source={require('../../images/logo-removebg-preview.png')} style={styles.logo}/>
            <TextInput placeholder='Почта' style={styles.input} value={email} onChangeText={text => setEmail(text)}/>
            <TextInput placeholder='Придумайте ник' secureTextEntry style={styles.input} value={username} onChangeText={text => setUsername(text)}/>
                <View style={{backgroundColor: '#00754A', height: '13%', justifyContent: 'center', marginHorizontal: '11%', borderRadius: 30, marginTop: 15}}>
                            <TouchableOpacity onPress={() => {
                register(email, username, navigation);
            }}>
                <Text style={{alignSelf: 'center', borderRadius: 20, color: '#FFFFFF' }}>Зарегистрироваться</Text>
                             </TouchableOpacity>
              </View>

            <View style={{flexDirection: 'column', marginTop: 15}}>
              <View style={{flexDirection: 'row', alignSelf: 'center'}}>
                <Text style={{fontSize: 12}}>Есть аккаунт? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.link}>Войти</Text>
                </TouchableOpacity>
              </View>
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
    height: '45%',
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
  },
  back: {
    alignSelf: 'center',
  },
  backContainer: {
    alignSelf: 'flex-start',
    borderRadius: 30,
    borderWidth: 3,
    marginHorizontal: 20,
    justifyContent: 'flex-end',
    backgroundColor: '#00754A',
    borderColor: '#ffffff'
  }
});
