import React, { useState } from 'react';
import './Header.css';

const Header = ({ onSearch, onToggleStream, onRefresh, isStreaming }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  return (
    <header className="monitor-header">
      <div className="header-left">
        <h1>监控面板</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="搜索服务器、标签或区域..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      <div className="header-center">
        <button
          onClick={onToggleStream}
          className={`control-btn ${isStreaming ? 'pause' : 'play'}`}
        >
          {isStreaming ? '暂停数据流' : '启动数据流'}
        </button>
        <button onClick={onRefresh} className="control-btn">
          刷新数据
        </button>
        <button className="control-btn">
          切换主题
        </button>
      </div>

      <div className="header-right">
        <div className="user-info">
          <span className="user-avatar">👤</span>
          <span className="user-name">管理员</span>
        </div>
      </div>
    </header>
  );
};

export default Header;