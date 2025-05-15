import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ABI from './VotingABI.json';

const CONTRACT_ADDRESS = '0x62BDd6937A71A176dA9AECdFbdf2C059962926cb';

const Web3Voting = () => {
  const [account, setAccount] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [candidatesCount, setCandidatesCount] = useState(0);

  // 获取provider实例（MetaMask注入）
  const getProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  };

  // 获取合约实例
  const getContract = (signerOrProvider) => {
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
  };

  // 连接MetaMask钱包
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

  // 断开钱包绑定
  const disconnectWallet = () => {
    setAccount('');
  };

  // 获取候选人数
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

  // 获取候选人列表
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

  // 投票功能
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
      fetchCandidates(); // 更新候选人票数
    } catch (error) {
    //   console.error('投票失败:', error);
      // 优先使用合约返回的reason字段
        const revertReason = error?.reason || error?.error?.message || '未知错误';
        // 根据常见错误做用户友好的提示
        let message = '投票失败：' + revertReason;
        if (revertReason.includes('already voted')) {
            message = '您已经投过票了，不能重复投票。';
        }

        alert(message);
    }
  };

  // 监听账户变更，自动更新绑定钱包地址
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

      // 清理监听器
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  // 页面加载时拉取候选人信息
  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <div>
      <h2>Web3 投票系统</h2>
      {!account ? (
        <button onClick={connectWallet}>连接 MetaMask 钱包</button>
      ) : (
        <>
          <p>当前钱包地址：{account}</p>
          <button onClick={disconnectWallet}>断开钱包</button>
        </>
      )}

      <ul>
        {candidates.map((c) => (
          <li key={c.id}>
            {c.name} - 得票数: {c.voteCount}{' '}
            <button onClick={() => vote(c.id)}>投票</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Web3Voting;
