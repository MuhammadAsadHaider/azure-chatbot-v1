import React, { useState } from 'react';
import styled from 'styled-components';
import { ChatInterface } from './components/ChatInterface';
import { Configuration } from './components/Configuration';
import { GlobalStyle } from './styles/GlobalStyle';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    font-size: 2.2rem;
    color: #2c3e50;
    margin-bottom: 10px;
  }
`;

function App() {
  const [sessionActive, setSessionActive] = useState(false);
  const [config, setConfig] = useState({
    region: 'westus2',
    apiKey: '',
    openaiEndpoint: '',
    openaiApiKey: '',
    openaiDeploymentName: '',
    ttsVoice: 'en-US-AvaMultilingualNeural',
    avatarCharacter: 'lisa',
    avatarStyle: 'casual-sitting',
    customVoiceEndpointId: '',
    personalVoiceSpeakerProfileID: '',
    continuousConversation: false,
    showSubtitles: false,
    customizedAvatar: false,
    autoReconnect: true,
    useLocalVideoForIdle: false,
    sttLocales: 'en-US,de-DE,es-ES,fr-FR,it-IT,ja-JP,ko-KR,zh-CN',
    enablePrivateEndpoint: false,
    privateEndpoint: '',
    enableOyd: false,
    cogSearchEndpoint: '',
    cogSearchApiKey: '',
    cogSearchIndexName: '',
    systemPrompt: 'You are an AI assistant that helps people find information.'
  });
  
  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Header>
          <h1>Azure AI Talking Avatar Chat</h1>
        </Header>
        
        {!sessionActive ? (
          <Configuration 
            config={config} 
            setConfig={setConfig} 
            startSession={() => setSessionActive(true)} 
          />
        ) : (
          <ChatInterface 
            config={config} 
            endSession={() => setSessionActive(false)} 
          />
        )}
      </AppContainer>
    </>
  );
}

export default App;
