class AudioManager {
    constructor() {
        // Lazy initialize audio context on first user interaction
        this.audioContext = null;
        this.soundEffects = {
            chomp: { frequency: 440, duration: 0.1 },
            death: { frequency: 200, duration: 0.3 }
        };
        this.activeNodes = new Set();
    }

    initAudioContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('AudioContext initialized successfully');
            } catch (error) {
                console.error('Failed to initialize AudioContext:', error);
            }
        }
    }

    cleanupNode(oscillator, gainNode) {
        try {
            if (this.activeNodes.has(oscillator)) {
                oscillator.disconnect();
                gainNode.disconnect();
                this.activeNodes.delete(oscillator);
            }
        } catch (error) {
            console.error('Error cleaning up audio nodes:', error);
        }
    }

    play(soundName) {
        try {
            this.initAudioContext();

            if (!this.audioContext || !this.soundEffects[soundName]) {
                return;
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            this.activeNodes.add(oscillator);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            const currentTime = this.audioContext.currentTime;
            const { frequency, duration } = this.soundEffects[soundName];

            oscillator.frequency.setValueAtTime(frequency, currentTime);
            gainNode.gain.setValueAtTime(0.1, currentTime);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

            oscillator.start(currentTime);
            oscillator.stop(currentTime + duration);

            // Clean up nodes after they're done
            setTimeout(() => {
                this.cleanupNode(oscillator, gainNode);
            }, duration * 1000 + 100);

        } catch (error) {
            console.error('Audio playback error:', error);
        }
    }
}