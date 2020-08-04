import React from 'react';
import {StyleSheet, Text, View, Button} from 'react-native';
import {FAB} from 'react-native-paper';
import {NavigationContainer} from '@react-navigation/native';
import {
  createStackNavigator,
  createAppContainer,
} from '@react-navigation/stack';
import {createDrawerNavigator} from '@react-navigation/drawer';
import firebase from '@react-native-firebase/app';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

import LoginScreen from './Screens/LoginScreen';
import SignupScreen from './Screens/SignupScreen';
import MapsScreen from './Screens/MapsScreen';
import SolutionsScreen from './Screens/SolutionsScreen';
import OrderScreen from './Screens/OrderScreen';
import MapNavigation from './Screens/MapNavigation';
import TrackScreen from './Screens/TrackScreen';

export default class App extends React.Component {
  static defaultNavigationOptions = {
    header: null,
  };

  render() {
    return (
      <NavigationContainer>
        {/* <Drawer.Navigator initialRouteName='MapsScreen'>
          <Drawer.Screen name='MapsScreen' component={MapsScreen} />
          <Drawer.Screen name='LoginScreen' component={LoginScreen} />
          <Drawer.Screen name='GeoScreen' component={GeoScreen} />
          <Drawer.Screen
            name='SolutionsScreen'
            component={SolutionsScreen}
            options={({ route }) => ({ title: route.params.orderId })}
          />
        </Drawer.Navigator> */}

        <Stack.Navigator initialRouteName="MapNavigation" headerMode="none">
          <Stack.Screen name="MapNavigation" component={MapNavigation} />
          <Stack.Screen name="MapsScreen" component={MapsScreen} />
          <Stack.Screen name="SignupScreen" component={SignupScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen
            name="SolutionsScreen"
            component={SolutionsScreen}
            options={({route}) => ({
              title: route.params.orderId,
              start: route.params.start,
              end: route.params.end,
              startAdd: route.params.startAdd,
              endAdd: route.params.endAdd,
              solutions: route.params.solutions,
              signatures: route.params.signatures,
            })}
          />
          <Stack.Screen
            name="OrderScreen"
            component={OrderScreen}
            options={({route}) => ({
              start: route.params.start,
              end: route.params.end,
              startAdd: route.params.startAdd,
              endAdd: route.params.endAdd,
              signature: route.params.signature,
              solution: route.params.solution,
            })}
          />
          <Stack.Screen
            name="TrackScreen"
            component={TrackScreen}
            options={({route}) => ({
              start: route.params.start,
              end: route.params.end,
              solution: route.params.solution,
              startAdd: route.params.startAdd,
              endAdd: route.params.endAdd,
              id: route.params.id,
              orderId: route.params.orderId,
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}
