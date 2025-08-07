import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from '../screens/MainScreen';
import LoginScreen from '../screens/login/LoginScreen';
import RegisterScreen from '../screens/registration/Registration';
import RegisterCodeScreen from '../screens/registration/RegistrationCode';
import RegisterPasswordScreen from '../screens/registration/RegistrationPassword';
import Success from '../screens/registration/RegistrationSuccess';
import { AuthContext } from '../context/AuthContext';
import LoginCodeScreen from '../screens/login/LoginCode';
import ProfileScreen from '../screens/Profile';


export const navigationRef = React.createRef(); // 👈 оставляем для редиректа из axios

const Stack = createNativeStackNavigator();

const Navigation = ({ onLayout }) => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <NavigationContainer ref={navigationRef} onReady={onLayout}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Home" component={MainScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="LoginCode" component={LoginCodeScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="RegisterCode" component={RegisterCodeScreen} />
            <Stack.Screen name="RegisterPassword" component={RegisterPasswordScreen} />
            <Stack.Screen name="Success" component={Success} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
