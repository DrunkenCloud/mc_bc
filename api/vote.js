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
        this.chain = [this.createGenesisBlock()];
        this.pendingTransaction = null;
    }

    createGenesisBlock() {
        return new Block('0', 'Genesis Block');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(block) {
        block.previousHash = this.getLatestBlock().hash;
        block.hash = block.calculateHash();
        this.chain.push(block);
    }

    createTransaction(transaction) {
        this.pendingTransaction = transaction;
    }

    minePendingTransaction() {
        if (this.pendingTransaction) {
            const block = new Block(this.getLatestBlock().hash, this.pendingTransaction);
            this.addBlock(block);
            this.pendingTransaction = null;
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

    votingBlockchain.createTransaction(candidate);
    votingBlockchain.minePendingTransaction();
    res.send({ message: 'Vote recorded', candidate });
});

app.get('/api/results', (req, res) => {
    const results = {};
    votingBlockchain.chain.forEach(block => {
        if (block.transaction) {
            results[block.transaction] = (results[block.transaction] || 0) + 1;
        }
    });
    res.send(results);
});

app.post('/api/clear', (req, res) => {
    votingBlockchain.chain = [votingBlockchain.createGenesisBlock()];
    votingBlockchain.pendingTransaction = null;
    res.send({ message: 'Blockchain has been reset.' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;