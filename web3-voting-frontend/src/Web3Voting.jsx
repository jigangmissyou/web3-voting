import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ABI from './VotingABI.json';

const CONTRACT_ADDRESS = '0x62BDd6937A71A176dA9AECdFbdf2C059962926cb';

const Web3Voting = () => {
  const [account, setAccount] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [candidatesCount, setCandidatesCount] = useState(0);

  const getProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  };

  const getContract = (signerOrProvider) => {
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请先安装 MetaMask');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error('连接钱包失败:', error);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
  };

  const fetchCandidatesCount = async () => {
    try {
      const provider = getProvider();
      const contract = getContract(provider);
      const count = await contract.candidatesCount();
      setCandidatesCount(count);
      return count;
    } catch (error) {
      console.error('读取候选人数量失败:', error);
      return 0;
    }
  };

  const fetchCandidates = async () => {
    try {
      const provider = getProvider();
      const contract = getContract(provider);
      const count = await fetchCandidatesCount();
      const temp = [];
      for (let i = 1; i <= count; i++) {
        const c = await contract.candidates(i);
        temp.push({
          id: c.id.toString(),
          name: c.name,
          voteCount: c.voteCount.toString(),
        });
      }
      setCandidates(temp);
    } catch (error) {
      console.error('读取候选人失败:', error);
    }
  };

  const vote = async (candidateId) => {
    try {
      const provider = getProvider();
      if (!provider) {
        alert('请先连接钱包');
        return;
      }
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.vote(candidateId);
      await tx.wait();

      alert('投票成功！');
      fetchCandidates();
    } catch (error) {
      const revertReason = error?.reason || error?.error?.message || '未知错误';
      let message = '投票失败：' + revertReason;
      if (revertReason.includes('already voted')) {
        message = '您已经投过票了，不能重复投票。';
      }
      alert(message);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount('');
        }
      };

      window.ethereum.request({ method: 'eth_accounts' })
        .then(handleAccountsChanged)
        .catch((err) => console.error('获取账户失败', err));

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-4 text-blue-700">Web3 投票系统</h2>

        <div className="flex justify-center mb-4">
          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              连接 MetaMask 钱包
            </button>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-2">当前钱包地址：<span className="font-mono text-sm">{account}</span></p>
              <button
                onClick={disconnectWallet}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                断开钱包
              </button>
            </div>
          )}
        </div>

        <ul className="space-y-4">
          {candidates.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-md"
            >
              <div>
                <p className="font-semibold text-lg">{c.name}</p>
                <p className="text-gray-600">得票数: {c.voteCount}</p>
              </div>
              <button
                onClick={() => vote(c.id)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                投票
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Web3Voting;
