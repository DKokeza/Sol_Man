class WalletManager {
    constructor() {
        this.connection = null;
        this.wallet = null;
        this.isConnected = false;
        
        // Initialize connection to Solana devnet
        this.initializeConnection();
        this.bindWalletEvents();
    }

    async initializeConnection() {
        try {
            // Check if Phantom wallet is available
            const isPhantomAvailable = window.solana && window.solana.isPhantom;
            if (!isPhantomAvailable) {
                console.log('Phantom wallet is not installed');
                return;
            }

            // Connect to Solana devnet
            const { Connection, clusterApiUrl } = solanaWeb3;
            this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
            console.log('Connected to Solana devnet');
        } catch (error) {
            console.error('Failed to initialize Solana connection:', error);
        }
    }

    bindWalletEvents() {
        document.getElementById('connectWallet')?.addEventListener('click', () => this.connectWallet());
    }

    async connectWallet() {
        try {
            if (!window.solana) {
                alert('Please install Phantom wallet to continue');
                return;
            }

            const response = await window.solana.connect();
            this.wallet = response.publicKey.toString();
            this.isConnected = true;
            
            // Update UI
            this.updateWalletUI();
            console.log('Wallet connected:', this.wallet);
        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Failed to connect wallet. Please try again.');
        }
    }

    updateWalletUI() {
        const walletInfo = document.getElementById('walletInfo');
        if (walletInfo) {
            if (this.isConnected && this.wallet) {
                walletInfo.innerHTML = `Connected: ${this.wallet.slice(0, 4)}...${this.wallet.slice(-4)}`;
                document.getElementById('connectWallet').style.display = 'none';
            } else {
                walletInfo.innerHTML = 'Not connected';
                document.getElementById('connectWallet').style.display = 'block';
            }
        }
    }

    async sendReward(amount) {
        if (!this.isConnected || !this.wallet) {
            alert('Please connect your wallet to receive rewards');
            return;
        }

        // Implementation for sending rewards will go here
        console.log(`Sending ${amount} reward to wallet ${this.wallet}`);
    }
}
