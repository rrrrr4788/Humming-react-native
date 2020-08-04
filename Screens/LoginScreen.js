import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {TextInput, Button} from 'react-native-paper';

import auth from '@react-native-firebase/auth';

export default class LoginScreen extends React.Component {
  state = {
    email: '',
    password: '',
    isLoggedIn: false,
  };

  componentDidMount() {
    // console.log(user);
  }

  resetPword = (emailAddress) => {
    auth()
      .sendPasswordResetEmail(emailAddress)
      .then(function () {
        // Email sent.
        console.log('email sent');
      })
      .catch(function (error) {
        // An error happened.
        console.warn(error);
      });
  };

  render() {
    // auth().onAuthStateChanged((result) => {
    //   console.log(result);
    //   if (result) {
    //     if (this.props.navigation.canGoBack()) {
    //       this.props.navigation.goBack();
    //     } else {
    //       this.props.navigation.replace('MapNavigation');
    //     }
    //   }
    // });
    console.log(auth().currentUser);
    if (auth().currentUser) {
      if (this.props.navigation.canGoBack()) {
        this.props.navigation.goBack();
      } else {
        this.props.navigation.replace('MapNavigation');
      }
    }
    return (
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text
          style={{
            marginTop: 50,
            fontSize: 50,
            textAlign: 'center',
          }}>
          Sign In
        </Text>
        <View
          style={{
            marginTop: 50,
            marginHorizontal: 50,
          }}>
          <TextInput
            mode="contained"
            label="Email"
            keyboardType="email-address"
            value={this.state.email}
            onChangeText={(text) => this.setState({email: text})}
          />

          <TextInput
            style={{marginTop: 10}}
            label="Password"
            keyboardType="default"
            secureTextEntry={true}
            value={this.state.password}
            onChangeText={(text) => this.setState({password: text})}
          />
          <Button
            onPress={() => {
              if (this.state.email != '' && this.state.password != '') {
                auth()
                  .signInWithEmailAndPassword(
                    this.state.email,
                    this.state.password,
                  )
                  .then((result) => {
                    //console.log(result);
                    //this.props.navigation.replace('HomeScreen');
                    if (result) {
                      if (this.props.navigation.canGoBack()) {
                        this.props.navigation.goBack();
                      } else {
                        this.props.navigation.replace('MapNavigation');
                      }
                    }
                  })
                  .catch((error) => alert(error));
              } else {
                alert('Provide information');
              }
            }}
            mode="contained"
            style={{marginTop: 20}}>
            Login Now
          </Button>

          <Button
            onPress={() => {
              if (this.state.email != '') {
                this.resetPword(this.state.email);
              } else {
                alert('Please provide your email for resetting the password.');
              }
            }}
            mode="contained"
            style={{marginTop: 20}}>
            Login Now
          </Button>

          <Button
            onPress={() => {
              this.props.navigation.navigate('SignupScreen');
            }}
            style={{marginTop: 20}}>
            New user? Sign up now
          </Button>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
