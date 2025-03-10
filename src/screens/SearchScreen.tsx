import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Search'>;

interface SearchResult {
  username: string;
  followers_count: number;
  is_live: boolean;
  verified: boolean;
}

export default function SearchScreen() {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchChannels = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("https://search.kick.com/multi_search", {
        method: "POST",
        headers: {
          "content-type": "text/plain;charset=UTF-8",
          "x-typesense-api-key": "nXIMW0iEN6sMujFYjFuhdrSwVow3pDQu"
        },
        body: JSON.stringify({
          searches: [
            { preset: "category_search", q: query },
            { preset: "channel_search", q: query }
          ]
        })
      });

      const data = await response.json();
      
      // Extract channel results from the response
      const channelResults = data.results[1].hits.map((hit: any) => ({
        username: hit.document.username,
        followers_count: hit.document.followers_count,
        is_live: hit.document.is_live,
        verified: hit.document.verified
      }));

      setResults(channelResults);
    } catch (err) {
      setError('Failed to search channels');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('Stream', { username: item.username })}
    >
      <View style={styles.resultContent}>
        <Text style={[styles.username, { color: colors.text }]}>
          {item.username}
          {item.verified && ' ✓'}
        </Text>
        <Text style={[styles.followers, { color: colors.tertiaryText }]}>
          {item.followers_count.toLocaleString()} followers
        </Text>
        {item.is_live && (
          <View style={[styles.liveIndicator, { backgroundColor: colors.error }]}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.background }]}>
          <Ionicons 
            name="search" 
            size={20} 
            color={colors.tertiaryText}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search channels..."
            placeholderTextColor={colors.tertiaryText}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchChannels(text);
            }}
            returnKeyType="search"
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setResults([]);
              }}
              style={styles.clearButton}
            >
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={colors.tertiaryText}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.username}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searchQuery ? (
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                No results found
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  list: {
    padding: 10,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultContent: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  followers: {
    fontSize: 12,
  },
  liveIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
}); 