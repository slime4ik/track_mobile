// RegisterCodeScreen.tsx
import { useContext, useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Spinner from 'react-native-loading-spinner-overlay';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RegisterCodeScreen({ navigation })  {
  const { isLoading, verifyCode, error, clearError } = useContext(AuthContext);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);

  // Обработчик ошибок
  useEffect(() => {
    if (error?.type === 'verifyCode') {
      Alert.alert(
        'Ошибка верификации',
        error.message || 'Неверный код подтверждения',
        [{ text: 'OK', onPress: () => clearError() }]
      );
    }
  }, [error]);

  const handleChange = (text, index) => {
    if (!/^\d*$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Ошибка', 'Введите полный код из 6 цифр');
      return;
    }
    
    try {
      await verifyCode(fullCode, navigation);
    } catch (err) {
      // Ошибка уже обработана в контексте
    }
  };

  return (
    <View style={styles.container}>
      <Spinner visible={isLoading} />
      <View style={styles.wrapper}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backContainer}>
          <Ionicons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>

        <Image source={require('../../images/logo-removebg-preview.png')} style={styles.logo} />

        <Text style={styles.title}>Введите код из письма</Text>

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
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Подтвердить</Text>
        </TouchableOpacity>
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
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 30,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    alignItems: 'center'
  },
  logo: { 
    width: 130, 
    height: 60, 
    marginBottom: 20 
  },
  title: {
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  backContainer: {
    alignSelf: 'flex-start',
    borderRadius: 25,
    borderWidth: 3,
    backgroundColor: '#00754A',
    borderColor: '#fff',
    padding: 5,
    marginBottom: 15
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginVertical: 15
  },
  input: {
    width: 45,
    height: 50,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: '#ccc',
    fontSize: 22,
    color: '#333',
    backgroundColor: '#fff'
  },
  button: {
    backgroundColor: '#00754A',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: '65%',
    alignItems: 'center',
    marginTop: 15
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '600' 
  }
});