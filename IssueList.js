import React from 'react';
import {Row, Table} from 'react-native-table-component';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const dateRegex = new RegExp('^\\d\\d\\d\\d-\\d\\d-\\d\\d');
const inputDateRegex = new RegExp('^\\d{4}-\\d{2}-\\d{2}$');

const GRAPHQL_URL = Platform.select({
  android: 'http://10.0.2.2:3000/graphql',
  ios: 'http://localhost:3000/graphql',
  default: 'http://localhost:3000/graphql',
});

const tableWidths = [44, 82, 98, 110, 74, 110, 220];

function jsonDateReviver(key, value) {
  if (typeof value === 'string' && dateRegex.test(value)) return new Date(value);
  return value;
}

function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

async function graphQLFetch(query, variables = {}) {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query, variables}),
    });
    const body = await response.text();
    const result = JSON.parse(body, jsonDateReviver);

    if (result.errors) {
      const error = result.errors[0];
      if (error.extensions?.code === 'BAD_USER_INPUT') {
        const details =
          error.extensions?.exception?.errors?.join('\n') ||
          'Please check your input values.';
        Alert.alert('Validation Error', `${error.message}\n${details}`);
      } else {
        Alert.alert(
          'Server Error',
          `${error.extensions?.code || 'GRAPHQL_ERROR'}: ${error.message}`,
        );
      }
      return null;
    }

    return result.data;
  } catch (e) {
    Alert.alert(
      'Connection Error',
      `Cannot reach ${GRAPHQL_URL}. Make sure the backend is running on port 3000.\n\n${e.message}`,
    );
    return null;
  }
}

class IssueFilter extends React.Component {
  render() {
    return (
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>IssueFilter Dummy Component</Text>
        <Text style={styles.filterText}>
          This placeholder mirrors the web version. The mobile app currently
          shows all issues from the backend.
        </Text>
      </View>
    );
  }
}

function IssueRow(props) {
  const {issue} = props;
  const rowData = [
    issue.id,
    issue.status,
    issue.owner || '-',
    formatDate(issue.created),
    issue.effort ?? '-',
    formatDate(issue.due),
    issue.title,
  ];

  return (
    <Row
      data={rowData}
      widthArr={tableWidths}
      style={styles.row}
      textStyle={styles.rowText}
    />
  );
}

function IssueTable(props) {
  const {issues, loading} = props;
  const tableHead = ['ID', 'Status', 'Owner', 'Created', 'Effort', 'Due', 'Title'];

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#1d4d6b" />
        <Text style={styles.helperText}>Loading issues from GraphQL...</Text>
      </View>
    );
  }

  if (!issues.length) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No issues found</Text>
        <Text style={styles.helperText}>
          Add a new issue from the Add tab, then refresh the list.
        </Text>
      </View>
    );
  }

  const issueRows = issues.map(issue => <IssueRow key={issue.id} issue={issue} />);

  return (
    <View style={styles.tableCard}>
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
        <View>
          <Table borderStyle={styles.tableBorder}>
            <Row
              data={tableHead}
              widthArr={tableWidths}
              style={styles.header}
              textStyle={styles.headerText}
            />
          </Table>
          <ScrollView style={styles.tableDataWrapper} nestedScrollEnabled={true}>
            <Table borderStyle={styles.tableBorder}>{issueRows}</Table>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

class IssueAdd extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      owner: '',
      title: '',
      effort: '',
      due: '',
      submitting: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit() {
    const owner = this.state.owner.trim();
    const title = this.state.title.trim();
    const effort = this.state.effort.trim();
    const due = this.state.due.trim();

    if (!title) {
      Alert.alert('Missing Title', 'Please enter an issue title.');
      return;
    }

    if (due && !inputDateRegex.test(due)) {
      Alert.alert('Invalid Due Date', 'Use the format YYYY-MM-DD.');
      return;
    }

    const issue = {
      owner,
      title,
      status: 'New',
    };

    if (effort) {
      const numericEffort = Number.parseInt(effort, 10);
      if (Number.isNaN(numericEffort) || numericEffort < 0) {
        Alert.alert('Invalid Effort', 'Effort should be a non-negative integer.');
        return;
      }
      issue.effort = numericEffort;
    }

    if (due) {
      issue.due = due;
    }

    this.setState({submitting: true});
    const success = await this.props.createIssue(issue);
    this.setState({submitting: false});

    if (success) {
      this.setState({
        owner: '',
        title: '',
        effort: '',
        due: '',
      });
      Alert.alert('Success', 'Issue added successfully.');
    }
  }

  render() {
    return (
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add Issue</Text>
        <TextInput
          style={styles.input}
          placeholder="Owner"
          value={this.state.owner}
          onChangeText={owner => this.setState({owner})}
        />
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={this.state.title}
          onChangeText={title => this.setState({title})}
        />
        <TextInput
          style={styles.input}
          placeholder="Effort"
          value={this.state.effort}
          onChangeText={effort => this.setState({effort})}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Due Date (YYYY-MM-DD)"
          value={this.state.due}
          onChangeText={due => this.setState({due})}
          autoCapitalize="none"
        />
        <Pressable
          style={[
            styles.primaryButton,
            this.state.submitting && styles.buttonDisabled,
          ]}
          onPress={this.handleSubmit}
          disabled={this.state.submitting}>
          <Text style={styles.primaryButtonText}>
            {this.state.submitting ? 'Adding...' : 'Add Issue'}
          </Text>
        </Pressable>
      </View>
    );
  }
}

class BlackList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nameInput: '',
      submitting: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit() {
    const nameInput = this.state.nameInput.trim();
    if (!nameInput) {
      Alert.alert('Missing Owner', 'Please enter an owner name to blacklist.');
      return;
    }

    const query = `mutation addToBlacklist($nameInput: String!) {
      addToBlacklist(nameInput: $nameInput)
    }`;

    this.setState({submitting: true});
    const data = await graphQLFetch(query, {nameInput});
    this.setState({submitting: false});

    if (data) {
      this.setState({nameInput: ''});
      Alert.alert('BlackList Updated', `${nameInput} has been added.`);
    }
  }

  render() {
    return (
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>BlackList Owner</Text>
        <Text style={styles.helperText}>
          This writes to the backend blacklist collection. The existing backend
          does not block issue creation automatically.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Owner name"
          value={this.state.nameInput}
          onChangeText={nameInput => this.setState({nameInput})}
        />
        <Pressable
          style={[
            styles.secondaryButton,
            this.state.submitting && styles.buttonDisabled,
          ]}
          onPress={this.handleSubmit}
          disabled={this.state.submitting}>
          <Text style={styles.secondaryButtonText}>
            {this.state.submitting ? 'Saving...' : 'Add to BlackList'}
          </Text>
        </Pressable>
      </View>
    );
  }
}

export default class IssueList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      issues: [],
      loading: true,
      activeTab: 'issues',
    };
    this.createIssue = this.createIssue.bind(this);
    this.loadData = this.loadData.bind(this);
  }

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    this.setState({loading: true});
    const query = `query {
      issueList {
        id
        title
        status
        owner
        created
        effort
        due
      }
    }`;

    const data = await graphQLFetch(query);
    if (data) {
      this.setState({issues: data.issueList, loading: false});
    } else {
      this.setState({loading: false});
    }
  }

  async createIssue(issue) {
    const query = `mutation issueAdd($issue: IssueInputs!) {
      issueAdd(issue: $issue) {
        id
      }
    }`;

    const data = await graphQLFetch(query, {issue});
    if (data) {
      await this.loadData();
      this.setState({activeTab: 'issues'});
      return true;
    }
    return false;
  }

  renderTabButton(key, label) {
    const isActive = this.state.activeTab === key;
    return (
      <Pressable
        key={key}
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => this.setState({activeTab: key})}>
        <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  renderActivePanel() {
    if (this.state.activeTab === 'add') {
      return <IssueAdd createIssue={this.createIssue} />;
    }

    if (this.state.activeTab === 'blacklist') {
      return <BlackList />;
    }

    return <IssueTable issues={this.state.issues} loading={this.state.loading} />;
  }

  render() {
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <IssueFilter />

        <View style={styles.toolbar}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <View style={styles.tabRow}>
              {this.renderTabButton('issues', 'Issues')}
              {this.renderTabButton('add', 'Add')}
              {this.renderTabButton('blacklist', 'BlackList')}
            </View>
          </ScrollView>
          <Pressable style={styles.refreshButton} onPress={this.loadData}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </Pressable>
        </View>

        {this.renderActivePanel()}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 28,
  },
  filterCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#eef6fb',
    borderWidth: 1,
    borderColor: '#c8e0ed',
  },
  filterTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#153b53',
    marginBottom: 6,
  },
  filterText: {
    color: '#34576d',
    lineHeight: 20,
  },
  toolbar: {
    marginTop: 14,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ecf0f3',
    marginRight: 10,
  },
  tabButtonActive: {
    backgroundColor: '#1d4d6b',
  },
  tabButtonText: {
    color: '#355062',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#dcecf4',
  },
  refreshButtonText: {
    color: '#174663',
    fontWeight: '700',
  },
  tableCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7e2ea',
  },
  tableBorder: {
    borderWidth: 1,
    borderColor: '#d3dce3',
  },
  header: {
    height: 48,
    backgroundColor: '#1d4d6b',
  },
  headerText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  tableDataWrapper: {
    maxHeight: 360,
  },
  row: {
    minHeight: 46,
    backgroundColor: '#f8fbfd',
  },
  rowText: {
    textAlign: 'center',
    color: '#223746',
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  formCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7e2ea',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#183d54',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7d5de',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fbfdfe',
    marginBottom: 12,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1d4d6b',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#d96345',
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  centerBox: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7e2ea',
    alignItems: 'center',
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7e2ea',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#183d54',
    marginBottom: 8,
  },
  helperText: {
    color: '#547183',
    textAlign: 'center',
    lineHeight: 20,
  },
});
