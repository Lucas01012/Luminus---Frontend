import React, {useState} from 'react'
import {View, Text, Button, Image, StyleSheet, ActivityIndicator, ScrollView} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import axios from 'axios'

export default function HomeScreen(){
  const [image, setImage] = useState <string | null>(null);
  const [resultado, setResultado] = useState<any[] | null>(null);
  const [carregando, setCarregando] = useState(false);

const pickImage = async() =>{
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });

  if (!result.canceled){
    setImage(result.assets[0].uri)
    setResultado(null)
  }
};

const sendImage = async() =>{
  if (!image) return;

  setCarregando(true);

    const formData = new FormData();
    formData.append("imagem", {
      uri: image,
      name: "foto.jpg",
      type: "image/jpeg",
    } as any); // TypeScript dá uma leve surtada aqui, o `as any` resolve por enquanto

    try{
      const res = await axios.post("http://192.168.0.183:5000/analisar", formData,{
        headers: {
          "Content-Type":"multipart/form-data"
        },
      });

      setResultado(res.data);
    }catch(error){
      console.error("Deu pau KKKKKKKKKK:", error);
    }

    setCarregando(false);
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>🔍 Luminus: Detecção de Objetos</Text>

      <Button title="Escolher Imagem" onPress={pickImage} />

      {image && (
        <>
          <Image source={{ uri: image }} style={styles.preview} />
          <Button title="Enviar para Análise" onPress={sendImage} />
        </>
      )}

      {carregando && <ActivityIndicator size="large" color="#ef7b00" style={{ marginTop: 20 }} />}

      {resultado && (
        <View style={styles.resultado}>
          <Text style={styles.subtitulo}>Resultado:</Text>
          {resultado.map((obj, idx) => (
            <Text key={idx}>• {obj.objeto} ({(obj.confianca * 100).toFixed(1)}%)</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  preview: {
    width: 250,
    height: 250,
    marginVertical: 20,
    borderRadius: 8,
  },
  resultado: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    width: '100%',
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});