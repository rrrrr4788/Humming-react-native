import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {TextInput, Button} from 'react-native-paper';
import auth from '@react-native-firebase/auth';

export default class SignupScreen extends React.Component {
  state = {
    email: '',
    password: '',
    confirmPassword: '',
  };
  render() {
    return (
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text
          style={{
            marginTop: 50,
            fontSize: 50,
            textAlign: 'center',
          }}>
          Sign Up
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

          <TextInput
            style={{marginTop: 10}}
            label="Confirm Password"
            secureTextEntry={true}
            keyboardType="default"
            value={this.state.confirmPassword}
            onChangeText={(text) => this.setState({confirmPassword: text})}
          />
          <Button
            onPress={() => {
              if (
                this.state.email != '' &&
                this.state.password != '' &&
                this.state.confirmPassword != '' &&
                this.state.password == this.state.confirmPassword
              ) {
                auth()
                  .createUserWithEmailAndPassword(
                    this.state.email,
                    this.state.password,
                  )
                  .then((result) => {
                    this.props.navigation.goBack();
                  })
                  .catch((error) => alert(error));
              } else {
                alert('Please provide valid credentials');
              }
            }}
            mode="contained"
            style={{marginTop: 20}}>
            Sign up Now
          </Button>

          <Button
            onPress={() => {
              this.props.navigation.goBack();
            }}
            style={{marginTop: 20}}>
            Already a user? Sign in now
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
