/**
 * Issue Tracker React Native App
 * IT5007 Assignment 3
 */

import React from 'react';
import IssueList from './IssueList.js';
import {SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';

export default class App extends React.Component {
  render() {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#12344d" />
        <View style={styles.hero}>
          <Text style={styles.title}>Issue Tracker Mobile</Text>
          <Text style={styles.subtitle}>
            React Native frontend for the existing GraphQL backend
          </Text>
        </View>
        <IssueList />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fb',
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#12344d',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#c8dbe7',
  },
});
