'use client';

import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './globals.css';

// 動的にaws-exportsを読み込み、エラーハンドリングを追加
const configureAmplify = () => {
  try {
    // aws-exports.jsの読み込みを試行
    const awsExports = require('../aws-exports');
    
    // 設定が正しいかチェック
    if (awsExports.default && awsExports.default.aws_user_pools_id) {
      console.log('Amplify configuration loaded successfully');
      Amplify.configure(awsExports.default);
      return true;
    } else {
      console.error('AWS exports file exists but missing user pool configuration');
      return false;
    }
  } catch (error) {
    console.error('Failed to load aws-exports.js:', error);
    console.error('Please run "amplify push" to generate the configuration file');
    return false;
  }
};

// Amplifyの設定を実行
const isConfigured = configureAmplify();

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        {isConfigured ? (
          <Authenticator.Provider>
            {children}
          </Authenticator.Provider>
        ) : (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center',
            backgroundColor: '#ffe6e6',
            color: '#d8000c',
            border: '1px solid #ffcccb',
            borderRadius: '5px',
            margin: '20px'
          }}>
            <h2>設定エラー</h2>
            <p>AWS Amplifyの設定が見つかりません。</p>
            <p>以下のコマンドを実行してください：</p>
            <code style={{ 
              display: 'block', 
              backgroundColor: '#f0f0f0', 
              padding: '10px', 
              margin: '10px 0',
              borderRadius: '3px'
            }}>
              amplify push
            </code>
            {children}
          </div>
        )}
      </body>
    </html>
  );
}
