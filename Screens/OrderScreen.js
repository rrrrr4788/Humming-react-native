import React, {Component} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  SafeAreaView,
  Image,
  ScrollView,
  Vibration,
  Platform,
} from 'react-native';
import {
  Menu,
  Button,
  Provider,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import MapView, {Marker, Callout} from 'react-native-maps';
import {key} from '../util/GoogleAPI';
import Polyline from '@mapbox/polyline';
import auth from '@react-native-firebase/auth';
import {Icon} from 'react-native-elements';
import {
  TouchableOpacity,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import AnimatedPolyline from 'react-native-maps-animated-polyline';
import {formatDate, formatTime} from '../functions/getTime';
import {getPoints} from '../functions/getPoints';
import stripe from 'tipsi-stripe';
import {StackActions} from '@react-navigation/native';
// import { Notifications } from 'expo';
// import * as Permissions from 'expo-permissions';
// import Constants from 'expo-constants';

export default class OrderScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      region: {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
      markerStart: props.route.params.start,
      markerEnd: props.route.params.end,
      startAdd: props.route.params.startAdd,
      endAdd: props.route.params.endAdd,
      coords: [
        {
          latitude: props.route.params.start.coordinate.latitude,
          longitude: props.route.params.start.coordinate.longitude,
        },
        {
          latitude: props.route.params.end.coordinate.latitude,
          longitude: props.route.params.end.coordinate.longitude,
        },
      ],
      coordsDrone: [],
      solution: props.route.params.solution,
      signature: props.route.params.signature,
      isLoading: false,
      idToken: '',
      expoPushToken: '',
      notification: {},
    };
  }

  componentDidMount() {
    stripe.setOptions({
      publishableKey: 'pk_test_5k46Yz1BbQw48FbrnqPhvDpW00wDV72QeN',
    });
    this.drawALine();
    // this.registerForPushNotificationsAsync();

    // // Handle notifications that are received or selected while the app
    // // is open. If the app was closed and then opened by tapping the
    // // notification (rather than just tapping the app icon to open it),
    // // this function will fire on the next tick after the app starts
    // // with the notification data.
    // this._notificationSubscription = Notifications.addListener(
    //   this._handleNotification
    // );
  }

  // registerForPushNotificationsAsync = async () => {
  //   if (Constants.isDevice) {
  //     const { status: existingStatus } = await Permissions.getAsync(
  //       Permissions.NOTIFICATIONS
  //     );
  //     let finalStatus = existingStatus;
  //     if (existingStatus !== 'granted') {
  //       const { status } = await Permissions.askAsync(
  //         Permissions.NOTIFICATIONS
  //       );
  //       finalStatus = status;
  //     }
  //     if (finalStatus !== 'granted') {
  //       alert('Failed to get push token for push notification!');
  //       return;
  //     }
  //     token = await Notifications.getExpoPushTokenAsync();
  //     console.log(token);
  //     this.setState({ expoPushToken: token });
  //   } else {
  //     alert('Must use physical device for Push Notifications');
  //   }

  //   if (Platform.OS === 'android') {
  //     Notifications.createChannelAndroidAsync('default', {
  //       name: 'default',
  //       sound: true,
  //       priority: 'max',
  //       vibrate: [0, 250, 250, 250],
  //     });
  //   }
  // };

  async drawALine() {
    const A = [this.state.coords[0].latitude, this.state.coords[0].longitude];
    const B = [this.state.coords[1].latitude, this.state.coords[1].longitude];

    const tempList = await getPoints(A, B);
    const tempObj = tempList[Math.round(tempList.length / 2)];
    this.setState({
      region: {
        latitude: tempObj.latitude,
        longitude: tempObj.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
    });
    if (this.state.solution.machine_type) {
      this.getDirections(
        this.state.markerStart.coordinate,
        this.state.markerEnd.coordinate,
      );
    } else {
      this.setState({coordsDrone: tempList});
    }
  }

  async getDirections(start, end) {
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&key=${key}`,
      );
      const respJson = await resp.json();
      const response = respJson.routes[0];
      // const distanceTime = response.legs[0];
      // const distance = distanceTime.distance.text;
      // const time = distanceTime.duration.text;
      const points = Polyline.decode(
        respJson.routes[0].overview_polyline.points,
      );
      const coords = points.map((point) => {
        return {
          latitude: point[0],
          longitude: point[1],
        };
      });
      // this.setState({ coords, distance, time });
      this.setState({coords});
    } catch (error) {
      console.log('Error: ', error);
    }
  }

  // _handleNotification = (notification) => {
  //   Vibration.vibrate();
  //   console.log(notification);
  //   this.setState({ notification: notification });
  // };

  // sendPushNotification = async () => {
  //   const message = {
  //     to: this.state.expoPushToken,
  //     sound: 'default',
  //     title: 'Order Confirmed!',
  //     body: 'A machine is already on its way to collect the package!',
  //     data: { data: 'goes here' },
  //     _displayInForeground: true,
  //   };
  //   const response = await fetch('https://exp.host/--/api/v2/push/send', {
  //     method: 'POST',
  //     headers: {
  //       Accept: 'application/json',
  //       'Accept-encoding': 'gzip, deflate',
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify(message),
  //   });
  // };

  async pay(orderId) {
    const token = await stripe.paymentRequestWithCardForm();
    //console.log(token);

    const user = auth().currentUser;
    await user.getIdToken(true).then((idToken) => {
      this.setState({idToken});
    });
    return fetch('http://35.238.55.197:8080/pay', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: this.state.idToken,
        Payment: token.tokenId,
      },
      body: JSON.stringify({
        order_id: orderId,
      }),
    }).then(() => {
      this.setState({isLoading: false}, () => {
        // this.sendPushNotification();
        this.props.navigation.dispatch(StackActions.popToTop(), () =>
          console.log(orderId),
        );
        this.props.navigation.navigate('TrackScreen', {
          orderId,
        });
      });
    });
  }

  render() {
    const dropOffTime = new Date(
      Date.parse(this.state.solution.estimated_dropoff_time),
    );

    const pickUpTime = new Date(
      Date.parse(this.state.solution.estimated_pickup_time),
    );
    return (
      <View>
        {this.state.isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator></ActivityIndicator>
          </View>
        ) : (
          <View></View>
        )}
        <View style={{top: 20, left: 5, position: 'absolute', zIndex: 1}}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
            <Icon name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <MapView style={styles.mapStyle} initialRegion={this.state.region}>
          <Marker
            coordinate={this.state.markerStart.coordinate}
            pinColor={'#00FF00'}>
            <Callout>
              {this.state.startAdd == '' ? (
                <View>
                  <Text>
                    latitude: {this.state.markerStart.coordinate.latitude}
                  </Text>
                  <Text>
                    longitude: {this.state.markerStart.coordinate.longitude}
                  </Text>
                </View>
              ) : (
                <Text>{this.state.startAdd}</Text>
              )}
            </Callout>
          </Marker>
          <Marker coordinate={this.state.markerEnd.coordinate}>
            <Callout>
              {this.state.endAdd == '' ? (
                <View>
                  <Text>
                    latitude: {this.state.markerEnd.coordinate.latitude}
                  </Text>
                  <Text>
                    longitude: {this.state.markerEnd.coordinate.longitude}
                  </Text>
                </View>
              ) : (
                <Text>{this.state.endAdd}</Text>
              )}
            </Callout>
          </Marker>
          {/* <MapView.Polyline
            strokeWidth={7}
            strokeColor='red'
            coordinates={this.state.coords}
          /> */}
          <AnimatedPolyline
            strokeWidth={4}
            strokeColor="red"
            coordinates={this.state.coords}
            interval={30}
          />
          <AnimatedPolyline
            strokeWidth={4}
            strokeColor="#0066CF"
            coordinates={this.state.coordsDrone}
            interval={30}
          />
        </MapView>
        <View style={styles.body}>
          <View
            style={{
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
            }}>
            <Text style={styles.header}>Order Details</Text>
            <Text style={styles.texts}>From: {this.state.startAdd}</Text>
            <Text style={styles.texts}>To: {this.state.endAdd}</Text>
            <Text style={styles.texts}>
              {`Pick up at: ${formatDate(pickUpTime)}, ${formatTime(
                pickUpTime,
              )}`}
            </Text>
            <Text style={styles.texts}>
              {`Drop off at: ${formatDate(dropOffTime)}, ${formatTime(
                dropOffTime,
              )}`}
            </Text>
            <Text style={styles.texts}>
              Duration: {this.state.solution.duration}
            </Text>
          </View>

          <Button
            mode="contained"
            style={styles.btn}
            onPress={() => {
              this.setState({isLoading: true});
              const user = auth().currentUser;

              user
                .getIdToken(true)
                .then((idToken) => {
                  // Send token to your backend via HTTPS
                  // ...
                  fetch('http://35.238.55.197:8080/order', {
                    method: 'POST',
                    headers: {
                      Accept: 'application/json',
                      'Content-Type': 'application/json',
                      Authorization: idToken,
                    },
                    body: JSON.stringify({
                      solution: this.state.solution,
                      signature: this.state.signature,
                    }),
                  })
                    .then((response) => {
                      return response.json();
                    })
                    .then((response) => {
                      console.log(response.order_id);
                      this.setState({isLoading: false}, () => {
                        // this.props.navigation.navigate('PaymentScreen', {
                        //   price: this.state.solution.price,
                        //   weight: this.state.solution.weight,
                        //   machineType: this.state.solution.machine_type,
                        //   orderId: response.order_id,
                        // });
                        this.pay(response.order_id);
                      });
                    })
                    .catch((error) => {
                      alert(error);
                    });
                })
                .catch(function (error) {
                  // Handle error
                  console.log(error);
                });
            }}>
            Confirm & Pay
          </Button>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapStyle: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.45,
    top: 0,
    position: 'absolute',
  },
  body: {
    height: Dimensions.get('window').height * 0.55,
    width: Dimensions.get('window').width,
    top: Dimensions.get('window').height * 0.45,
    position: 'absolute',
  },
  header: {
    fontWeight: 'bold',
    fontSize: 32,
  },
  texts: {
    fontSize: 18,
    padding: 8,
  },
  btn: {
    zIndex: 1,
    bottom: 0,
    width: Dimensions.get('window').width,
    position: 'absolute',
    color: 'black',
  },
  loader: {
    backgroundColor: '#fff5',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
