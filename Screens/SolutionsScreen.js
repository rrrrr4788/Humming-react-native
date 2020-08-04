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
import {
  TouchableOpacity,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import {formatDate, formatTime} from '../functions/getTime';
import AnimatedPolyline from 'react-native-maps-animated-polyline';
import {getPoints} from '../functions/getPoints';

export default class SolutionsScreen extends Component {
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
      coords: [],
      coordsDrone: [],
      solutions: props.route.params.solutions,
      signatures: props.route.params.signatures,
      orderId: props.route.params.orderId,
      solution: {},
      signature: '',
      selected: -1,
    };
  }

  componentDidMount() {
    this.drawALine();
  }

  async drawALine() {
    await this.getDirections(
      this.state.markerStart.coordinate,
      this.state.markerEnd.coordinate,
    );

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
    let tempRegion = {
      latitude: tempObj.latitude,
      longitude: tempObj.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    this.setState({coordsDrone: tempList});
    return this.mapView.animateToRegion(tempRegion, 1000);
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
      return this.setState({coords});
    } catch (error) {
      console.log('Error: ', error);
    }
  }

  render() {
    const user = auth().currentUser;
    auth().onAuthStateChanged((result) => {
      if (result && this.state.selected != -1) {
        this.props.navigation.navigate('OrderScreen', {
          start: this.state.markerStart,
          end: this.state.markerEnd,
          solution: this.state.solution,
          startAdd: this.state.startAdd,
          endAdd: this.state.endAdd,
          signature: this.state.signature,
        });
      }
    });
    return (
      <View style={styles.container}>
        <View style={{top: 20, left: 5, position: 'absolute', zIndex: 1}}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
            <Icon name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
        </View>
        <View
          style={{
            flex: 1,
          }}>
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
        </View>
        <View
          style={{
            flex: 2,
          }}>
          <ScrollView style={styles.container}>
            <View style={styles.flatlist}>
              <FlatList
                data={this.state.solutions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => {
                  //<this.Item item={item}
                  const dropOffTime = new Date(
                    Date.parse(item.estimated_dropoff_time),
                  );

                  const pickUpTime = new Date(
                    Date.parse(item.estimated_pickup_time),
                  );
                  return (
                    <View style={styles.item}>
                      <TouchableOpacity
                        onPress={() => {
                          const user = auth().currentUser;
                          //console.log(user);
                          this.setState({
                            selected: index,
                            solution: item,
                            signature: this.state.signatures[index],
                          });
                          auth().onAuthStateChanged((result) => {
                            if (result) {
                              this.props.navigation.navigate('OrderScreen', {
                                start: this.state.markerStart,
                                end: this.state.markerEnd,
                                solution: this.state.solution,
                                startAdd: this.state.startAdd,
                                endAdd: this.state.endAdd,
                                signature: this.state.signature,
                              });
                              this.setState({
                                start: item.start,
                                end: item.end,
                                solution: item,
                              });
                            } else {
                              this.props.navigation.navigate('LoginScreen');
                            }
                          });
                        }}>
                        <View style={{flexDirection: 'row'}}>
                          {
                            //drone = 0, robot = 1
                            !item.machine_type ? (
                              <Image
                                style={{width: 80, height: 80}}
                                source={require('../img/DjiDrone.png')}></Image>
                            ) : (
                              <Image
                                style={{width: 80, height: 80}}
                                source={require('../img/WallE.png')}></Image>
                            )
                          }

                          <View style={{marginHorizontal: 20}}>
                            <Text
                              style={{
                                color: 'white',
                                fontSize: 15,
                                fontWeight: 'bold',
                              }}>{`Drop off at: ${formatDate(
                              dropOffTime,
                            )}, ${formatTime(dropOffTime)}`}</Text>
                            <Text
                              style={{
                                color: 'white',
                                fontSize: 15,
                                fontWeight: 'bold',
                              }}>{`Pick up at: ${formatDate(
                              pickUpTime,
                            )}, ${formatTime(pickUpTime)}`}</Text>
                            <Text
                              style={{
                                color: 'white',
                                fontSize: 15,
                                fontWeight: 'bold',
                              }}>{`Weight: ${item.weight}`}</Text>
                            <Text
                              style={{
                                color: 'white',
                                fontSize: 24,
                                fontWeight: 'bold',
                              }}>{`$${(item.price / 100).toPrecision(
                              3,
                            )}`}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                }}></FlatList>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  flatlist: {
    // top: Dimensions.get('window').height * 0.45,
    // position: 'absolute',
    width: Dimensions.get('window').width,
    //marginTop: 10,
  },
  mapStyle: {
    width: Dimensions.get('window').width,
    height: '100%',
    // top: 0,
    // position: 'absolute',
    // display: 'none',
  },
  item: {
    marginTop: 15,
    backgroundColor: '#3498db',
    // marginVertical: 15,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: 'white',
  },
});
