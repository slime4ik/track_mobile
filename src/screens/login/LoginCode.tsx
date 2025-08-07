import { StatusBar } from 'expo-status-bar';
import { useContext, useState, useRef } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { AuthContext } from '../../context/AuthContext'
import Spinner from 'react-native-loading-spinner-overlay';
import Ionicons from '@expo/vector-icons/Ionicons';


export default function LoginCodeScreen({navigation}) {
    const {isLoading, loginCode} = useContext(AuthContext);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return; // Только цифры

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Переход к следующему
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Автосабмит
    if (index === 5 && text) {
      const fullCode = newCode.join('');
      console.log('Введён код:', fullCode);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };
  return (
    <View style={styles.container}>
      <Spinner visible={isLoading}/>
        <View style={styles.wrapper}>
        <View style={{justifyContent: 'flex-start', marginBottom: 45}}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.backContainer}>
            <Ionicons name="arrow-back" size={30} color="white" style={styles.back}/>
          </View>
        </TouchableOpacity>
        <Image source={require('../../images/logo-removebg-preview.png')} style={styles.logo}/>
        </View>
      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={el => (inputs.current[index] = el)}
            value={digit}
            onChangeText={text => handleChange(text, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={1}
            returnKeyType="done"
            textAlign="center"
          />
        ))}
      </View>
              <View style={{backgroundColor: '#00754A', height: '15%', justifyContent: 'center', marginHorizontal: '11%', borderRadius: 30, marginTop: 15, width: '70%', alignSelf: 'center'}}>
              <TouchableOpacity onPress={() => {
                const fullCode = code.join('');
                loginCode(fullCode);
              }}>
                <Text style={{alignSelf: 'center', borderRadius: 20, color: '#FFFFFF',}}>Войти</Text>
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
    height: '35%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    justifyContent: 'center'
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: 12,
    borderColor: '#ccc',
    fontSize: 24,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 20
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginHorizontal: 15
  },
  link: {
    color: 'blue'
  },
  logo: {
    width: 150,
    height: 67,
    marginBottom: 30,
    alignSelf: 'center',
    position: 'absolute'
  },
  back: {
    alignSelf: 'center',
  },
  backContainer: {
    alignSelf: 'baseline',
    borderRadius: 30,
    borderWidth: 7,
    marginHorizontal: 20,
    justifyContent: 'flex-end',
    backgroundColor: '#00754A',
    borderColor: '#00754A',
    marginTop: 10
  },
});
