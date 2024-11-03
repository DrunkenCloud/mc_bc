const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
const port = 3000;

class Block {
    constructor(previousHash = '', transaction = '') {
        this.previousHash = previousHash;
        this.transaction = transaction;
        this.timestamp = Date.now();
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(this.timestamp + this.transaction + this.previousHash)
            .digest('hex');
    }
}

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransaction = null;

        this.initializeChain();
    }

    initializeChain() {
        const genesisBlock = new Block('', 'Genesis Block');
        genesisBlock.hash = genesisBlock.calculateHash();
        this.chain.push(genesisBlock);

        for (let i = 1; i < 100; i++) {
            const emptyBlock = new Block('', 'empty');
            this.chain.push(emptyBlock);
        }
    }

    getLatestBlock() {
        return this.chain[this.chain.findIndex(block => block.transaction === 'empty') - 1];
    }

    addTransaction(transaction) {
        this.pendingTransaction = transaction;
    }

    minePendingTransaction() {
        if (this.pendingTransaction) {
            const emptyBlockIndex = this.chain.findIndex(block => block.transaction === 'empty');

            if (emptyBlockIndex !== -1) {
                const block = this.chain[emptyBlockIndex];
                const previousBlock = this.getLatestBlock();

                block.previousHash = previousBlock.hash;
                block.transaction = this.pendingTransaction;
                block.timestamp = Date.now();
                block.hash = block.calculateHash();

                this.pendingTransaction = null;
            } else {
                console.log("No empty blocks available.");
            }
        }
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    resetChain() {
        this.chain.forEach((block, index) => {
            if (index !== 0) {
                block.previousHash = '';
                block.transaction = 'empty';
                block.timestamp = null;
                block.hash = null;
            }
        });
        this.pendingTransaction = null;
    }
}

const votingBlockchain = new Blockchain();

app.get('/api/chain', (req, res) => {
    res.send(votingBlockchain.chain);
});

app.post('/api/vote', (req, res) => {
    const { candidate } = req.body;

    if (!candidate) {
        return res.status(400).send('Please specify a candidate.');
    }

    votingBlockchain.addTransaction(candidate);
    votingBlockchain.minePendingTransaction();
    res.send({ message: 'Vote recorded', candidate });
});

app.get('/api/results', (req, res) => {
    const results = {};
    votingBlockchain.chain.forEach(block => {
        if (block.transaction && block.transaction !== 'empty') {
            results[block.transaction] = (results[block.transaction] || 0) + 1;
        }
    });
    res.send(results);
});

app.post('/api/clear', (req, res) => {
    votingBlockchain.resetChain();
    res.send({ message: 'Blockchain has been reset.' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;