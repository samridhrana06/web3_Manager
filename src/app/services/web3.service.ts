import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import Web3 from 'web3';
import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';

@Injectable({
  providedIn: 'root'
})
export class Web3Service {
  private web3: Web3 | null = null;
  private onboard: any;
  private connectedWallet = new BehaviorSubject<string | null>(null);
  public connectedWallet$ = this.connectedWallet.asObservable();

  constructor() {
    this.initOnboard();
  }

  private initOnboard() {
    const injected = injectedModule();

    this.onboard = Onboard({
      wallets: [injected],
      chains: [
        {
          id: '0x1',
          token: 'ETH',
          label: 'Ethereum Mainnet',
          rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
        },
        {
          id: '0x89',
          token: 'MATIC',
          label: 'Polygon',
          rpcUrl: 'https://polygon-rpc.com'
        }
      ]
    });
  }

  async connectWallet() {
    try {
      const wallets = await this.onboard.connectWallet();
      if (wallets[0]) {
        this.web3 = new Web3(wallets[0].provider);
        this.connectedWallet.next(wallets[0].accounts[0].address);
        return wallets[0].accounts[0].address;
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  async disconnectWallet() {
    try {
      const [primaryWallet] = this.onboard.state.get().wallets;
      if (primaryWallet) {
        await this.onboard.disconnectWallet({ label: primaryWallet.label });
        this.web3 = null;
        this.connectedWallet.next(null);
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.web3) throw new Error('Web3 not initialized');
    try {
      const balance = await this.web3.eth.getBalance(address);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  async sendTransaction(to: string, value: string) {
    if (!this.web3) throw new Error('Web3 not initialized');
    try {
      const accounts = await this.web3.eth.getAccounts();
      const valueInWei = this.web3.utils.toWei(value, 'ether');

      return await this.web3.eth.sendTransaction({
        from: accounts[0],
        to,
        value: valueInWei
      });
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.web3 !== null;
  }

  getWeb3(): Web3 | null {
    return this.web3;
  }
}
