import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
  LayoutAnimation,
  UIManager,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import {
  Button,
  FAB,
  ActivityIndicator,
  Card,
  Paragraph,
  Avatar,
  Title,
} from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  TouchableOpacity,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import MapView, {Marker, Callout} from 'react-native-maps';
import BottomSheet from 'reanimated-bottom-sheet';
import Geocoder from 'react-native-geocoding';
import {Icon} from 'react-native-elements';
import Polyline from '@mapbox/polyline';
import {key} from '../util/GoogleAPI';
import {DrawerActions} from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import {getPoints} from '../functions/getPoints';
import AnimatedPolyline from 'react-native-maps-animated-polyline';

Keyboard.dismiss();
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default class MapsScreen extends React.Component {
  state = {
    headerPosition: 'up',
    headerHeight: null,
    focusColor1: null,
    focusColor2: null,
    focusColor3: null,
    filterPosition: 'down',
    machine: null,

    region: {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
    selectStart: false,
    selectEnd: false,
    markerStart: {
      coordinate: {
        latitude: 0,
        longitude: 1,
      },
    },
    markerEnd: {
      coordinate: {
        latitude: 1,
        longitude: 0,
      },
    },
    coords: [],
    coordsDrone: [],
    hasStart: false,
    hasEnd: false,
    startAdd: '',
    endAdd: '',
    isLoading: false,
    weight: 0,
    isComplete: false,
  };

  componentDidMount() {
    const user = auth().currentUser;
    Geocoder.init(key, {language: 'en'}); // use a valid API key
  }

  checkPoint = {
    latitude: 37.78825,
    longitude: -122.4324,
  };

  midPoint = {
    latitude: 0,
    longitude: 0,
  };

  resetStates() {
    this.setState({
      region: {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
      selectStart: false,
      selectEnd: false,
      markerStart: {
        coordinate: {
          latitude: 0,
          longitude: 1,
        },
      },
      markerEnd: {
        coordinate: {
          latitude: 1,
          longitude: 0,
        },
      },
      headerPosition: 'up',
      headerHeight: null,
      focusColor1: null,
      focusColor2: null,
      focusColor3: null,
      filterPosition: 'down',
      coords: [],
      coordsDrone: [],
      hasStart: false,
      hasEnd: false,
      startAdd: '',
      endAdd: '',
      isLoading: false,
      weight: 0,
      machine: null,
      isComplete: false,
    });
  }

  async isReachable(coordinate) {
    const resp = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${this.checkPoint.latitude},${this.checkPoint.longitude}&destination=${coordinate.latitude},${coordinate.longitude}&key=${key}`,
    );
    const respJson = await resp.json();
    const response = respJson.routes[0];
    // const distanceTime = response.legs[0];
    // const distance = distanceTime.distance.text;
    // const time = distanceTime.duration.text;
    const points = Polyline.decode(respJson.routes[0].overview_polyline.points);
    const coords = points.map((point) => {
      return {
        latitude: point[0],
        longitude: point[1],
      };
    });

    return [
      this.verifyPoints(coords[coords.length - 1], coordinate),
      coordinate,
    ];
  }

  verifyPoints(point1, point2) {
    //checks if two points are reachable from one another
    // console.log(point1, point2);
    const distance = Math.sqrt(
      Math.pow(Math.abs(point1.latitude - point2.latitude), 2) +
        Math.pow(Math.abs(point1.longitude - point2.longitude), 2),
    );
    // console.log(`distance: ${distance}`);
    if (
      // Math.abs(point1.latitude - point2.latitude) > 0.001 ||
      // Math.abs(point1.longitude - point2.longitude) > 0.001
      distance > 0.0007
    ) {
      return false;
    }
    return true;
  }

  invalidInput(startEnd) {
    if (startEnd == 'start') {
      this.setState(
        {
          selectStart: false,
          markerStart: {
            coordinate: {
              latitude: 0,
              longitude: 1,
            },
          },
          hasStart: false,
          startAdd: '',
          isComplete: false,
        },
        () => console.log('start cleared'),
      );
    } else {
      this.setState(
        {
          selectEnd: false,
          markerEnd: {
            coordinate: {
              latitude: 1,
              longitude: 0,
            },
          },
          hasEnd: false,
          endAdd: '',
          isComplete: false,
        },
        () => console.log('end cleared'),
      );
    }
  }

  async goToRegion(tempList) {
    const tempObj = tempList[Math.round(tempList.length / 2)];
    let tempRegion = {
      latitude: tempObj.latitude,
      longitude: tempObj.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };

    return this.mapView.animateToRegion(tempRegion, 1000);
  }

  // getData(coordinates) {
  //   Geocoder.init(key, { language: 'en' }); // use a valid API key

  //   Geocoder.from(coordinates)
  //     .then((json) => {
  //       var addressComponent = json.results[0]; //.formatted_address; //json.results[0].address_components[0];
  //       // this.setState({
  //       //   temp: addressComponent,
  //       // });
  //       console.log(addressComponent);
  //     })
  //     .catch((error) => console.warn(error));
  // }
  async geoAdd(add, startEnd) {
    Geocoder.from(add).then((json) => {
      var addressComponent = json.results[0].geometry.location;
      const temp = {
        latitude: addressComponent.lat,
        longitude: addressComponent.lng,
      };
      // console.log(temp);
      this.geo(temp, startEnd);
      // let flag = false;
      // let tempArr = [];
      // for (let i = 0; i < temp.length; i++) {
      //   if (temp[i] != 'San Francisco' && flag == false) {
      //     tempArr.push(temp[i]);
      //   } else flag = true;
      // }
      // const address = tempArr.join(', ');
      // console.log(startEnd);
      // if (startEnd == 'start')
      //   this.setState({
      //     startAdd: address,
      //   });
      // else if (startEnd == 'end')
      //   this.setState({
      //     endAdd: address,
      //   });

      // return flag;
    });
  }
  async geo(coordinates, startEnd) {
    return Geocoder.from(coordinates)
      .then((json) => {
        var addressComponent = json.results[0].formatted_address; //json.results[0].address_components[0];
        const temp = addressComponent.split(', ');
        let flag = false;
        let tempArr = [];
        for (let i = 0; i < temp.length; i++) {
          if (temp[i] != 'San Francisco' && flag == false) {
            tempArr.push(temp[i]);
          } else flag = true;
        }
        const address = tempArr.join(', ');
        // console.log(startEnd);
        // if (startEnd == 'start')
        //   this.setState({
        //     startAdd: address,
        //   });
        // else if (startEnd == 'end')
        //   this.setState({
        //     endAdd: address,
        //   });

        return [flag, address];
      })
      .then((values) => {
        // console.log(values[0]);
        // console.log(address);
        if (values[0]) {
          //if in service range
          if (startEnd == 'start')
            this.setState(
              {
                markerStart: {coordinate: coordinates},
                hasStart: true,
                selectStart: false,
                startAdd: values[1],
              },
              () => {
                this.drawALine();
              },
            );
          //if not in service range
          else
            this.setState(
              {
                markerEnd: {coordinate: coordinates},
                hasEnd: true,
                selectEnd: false,
                endAdd: values[1],
              },
              () => {
                this.drawALine();
              },
            );
        } else {
          alert(
            'Sorry, please retype your input. Note that currently we only offer services in San Fransisco. We apologize for the inconvenience.',
          );
          this.invalidInput(startEnd);
        }
      })
      .catch((error) => console.warn(error));
  }

  async drawALine() {
    if (this.state.hasStart && this.state.hasEnd) {
      // if (this.state.isComplete) {
      await this.getDirections(
        this.state.markerStart.coordinate,
        this.state.markerEnd.coordinate,
      );
    }
  }

  async drawDroneLine() {
    const A = [
      this.state.markerStart.coordinate.latitude,
      this.state.markerStart.coordinate.longitude,
    ];
    const B = [
      this.state.markerEnd.coordinate.latitude,
      this.state.markerEnd.coordinate.longitude,
    ];

    const tempList = await getPoints(A, B);

    this.setState({coordsDrone: tempList}, () => {
      this.goToRegion(tempList);
    });
  }
  async getDirections(start, end) {
    // console.log(start);
    // console.log(end);
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

      // console.log('start');
      // console.log(coords[0], start);
      // console.log('end');
      // console.log(coords[coords.length - 1], end);

      if (
        //check if two points are not reachable from one another
        // coords[0].latitude.toPrecision(4) !=
        //   this.state.markerStart.coordinate.latitude.toPrecision(4) ||
        // coords[0].longitude.toPrecision(5) !=
        //   this.state.markerStart.coordinate.longitude.toPrecision(5) ||
        // coords[coords.length - 1].latitude.toPrecision(4) !=
        //   this.state.markerEnd.coordinate.latitude.toPrecision(4) ||
        // coords[coords.length - 1].longitude.toPrecision(5) !=
        //   this.state.markerEnd.coordinate.longitude.toPrecision(5)
        // Math.abs(
        //   coords[0].latitude - this.state.markerStart.coordinate.latitude,
        // ) > 0.001 ||
        // Math.abs(
        //   coords[0].longitude - this.state.markerStart.coordinate.longitude,
        // ) > 0.001 ||
        // Math.abs(
        //   coords[coords.length - 1].latitude -
        //     this.state.markerEnd.coordinate.latitude,
        // ) > 0.001 ||
        // Math.abs(
        //   coords[coords.length - 1].longitude -
        //     this.state.markerEnd.coordinate.longitude,
        // ) > 0.001
        !this.verifyPoints(coords[0], this.state.markerStart.coordinate) ||
        !this.verifyPoints(
          coords[coords.length - 1],
          this.state.markerEnd.coordinate,
        )
      ) {
        alert(
          'Sorry, based on the addresses you input, robots are unable to travel from the starting point to the destination.',
        );
        this.invalidInput('start');
        this.invalidInput('end');
        this.setState({
          coords: [],
          coordsDrone: [],
        });
      } else {
        this.setState({coords, isComplete: true});
        this.drawDroneLine();
      }
    } catch (error) {
      console.warn('Error: ', error);
    }
  }

  toggleHeader = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'scaleXY'),
    );
    this.setState({
      headerPosition: this.state.headerPosition === 'up' ? 'down' : 'up',
    });
  };
  toggleFilter = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'scaleXY'),
    );
    this.setState({
      filterPosition: this.state.filterPosition === 'down' ? 'up' : 'down',
    });
  };
  closeFilter = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'scaleXY'),
    );
    this.setState({
      filterPosition: 'down',
    });
  };

  measureHeight = (e) => {
    this.setState({
      headerHeight: e.nativeEvent.layout.height,
    });
  };

  render() {
    // console.log(this.state.startAdd);
    return (
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <View>
            <MapView
              style={styles.mapStyle}
              ref={(ref) => (this.mapView = ref)}
              initialRegion={this.state.region}
              onRegionChangeComplete={(region) => {
                // console.log(region.latitude);
                // console.log(region.longitude);
                this.midPoint = {
                  latitude: region.latitude,
                  longitude: region.longitude,
                };
                this.setState({}); //makes everything rerender
                console.log(this.midPoint);
              }}
              // onPoiClick={async (event) => {
              //   if (this.state.selectStart) {
              //     //When selecting the starting location, a marker is placed and the coordinates are stored in the state.
              //     //this.getData(event.nativeEvent.coordinate);

              //     this.isReachable(event.nativeEvent.coordinate).then(
              //       (results) => {
              //         if (results[0]) {
              //           this.geo(results[1], 'start');
              //         } else {
              //           alert(
              //             'Sorry, our vehicles are unable to reach here. Please choose another point.',
              //           );
              //           this.invalidInput('start');
              //         }
              //       },
              //     );
              //     // Geocoder.from(event.nativeEvent.coordinate)
              //     //   .then((json) => {
              //     //     var addressComponent = json.results[0].formatted_address; //json.results[0].address_components[0];
              //     //     // console.log(json.results);
              //     //     const temp = addressComponent.split(', ');
              //     //     let flag = false;
              //     //     let tempArr = [];
              //     //     for (let i = 0; i < temp.length; i++) {
              //     //       if (temp[i] != 'San Francisco' && flag == false) {
              //     //         tempArr.push(temp[i]);
              //     //       } else flag = true;
              //     //     }
              //     //     const address = tempArr.join(', ');

              //     //     this.setState({
              //     //       startAdd: address,
              //     //     });
              //     //   })
              //     //   .catch((error) => console.warn(error));

              //     // const tempObj = {
              //     //   coordinate: event.nativeEvent.coordinate,
              //     // };
              //     // this.setState(
              //     //   {
              //     //     markerStart: tempObj,
              //     //     hasStart: true,
              //     //     selectStart: false,
              //     //   },
              //     //   () => {
              //     //     this.drawALine();
              //     //   }
              //     // );
              //   } else if (this.state.selectEnd) {
              //     this.isReachable(event.nativeEvent.coordinate).then(
              //       (results) => {
              //         if (results[0]) {
              //           this.geo(results[1], 'end');
              //         } else {
              //           alert(
              //             'Sorry, our vehicles are unable to reach here. Please choose another point.',
              //           );
              //           this.invalidInput('end');
              //         }
              //       },
              //     );
              //     // Geocoder.from(event.nativeEvent.coordinate)
              //     //   .then((json) => {
              //     //     var addressComponent = json.results[0].formatted_address; //json.results[0].address_components[0];
              //     //     const temp = addressComponent.split(', ');
              //     //     let flag = false;
              //     //     let tempArr = [];
              //     //     for (let i = 0; i < temp.length; i++) {
              //     //       if (temp[i] != 'San Francisco' && flag == false) {
              //     //         tempArr.push(temp[i]);
              //     //       } else flag = true;
              //     //     }
              //     //     const address = tempArr.join(', ');

              //     //     this.setState({
              //     //       endAdd: address,
              //     //     });
              //     //   })
              //     //   .catch((error) => console.warn(error));

              //     // const tempObj = {
              //     //   coordinate: event.nativeEvent.coordinate,
              //     // };
              //     // this.setState(
              //     //   {
              //     //     markerEnd: tempObj,
              //     //     hasEnd: true,
              //     //     selectEnd: false,
              //     //   },
              //     //   () => {
              //     //     this.drawALine();
              //     //   }
              //     // );
              //   }
              // }}
              // onPress={async (event) => {
              //   // console.log(event.nativeEvent.coordinate);
              //   //When tapping on the map, the following is executed
              //   //this.getData(event.nativeEvent.coordinate);
              //   if (this.state.selectStart) {
              //     //When selecting the starting location, a marker is placed and the coordinates are stored in the state.
              //     this.isReachable(event.nativeEvent.coordinate).then(
              //       (results) => {
              //         if (results[0]) {
              //           this.geo(results[1], 'start');
              //         } else {
              //           alert(
              //             'Sorry, our vehicles are unable to reach here. Please choose another point.',
              //           );
              //           this.invalidInput('start');
              //         }
              //       },
              //     );

              //     // Geocoder.from(event.nativeEvent.coordinate)
              //     //   .then((json) => {
              //     //     var addressComponent = json.results[0].formatted_address; //json.results[0].address_components[0];
              //     //     const temp = addressComponent.split(', ');
              //     //     let flag = false;
              //     //     let tempArr = [];
              //     //     for (let i = 0; i < temp.length; i++) {
              //     //       if (temp[i] != 'San Francisco' && flag == false) {
              //     //         tempArr.push(temp[i]);
              //     //       } else flag = true;
              //     //     }
              //     //     const address = tempArr.join(', ');

              //     //     this.setState({
              //     //       startAdd: address,
              //     //     });
              //     //   })
              //     //   .catch((error) => console.warn(error));

              //     // const tempObj = {
              //     //   coordinate: event.nativeEvent.coordinate,
              //     // };
              //     // this.setState(
              //     //   {
              //     //     markerStart: tempObj,
              //     //     hasStart: true,
              //     //     selectStart: false,
              //     //   },
              //     //   () => {
              //     //     this.drawALine();
              //     //   }
              //     // );
              //   } else if (this.state.selectEnd) {
              //     this.isReachable(event.nativeEvent.coordinate).then(
              //       (results) => {
              //         if (results[0]) {
              //           this.geo(results[1], 'end');
              //         } else {
              //           alert(
              //             'Sorry, our vehicles are unable to reach here. Please choose another point.',
              //           );
              //           this.invalidInput('end');
              //         }
              //       },
              //     );
              //     // Geocoder.from(event.nativeEvent.coordinate)
              //     //   .then((json) => {
              //     //     var addressComponent = json.results[0].formatted_address; //json.results[0].address_components[0];
              //     //     const temp = addressComponent.split(', ');
              //     //     let flag = false;
              //     //     let tempArr = [];
              //     //     for (let i = 0; i < temp.length; i++) {
              //     //       if (temp[i] != 'San Francisco' && flag == false) {
              //     //         tempArr.push(temp[i]);
              //     //       } else flag = true;
              //     //     }
              //     //     const address = tempArr.join(', ');

              //     //     this.setState({
              //     //       endAdd: address,
              //     //     });
              //     //   })
              //     //   .catch((error) => console.warn(error));

              //     // const tempObj = {
              //     //   coordinate: event.nativeEvent.coordinate,
              //     // };
              //     // this.setState(
              //     //   {
              //     //     markerEnd: tempObj,
              //     //     hasEnd: true,
              //     //     selectEnd: false,
              //     //   },
              //     //   () => {
              //     //     this.drawALine();
              //     //   }
              //     // );
              //   }
              // }}
            >
              <Marker
                coordinate={this.state.markerStart.coordinate}
                pinColor={'#00FF00'}>
                <Callout>
                  <Text>Start: {this.state.startAdd}</Text>
                </Callout>
              </Marker>
              <Marker coordinate={this.state.markerEnd.coordinate}>
                <Callout>
                  <Text>End: {this.state.endAdd}</Text>
                </Callout>
              </Marker>

              {this.state.isComplete ? (
                <View>
                  {this.state.machine == null ? (
                    <View>
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
                    </View>
                  ) : (
                    <View>
                      {this.state.machine == 'Drone' ? (
                        <AnimatedPolyline
                          strokeWidth={4}
                          strokeColor="#0066CF"
                          coordinates={this.state.coordsDrone}
                          interval={30}
                        />
                      ) : (
                        <View>
                          <AnimatedPolyline
                            strokeWidth={4}
                            strokeColor="red"
                            coordinates={this.state.coords}
                            interval={30}
                          />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <View></View>
              )}
            </MapView>
            {/* Centered Marker Component */}
            {this.state.selectStart || this.state.selectEnd ? (
              <View
                style={[
                  {
                    top: '50%',
                    left: '50%',
                    position: 'absolute',
                    zIndex: 1,
                  },
                  {
                    transform: [{translateX: -20}, {translateY: -40}],
                  },
                ]}>
                <Icon name="location-on" size={40} color="black" />
              </View>
            ) : (
              <View></View>
            )}
          </View>
          {/* {this.state.isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator />
          </View>
        ) : (
          <View></View>
        )} */}
          <View style={[styles.icon, {elevation: 20}]}>
            <TouchableOpacity style={{margin: 15}}>
              <Icon
                name="menu"
                size={30}
                color="black"
                onPress={() =>
                  this.props.navigation.dispatch(DrawerActions.toggleDrawer())
                }
              />
            </TouchableOpacity>
          </View>

          <View style={styles.start}>
            <TouchableOpacity
              style={{
                paddingTop: 20,
                paddingBottom: 20,
                paddingLeft: 40,
                paddingRight: 40,
              }}
              onPress={() => {
                this.toggleHeader();
                this.toggleFilter();
              }}>
              <Text style={{fontSize: 20}}>Start</Text>
            </TouchableOpacity>
          </View>

          {this.state.selectStart || this.state.selectEnd ? (
            <View style={styles.start}>
              <TouchableOpacity
                style={{
                  paddingTop: 20,
                  paddingBottom: 20,
                  paddingLeft: 40,
                  paddingRight: 40,
                }}
                onPress={() => {
                  if (this.state.selectStart) {
                    //When selecting the starting location, a marker is placed and the coordinates are stored in the state.

                    this.isReachable(this.midPoint).then((results) => {
                      if (results[0]) {
                        this.geo(results[1], 'start');
                      } else {
                        alert(
                          'Sorry, our vehicles are unable to reach here. Please choose another point.',
                        );
                        this.invalidInput('start');
                      }
                    });
                  } else if (this.state.selectEnd) {
                    this.isReachable(this.midPoint).then((results) => {
                      if (results[0]) {
                        this.geo(results[1], 'end');
                      } else {
                        alert(
                          'Sorry, our vehicles are unable to reach here. Please choose another point.',
                        );
                        this.invalidInput('end');
                      }
                    });
                  }
                }}>
                <Text style={{fontSize: 20}}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View></View>
          )}

          {this.state.isComplete ? (
            <View style={styles.start}>
              <TouchableOpacity
                style={{
                  paddingTop: 20,
                  paddingBottom: 20,
                  paddingLeft: 40,
                  paddingRight: 40,
                }}
                onPress={async () => {
                  //console.log('confirm');
                  const markerStartInJSON = JSON.stringify(
                    this.state.markerStart,
                  );
                  const markerEndInJSON = JSON.stringify(this.state.markerEnd);

                  const emptyCoordinate = {
                    coordinate: {
                      latitude: 0,
                      longitude: 0,
                    },
                  };

                  const emptyInJSON = JSON.stringify(emptyCoordinate);

                  if (
                    markerEndInJSON != emptyInJSON &&
                    markerStartInJSON != emptyInJSON &&
                    this.state.weight > 0 &&
                    this.state.startAdd != this.state.endAdd
                  ) {
                    const user = auth().currentUser;
                    // console.log(user.uid);

                    let machine_type = 2;
                    if (this.state.machine === 'Drone') {
                      machine_type = 0;
                    } else if (this.state.machine === 'Robot') {
                      machine_type = 1;
                    } else {
                      machine_type = 2;
                    }

                    const pushObject = {
                      starting_point: {
                        coordinate: {
                          lat: this.state.markerStart.coordinate.latitude,
                          lon: this.state.markerStart.coordinate.longitude,
                        },
                        address: this.state.startAdd,
                      },
                      destination: {
                        coordinate: {
                          lat: this.state.markerEnd.coordinate.latitude,
                          lon: this.state.markerEnd.coordinate.longitude,
                        },
                        address: this.state.endAdd,
                      },
                      machine_type,
                      weight: parseFloat(this.state.weight),
                    };

                    console.log(pushObject);

                    this.setState({isLoading: true}, async () => {
                      await fetch('http://35.238.55.197:8080/query', {
                        method: 'POST',
                        headers: {
                          // Accept: 'application/json',
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(pushObject),
                      })
                        .then((response) => {
                          return response.json();
                        })
                        .then((json) => {
                          // console.log('sent');
                          // console.log(json);
                          // console.log(this.state.markerStart.coordinate);
                          const user = auth().currentUser;
                          if (user) {
                            firestore()
                              .collection('user')
                              .doc(user.uid)
                              .collection('addresses')
                              .doc(this.state.startAdd)
                              .set({})
                              .catch((error) => console.log(error));

                            firestore()
                              .collection('user')
                              .doc(user.uid)
                              .collection('addresses')
                              .doc(this.state.endAdd)
                              .set({})
                              .catch((error) => console.log(error));
                          }

                          this.props.navigation.navigate('SolutionsScreen', {
                            start: this.state.markerStart,
                            end: this.state.markerEnd,
                            startAdd: this.state.startAdd,
                            endAdd: this.state.endAdd,
                            solutions: json.solutions,
                            signatures: json.signatures,
                          });
                          // .then(() => this.resetStates());
                        })
                        .catch((error) => console.log(error));
                      this.resetStates();
                    });
                    // this.resetStates();
                  } else {
                    if (this.state.startAdd == this.state.endAdd) {
                      alert(
                        'Please input valid starting point and destination.',
                      );
                    } else {
                      if (this.state.weight <= 0) {
                        alert('Please input a valid weight.');
                      }
                    }
                  }
                }}>
                <Text style={{fontSize: 20}}>Query Solutions</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View></View>
          )}

          {/* header component */}
          <View
            style={[
              styles.header,
              this.state.headerPosition === 'up'
                ? styles.header
                : styles.moveDown,
            ]}
            onLayout={this.measureHeight}>
            {/* icon view */}
            <View style={styles.icon}>
              <TouchableOpacity style={{margin: 15}}>
                <Icon
                  name="arrow-back"
                  size={30}
                  color="black"
                  onPress={() => {
                    this.toggleHeader();
                    this.closeFilter();
                  }}
                />
              </TouchableOpacity>
            </View>
            {/* two rows view */}
            <View
              style={{
                flexDirection: 'column',
                marginLeft: 60,
                flex: 1,
              }}>
              {/* first row */}
              <View
                style={{
                  justifyContent: 'center',
                }}>
                {this.state.startAdd == '' ? (
                  <TextInput
                    style={[
                      styles.textinput,
                      {
                        backgroundColor: this.state.focusColor1
                          ? this.state.focusColor1
                          : '#dddddd',
                      },
                    ]}
                    placeholderTextColor="gray"
                    placeholder="From"
                    onChangeText={(text) => {
                      this.setState({startAdd: text});
                    }}
                    onFocus={() => {
                      this.setState({
                        focusColor1: '#cccccc',
                        selectStart: true,
                        selectEnd: false,
                      });
                    }}
                    onBlur={() => {
                      this.setState({
                        focusColor1: null,
                      });
                    }}
                  />
                ) : (
                  <TextInput
                    style={[
                      styles.textinput,
                      {
                        backgroundColor: this.state.focusColor1
                          ? this.state.focusColor1
                          : '#dddddd',
                      },
                    ]}
                    onFocus={() => {
                      this.setState({
                        focusColor1: '#cccccc',
                        selectStart: true,
                        selectEnd: false,
                      });
                    }}
                    onChangeText={(text) => {
                      this.setState({startAdd: text});
                    }}
                    onBlur={() => {
                      this.setState({
                        focusColor1: null,
                      });
                      // console.log(this.state.startAdd);
                      this.geoAdd(this.state.startAdd, 'start');
                    }}>
                    {this.state.startAdd}
                  </TextInput>
                )}
              </View>
              {/* second row */}
              <View
                style={{
                  justifyContent: 'center',
                  marginBottom: 5,
                }}>
                {this.state.endAdd == '' ? (
                  <TextInput
                    style={[
                      styles.textinput,
                      {
                        backgroundColor: this.state.focusColor2
                          ? this.state.focusColor2
                          : '#dddddd',
                      },
                    ]}
                    placeholderTextColor="gray"
                    placeholder="To"
                    onChangeText={(text) => {
                      this.setState({endAdd: text});
                    }}
                    onFocus={() => {
                      this.setState({
                        focusColor2: '#cccccc',
                        selectStart: false,
                        selectEnd: true,
                      });
                    }}
                    onBlur={() => {
                      this.setState({
                        focusColor2: null,
                      });
                      this.geoAdd(this.state.endAdd, 'end');
                    }}
                  />
                ) : (
                  <TextInput
                    style={[
                      styles.textinput,
                      {
                        backgroundColor: this.state.focusColor2
                          ? this.state.focusColor2
                          : '#dddddd',
                      },
                    ]}
                    onChangeText={(text) => {
                      this.setState({endAdd: text});
                    }}
                    onFocus={() => {
                      this.setState({focusColor2: '#cccccc'});
                    }}
                    onBlur={() => {
                      this.setState({
                        focusColor2: null,
                      });
                      this.geoAdd(this.state.endAdd, 'end');
                    }}>
                    {this.state.endAdd}
                  </TextInput>
                )}
              </View>
            </View>
          </View>

          {/* filter component */}
          <View
            style={[
              styles.filter,
              this.state.filterPosition === 'down'
                ? styles.filter
                : {top: this.state.headerHeight},
            ]}>
            {/* set location on map */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                paddingTop: 10,
                paddingBottom: 10,
                borderBottomColor: '#dddddd',
                borderBottomWidth: 2,
              }}
              onPress={() => {
                this.toggleFilter();
              }}>
              <View
                style={{
                  backgroundColor: '#dddddd',
                  borderRadius: 25,
                  width: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 20,
                  marginRight: 10,
                }}>
                <Icon name="location-on" size={30} color="black" />
              </View>
              <Text
                style={{
                  flex: 1,
                  height: 50,
                  textAlignVertical: 'center',
                  textAlign: 'left',
                  fontSize: 18,
                }}>
                Set location on map
              </Text>
            </TouchableOpacity>

            {/* machine picker */}
            <View style={styles.filterRow}>
              <Text
                style={{
                  height: 50,
                  flex: 1,
                  textAlignVertical: 'center',
                  textAlign: 'left',
                  fontSize: 18,
                }}>
                Machine (Optional):{' '}
              </Text>
              <View
                style={{
                  height: 50,
                  backgroundColor: '#dddddd',
                  borderRadius: 4,
                  flex: 1,
                }}>
                <RNPickerSelect
                  placeholder={{
                    label: 'Machine',
                    value: null,
                  }}
                  value={this.state.machine}
                  onValueChange={(value) => {
                    this.setState({machine: value}, () =>
                      console.log(this.state.machine),
                    );
                  }}
                  items={[
                    {label: 'Drone', value: 'Drone'},
                    {label: 'Robot', value: 'Robot'},
                  ]}
                />
              </View>
            </View>

            {/* weight picker */}
            <View style={styles.filterRow}>
              <Text
                style={{
                  height: 50,
                  flex: 1,
                  textAlignVertical: 'center',
                  textAlign: 'left',
                  fontSize: 18,
                }}>
                Weight:{' '}
              </Text>
              <View
                style={{
                  height: 50,
                  flex: 1,
                  flexDirection: 'row',
                }}>
                {/* weight input */}
                <View
                  style={[
                    {
                      flex: 3,
                      borderRadius: 4,
                      backgroundColor: '#dddddd',
                    },
                    {
                      backgroundColor: this.state.focusColor3
                        ? this.state.focusColor3
                        : '#dddddd',
                    },
                  ]}>
                  <TextInput
                    style={{
                      overflow: 'hidden',
                      height: 50,
                      paddingLeft: 10,
                      paddingRight: 10,
                      textAlignVertical: 'center',
                      textAlign: 'center',
                      fontSize: 18,
                    }}
                    value={this.state.weight.toString()}
                    onFocus={() => {
                      this.setState({focusColor3: '#cccccc'});
                    }}
                    onBlur={() => {
                      this.setState({
                        focusColor3: null,
                      });
                    }}
                    onChangeText={(text) => {
                      this.setState({weight: text});
                    }}
                    keyboardType="numeric"
                  />
                </View>

                {/* unit */}
                <View
                  style={{
                    borderRadius: 4,
                  }}>
                  <Text
                    style={{
                      height: 50,
                      paddingLeft: 10,
                      paddingRight: 10,
                      textAlignVertical: 'center',
                      textAlign: 'center',
                      fontSize: 18,
                    }}>
                    lb(s)
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {/* <View style={styles.footer}>
            <BottomSheet
              snapPoints={['5%', '20%']}
              renderContent={this.renderContent}
            />
          </View> */}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    top: -Dimensions.get('window').height * 0.3,
    left: 0,
    position: 'absolute',
    width: 0,
    flex: 1,
    alignItems: 'stretch',
    zIndex: 1,
    flexDirection: 'row',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    elevation: 50,
  },
  moveDown: {
    top: 0,
    width: Dimensions.get('window').width,
  },
  filter: {
    backgroundColor: '#ffffff',
    top: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    left: 0,
    position: 'absolute',
    zIndex: 1,
    flexDirection: 'column',
    paddingTop: 10,
  },
  filterRow: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 10,
    marginLeft: 10,
    marginRight: 10,
  },
  footer: {
    bottom: 0,
    height: Dimensions.get('window').height * 0.2,
    width: Dimensions.get('window').width,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapStyle: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  bottomSheet: {
    flex: 1,
    color: '#333',
    // top: Dimensions.get('window').height * 0.2,
  },
  loader: {
    backgroundColor: '#000',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  start: {
    backgroundColor: 'skyblue',
    position: 'absolute',
    bottom: 40,
    borderRadius: 10,
  },
  icon: {
    backgroundColor: 'white',
    position: 'absolute',
    left: Platform.OS === 'android' ? StatusBar.currentHeight * 0.3 : 0,
    top: Platform.OS === 'android' ? StatusBar.currentHeight * 1.3 : 0,
    borderRadius: 30,
  },
  textinput: {
    backgroundColor: '#eeeeee',
    marginVertical: 5,
    borderRadius: 4,
    overflow: 'hidden',
    width: 300,
    height: 40,
    textAlign: 'left',
    fontSize: 16,
    paddingLeft: 10,
    paddingRight: 10,
  },
});
