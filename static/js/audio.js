class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.initSounds();
    }

    async initSounds() {
        const soundEffects = {
            chomp: [0, 0.1, 0.2, 0],
            death: [0.3, 0, 0, 0.3],
            ghost: [0.2, 0.1, 0, 0.1]
        };

        for (const [name, values] of Object.entries(soundEffects)) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            this.sounds[name] = { oscillator, gainNode };
        }
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            const currentTime = this.audioContext.currentTime;
            const { oscillator, gainNode } = this.sounds[soundName];
            
            oscillator.frequency.setValueAtTime(440, currentTime);
            gainNode.gain.setValueAtTime(0.1, currentTime);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.1);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + 0.1);
        }
    }
}
