import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function Success({navigation}) {

  return (
    <View style={styles.container}>
            <View style={{flexDirection: 'row', marginTop: 15}}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.link}>Тогда тапни меня!😜</Text>
                </TouchableOpacity>
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
    width: '80%'
  },
  input: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 5,
    paddingHorizontal: 14
  },
  link: {
    color: 'blue'
  },
  logo: {
    width: 150,
    height: 67,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 10
  }
});
