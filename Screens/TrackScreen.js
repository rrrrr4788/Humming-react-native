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
import firestore from '@react-native-firebase/firestore';
import {Icon} from 'react-native-elements';
import {TouchableOpacity} from 'react-native-gesture-handler';
import AnimatedPolyline from 'react-native-maps-animated-polyline';
import {getPoints} from '../functions/getPoints';

export default class TrackScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      region: {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
      markerStart: {
        coordinate: {
          latitude: 37.78,
          longitude: -122.444,
        },
      },
      markerEnd: {
        coordinate: {
          latitude: 37.72,
          longitude: -122.433,
        },
      },
      startAdd: '',
      endAdd: '',
      coords: [],
      isLoading: false,
      orderId: props.route.params.orderId,
      coordsDrone: [],
      order: {},
    };
  }

  componentDidMount() {
    console.log(this.state.orderId);
    this.fetchData();
  }

  async fetchData() {
    await firestore()
      .collection('orders')
      .doc(this.state.orderId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          // console.log('Document data:', doc.data());
          this.setState({order: doc.data()}, () => {
            console.log(this.state.order);
            this.drawALine();
          });
        } else {
          alert('No such document!');
          this.props.navigation.goBack();
        }
      });
  }

  async drawALine() {
    const A = [
      this.state.markerStart.coordinate.latitude,
      this.state.markerStart.coordinate.longitude,
    ];
    const B = [
      this.state.markerEnd.coordinate.latitude,
      this.state.markerEnd.coordinate.longitude,
    ];

    const tempList = await getPoints(A, B);
    const tempObj = tempList[Math.round(tempList.length / 2)];
    const tempRegion = {
      latitude: tempObj.latitude,
      longitude: tempObj.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    this.setState({
      region: tempRegion,
    });

    this.mapView.animateToRegion(tempRegion, 1000);

    if (this.state.order.MachineType) {
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

  render() {
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

        <MapView
          style={styles.mapStyle}
          ref={(ref) => (this.mapView = ref)}
          initialRegion={this.state.region}>
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
            {this.state.order.Status == 1 ? (
              <Text style={styles.header}>
                Standby, your package is on its way!
              </Text>
            ) : (
              <Text style={styles.header}>Order Details</Text>
            )}
            {/* <Text style={styles.header}>Order Details</Text> */}
            <Text style={styles.texts}>From: {this.state.startAdd}</Text>
            <Text style={styles.texts}>To: {this.state.endAdd}</Text>
          </View>
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
    height: Dimensions.get('window').height * 0.6,
    top: 0,
    position: 'absolute',
  },
  body: {
    height: Dimensions.get('window').height * 0.4,
    width: Dimensions.get('window').width,
    top: Dimensions.get('window').height * 0.6,
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
