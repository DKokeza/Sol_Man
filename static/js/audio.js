class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.soundEffects = {
            chomp: [0, 0.1, 0.2, 0],
            death: [0.3, 0, 0, 0.3],
            ghost: [0.2, 0.1, 0, 0.1]
        };
        this.currentMusic = null;
        this.musicGain = null;
        this.setupMusicNode();
    }

    setupMusicNode() {
        this.musicGain = this.audioContext.createGain();
        this.musicGain.connect(this.audioContext.destination);
        this.musicGain.gain.value = 0.3; // Lower volume for background music
    }

    createMusicLoop(frequency, duration) {
        const oscillator = this.audioContext.createOscillator();
        oscillator.connect(this.musicGain);
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        return oscillator;
    }

    playMusic(state) {
        if (this.currentMusic) {
            // Fade out current music
            const fadeOutTime = this.audioContext.currentTime + 0.5;
            this.musicGain.gain.linearRampToValueAtTime(0, fadeOutTime);
            this.currentMusic.stop(fadeOutTime);
        }

        // Create new music based on game state
        const currentTime = this.audioContext.currentTime;
        let music;

        switch(state) {
            case 'normal':
                music = this.createMusicLoop(220, 0.2); // Normal gameplay
                break;
            case 'power':
                music = this.createMusicLoop(330, 0.15); // Power-up mode
                break;
            case 'danger':
                music = this.createMusicLoop(440, 0.1); // Ghost nearby
                break;
            default:
                music = this.createMusicLoop(220, 0.2);
        }

        // Fade in new music
        this.musicGain.gain.setValueAtTime(0, currentTime);
        this.musicGain.gain.linearRampToValueAtTime(0.3, currentTime + 0.5);

        music.start(currentTime);
        this.currentMusic = music;
    }

    play(soundName) {
        if (this.soundEffects[soundName]) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            const currentTime = this.audioContext.currentTime;
            oscillator.frequency.setValueAtTime(440, currentTime);
            gainNode.gain.setValueAtTime(0.1, currentTime);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.1);

            oscillator.start(currentTime);
            oscillator.stop(currentTime + 0.1);
        }
    }
}