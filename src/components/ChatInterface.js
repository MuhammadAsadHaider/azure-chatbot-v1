import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiSend, FiMic, FiMicOff, FiTrash2, FiX } from 'react-icons/fi';
import { AzureSpeechService } from '../services/AzureSpeechService';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const ContentArea = styled.div`
  display: flex;
  gap: 20px;
  height: 80vh;
  
  @media (max-width: 768px) {
    flex-direction: column;
    height: auto;
  }
`;

const VideoContainer = styled.div`
  flex: 1;
  position: relative;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  min-height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
  
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background-color: white;
  }
`;

const LocalVideo = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Subtitles = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  width: 100%;
  text-align: center;
  color: white;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  font-size: 18px;
  padding: 0 20px;
  z-index: 10;
`;

const ChatHistoryContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ChatHistory = styled.div`
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: white;
  overflow-y: auto;
  max-height: calc(80vh - 140px);
`;

const Message = styled.div`
  margin-bottom: 15px;
  
  .user, .assistant {
    padding: 10px 15px;
    border-radius: 18px;
    margin-bottom: 5px;
    max-width: 80%;
    word-wrap: break-word;
  }
  
  .user {
    background-color: #e7f3ff;
    align-self: flex-end;
    margin-left: auto;
    border-bottom-right-radius: 5px;
  }
  
  .assistant {
    background-color: #f0f0f0;
    align-self: flex-start;
    margin-right: auto;
    border-bottom-left-radius: 5px;
  }
  
  .sender {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 2px;
  }
`;

const InputArea = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const TextInput = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-left: 10px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.color || '#4f85e5'};
  padding: 10px;
  border-radius: 50%;
  border: none;
  color: white;
  cursor: pointer;
  height: 40px;
  width: 40px;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

const StatusIndicator = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px 10px;
  border-radius: 4px;
  background-color: ${props => props.connected ? 'rgba(46, 204, 113, 0.8)' : 'rgba(231, 76, 60, 0.8)'};
  color: white;
  font-size: 0.8rem;
  z-index: 10;
`;

export const ChatInterface = ({ config, endSession }) => {
  const speechService = useRef(null);
  const videoContainerRef = useRef(null);
  const chatHistoryRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const [status, setStatus] = useState('connecting');
  const [isConnected, setIsConnected] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [subtitlesText, setSubtitlesText] = useState('');
  const localVideoRef = useRef(null);
  
  // Initialize the speech service
  useEffect(() => {
    speechService.current = new AzureSpeechService();
    
    // Set up a video for idle state if enabled
    if (config.useLocalVideoForIdle) {
      setupLocalVideo();
    }
    
    // Connect to the avatar service
    connectToAvatar();
    
    // Check for hung video stream periodically
    const intervalId = setInterval(() => {
      if (speechService.current) {
        speechService.current.checkHung(() => {
          setStatus('reconnecting');
          connectToAvatar();
        });
      }
    }, 5000);
    
    return () => {
      if (speechService.current) {
        speechService.current.disconnectAvatar();
      }
      clearInterval(intervalId);
    };
  }, []);
  
  const setupLocalVideo = () => {
    if (localVideoRef.current) {
      const video = document.createElement('video');
      video.src = 'video/lisa-casual-sitting-idle.mp4';
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      localVideoRef.current.appendChild(video);
    }
  };
  
  const connectToAvatar = async () => {
    try {
      await speechService.current.connectAvatar(
        config,
        handleStatusChange,
        handleVideoConnected,
        handleSubtitleChange
      );
    } catch (error) {
      console.error('Failed to connect to avatar:', error);
      setStatus('error');
    }
  };
  
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (newStatus === 'videoConnected' || newStatus === 'avatarStarted') {
      setIsConnected(true);
    } else if (newStatus === 'disconnected' || newStatus === 'failed' || newStatus === 'error') {
      setIsConnected(false);
    }
  };
  
  const handleVideoConnected = (videoElement) => {
    if (videoContainerRef.current) {
      // Clear existing video elements
      while (videoContainerRef.current.firstChild) {
        videoContainerRef.current.removeChild(videoContainerRef.current.firstChild);
      }
      
      // Add the new video element
      videoContainerRef.current.appendChild(videoElement);
    }
  };
  
  const handleSubtitleChange = (text, visible) => {
    setSubtitlesText(text);
    setShowSubtitles(visible && config.showSubtitles);
  };
  
  const handleSendMessage = async () => {
    if (inputText.trim() === '') return;
    
    const userMessage = inputText;
    setInputText('');
    
    // Add user message to chat
    setMessages(prev => [
      ...prev, 
      { role: 'user', content: userMessage }
    ]);
    
    // Scroll to bottom
    setTimeout(() => {
      if (chatHistoryRef.current) {
        chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
      }
    }, 100);
    
    try {
      // Process with Azure OpenAI and speak response
      await speechService.current.handleUserQuery(
        userMessage,
        config,
        (responseText) => {
          // Update the assistant message as it streams in
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = responseText;
            } else {
              newMessages.push({ role: 'assistant', content: responseText });
            }
            
            return newMessages;
          });
          
          // Scroll to bottom as message updates
          if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
          }
        },
        (spokenText) => {
          // Handle when speech starts for a sentence
          console.log('Speaking:', spokenText);
        }
      );
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        { role: 'system', content: `Error: ${error.message}` }
      ]);
    }
  };
  
  const toggleMicrophone = async () => {
    if (isMicActive) {
      // Stop microphone
      try {
        await speechService.current.stopMicrophone();
        setIsMicActive(false);
      } catch (error) {
        console.error('Failed to stop microphone:', error);
      }
    } else {
      // Start microphone
      try {
        await speechService.current.startMicrophone((recognizedText) => {
          // Add recognized text as user message
          setMessages(prev => [
            ...prev, 
            { role: 'user', content: recognizedText }
          ]);
          
          // Process with Azure OpenAI and speak response
          speechService.current.handleUserQuery(
            recognizedText,
            config,
            (responseText) => {
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content = responseText;
                } else {
                  newMessages.push({ role: 'assistant', content: responseText });
                }
                
                return newMessages;
              });
              
              if (chatHistoryRef.current) {
                chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
              }
            },
            (spokenText) => {
              console.log('Speaking:', spokenText);
            }
          );
          
          // Only stop microphone if not in continuous conversation mode
          if (!config.continuousConversation) {
            speechService.current.stopMicrophone();
            setIsMicActive(false);
          }
        });
        
        setIsMicActive(true);
      } catch (error) {
        console.error('Failed to start microphone:', error);
      }
    }
  };
  
  const clearChat = () => {
    setMessages([]);
    speechService.current.clearChatHistory(config.systemPrompt);
  };
  
  const handleEndSession = () => {
    if (speechService.current) {
      speechService.current.disconnectAvatar();
    }
    endSession();
  };
  
  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  return (
    <ChatContainer>
      <ChatHeader>
        <h2>Chat with AI Avatar</h2>
        <ActionButton color="#e74c3c" onClick={handleEndSession}>
          <FiX />
        </ActionButton>
      </ChatHeader>
      
      <ContentArea>
        <VideoContainer>
          {status === 'connecting' || status === 'reconnecting' ? (
            <StatusIndicator connected={false}>
              {status === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
            </StatusIndicator>
          ) : (
            <StatusIndicator connected={isConnected}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </StatusIndicator>
          )}
          
          <div ref={videoContainerRef}></div>
          
          {config.useLocalVideoForIdle && (
            <LocalVideo ref={localVideoRef} style={{ display: isConnected ? 'none' : 'block' }}></LocalVideo>
          )}
          
          {showSubtitles && (
            <Subtitles>{subtitlesText}</Subtitles>
          )}
        </VideoContainer>
        
        <ChatHistoryContainer>
          <ChatHistory ref={chatHistoryRef}>
            {messages.map((message, index) => (
              <Message key={index}>
                <div className="sender">{message.role === 'user' ? 'You' : 'AI Assistant'}</div>
                <div className={message.role}>{message.content}</div>
              </Message>
            ))}
          </ChatHistory>
          
          <InputArea>
            <TextInput
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message here..."
              onKeyPress={handleInputKeyPress}
              disabled={!isConnected}
            />
            
            <ButtonGroup>
              <ActionButton 
                onClick={handleSendMessage} 
                disabled={!isConnected || inputText.trim() === ''}
              >
                <FiSend />
              </ActionButton>
              
              <ActionButton 
                onClick={toggleMicrophone} 
                disabled={!isConnected}
                color={isMicActive ? '#e74c3c' : undefined}
              >
                {isMicActive ? <FiMicOff /> : <FiMic />}
              </ActionButton>
              
              <ActionButton 
                onClick={clearChat} 
                color="#f39c12"
              >
                <FiTrash2 />
              </ActionButton>
            </ButtonGroup>
          </InputArea>
        </ChatHistoryContainer>
      </ContentArea>
    </ChatContainer>
  );
}; 