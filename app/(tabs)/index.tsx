import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const modos = [
  { key: 'vision_reconhecer', label: 'Reconhecer (Vision)' },
  { key: 'vision_descrever', label: 'Descrever (Vision)' },
  { key: 'vision_lerTexto', label: 'Ler Texto (Vision)' },
  { key: 'vision_tudo', label: 'Tudo (Vision)' },
  { key: 'gemini_reconhecer', label: 'Reconhecer (Gemini)' },
  { key: 'gemini_descrever', label: 'Descrever (Gemini)' },
  { key: 'gemini_lerTexto', label: 'Ler Texto (Gemini)' },
  { key: 'gemini_tudo', label: 'Tudo (Gemini)' },
];

type ResultadoTipo = {
  reconhecer?: any;
  descrever?: any;
  lerTexto?: any;
} | null;

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoTipo>(null);
  const [carregando, setCarregando] = useState(false);
  const [modoEscolhido, setModoEscolhido] = useState<string>('gemini_descrever');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResultado(null);
    }
  };

  const sendImage = async () => {
    if (!image) {
      alert('Selecione uma imagem primeiro!');
      return;
    }

    setCarregando(true);

    const formData = new FormData();
    formData.append('imagem', {
      uri: image,
      name: 'foto.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      let resReconhecer, resDescrever, resLerTexto;

      const [modelo, acao] = modoEscolhido.split('_');

      const baseURL = 'http://192.168.1.128:5000';

      const config = { timeout: 60000 };

      if (acao === 'tudo') {
        const modoGemini = modelo === 'gemini';

        [resReconhecer, resDescrever, resLerTexto] = await Promise.all([
          axios.post(`${baseURL}/analisar?modo=${modoGemini ? 'gemini' : 'vision'}`, formData, config),
          axios.post(`${baseURL}/analisar?modo=${modoGemini ? 'gemini' : 'vision'}`, formData, config),
          axios.post(`${baseURL}/ler-texto`, formData, config),
        ]);

        setResultado({
          reconhecer: resReconhecer.data,
          descrever: resDescrever.data,
          lerTexto: resLerTexto.data,
        });
      } else if (acao === 'reconhecer' || acao === 'descrever') {
        const res = await axios.post(`${baseURL}/analisar?modo=${modelo}`, formData, config);
        setResultado({ [acao]: res.data });
      } else if (acao === 'lerTexto') {
        const res = await axios.post(`${baseURL}/ler-texto`, formData, config);
        setResultado({ lerTexto: res.data });
      }
    } catch (error) {
      console.error('Erro ao enviar a imagem:', error);
      alert('Erro na requisição. Verifique o servidor ou tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>🔍 Luminus: Detecção de Objetos</Text>

      <Button title="Escolher Imagem" onPress={pickImage} />

      <View style={styles.radioContainer}>
        {modos.map((modo) => (
          <TouchableOpacity
            key={modo.key}
            style={[styles.radioButton, modoEscolhido === modo.key && styles.radioSelected]}
            onPress={() => setModoEscolhido(modo.key)}
          >
            <Text style={styles.radioLabel}>{modo.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {image && (
        <>
          <Image source={{ uri: image }} style={styles.preview} />
          <Button title="Enviar para Análise" onPress={sendImage} />
        </>
      )}

      {carregando && <ActivityIndicator size="large" color="#ef7b00" style={{ marginTop: 20 }} />}

      {resultado && (
        <View style={styles.resultado}>
          {resultado.reconhecer && (
            <>
              <Text style={styles.subtitulo}>Resultado de Reconhecimento:</Text>
              <Text>{resultado.reconhecer[0]?.objeto || JSON.stringify(resultado.reconhecer, null, 2)}</Text>
            </>
          )}

          {resultado.descrever && (
            <>
              <Text style={styles.subtitulo}>Objetos Detectados:</Text>
              {resultado.descrever.labels?.map((item: any, idx: any) => (
                <Text key={idx}>• {item.objeto} ({Math.round(item.confianca * 100)}%)</Text>
              ))}
              <Text style={styles.subtitulo}>Referências Web:</Text>
              {resultado.descrever.web_entities?.map((item: any, idx: any) => (
                <Text key={idx}>• {item.descricao} ({Math.round(item.score * 100)}%)</Text>
              ))}
            </>
          )}

          {resultado.lerTexto && (
            <>
              <Text style={styles.subtitulo}>Texto Detectado:</Text>
              <Text>{resultado.lerTexto.texto}</Text>
            </>
          )}
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
  radioContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  radioButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ef7b00',
    borderRadius: 20,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  radioSelected: {
    backgroundColor: '#ef7b00',
  },
  radioLabel: {
    color: '#000',
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