import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainScreen from "../screens/MainScreen";
import LoginScreen from "../screens/login/LoginScreen";
import LoginCodeScreen from "../screens/login/LoginCode";
import RegisterScreen from "../screens/registration/Registration";
import RegisterCodeScreen from "../screens/registration/RegistrationCode";
import RegisterPasswordScreen from "../screens/registration/RegistrationPassword";
import Success from "../screens/registration/RegistrationSuccess";
import ProfileScreen from "../screens/Profile";
import TrackDetailScreen from "../screens/TrackDetail";

import { AuthContext } from "../context/AuthContext";
import CreateScreen from "../screens/TrackCreate";

export const navigationRef = React.createRef();

const Stack = createNativeStackNavigator();

const Navigation = ({ onLayout }) => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <NavigationContainer ref={navigationRef} onReady={onLayout}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Если не авторизован → показываем только auth-экраны */}
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="LoginCode" component={LoginCodeScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="RegisterCode" component={RegisterCodeScreen} />
            <Stack.Screen
              name="RegisterPassword"
              component={RegisterPasswordScreen}
            />
            <Stack.Screen name="Success" component={Success} />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={MainScreen}
              options={{
                unmountOnBlur: false, // ❌ не размонтировать при уходе
              }}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen
              name="TrackDetail"
              component={TrackDetailScreen}
            />
            <Stack.Screen name="CreateTrack" component={CreateScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
