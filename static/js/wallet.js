class WalletManager {
    constructor() {
        this.connection = null;
        this.wallet = null;
        this.isConnected = false;

        // Initialize connection to Solana devnet
        this.initializeConnection();
        this.bindWalletEvents();

        // Add error logging
        console.log('WalletManager initialized');
    }

    async initializeConnection() {
        try {
            // Check if Phantom wallet is available
            const isPhantomAvailable = window.solana && window.solana.isPhantom;
            if (!isPhantomAvailable) {
                console.log('Phantom wallet is not installed');
                this.updateWalletUI('Phantom wallet not installed');
                return;
            }

            // Connect to Solana devnet
            const { Connection, clusterApiUrl } = solanaWeb3;
            this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
            console.log('Connected to Solana devnet');
        } catch (error) {
            console.error('Failed to initialize Solana connection:', error);
            this.updateWalletUI('Failed to connect to Solana network');
        }
    }

    bindWalletEvents() {
        const connectButton = document.getElementById('connectWallet');
        if (connectButton) {
            connectButton.addEventListener('click', () => this.connectWallet());
            console.log('Wallet events bound successfully');
        } else {
            console.error('Connect wallet button not found');
        }
    }

    async connectWallet() {
        try {
            if (!window.solana) {
                this.updateWalletUI('Please install Phantom wallet');
                return;
            }

            const response = await window.solana.connect();
            this.wallet = response.publicKey.toString();
            this.isConnected = true;

            this.updateWalletUI();
            console.log('Wallet connected:', this.wallet);
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.updateWalletUI('Failed to connect wallet');
        }
    }

    updateWalletUI(errorMessage = null) {
        const walletInfo = document.getElementById('walletInfo');
        if (walletInfo) {
            if (errorMessage) {
                walletInfo.innerHTML = `<span class="error">${errorMessage}</span>`;
                walletInfo.classList.add('error');
            } else if (this.isConnected && this.wallet) {
                walletInfo.innerHTML = `Connected: ${this.wallet.slice(0, 4)}...${this.wallet.slice(-4)}`;
                walletInfo.classList.remove('error');
                if (document.getElementById('connectWallet')) {
                    document.getElementById('connectWallet').style.display = 'none';
                }
            } else {
                walletInfo.innerHTML = 'Not connected';
                walletInfo.classList.remove('error');
                if (document.getElementById('connectWallet')) {
                    document.getElementById('connectWallet').style.display = 'block';
                }
            }
        } else {
            console.error('Wallet info element not found');
        }
    }

    async sendReward(amount) {
        if (!this.isConnected || !this.wallet) {
            console.log('Wallet not connected for rewards');
            return false;
        }

        try {
            // Log reward attempt
            console.log(`Attempting to send ${amount} SOL reward to ${this.wallet}`);
            return true;
        } catch (error) {
            console.error('Error sending reward:', error);
            return false;
        }
    }
}

// Initialize wallet manager when the page loads
window.addEventListener('load', () => {
    try {
        window.walletManager = new WalletManager();
    } catch (error) {
        console.error('Failed to initialize wallet manager:', error);
    }
});