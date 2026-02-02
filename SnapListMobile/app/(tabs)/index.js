import { useState } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Linking, Modal, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import axios from 'axios';

// ⚠️ Vérifie que c'est bien ta bonne adresse Ngrok ici !
const API_URL = 'https://snaplist-api.onrender.com'; 

export default function HomeScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [vintedUrl, setVintedUrl] = useState(null);
  
  // Variables pour l'historique
  const [history, setHistory] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null); setVintedUrl(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    let localUri = image;
    let filename = localUri.split('/').pop();
    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image`;

    let formData = new FormData();
    formData.append('file', { uri: localUri, name: filename, type });

    try {
      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true'},
      });
      setResult(response.data.resultat);
      setVintedUrl(response.data.url_vinted);
    } catch (error) {
      Alert.alert("Erreur", "Serveur injoignable");
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async () => {
      try {
          const response = await axios.get(`${API_URL}/history`, {
            headers: { 'ngrok-skip-browser-warning': 'true'}
          });
          setHistory(response.data);
          setModalVisible(true);
      } catch (e) {
          Alert.alert("Erreur", "Impossible de charger l'historique");
      }
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text || result);
    Alert.alert("Copié !", "Texte dans le presse-papier.");
  };

  const openVinted = (url) => {
    const link = url || vintedUrl;
    if (link) Linking.openURL(link);
  };

  const renderHistoryItem = ({ item }) => (
      <View style={styles.historyItem}>
          <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>{item.date} à {item.heure}</Text>
              <Text style={styles.historyTitle}>{item.titre}</Text>
          </View>
          <View style={styles.historyActions}>
              <TouchableOpacity onPress={() => openVinted(item.url)} style={styles.smallBtn}>
                  <Text style={{color:'white'}}>🔍 Vinted</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => copyToClipboard(item.texte)} style={[styles.smallBtn, {backgroundColor: '#48cae4'}]}>
                  <Text style={{color:'white'}}>📋 Copier</Text>
              </TouchableOpacity>
          </View>
      </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: '#f4f6f8'}}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🛍️ SnapList Pro</Text>
          <TouchableOpacity style={styles.historyBtn} onPress={openHistory}>
              <Text style={styles.historyBtnText}>📜 Historique</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.card}>
          {image ? (
              <Image source={{ uri: image }} style={styles.image} />
          ) : (
              <TouchableOpacity onPress={pickImage} style={styles.placeholder}>
                  <Text style={styles.placeholderText}>+ Nouvelle Photo</Text>
              </TouchableOpacity>
          )}
          
          <View style={styles.btnRow}>
              <TouchableOpacity style={styles.buttonSecondary} onPress={pickImage}>
                  <Text style={styles.btnTextSec}>Refaire</Text>
              </TouchableOpacity>
              {image && !loading && (
                   <TouchableOpacity style={styles.buttonPrimary} onPress={analyzeImage}>
                      <Text style={styles.btnTextPri}>Analyser</Text>
                   </TouchableOpacity>
              )}
          </View>
        </View>

        {loading && <ActivityIndicator size="large" color="#0077b6" style={{marginTop: 20}} />}

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultHeader}>Résultat :</Text>
            <Text style={styles.resultText}>{result}</Text>
            <TouchableOpacity style={styles.vintedButton} onPress={() => openVinted()}>
              <Text style={styles.vintedButtonText}>🔍 COMPARER SUR VINTED</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.copyButton} onPress={() => copyToClipboard()}>
              <Text style={styles.copyButtonText}>📋 COPIER TEXTE</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal animationType="slide" transparent={false} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>📜 Mon Historique</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Text style={styles.closeText}>Fermer ✖</Text>
                  </TouchableOpacity>
              </View>
              <FlatList 
                  data={history}
                  renderItem={renderHistoryItem}
                  keyExtractor={item => item.id.toString()}
                  contentContainerStyle={{padding: 20}}
              />
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 60 },
  header: { marginBottom: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '800', color: '#0077b6' },
  historyBtn: { backgroundColor: '#e0f7fa', padding: 8, borderRadius: 8 },
  historyBtnText: { color: '#0077b6', fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 20, alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.1, elevation: 5 },
  image: { width: '100%', height: 250, borderRadius: 15, marginBottom: 15 },
  placeholder: { width: '100%', height: 200, backgroundColor: '#eef2f5', borderRadius: 15, marginBottom: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#dde', borderStyle: 'dashed' },
  placeholderText: { color: '#888', fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  buttonPrimary: { backgroundColor: '#0077b6', padding: 12, borderRadius: 10, flex: 1, alignItems: 'center' },
  buttonSecondary: { backgroundColor: '#eef2f5', padding: 12, borderRadius: 10, flex: 1, alignItems: 'center' },
  btnTextPri: { color: 'white', fontWeight: 'bold' },
  btnTextSec: { color: '#333', fontWeight: '600' },
  resultCard: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginTop: 20, elevation: 3, marginBottom: 40 },
  resultHeader: { fontWeight: 'bold', fontSize: 18, marginBottom: 10 },
  resultText: { fontSize: 15, lineHeight: 22, color: '#444', marginBottom: 20 },
  vintedButton: { backgroundColor: '#09b1ba', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  vintedButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  copyButton: { backgroundColor: '#48cae4', padding: 15, borderRadius: 10, alignItems: 'center' },
  copyButtonText: { color: 'white', fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: '#f4f6f8', paddingTop: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  closeText: { fontSize: 16, color: 'red', fontWeight: 'bold' },
  historyItem: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  historyHeader: { marginBottom: 10 },
  historyDate: { fontSize: 12, color: '#888' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  historyActions: { flexDirection: 'row', gap: 10 },
  smallBtn: { backgroundColor: '#09b1ba', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 5 }
});