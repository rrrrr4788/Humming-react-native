import React, {Component} from 'react';
import {StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createDrawerNavigator} from '@react-navigation/drawer';

import LoginScreen from './LoginScreen';
import MapsScreen from './MapsScreen';
import OrderListScreen from './OrderListScreen';
import ProfileScreen from './ProfileScreen';
const Drawer = createDrawerNavigator();

export default class App extends Component {
  render() {
    return (
      // <View style={styles.container}>
      <Drawer.Navigator initialRouteName="Map">
        <Drawer.Screen name="OrderList" component={OrderListScreen} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
        <Drawer.Screen name="Map" component={MapsScreen} />
        <Drawer.Screen name="Login" component={LoginScreen} />
      </Drawer.Navigator>
      // </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'tomato',
  },
});
