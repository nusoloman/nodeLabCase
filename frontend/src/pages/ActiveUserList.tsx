import React from 'react';
import OnlineUserList from '../components/OnlineUserList';

const ActiveUserList: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        <OnlineUserList />
      </div>
    </div>
  );
};

export default ActiveUserList;
