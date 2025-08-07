import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ImageBackgroundComponent } from 'react-native';
import { AuthContext } from '../../context/AuthContext'
import Spinner from 'react-native-loading-spinner-overlay';
import Ionicons from '@expo/vector-icons/Ionicons';


export default function RegisterPasswordScreen({navigation}) {
    const [ password, setPassword ] = useState(null);
    const [ password2, setPassword2 ] = useState(null);
    const [regstep, setRegtep] = useState(null);
    const {isLoading, setPasswordFunc} = useContext(AuthContext);
  
  return (
    <View style={styles.container}>
      <Spinner visible={isLoading}/>
        <View style={styles.wrapper}>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
      <View style={styles.backContainer}>
        <Ionicons name="arrow-back" size={30} color="white" style={styles.back}/>
      </View>
      </TouchableOpacity>
        <Image source={require('../../images/logo-removebg-preview.png')} style={styles.logo}/>
            <TextInput placeholder='Пароль' secureTextEntry style={styles.input} value={password} onChangeText={text => setPassword(text)}/>
            <TextInput placeholder='Повторите пароль' secureTextEntry style={styles.input} value={password2} onChangeText={text => setPassword2(text)}/>
              <View style={{backgroundColor: '#00754A', height: '15%', justifyContent: 'center', marginHorizontal: '11%', borderRadius: 30, marginTop: 15, width: '70%', alignSelf: 'center'}}>
              <TouchableOpacity onPress={() => {
                setPasswordFunc(password, password2, navigation);
              }}>
                <Text style={{alignSelf: 'center', borderRadius: 20, color: '#FFFFFF', }}>Зарегистрироваться</Text>
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
    justifyContent: 'center'
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
  },
  logo: {
    width: 150,
    height: 67,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 15
  },
  back: {
    alignSelf: 'center',
  },
  backContainer: {
    alignSelf: 'flex-start',
    borderRadius: 30,
    borderWidth: 3,
    marginHorizontal: 20,
    marginVertical: 20,
    justifyContent: 'flex-end',
    backgroundColor: '#00754A',
    borderColor: '#ffffff'
  },

});
