class AudioManager {
    constructor() {
        // Lazy initialize audio context on first user interaction
        this.audioContext = null;
        this.soundEffects = {
            chomp: { frequency: 440, duration: 0.1 },
            death: { frequency: 200, duration: 0.3 }
        };
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    play(soundName) {
        try {
            this.initAudioContext();

            if (this.audioContext && this.soundEffects[soundName]) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

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
                    oscillator.disconnect();
                    gainNode.disconnect();
                }, duration * 1000 + 100);
            }
        } catch (error) {
            console.log('Audio error:', error);
        }
    }
}