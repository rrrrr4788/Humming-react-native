import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  FlatList,
  UIManager,
  Keyboard,
  Dimensions,
} from 'react-native';
import {
  TextInput,
  Button,
  FAB,
  Dialog,
  Portal,
  Provider,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import {Icon} from 'react-native-elements';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';

Keyboard.dismiss();
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default class ProfileScreen extends React.Component {
  state = {
    email: '',
    password: '',
    userName: '',
    passwordForVerification: '',
    isLoggedIn: false,
    usernamePosition: 'down',
    addressPosition: 'down',
    phonenumberPosition: 'down',
    updatePosition: 'down',
    userAddresses: [],
    visible: false,
    currentAdd: '',
    user: null,
    isLoading: true,
  };

  componentDidMount() {
    this.getUser();
  }

  getUser() {
    auth().onAuthStateChanged((result) => {
      console.log(result);
      // console.log(result.displayName);
      if (result) {
        // if (this.props.navigation.canGoBack()) {
        //   // console.log('going back');
        //   // this.props.navigation.goBack();
        // } else {
        //   console.log('login');
        //   this.props.navigation.navigate('LoginScreen');
        // }
        // this.user = result;
        this.setState({user: result, userName: result.displayName}, () =>
          this.fetchData(),
        );
      } else {
        this.props.navigation.navigate('LoginScreen');
      }
      // console.log(user);
    });

    // this.fetchData();
  }

  async fetchData() {
    firestore()
      .collection('user')
      .doc(this.state.user.uid)
      .collection('addresses')
      .get()
      .then((querySnapshot) => {
        const addressList = [];
        querySnapshot.forEach((snapshot) => {
          addressList.push({
            id: snapshot.id,
            data: snapshot.data().address,
          });
        });
        this.setState({
          userAddresses: addressList,
          isLoading: false,
        });
      })
      .catch((error) => console.log(error));
  }

  _showDialog = () => this.setState({visible: true});

  _hideDialog = () => this.setState({visible: false});

  removeAdd = () => {
    firestore()
      .collection('user')
      .doc(this.state.user.uid)
      .collection('addresses')
      .doc(this.state.currentAdd)
      .delete()
      .then(() => this.fetchData())
      .catch((error) => console.log(error));
  };

  toggleUpdate = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'scaleXY'),
    );
    this.setState({
      updatePosition: this.state.updatePosition === 'down' ? 'up' : 'down',
    });
  };

  toggleAdd = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'scaleXY'),
    );
    this.setState({
      addressPosition: this.state.addressPosition === 'down' ? 'up' : 'down',
    });
  };

  toggleUsername = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'scaleXY'),
    );
    this.setState({
      usernamePosition: this.state.usernamePosition === 'down' ? 'up' : 'down',
    });
  };

  togglePhoneNumber = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'scaleXY'),
    );
    this.setState({
      phonenumberPosition:
        this.state.phonenumberPosition === 'down' ? 'up' : 'down',
    });
  };
  closeFilter = () => {
    Keyboard.dismiss();
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'scaleXY'),
    );
    this.setState({
      usernamePosition: 'down',
      addressPosition: 'down',
      phonenumberPosition: 'down',
      updatePosition: 'down',
    });
  };

  render() {
    return (
      <View style={styles.container}>
        {this.state.isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator></ActivityIndicator>
          </View>
        ) : (
          <View style={{flex: 1}}>
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
              {this.state.user && this.state.user.displayName ? (
                <Text style={{fontSize: 24}}>
                  Hello, {this.state.user.displayName}!
                </Text>
              ) : (
                <Text style={{fontSize: 24}}>
                  Hello, {this.state.user.email}!
                </Text>
              )}
            </View>
            <View style={{flex: 5}}>
              <TouchableOpacity
                style={styles.section}
                onPress={() => this.toggleUsername()}>
                <Text style={styles.header}>User Name</Text>
                {this.state.user && this.state.user.displayName ? (
                  <Text style={styles.texts}>
                    {this.state.user.displayName}
                  </Text>
                ) : (
                  <Text style={styles.texts}>Click to set a user name</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.section}
                onPress={() => this.togglePhoneNumber()}>
                <Text style={styles.header}>Phone Number</Text>
                {this.state.user && this.state.user.phoneNumber == null ? (
                  <Text style={styles.texts}>
                    Click to set the phone number
                  </Text>
                ) : (
                  <Text style={styles.texts}>
                    {this.state.user.phoneNumber}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.section}>
                <Text style={styles.header}>Email Address</Text>
                {this.state.user && this.state.user.email ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                    <View>
                      <Text style={styles.texts}>{this.state.user.email}</Text>
                    </View>
                    <View>
                      {this.state.user.emailVerified ? (
                        <View>
                          <Text style={{fontSize: 18, color: 'green'}}>
                            Verified
                          </Text>
                        </View>
                      ) : (
                        <View>
                          <Text style={{fontSize: 18, color: 'red'}}>
                            Not Verified
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <View></View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.section}
                onPress={() => this.toggleUpdate()}>
                <Text style={styles.header}>Update Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.section}
                onPress={() => this.toggleAdd()}>
                <Text style={styles.header}>Manage Addresses</Text>
              </TouchableOpacity>
            </View>

            <View style={{bottom: '0%', zIndex: 0}}>
              <Button
                style={{backgroundColor: 'red'}}
                mode="contained"
                onPress={() => {
                  auth()
                    .signOut()
                    .then(() => this.props.navigation.replace('MapNavigation'))
                    .catch((error) => console.log(error));
                }}>
                Sign Out
              </Button>
            </View>

            {/* User name component */}
            <View
              style={[
                styles.filter,
                this.state.usernamePosition === 'down'
                  ? styles.filter
                  : {top: 0},
              ]}>
              {/* Header */}
              <View
                style={{
                  height: '10%',
                  width: '100%',
                }}>
                <View style={{flexDirection: 'row'}}>
                  <View style={styles.icon}>
                    <TouchableOpacity style={{margin: 15}}>
                      <Icon
                        name="arrow-back"
                        size={30}
                        color="black"
                        onPress={() => {
                          this.closeFilter();
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View
                style={{
                  marginTop: 50,
                  marginHorizontal: 50,
                }}>
                <TextInput
                  style={{marginTop: 10}}
                  label="User Name"
                  keyboardType="default"
                  value={this.state.userName}
                  onChangeText={(text) =>
                    this.setState({userName: text})
                  }></TextInput>
                <Button
                  onPress={() => {
                    this.state.user
                      .updateProfile({
                        displayName: this.state.userName,
                      })
                      .then(() => {
                        console.log('changed');
                        this.closeFilter();
                        this.getUser();
                      })
                      .catch((error) => console.warn(error));
                  }}
                  mode="contained"
                  style={{marginTop: 20}}>
                  Save
                </Button>
              </View>
            </View>

            {/* Phone number component */}
            <View
              style={[
                styles.filter,
                this.state.phonenumberPosition === 'down'
                  ? styles.filter
                  : {top: 0},
              ]}>
              {/* Header */}
              <View
                style={{
                  height: '10%',
                  width: '100%',
                }}>
                <View style={{flexDirection: 'row'}}>
                  <View style={styles.icon}>
                    <TouchableOpacity style={{margin: 15}}>
                      <Icon
                        name="arrow-back"
                        size={30}
                        color="black"
                        onPress={() => {
                          this.closeFilter();
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Update pword component */}
            <View
              style={[
                styles.filter,
                this.state.updatePosition === 'down' ? styles.filter : {top: 0},
              ]}>
              {/* Header */}
              <View
                style={{
                  backgroundColor: 'white',
                  height: '10%',
                  width: '100%',
                }}>
                <View style={{flexDirection: 'row'}}>
                  <View style={styles.icon}>
                    <TouchableOpacity style={{margin: 15}}>
                      <Icon
                        name="arrow-back"
                        size={30}
                        color="black"
                        onPress={() => {
                          this.closeFilter();
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                  {/* <Text style={styles.title}>Update Password</Text> */}
                </View>
              </View>
              <View
                style={{
                  marginTop: 50,
                  marginHorizontal: 50,
                }}>
                <Text style={{color: 'gray', fontSize: 20}}>
                  Type in your current password:
                </Text>
                <TextInput
                  style={{marginTop: 10}}
                  label="Old Password"
                  keyboardType="default"
                  secureTextEntry={true}
                  value={this.state.passwordForVerification}
                  onChangeText={(text) =>
                    this.setState({passwordForVerification: text})
                  }></TextInput>
                <Button
                  onPress={() => {
                    console.log('do smth');
                  }}
                  mode="contained"
                  style={{marginTop: 20}}>
                  Next
                </Button>
              </View>
            </View>

            {/* Address component */}
            <View
              style={[
                styles.filter,
                this.state.addressPosition === 'down'
                  ? styles.filter
                  : {top: 0},
              ]}>
              {/* Header */}
              <View
                style={{
                  backgroundColor: 'black',
                  height: '10%',
                  width: '100%',
                }}>
                <View style={{flexDirection: 'row'}}>
                  <View style={styles.icon}>
                    <TouchableOpacity style={{margin: 15}}>
                      <Icon
                        name="arrow-back"
                        size={30}
                        color="white"
                        onPress={() => {
                          this.closeFilter();
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.title}>Manage Addresses</Text>
                </View>
              </View>

              <View style={styles.flatlist}>
                <FlatList
                  data={this.state.userAddresses}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({item, index}) => {
                    return (
                      <View style={styles.item}>
                        <TouchableOpacity
                          onPress={() => {
                            this._showDialog();
                            this.setState({currentAdd: item.id});
                          }}>
                          <View style={{flexDirection: 'row'}}>
                            <Text style={styles.itemTexts}>{item.id}</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  }}></FlatList>
                <Provider>
                  <Portal>
                    <Dialog
                      visible={this.state.visible}
                      onDismiss={this._hideDialog}>
                      <Dialog.Title>Alert</Dialog.Title>
                      <Dialog.Content>
                        <Paragraph>
                          Are you sure you want to permanantly delete this
                          address from your address book?
                        </Paragraph>
                      </Dialog.Content>
                      <Dialog.Actions>
                        <Button
                          onPress={() => {
                            this._hideDialog();
                            this.removeAdd();
                          }}>
                          Confirm
                        </Button>
                        <Button onPress={this._hideDialog}>Cancel</Button>
                      </Dialog.Actions>
                    </Dialog>
                  </Portal>
                </Provider>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontWeight: 'bold',
    fontSize: 24,
    color: 'black',
  },
  texts: {
    color: '#333',
    fontSize: 20,
  },
  itemTexts: {
    color: '#333',
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    paddingVertical: 25,
    marginHorizontal: 20,
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
  icon: {
    // position: 'absolute',
    borderRadius: 30,
  },
  fab: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    margin: 16,
  },
  flatlist: {
    width: Dimensions.get('window').width,
    flex: 3,
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
  loader: {
    backgroundColor: '#fff5',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  title: {
    color: 'white',
    fontSize: 25,
    // fontWeight: 'bold',
    marginTop: 15,
  },
});
