import React, { useState } from 'react';
import styled from 'styled-components';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

const ConfigContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: ${props => props.$isOpen ? '15px' : '5px'};
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
  
  h2 {
    margin: 0;
    font-size: 1.3rem;
    color: #2c3e50;
  }
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const StartButton = styled.button`
  background-color: #2ecc71;
  padding: 12px 24px;
  font-size: 1.1rem;
  
  &:hover {
    background-color: #27ae60;
  }
`;

const Checkbox = styled.div`
  margin-bottom: 15px;
  
  input {
    margin-right: 8px;
    width: auto;
  }
  
  label {
    display: inline-block;
    margin-bottom: 0;
  }
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Configuration = ({ config, setConfig, startSession }) => {
  const [openSections, setOpenSections] = useState({
    speech: true,
    openai: false,
    cogSearch: false,
    avatar: false,
    stt_tts: false
  });
  
  const toggleSection = (section) => {
    setOpenSections({
      ...openSections,
      [section]: !openSections[section]
    });
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    startSession();
  };
  
  return (
    <ConfigContainer>
      <form onSubmit={handleSubmit}>
        <Section>
          <SectionHeader $isOpen={openSections.speech} onClick={() => toggleSection('speech')}>
            {openSections.speech ? <FiChevronDown /> : <FiChevronRight />}
            <h2>Azure Speech Resource</h2>
          </SectionHeader>
          
          {openSections.speech && (
            <Grid>
              <FormGroup>
                <label htmlFor="region">Region</label>
                <select 
                  id="region" 
                  name="region" 
                  value={config.region} 
                  onChange={handleChange}
                >
                  <option value="westus2">West US 2</option>
                  <option value="westeurope">West Europe</option>
                  <option value="southeastasia">Southeast Asia</option>
                  <option value="southcentralus">South Central US</option>
                  <option value="northeurope">North Europe</option>
                  <option value="swedencentral">Sweden Central</option>
                  <option value="eastus2">East US 2</option>
                </select>
              </FormGroup>
              
              <FormGroup>
                <label htmlFor="apiKey">API Key</label>
                <input 
                  type="password" 
                  id="apiKey" 
                  name="apiKey" 
                  value={config.apiKey} 
                  onChange={handleChange} 
                  required
                />
              </FormGroup>
              
              <Checkbox>
                <input 
                  type="checkbox" 
                  id="enablePrivateEndpoint" 
                  name="enablePrivateEndpoint" 
                  checked={config.enablePrivateEndpoint} 
                  onChange={handleChange} 
                />
                <label htmlFor="enablePrivateEndpoint">Enable Private Endpoint</label>
              </Checkbox>
              
              {config.enablePrivateEndpoint && (
                <FormGroup>
                  <label htmlFor="privateEndpoint">Private Endpoint</label>
                  <input 
                    type="text" 
                    id="privateEndpoint" 
                    name="privateEndpoint" 
                    value={config.privateEndpoint} 
                    onChange={handleChange} 
                    placeholder="https://{your custom name}.cognitiveservices.azure.com/" 
                  />
                </FormGroup>
              )}
            </Grid>
          )}
        </Section>
        
        <Section>
          <SectionHeader $isOpen={openSections.stt_tts} onClick={() => toggleSection('stt_tts')}>
            {openSections.stt_tts ? <FiChevronDown /> : <FiChevronRight />}
            <h2>STT / TTS Configuration</h2>
          </SectionHeader>
          
          {openSections.stt_tts && (
            <Grid>
              <FormGroup>
                <label htmlFor="sttLocales">STT Locale(s)</label>
                <input 
                  type="text" 
                  id="sttLocales" 
                  name="sttLocales" 
                  value={config.sttLocales} 
                  onChange={handleChange} 
                  placeholder="e.g., en-US,fr-FR,de-DE"
                />
              </FormGroup>
              
              <FormGroup>
                <label htmlFor="ttsVoice">TTS Voice</label>
                <input 
                  type="text" 
                  id="ttsVoice" 
                  name="ttsVoice" 
                  value={config.ttsVoice} 
                  onChange={handleChange} 
                  placeholder="e.g., en-US-AvaMultilingualNeural"
                />
              </FormGroup>
              
              <FormGroup>
                <label htmlFor="customVoiceEndpointId">Custom Voice Deployment ID</label>
                <input 
                  type="text" 
                  id="customVoiceEndpointId" 
                  name="customVoiceEndpointId" 
                  value={config.customVoiceEndpointId} 
                  onChange={handleChange} 
                />
              </FormGroup>
              
              <FormGroup>
                <label htmlFor="personalVoiceSpeakerProfileID">Personal Voice Speaker Profile ID</label>
                <input 
                  type="text" 
                  id="personalVoiceSpeakerProfileID" 
                  name="personalVoiceSpeakerProfileID" 
                  value={config.personalVoiceSpeakerProfileID} 
                  onChange={handleChange} 
                />
              </FormGroup>
              
              <Checkbox style={{ gridColumn: '1 / span 2' }}>
                <input 
                  type="checkbox" 
                  id="continuousConversation" 
                  name="continuousConversation" 
                  checked={config.continuousConversation} 
                  onChange={handleChange} 
                />
                <label htmlFor="continuousConversation">Continuous Conversation (keep microphone on after response)</label>
              </Checkbox>
            </Grid>
          )}
        </Section>
        
        <Section>
          <SectionHeader $isOpen={openSections.openai} onClick={() => toggleSection('openai')}>
            {openSections.openai ? <FiChevronDown /> : <FiChevronRight />}
            <h2>Azure OpenAI Resource</h2>
          </SectionHeader>
          
          {openSections.openai && (
            <Grid>
              <FormGroup>
                <label htmlFor="openaiEndpoint">Endpoint</label>
                <input 
                  type="text" 
                  id="openaiEndpoint" 
                  name="openaiEndpoint" 
                  value={config.openaiEndpoint} 
                  onChange={handleChange} 
                  required
                  placeholder="https://{resource-name}.openai.azure.com"
                />
              </FormGroup>
              
              <FormGroup>
                <label htmlFor="openaiApiKey">API Key</label>
                <input 
                  type="password" 
                  id="openaiApiKey" 
                  name="openaiApiKey" 
                  value={config.openaiApiKey} 
                  onChange={handleChange} 
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <label htmlFor="openaiDeploymentName">Deployment Name</label>
                <input 
                  type="text" 
                  id="openaiDeploymentName" 
                  name="openaiDeploymentName" 
                  value={config.openaiDeploymentName} 
                  onChange={handleChange} 
                  required
                  placeholder="e.g., gpt-35-turbo or your deployment name"
                />
              </FormGroup>
              
              <FormGroup style={{ gridColumn: '1 / span 2' }}>
                <label htmlFor="systemPrompt">System Prompt</label>
                <textarea 
                  id="systemPrompt" 
                  name="systemPrompt" 
                  value={config.systemPrompt} 
                  onChange={handleChange} 
                  rows="4"
                />
              </FormGroup>
              
              <Checkbox>
                <input 
                  type="checkbox" 
                  id="enableOyd" 
                  name="enableOyd" 
                  checked={config.enableOyd} 
                  onChange={handleChange} 
                />
                <label htmlFor="enableOyd">Enable On Your Data</label>
              </Checkbox>
            </Grid>
          )}
        </Section>
        
        {config.enableOyd && (
          <Section>
            <SectionHeader $isOpen={openSections.cogSearch} onClick={() => toggleSection('cogSearch')}>
              {openSections.cogSearch ? <FiChevronDown /> : <FiChevronRight />}
              <h2>Azure Cognitive Search Resource</h2>
            </SectionHeader>
            
            {openSections.cogSearch && (
              <Grid>
                <FormGroup>
                  <label htmlFor="cogSearchEndpoint">Endpoint</label>
                  <input 
                    type="text" 
                    id="cogSearchEndpoint" 
                    name="cogSearchEndpoint" 
                    value={config.cogSearchEndpoint} 
                    onChange={handleChange} 
                    placeholder="https://{search-name}.search.windows.net"
                  />
                </FormGroup>
                
                <FormGroup>
                  <label htmlFor="cogSearchApiKey">API Key</label>
                  <input 
                    type="password" 
                    id="cogSearchApiKey" 
                    name="cogSearchApiKey" 
                    value={config.cogSearchApiKey} 
                    onChange={handleChange} 
                  />
                </FormGroup>
                
                <FormGroup>
                  <label htmlFor="cogSearchIndexName">Index Name</label>
                  <input 
                    type="text" 
                    id="cogSearchIndexName" 
                    name="cogSearchIndexName" 
                    value={config.cogSearchIndexName} 
                    onChange={handleChange} 
                  />
                </FormGroup>
              </Grid>
            )}
          </Section>
        )}
        
        <Section>
          <SectionHeader $isOpen={openSections.avatar} onClick={() => toggleSection('avatar')}>
            {openSections.avatar ? <FiChevronDown /> : <FiChevronRight />}
            <h2>Avatar Configuration</h2>
          </SectionHeader>
          
          {openSections.avatar && (
            <>
              <Grid>
                <FormGroup>
                  <label htmlFor="avatarCharacter">Avatar Character</label>
                  <input 
                    type="text" 
                    id="avatarCharacter" 
                    name="avatarCharacter" 
                    value={config.avatarCharacter} 
                    onChange={handleChange} 
                    placeholder="e.g., lisa, guy, etc."
                  />
                </FormGroup>
                
                <FormGroup>
                  <label htmlFor="avatarStyle">Avatar Style</label>
                  <input 
                    type="text" 
                    id="avatarStyle" 
                    name="avatarStyle" 
                    value={config.avatarStyle} 
                    onChange={handleChange} 
                    placeholder="e.g., casual-sitting"
                  />
                </FormGroup>
              </Grid>
              
              <CheckboxGroup>
                <Checkbox>
                  <input 
                    type="checkbox" 
                    id="customizedAvatar" 
                    name="customizedAvatar" 
                    checked={config.customizedAvatar} 
                    onChange={handleChange} 
                  />
                  <label htmlFor="customizedAvatar">Custom Avatar</label>
                </Checkbox>
                
                <Checkbox>
                  <input 
                    type="checkbox" 
                    id="autoReconnect" 
                    name="autoReconnect" 
                    checked={config.autoReconnect} 
                    onChange={handleChange} 
                  />
                  <label htmlFor="autoReconnect">Auto Reconnect</label>
                </Checkbox>
                
                <Checkbox>
                  <input 
                    type="checkbox" 
                    id="useLocalVideoForIdle" 
                    name="useLocalVideoForIdle" 
                    checked={config.useLocalVideoForIdle} 
                    onChange={handleChange} 
                  />
                  <label htmlFor="useLocalVideoForIdle">Use Local Video for Idle</label>
                </Checkbox>
                
                <Checkbox>
                  <input 
                    type="checkbox" 
                    id="showSubtitles" 
                    name="showSubtitles" 
                    checked={config.showSubtitles} 
                    onChange={handleChange} 
                  />
                  <label htmlFor="showSubtitles">Show Subtitles</label>
                </Checkbox>
              </CheckboxGroup>
            </>
          )}
        </Section>
        
        <ButtonContainer>
          <StartButton type="submit">Open Avatar Session</StartButton>
        </ButtonContainer>
      </form>
    </ConfigContainer>
  );
}; 