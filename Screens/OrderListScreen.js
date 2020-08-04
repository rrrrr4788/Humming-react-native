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
  RefreshControl,
} from 'react-native';
import {
  Menu,
  Button,
  Provider,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {Icon} from 'react-native-elements';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {formatDate, formatTime} from '../functions/getTime';
import {DrawerActions} from '@react-navigation/native';
import stripe from 'tipsi-stripe';

export default class OrderListScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: [],
      isLoading: true,
      idToken: '',
      refreshing: false,
    };
  }

  componentDidMount() {
    this.fetchData();
    stripe.setOptions({
      publishableKey: 'pk_test_5k46Yz1BbQw48FbrnqPhvDpW00wDV72QeN',
    });
  }

  _onRefresh() {
    this.setState({refreshing: true});
    this.fetchData().then(() => {
      this.setState({refreshing: false});
    });
  }

  async fetchData() {
    firestore()
      .collection('orders')
      .get()
      .then((querySnapshot) => {
        const orderList = [];
        querySnapshot.forEach((snapshot) => {
          const user = auth().currentUser;
          if (snapshot.data().UserId == user.uid) {
            orderList.push({id: snapshot.id, data: snapshot.data()});
          }
        });
        this.setState({orders: orderList, isLoading: false});
      })
      .catch((error) => console.log(error));
  }

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
        this.fetchData();

        this.props.navigation.navigate('TrackScreen', {
          orderId,
        });
      });
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'skyblue',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              top: 20,
              left: 5,
              position: 'absolute',
              zIndex: 1,
              margin: 15,
            }}>
            <TouchableOpacity
              onPress={() => {
                if (this.props.navigation.canGoBack()) {
                  this.props.navigation.goBack();
                } else {
                  this.props.navigation.replace('MapNavigation');
                }
              }}>
              <Icon name="arrow-back" size={30} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={{fontSize: 24}}>Find your previous orders</Text>
        </View>
        <View style={{flex: 5}}>
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={this._onRefresh.bind(this)}
              />
            }>
            {this.state.isLoading ? (
              <View style={styles.loader}>
                <ActivityIndicator></ActivityIndicator>
              </View>
            ) : (
              <View></View>
            )}

            <View style={styles.flatlist}>
              <FlatList
                data={this.state.orders}
                keyExtractor={(item, index) => item.data.PlacingTime.toString()}
                refreshing={true}
                initialNumToRender={5}
                windowSize={5}
                maxToRenderPerBatch={5}
                renderItem={({item, index}) => {
                  //<this.Item item={item}
                  const pickUpTime = item.data.PickUpTime.toDate();
                  const dropOffTime = item.data.DropOffTime.toDate();
                  return (
                    <View style={styles.item}>
                      <TouchableOpacity
                        onPress={() => {
                          if (!item.data.Status) {
                            // this.props.navigation.navigate('PaymentScreen', {
                            //   orderId: item.id,
                            //   price: item.data.Price,
                            //   weight: item.data.Weight,
                            //   machineType: item.data.MachineType,
                            // });
                            this.pay(item.id);
                            console.log(item.id);
                          } else {
                            this.props.navigation.navigate('TrackScreen', {
                              orderId: item.id,
                            });
                          }
                        }}>
                        <View style={{flexDirection: 'row'}}>
                          {
                            //drone = 0, robot = 1
                            !item.data.MachineType ? (
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
                              style={styles.texts}>{`Drop off at: ${formatDate(
                              dropOffTime,
                            )}, ${formatTime(dropOffTime)}`}</Text>
                            <Text
                              style={styles.texts}>{`Pick up at: ${formatDate(
                              pickUpTime,
                            )}, ${formatTime(pickUpTime)}`}</Text>
                            <View style={{flexDirection: 'row'}}>
                              <View>
                                <Text
                                  style={
                                    styles.texts
                                  }>{`Weight: ${item.data.Weight} lbs`}</Text>
                                <Text
                                  style={{
                                    color: 'white',
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                  }}>{`$${(item.data.Price / 100).toPrecision(
                                  3,
                                )}`}</Text>
                              </View>
                              {!item.data.Status ? (
                                <View
                                  style={{
                                    borderColor: 'white',
                                    borderWidth: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                  }}>
                                  <Text style={styles.texts}>
                                    Click to Finish Payment
                                  </Text>
                                </View>
                              ) : (
                                <View></View>
                              )}
                            </View>
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
    backgroundColor: '#fff',
  },
  body: {
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
    position: 'absolute',
  },
  header: {
    fontWeight: 'bold',
    fontSize: 32,
    color: 'white',
  },
  texts: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btn: {
    zIndex: 1,
    bottom: 0,
    width: Dimensions.get('window').width,
    position: 'absolute',
    color: 'black',
  },
  flatlist: {
    width: Dimensions.get('window').width,
    flex: 3,
  },
  loader: {
    backgroundColor: '#fff5',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  item: {
    marginTop: 15,
    backgroundColor: '#3498db',
    padding: 15,
    // marginVertical: 15,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
