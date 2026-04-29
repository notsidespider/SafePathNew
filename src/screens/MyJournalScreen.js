/**
 * My Journal Screen
 * Encrypted journal for documenting incidents
 * Simple text entries with date/time
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES } from '../constants';
import { DatabaseService } from '../services/DatabaseService';

const MyJournalScreen = () => {
  const [entries, setEntries] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryText, setEntryText] = useState('');
  const [entryTitle, setEntryTitle] = useState('');

  useEffect(() => {
    loadEntries();
    initializeJournalTable();
  }, []);

  const initializeJournalTable = async () => {
    try {
      await DatabaseService.db.executeSql(`
        CREATE TABLE IF NOT EXISTS journal_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error) {
      console.error('Journal table creation error:', error);
    }
  };

  const loadEntries = async () => {
    try {
      await initializeJournalTable();
      const results = await DatabaseService.db.executeSql(
        'SELECT * FROM journal_entries ORDER BY created_at DESC'
      );
      const loadedEntries = results[0].rows.raw();
      setEntries(loadedEntries);
    } catch (error) {
      console.error('Load entries error:', error);
      setEntries([]);
    }
  };

  const handleAddEntry = () => {
    setEntryTitle('');
    setEntryText('');
    setShowAddModal(true);
  };

  const saveEntry = async () => {
    if (!entryText.trim()) {
      Alert.alert('Error', 'Please enter some text for your journal entry');
      return;
    }

    try {
      await DatabaseService.db.executeSql(
        'INSERT INTO journal_entries (title, content) VALUES (?, ?)',
        [entryTitle.trim() || 'Untitled Entry', entryText.trim()]
      );

      setShowAddModal(false);
      setEntryTitle('');
      setEntryText('');
      loadEntries();
      Alert.alert('Saved', 'Journal entry saved successfully');
    } catch (error) {
      console.error('Save entry error:', error);
      Alert.alert('Error', 'Failed to save journal entry');
    }
  };

  const viewEntry = (entry) => {
    setSelectedEntry(entry);
    setShowViewModal(true);
  };

  const deleteEntry = (entry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.db.executeSql(
                'DELETE FROM journal_entries WHERE id = ?',
                [entry.id]
              );
              setShowViewModal(false);
              loadEntries();
              Alert.alert('Deleted', 'Journal entry deleted');
            } catch (error) {
              console.error('Delete entry error:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEntryPreview = (content) => {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Journal</Text>
          <Text style={styles.subtitle}>
            {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} • Private & Encrypted
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddEntry}>
          <Icon name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Entries List */}
      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="book-open-variant" size={80} color={COLORS.lightGray} />
          <Text style={styles.emptyTitle}>No Journal Entries</Text>
          <Text style={styles.emptyText}>
            Document incidents safely and privately.{'\n'}
            Your entries are encrypted.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddEntry}>
            <Icon name="plus-circle" size={24} color={COLORS.white} />
            <Text style={styles.emptyButtonText}>Create First Entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryCard}
              onPress={() => viewEntry(entry)}
              activeOpacity={0.7}
            >
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>
                  {entry.title || 'Untitled Entry'}
                </Text>
                <Icon name="chevron-right" size={20} color={COLORS.gray} />
              </View>
              <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
              <Text style={styles.entryPreview}>{getEntryPreview(entry.content)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Icon name="shield-lock" size={20} color={COLORS.primary} />
        <Text style={styles.infoText}>
          All journal entries are encrypted and stored locally on your device only.
        </Text>
      </View>

      {/* Add Entry Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Journal Entry</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder="Title (optional)"
              value={entryTitle}
              onChangeText={setEntryTitle}
              autoCapitalize="sentences"
            />

            <TextInput
              style={styles.contentInput}
              placeholder="What happened? Write down the details..."
              value={entryText}
              onChangeText={setEntryText}
              multiline
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEntry}
              >
                <Icon name="check" size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Entry Modal */}
      <Modal visible={showViewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedEntry?.title || 'Untitled Entry'}
              </Text>
              <TouchableOpacity onPress={() => setShowViewModal(false)}>
                <Icon name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.viewDate}>
              {selectedEntry && formatDate(selectedEntry.created_at)}
            </Text>

            <ScrollView style={styles.viewContent}>
              <Text style={styles.viewText}>{selectedEntry?.content}</Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => deleteEntry(selectedEntry)}
              >
                <Icon name="delete" size={20} color={COLORS.white} />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setShowViewModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  subtitle: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
  },
  entryCard: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.margin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    flex: 1,
  },
  entryDate: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginBottom: 8,
  },
  entryPreview: {
    fontSize: SIZES.body,
    color: COLORS.darkGray,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 3,
  },
  emptyTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: SIZES.margin * 2,
    marginBottom: SIZES.margin,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.margin * 2,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: SIZES.body,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: SIZES.padding,
    marginHorizontal: SIZES.margin,
    marginBottom: SIZES.margin,
    borderRadius: SIZES.radius,
  },
  infoText: {
    flex: 1,
    marginLeft: SIZES.margin,
    fontSize: SIZES.caption,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
    padding: SIZES.padding * 2,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.margin * 2,
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    fontSize: SIZES.body,
    marginBottom: SIZES.margin,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    fontSize: SIZES.body,
    minHeight: 200,
    marginBottom: SIZES.margin,
  },
  viewDate: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginBottom: SIZES.margin * 2,
  },
  viewContent: {
    maxHeight: 400,
    marginBottom: SIZES.margin * 2,
  },
  viewText: {
    fontSize: SIZES.body,
    color: COLORS.darkGray,
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.radius,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  cancelButtonText: {
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: COLORS.background,
  },
  closeButtonText: {
    color: COLORS.darkGray,
    fontWeight: '600',
  },
});

export default MyJournalScreen;
