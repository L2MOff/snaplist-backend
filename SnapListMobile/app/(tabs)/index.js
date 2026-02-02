import { useState } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, ScrollView, Alert, TouchableOpacity, TextInput, Modal, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; // Pour les icônes sympas

// 👇 METS TON LIEN RENDER ICI (Sans le slash à la fin)
const API_URL = 'https://snaplist-api.onrender.com'; 

export default function HomeScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // On stocke les données structurées ici
  const [data, setData] = useState(null);
  
  // Onglet actif : 'vinted' ou 'leboncoin'
  const [platform, setPlatform] = useState('vinted');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setData(null); // On reset les anciennes données
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
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // On reçoit le JSON propre du serveur
      setData(response.data);
    } catch (error) {
      Alert.alert("Oups", "Erreur d'analyse. Vérifie que le serveur Render est VERT (Live).");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copié ! ✅", `${label} est dans ton presse-papier.`);
  };

  // Fonction pour ouvrir les applis
  const openApp = (appUrl, webUrl) => {
    Linking.canOpenURL(appUrl).then(supported => {
      if (supported) {
        Linking.openURL(appUrl);
      } else {
        Linking.openURL(webUrl);
      }
    });
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>⚡ SnapList Pro</Text>
        </View>

        {/* Zone Photo */}
        <View style={styles.card}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <TouchableOpacity onPress={pickImage} style={styles.placeholder}>
              <Ionicons name="camera-outline" size={50} color="#888" />
              <Text style={styles.placeholderText}>Prendre une photo</Text>
            </TouchableOpacity>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnSec} onPress={pickImage}>
              <Text style={styles.btnTextSec}>Refaire</Text>
            </TouchableOpacity>
            {image && !loading && (
               <TouchableOpacity style={styles.btnPri} onPress={analyzeImage}>
                  <Text style={styles.btnTextPri}>🚀 Analyser</Text>
               </TouchableOpacity>
            )}
          </View>
        </View>

        {loading && <ActivityIndicator size="large" color="#09b1ba" style={{marginTop: 30}} />}

        {/* Zone de Résultat (S'affiche seulement si on a des données) */}
        {data && (
          <View style={styles.resultSection}>
            
            {/* Prix Estimé */}
            <View style={styles.priceTag}>
                <Text style={styles.priceLabel}>Estimation</Text>
                <Text style={styles.priceValue}>{data.prix_estime} €</Text>
            </View>

            {/* Sélecteur de Plateforme */}
            <View style={styles.tabs}>
                <TouchableOpacity onPress={() => setPlatform('vinted')} style={[styles.tab, platform === 'vinted' && styles.activeTabVinted]}>
                    <Text style={[styles.tabText, platform === 'vinted' && {color:'white'}]}>Vinted</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPlatform('leboncoin')} style={[styles.tab, platform === 'leboncoin' && styles.activeTabLBC]}>
                    <Text style={[styles.tabText, platform === 'leboncoin' && {color:'white'}]}>Leboncoin</Text>
                </TouchableOpacity>
            </View>

            {/* Formulaire de Vente */}
            <View style={styles.formCard}>
                <Text style={styles.label}>Titre de l'annonce :</Text>
                <View style={styles.inputGroup}>
                    <TextInput 
                        style={styles.input} 
                        value={platform === 'vinted' ? data.titre_vinted : data.titre_leboncoin}
                        multiline
                    />
                    <TouchableOpacity style={styles.copyBtn} onPress={() => copyToClipboard(platform === 'vinted' ? data.titre_vinted : data.titre_leboncoin, "Titre")}>
                        <Ionicons name="copy-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Description :</Text>
                <View style={styles.inputGroup}>
                    <TextInput 
                        style={[styles.input, {height: 100}]} 
                        value={data.description}
                        multiline
                    />
                    <TouchableOpacity style={styles.copyBtn} onPress={() => copyToClipboard(data.description, "Description")}>
                        <Ionicons name="copy-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Hashtags (Seulement pour Vinted) */}
                {platform === 'vinted' && (
                    <>
                    <Text style={styles.label}>Hashtags :</Text>
                    <TouchableOpacity onPress={() => copyToClipboard(data.hashtags, "Hashtags")}>
                        <Text style={styles.hashtags}>{data.hashtags}</Text>
                    </TouchableOpacity>
                    </>
                )}

                {/* Bouton d'action final */}
                <TouchableOpacity 
                    style={[styles.actionBtn, {backgroundColor: platform === 'vinted' ? '#09b1ba' : '#f56b2a'}]}
                    onPress={() => platform === 'vinted' ? openApp('vinted://', 'https://www.vinted.fr') : openApp('leboncoin://', 'https://www.leboncoin.fr')}
                >
                    <Text style={styles.actionBtnText}>Ouvrir {platform === 'vinted' ? 'Vinted' : 'Leboncoin'}</Text>
                    <Ionicons name="open-outline" size={24} color="white" />
                </TouchableOpacity>

            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f0f2f5' },
  scrollContainer: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 20, alignItems: 'center' },
  appTitle: { fontSize: 26, fontWeight: '900', color: '#1a1a1a' },
  
  card: { backgroundColor: 'white', padding: 15, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  image: { width: '100%', height: 250, borderRadius: 15, marginBottom: 15 },
  placeholder: { width: '100%', height: 200, backgroundColor: '#e9ecef', borderRadius: 15, marginBottom: 15, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#ced4da' },
  placeholderText: { color: '#adb5bd', marginTop: 10, fontWeight: '600' },
  
  btnRow: { flexDirection: 'row', gap: 10 },
  btnPri: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, flex: 1, alignItems: 'center' },
  btnSec: { backgroundColor: '#f1f3f5', padding: 15, borderRadius: 12, flex: 1, alignItems: 'center' },
  btnTextPri: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  btnTextSec: { color: '#1a1a1a', fontWeight: '600', fontSize: 16 },

  resultSection: { marginTop: 30 },
  priceTag: { alignSelf: 'center', backgroundColor: '#d4edda', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 30, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#c3e6cb' },
  priceLabel: { color: '#155724', fontWeight: '600', fontSize: 12, textTransform: 'uppercase' },
  priceValue: { color: '#155724', fontWeight: 'bold', fontSize: 28 },

  tabs: { flexDirection: 'row', backgroundColor: '#e9ecef', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTabVinted: { backgroundColor: '#09b1ba', shadowColor: "#000", shadowOpacity: 0.1, elevation: 2 },
  activeTabLBC: { backgroundColor: '#f56b2a', shadowColor: "#000", shadowOpacity: 0.1, elevation: 2 },
  tabText: { fontWeight: 'bold', color: '#868e96' },

  formCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.05, elevation: 2 },
  label: { fontWeight: '700', marginBottom: 8, color: '#343a40', marginTop: 10 },
  inputGroup: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f8f9fa', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e9ecef', fontSize: 16, color: '#212529' },
  copyBtn: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, justifyContent: 'center' },
  
  hashtags: { color: '#09b1ba', fontWeight: '600', marginTop: 5, marginBottom: 15 },
  
  actionBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 20, gap: 10 },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});