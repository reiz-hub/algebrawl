import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUNDS = {
  click: require('../assets/audios/click.mp3'),
  hit: require('../assets/audios/hit.mp3'),
  break: require('../assets/audios/break.mp3'),
  heartbreak: require('../assets/audios/heartbreak.mp3'),
  victory: require('../assets/audios/victory.mp3'),
  defeat: require('../assets/audios/defeat.mp3'),
};

const BG_MUSIC = require('../assets/audios/lobby.mp3');

class SoundService {
  private bgMusic: Audio.Sound | null = null;
  private soundEffects: Record<string, Audio.Sound> = {};
  private isInitialized = false;
  private isMusicEnabled = true;
  private isSoundEnabled = true;

  getMusicEnabled() {
    return this.isMusicEnabled;
  }

  getSoundEnabled() {
    return this.isSoundEnabled;
  }

  async setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    try {
      await AsyncStorage.setItem('@algebrawl_musicEnabled', JSON.stringify(enabled));
      if (enabled) {
        await this.resumeBgMusic();
      } else {
        await this.pauseBgMusic();
      }
    } catch (error) {
      console.warn('[SoundService] Failed to save music preference:', error);
    }
  }

  async setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
    try {
      await AsyncStorage.setItem('@algebrawl_soundEnabled', JSON.stringify(enabled));
    } catch (error) {
      console.warn('[SoundService] Failed to save sound preference:', error);
    }
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load settings preferences from AsyncStorage
      const storedMusic = await AsyncStorage.getItem('@algebrawl_musicEnabled');
      const storedSound = await AsyncStorage.getItem('@algebrawl_soundEnabled');

      if (storedMusic !== null) {
        this.isMusicEnabled = JSON.parse(storedMusic);
      }
      if (storedSound !== null) {
        this.isSoundEnabled = JSON.parse(storedSound);
      }

      // Set audio mode to ensure sound plays even when device is on silent/vibrate
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Load and play background music
      const { sound: bgSound } = await Audio.Sound.createAsync(
        BG_MUSIC,
        { shouldPlay: this.isMusicEnabled, isLooping: true, volume: 1.0 }
      );
      this.bgMusic = bgSound;

      // Preload small sound effect assets for low-latency playback
      for (const [key, value] of Object.entries(SOUNDS)) {
        const { sound } = await Audio.Sound.createAsync(value);
        this.soundEffects[key] = sound;
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('[SoundService] Initialization failed:', error);
    }
  }

  async playSound(type: keyof typeof SOUNDS) {
    if (!this.isSoundEnabled) return;
    try {
      const sound = this.soundEffects[type];
      if (!sound) {
        // If not loaded or initialized yet, try playing directly as a fallback
        if (SOUNDS[type]) {
          const { sound: directSound } = await Audio.Sound.createAsync(SOUNDS[type]);
          await directSound.playAsync();
        }
        return;
      }

      if (type === 'victory' || type === 'defeat') {
        // Duck background music for victory/defeat fanfares
        if (this.bgMusic) {
          await this.bgMusic.setStatusAsync({ volume: 0.15 });
        }

        await sound.setPositionAsync(0);
        await sound.playAsync();

        // Listen for completion and restore background music volume
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.setOnPlaybackStatusUpdate(null);
            if (this.bgMusic) {
              await this.bgMusic.setStatusAsync({ volume: 1.0 });
            }
          }
        });
      } else {
        // Play one-shot sounds with seek-to-zero to allow overlapping triggers
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.warn(`[SoundService] Failed to play sound "${type}":`, error);
    }
  }

  async stopSound(type: keyof typeof SOUNDS) {
    try {
      const sound = this.soundEffects[type];
      if (sound) {
        await sound.stopAsync();
        if ((type === 'victory' || type === 'defeat') && this.bgMusic) {
          await this.bgMusic.setStatusAsync({ volume: 1.0 });
        }
      }
    } catch (error) {
      console.warn(`[SoundService] Failed to stop sound "${type}":`, error);
    }
  }

  async playClick() {
    await this.playSound('click');
  }

  async pauseBgMusic() {
    try {
      if (this.bgMusic) {
        await this.bgMusic.pauseAsync();
      }
    } catch (error) {
      console.warn('[SoundService] Failed to pause bg music:', error);
    }
  }

  async resumeBgMusic() {
    try {
      if (this.bgMusic) {
        await this.bgMusic.playAsync();
      }
    } catch (error) {
      console.warn('[SoundService] Failed to resume bg music:', error);
    }
  }
}

export const soundService = new SoundService();
