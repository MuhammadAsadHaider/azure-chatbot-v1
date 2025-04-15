// AzureSpeechService.js - Wrapper for Azure Speech SDK operations

const sentenceLevelPunctuations = ['.', '?', '!', ':', ';', '。', '？', '！', '：', '；'];

export class AzureSpeechService {
  constructor() {
    this.SpeechSDK = window.SpeechSDK;
    this.speechRecognizer = null;
    this.avatarSynthesizer = null;
    this.peerConnection = null;
    this.peerConnectionDataChannel = null;
    this.isSpeaking = false;
    this.isReconnecting = false;
    this.speakingText = "";
    this.spokenTextQueue = [];
    this.sessionActive = false;
    this.userClosedSession = false;
    this.lastInteractionTime = new Date();
    this.lastSpeakTime = null;
    this.messages = [];
    this.messageInitiated = false;
    this.dataSources = [];
  }

  // Initialize the messages array
  initMessages(systemPrompt) {
    this.messages = [];

    if (this.dataSources.length === 0) {
      let systemMessage = {
        role: 'system',
        content: systemPrompt
      };

      this.messages.push(systemMessage);
    }
    
    this.messageInitiated = true;
  }

  // Connect to the avatar service
  async connectAvatar(config, onStatusChange, onVideoConnected, onSubtitleChange) {
    const { 
      region, 
      apiKey, 
      enablePrivateEndpoint, 
      privateEndpoint, 
      customVoiceEndpointId,
      avatarCharacter,
      avatarStyle,
      customizedAvatar,
      systemPrompt,
      enableOyd,
      cogSearchEndpoint,
      cogSearchApiKey,
      cogSearchIndexName,
      sttLocales
    } = config;

    if (apiKey === '') {
      throw new Error('Please fill in the API key of your speech resource.');
    }

    if (enablePrivateEndpoint && privateEndpoint === '') {
      throw new Error('Please fill in the Azure Speech endpoint.');
    }

    // Set up Speech Synthesis
    let speechSynthesisConfig;
    if (enablePrivateEndpoint) {
      speechSynthesisConfig = this.SpeechSDK.SpeechConfig.fromEndpoint(
        new URL(`wss://${privateEndpoint}/tts/cognitiveservices/websocket/v1?enableTalkingAvatar=true`), 
        apiKey
      );
    } else {
      speechSynthesisConfig = this.SpeechSDK.SpeechConfig.fromSubscription(apiKey, region);
    }
    speechSynthesisConfig.endpointId = customVoiceEndpointId;

    // Configure avatar
    const avatarConfig = new this.SpeechSDK.AvatarConfig(avatarCharacter, avatarStyle);
    avatarConfig.customized = customizedAvatar;
    this.avatarSynthesizer = new this.SpeechSDK.AvatarSynthesizer(speechSynthesisConfig, avatarConfig);
    
    // Set up event handler for avatar events
    this.avatarSynthesizer.avatarEventReceived = function (s, e) {
      const offsetMessage = e.offset === 0 ? "" : `, offset from session start: ${e.offset / 10000}ms.`;
      console.log(`Event received: ${e.description}${offsetMessage}`);
    };

    // Set up speech recognition
    const speechRecognitionConfig = this.SpeechSDK.SpeechConfig.fromEndpoint(
      new URL(`wss://${region}.stt.speech.microsoft.com/speech/universal/v2`), 
      apiKey
    );
    speechRecognitionConfig.setProperty(this.SpeechSDK.PropertyId.SpeechServiceConnection_LanguageIdMode, "Continuous");
    const sttLocaleArray = sttLocales.split(',');
    const autoDetectSourceLanguageConfig = this.SpeechSDK.AutoDetectSourceLanguageConfig.fromLanguages(sttLocaleArray);
    
    this.speechRecognizer = this.SpeechSDK.SpeechRecognizer.FromConfig(
      speechRecognitionConfig, 
      autoDetectSourceLanguageConfig, 
      this.SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
    );

    // Set up data sources for "on your data" if enabled
    this.dataSources = [];
    if (enableOyd) {
      if (cogSearchEndpoint === "" || cogSearchApiKey === "" || cogSearchIndexName === "") {
        throw new Error('Please fill in the Azure Cognitive Search endpoint, API key and index name.');
      } else {
        this.setDataSources(cogSearchEndpoint, cogSearchApiKey, cogSearchIndexName, systemPrompt);
      }
    }

    // Initialize messages if not already done
    if (!this.messageInitiated) {
      this.initMessages(systemPrompt);
    }

    // Get WebRTC token for avatar service
    try {
      let tokenResponse;
      if (enablePrivateEndpoint) {
        tokenResponse = await fetch(
          `https://${privateEndpoint}/tts/cognitiveservices/avatar/relay/token/v1`,
          { headers: { "Ocp-Apim-Subscription-Key": apiKey } }
        );
      } else {
        tokenResponse = await fetch(
          `https://${region}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1`,
          { headers: { "Ocp-Apim-Subscription-Key": apiKey } }
        );
      }

      if (!tokenResponse.ok) {
        throw new Error(`Failed to get token: ${tokenResponse.status} ${tokenResponse.statusText}`);
      }

      const responseData = await tokenResponse.json();
      const iceServerUrl = responseData.Urls[0];
      const iceServerUsername = responseData.Username;
      const iceServerCredential = responseData.Password;

      this.setupWebRTC(
        iceServerUrl, 
        iceServerUsername, 
        iceServerCredential, 
        onStatusChange, 
        onVideoConnected, 
        onSubtitleChange
      );
      
      return true;
    } catch (error) {
      console.error("Error connecting to avatar service:", error);
      throw error;
    }
  }

  // Setup WebRTC connection
  setupWebRTC(iceServerUrl, iceServerUsername, iceServerCredential, onStatusChange, onVideoConnected, onSubtitleChange) {
    // Create WebRTC peer connection
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{
        urls: [iceServerUrl],
        username: iceServerUsername,
        credential: iceServerCredential
      }]
    });

    // Fetch WebRTC video stream and mount it to an HTML video element
    this.peerConnection.ontrack = (event) => {
      if (event.track.kind === 'audio') {
        let audioElement = document.createElement('audio');
        audioElement.id = 'audioPlayer';
        audioElement.srcObject = event.streams[0];
        audioElement.autoplay = true;

        audioElement.onplaying = () => {
          console.log(`WebRTC ${event.track.kind} channel connected.`);
          onStatusChange('audioConnected');
        };

        return audioElement;
      }

      if (event.track.kind === 'video') {
        let videoElement = document.createElement('video');
        videoElement.id = 'videoPlayer';
        videoElement.srcObject = event.streams[0];
        videoElement.autoplay = true;
        videoElement.playsInline = true;

        // Continue speaking if there are unfinished sentences
        if (this.speakingText !== '') {
          this.speakNext(this.speakingText, 0, true);
        } else if (this.spokenTextQueue.length > 0) {
          this.speakNext(this.spokenTextQueue.shift());
        }

        videoElement.onplaying = () => {
          console.log(`WebRTC ${event.track.kind} channel connected.`);
          onStatusChange('videoConnected');
          onVideoConnected(videoElement);
          
          this.isReconnecting = false;
          setTimeout(() => { this.sessionActive = true; }, 5000); // Set session active after 5 seconds
        };

        return videoElement;
      }
    };
    
    // Listen to data channel to get events from the server
    this.peerConnection.addEventListener("datachannel", event => {
      this.peerConnectionDataChannel = event.channel;
      this.peerConnectionDataChannel.onmessage = e => {
        const webRTCEvent = JSON.parse(e.data);
        
        if (webRTCEvent.event.eventType === 'EVENT_TYPE_TURN_START') {
          onSubtitleChange(this.speakingText, true);
        } else if (webRTCEvent.event.eventType === 'EVENT_TYPE_SESSION_END' || 
                   webRTCEvent.event.eventType === 'EVENT_TYPE_SWITCH_TO_IDLE') {
          onSubtitleChange('', false);
          
          if (webRTCEvent.event.eventType === 'EVENT_TYPE_SESSION_END' && 
              !this.userClosedSession && 
              !this.isReconnecting) {
            if (new Date() - this.lastInteractionTime < 300000) {
              // Session disconnected unexpectedly, need reconnect
              console.log(`[${(new Date()).toISOString()}] The WebSockets got disconnected, need reconnect.`);
              onStatusChange('reconnecting');
              this.isReconnecting = true;

              // Remove data channel onmessage callback to avoid duplicately triggering reconnect
              this.peerConnectionDataChannel.onmessage = null;

              // Release the existing avatar connection
              if (this.avatarSynthesizer !== undefined) {
                this.avatarSynthesizer.close();
              }
            }
          }
        }

        console.log(`[${(new Date()).toISOString()}] WebRTC event received: ${e.data}`);
      };
    });

    // Create a data channel from the client side
    const c = this.peerConnection.createDataChannel("eventChannel");

    // Update status on connection state changes
    this.peerConnection.oniceconnectionstatechange = e => {
      console.log(`WebRTC status: ${this.peerConnection.iceConnectionState}`);
      onStatusChange(this.peerConnection.iceConnectionState);
    };

    // Offer to receive 1 audio, and 1 video track
    this.peerConnection.addTransceiver('video', { direction: 'sendrecv' });
    this.peerConnection.addTransceiver('audio', { direction: 'sendrecv' });

    // Start avatar and establish WebRTC connection
    this.avatarSynthesizer.startAvatarAsync(this.peerConnection).then((r) => {
      if (r.reason === this.SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
        console.log(`[${(new Date()).toISOString()}] Avatar started. Result ID: ${r.resultId}`);
        onStatusChange('avatarStarted');
      } else {
        console.log(`[${(new Date()).toISOString()}] Unable to start avatar. Result ID: ${r.resultId}`);
        onStatusChange('avatarFailed');
        
        if (r.reason === this.SpeechSDK.ResultReason.Canceled) {
          const cancellationDetails = this.SpeechSDK.CancellationDetails.fromResult(r);
          if (cancellationDetails.reason === this.SpeechSDK.CancellationReason.Error) {
            console.log(`Error details: ${cancellationDetails.errorDetails}`);
          }
        }
      }
    }).catch((error) => {
      console.log(`[${(new Date()).toISOString()}] Avatar failed to start. Error: ${error}`);
      onStatusChange('avatarFailed');
    });
  }

  // Disconnect from the avatar service
  disconnectAvatar() {
    if (this.avatarSynthesizer !== undefined) {
      this.avatarSynthesizer.close();
    }

    if (this.speechRecognizer !== undefined) {
      this.speechRecognizer.stopContinuousRecognitionAsync();
      this.speechRecognizer.close();
    }

    this.sessionActive = false;
  }

  // Start the microphone for speech recognition
  startMicrophone(onRecognizedSpeech) {
    this.lastInteractionTime = new Date();
    
    this.speechRecognizer.recognized = (s, e) => {
      if (e.result.reason === this.SpeechSDK.ResultReason.RecognizedSpeech) {
        const userQuery = e.result.text.trim();
        if (userQuery !== '') {
          onRecognizedSpeech(userQuery);
        }
      }
    };

    return new Promise((resolve, reject) => {
      this.speechRecognizer.startContinuousRecognitionAsync(
        () => resolve(),
        (err) => {
          console.log("Failed to start continuous recognition:", err);
          reject(err);
        }
      );
    });
  }

  // Stop the microphone
  stopMicrophone() {
    return new Promise((resolve, reject) => {
      this.speechRecognizer.stopContinuousRecognitionAsync(
        () => resolve(),
        (err) => {
          console.log("Failed to stop continuous recognition:", err);
          reject(err);
        }
      );
    });
  }

  // Set data sources for "on your data" feature
  setDataSources(azureCogSearchEndpoint, azureCogSearchApiKey, azureCogSearchIndexName, roleInformation) {
    let dataSource = {
      type: 'AzureCognitiveSearch',
      parameters: {
        endpoint: azureCogSearchEndpoint,
        key: azureCogSearchApiKey,
        indexName: azureCogSearchIndexName,
        semanticConfiguration: '',
        queryType: 'simple',
        fieldsMapping: {
          contentFieldsSeparator: '\n',
          contentFields: ['content'],
          filepathField: null,
          titleField: 'title',
          urlField: null
        },
        inScope: true,
        roleInformation: roleInformation
      }
    };

    this.dataSources.push(dataSource);
  }

  // HTML encode text
  htmlEncode(text) {
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    };

    return String(text).replace(/[&<>"'\/]/g, (match) => entityMap[match]);
  }

  // Speak text using the avatar
  speak(text, endingSilenceMs = 0) {
    if (this.isSpeaking) {
      this.spokenTextQueue.push(text);
      return;
    }

    this.speakNext(text, endingSilenceMs);
  }

  // Internal method to process the text to speak
  speakNext(text, endingSilenceMs = 0, skipUpdatingChatHistory = false) {
    const { ttsVoice, personalVoiceSpeakerProfileID } = this.config;
    
    let ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'><voice name='${ttsVoice}'><mstts:ttsembedding speakerProfileId='${personalVoiceSpeakerProfileID}'><mstts:leadingsilence-exact value='0'/>${this.htmlEncode(text)}</mstts:ttsembedding></voice></speak>`;
    
    if (endingSilenceMs > 0) {
      ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'><voice name='${ttsVoice}'><mstts:ttsembedding speakerProfileId='${personalVoiceSpeakerProfileID}'><mstts:leadingsilence-exact value='0'/>${this.htmlEncode(text)}<break time='${endingSilenceMs}ms' /></mstts:ttsembedding></voice></speak>`;
    }

    this.lastSpeakTime = new Date();
    this.isSpeaking = true;
    this.speakingText = text;
    
    this.avatarSynthesizer.speakSsmlAsync(ssml).then(
      (result) => {
        if (result.reason === this.SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          console.log(`Speech synthesized to speaker for text [ ${text} ]. Result ID: ${result.resultId}`);
          this.lastSpeakTime = new Date();
        } else {
          console.log(`Error occurred while speaking the SSML. Result ID: ${result.resultId}`);
        }

        this.speakingText = '';

        if (this.spokenTextQueue.length > 0) {
          this.speakNext(this.spokenTextQueue.shift());
        } else {
          this.isSpeaking = false;
        }
      }).catch(
        (error) => {
          console.log(`Error occurred while speaking the SSML: [ ${error} ]`);
          this.speakingText = '';

          if (this.spokenTextQueue.length > 0) {
            this.speakNext(this.spokenTextQueue.shift());
          } else {
            this.isSpeaking = false;
          }
        }
      );
  }

  // Stop speaking
  stopSpeaking() {
    this.lastInteractionTime = new Date();
    this.spokenTextQueue = [];
    
    return this.avatarSynthesizer.stopSpeakingAsync().then(
      () => {
        this.isSpeaking = false;
        console.log(`[${(new Date()).toISOString()}] Stop speaking request sent.`);
        return true;
      }
    ).catch(
      (error) => {
        console.log(`Error occurred while stopping speaking: ${error}`);
        return false;
      }
    );
  }

  // Handle user query and get response from Azure OpenAI
  async handleUserQuery(userQuery, config, onResponseUpdate, onSpeechStart) {
    this.lastInteractionTime = new Date();
    const { 
      openaiEndpoint, 
      openaiApiKey, 
      openaiDeploymentName,
      ttsVoice,
      personalVoiceSpeakerProfileID 
    } = config;
    
    // Save configuration for future use
    this.config = config;
    
    // Add user message to chat history
    let chatMessage = {
      role: 'user',
      content: userQuery
    };
    this.messages.push(chatMessage);

    // Stop previous speaking if there is any
    if (this.isSpeaking) {
      await this.stopSpeaking();
    }

    let url = `${openaiEndpoint}/openai/deployments/${openaiDeploymentName}/chat/completions?api-version=2023-06-01-preview`;
    let body = JSON.stringify({
      messages: this.messages,
      stream: true
    });

    if (this.dataSources.length > 0) {
      url = `${openaiEndpoint}/openai/deployments/${openaiDeploymentName}/extensions/chat/completions?api-version=2023-06-01-preview`;
      body = JSON.stringify({
        dataSources: this.dataSources,
        messages: this.messages,
        stream: true
      });
    }

    let assistantReply = '';
    let toolContent = '';
    let spokenSentence = '';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-key': openaiApiKey,
          'Content-Type': 'application/json'
        },
        body: body
      });

      if (!response.ok) {
        throw new Error(`Chat API response status: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      
      // Read chunks from stream
      const read = async (previousChunkString = '') => {
        const { value, done } = await reader.read();
        
        if (done) {
          return;
        }

        let chunkString = new TextDecoder().decode(value, { stream: true });
        if (previousChunkString !== '') {
          chunkString = previousChunkString + chunkString;
        }

        if (!chunkString.endsWith('}\n\n') && !chunkString.endsWith('[DONE]\n\n')) {
          return read(chunkString);
        }

        const byodDocRegex = new RegExp(/\[doc(\d+)\]/g);

        chunkString.split('\n\n').forEach((line) => {
          try {
            if (line.startsWith('data:') && !line.endsWith('[DONE]')) {
              const responseJson = JSON.parse(line.substring(5).trim());
              let responseToken = undefined;
              
              if (this.dataSources.length === 0) {
                responseToken = responseJson.choices[0].delta.content;
              } else {
                let role = responseJson.choices[0].messages[0].delta.role;
                if (role === 'tool') {
                  toolContent = responseJson.choices[0].messages[0].delta.content;
                } else {
                  responseToken = responseJson.choices[0].messages[0].delta.content;
                  if (responseToken !== undefined) {
                    if (byodDocRegex.test(responseToken)) {
                      responseToken = responseToken.replace(byodDocRegex, '').trim();
                    }

                    if (responseToken === '[DONE]') {
                      responseToken = undefined;
                    }
                  }
                }
              }

              if (responseToken !== undefined && responseToken !== null) {
                assistantReply += responseToken;
                onResponseUpdate(assistantReply);

                if (responseToken === '\n' || responseToken === '\n\n') {
                  spokenSentence += responseToken;
                  this.speak(spokenSentence);
                  onSpeechStart(spokenSentence);
                  spokenSentence = '';
                } else {
                  spokenSentence += responseToken;

                  responseToken = responseToken.replace(/\n/g, '');
                  if (responseToken.length === 1 || responseToken.length === 2) {
                    for (let i = 0; i < sentenceLevelPunctuations.length; ++i) {
                      let sentenceLevelPunctuation = sentenceLevelPunctuations[i];
                      if (responseToken.startsWith(sentenceLevelPunctuation)) {
                        this.speak(spokenSentence);
                        onSpeechStart(spokenSentence);
                        spokenSentence = '';
                        break;
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.log(`Error parsing response: ${error}`);
          }
        });

        return read();
      };
      
      await read();
      
      // Speak any remaining text
      if (spokenSentence !== '') {
        this.speak(spokenSentence);
        onSpeechStart(spokenSentence);
      }

      // Add tool message if data sources are used
      if (this.dataSources.length > 0 && toolContent) {
        this.messages.push({
          role: 'tool',
          content: toolContent
        });
      }

      // Add assistant message to chat history
      this.messages.push({
        role: 'assistant',
        content: assistantReply
      });

      return assistantReply;
    } catch (error) {
      console.error("Error in chat request:", error);
      throw error;
    }
  }

  // Check if the avatar video stream is hung
  checkHung(onReconnect) {
    let videoElement = document.getElementById('videoPlayer');
    if (videoElement !== null && videoElement !== undefined && this.sessionActive) {
      let videoTime = videoElement.currentTime;
      
      setTimeout(() => {
        if (videoElement.currentTime === videoTime) {
          if (this.sessionActive) {
            this.sessionActive = false;
            
            if (new Date() - this.lastInteractionTime < 300000) {
              console.log(`[${(new Date()).toISOString()}] The video stream got disconnected, need reconnect.`);
              onReconnect();
            }
          }
        }
      }, 2000);
    }
  }

  // Clear chat history
  clearChatHistory(systemPrompt) {
    this.initMessages(systemPrompt);
  }
} 